import express from 'express'
import session, { MemoryStore } from 'express-session'
import request from 'supertest'
import nock from 'nock'
import { AuthenticationClient, InMemoryTokenStore } from '@ministryofjustice/hmpps-auth-clients'
import type { HmppsUser } from './interfaces/hmppsUser'
import logger from '../logger'
import nunjucksSetup from './utils/nunjucksSetup'
import PrisonerSearchApiClient from './data/prisonerSearchApiClient'
import PrisonerSearchService from './services/prisonerSearchService'

/**
 * Full end-to-end proof of the theory: a real 401/403 from a downstream API call, while a court
 * appearance is in progress in session, is (1) correctly recognised by errorHandler.ts's status
 * normalization fix, (2) snapshotted to Redis keyed by username+nomsId, and (3) restored into a
 * *different* (new) session the next time that prisoner's record is visited — proving the court
 * appearance data survives the round trip, not just that a redirect happens.
 *
 * Everything below the network layer is real, unmocked code: RestClient, AuthenticationClient,
 * PrisonerSearchApiClient, populateCurrentPrisoner, errorHandler (with the status-normalization fix),
 * setUpWebSession's restoreJourneySession, and sessionRecoveryStore. Only two things are stubbed:
 * the network (nock) and the underlying Redis client used by sessionRecoveryStore (an in-memory fake,
 * following the same pattern as sessionRecoveryStore.test.ts) so this test doesn't need a real Redis.
 */

const COURT_APPEARANCE_IN_PROGRESS = { A1234BC: { appearanceUuid: 'appearance-1', caseReferenceNumber: 'CASE1' } }

const fakeRedisStore = new Map<string, string>()

const mockRedisClient = {
  connect: jest.fn().mockResolvedValue(undefined),
  get: jest.fn(async (key: string) => fakeRedisStore.get(key) ?? null),
  set: jest.fn(async (key: string, value: string) => {
    fakeRedisStore.set(key, value)
    return 'OK'
  }),
  del: jest.fn(async (key: string) => (fakeRedisStore.delete(key) ? 1 : 0)),
  on: jest.fn(),
}

const testUser: HmppsUser = {
  name: 'FIRST LAST',
  userId: 'id',
  token: 'user-token',
  username: 'user1',
  displayName: 'First Last',
  authSource: 'nomis',
  staffId: 1234,
  userRoles: [],
  caseLoads: [{ caseLoadId: 'MDI', description: 'mdi prison', type: 'INST', currentlyActive: true }],
  activeCaseLoadId: 'MDI',
  hasInactiveBookingsAccess: false,
  hasRecallsAccess: false,
  hasBookASecureMoveAccess: false,
} as HmppsUser

describe.each([401, 403])('full snapshot/restore loop against a real %i', authFailureStatus => {
  let config: typeof import('./config').default
  let app: express.Express

  function buildApp(): express.Express {
    let built: express.Express

    jest.isolateModules(() => {
      jest.doMock('./data/redisClient', () => ({ createRedisClient: jest.fn(() => mockRedisClient) }))
      // eslint-disable-next-line global-require, @typescript-eslint/no-require-imports
      config = require('./config').default
      config.redis.enabled = true

      // eslint-disable-next-line global-require, @typescript-eslint/no-require-imports
      const errorHandler = require('./errorHandler').default
      // eslint-disable-next-line global-require, @typescript-eslint/no-require-imports
      const populateCurrentPrisoner = require('./middleware/populateCurrentPrisoner').default

      const authenticationClient = new AuthenticationClient(config.apis.hmppsAuth, logger, new InMemoryTokenStore())
      const prisonerSearchApiClient = new PrisonerSearchApiClient(authenticationClient)
      const prisonerSearchService = new PrisonerSearchService(prisonerSearchApiClient)

      built = express()
      built.set('view engine', 'njk')
      nunjucksSetup(built, {
        applicationName: 'test',
        buildNumber: '1',
        gitRef: 'ref',
        gitShortHash: 'short',
        branchName: 'main',
        productId: 'P1',
      })

      built.use(session({ store: new MemoryStore(), secret: 'test-secret', resave: false, saveUninitialized: true }))
      built.use((req, res, next) => {
        req.user = {
          username: testUser.username,
          token: testUser.token,
          authSource: testUser.authSource,
        } as Express.User
        res.locals = {
          user: { ...testUser },
          cspNonce: '',
          csrfToken: '',
          asset_path: '',
          applicationName: '',
          environmentName: '',
          environmentNameColour: '',
        } as Express.Locals
        next()
      })
      // Simulates a journey already in progress: a court appearance already sitting in session
      // before populateCurrentPrisoner (and therefore the failing downstream call) even runs. Only
      // seeds when explicitly asked to (?seedCourtAppearance=true) — the second, "new session"
      // request in the test below must NOT be seeded, so anything present in its session can only
      // have come from the restore mechanism, not from this test scaffolding.
      built.use((req, _res, next) => {
        if (req.query.seedCourtAppearance === 'true' && !req.session.courtAppearances) {
          req.session.courtAppearances = COURT_APPEARANCE_IN_PROGRESS as never
        }
        next()
      })
      built.use('/person/:nomsId', populateCurrentPrisoner(prisonerSearchService))
      built.get('/person/:nomsId/ok', (req, res) =>
        res.status(200).json({ courtAppearances: req.session.courtAppearances }),
      )
      built.use(errorHandler(false))
    })

    return built
  }

  beforeEach(() => {
    nock.cleanAll()
    fakeRedisStore.clear()
    jest.clearAllMocks()
    app = buildApp()
  })

  afterEach(() => {
    nock.cleanAll()
  })

  function nockSystemToken() {
    nock(config.apis.hmppsAuth.url)
      .post('/oauth/token')
      .reply(200, { access_token: 'fake-system-token', expires_in: 3600 })
  }

  it(`snapshots a court appearance in progress on a real ${authFailureStatus}, then restores it into a new session`, async () => {
    // --- Request 1: existing session gets a court appearance seeded, then the downstream call fails ---
    nockSystemToken()
    nock(config.apis.prisonerSearchApi.url)
      .get('/prisoner/A1234BC')
      .reply(authFailureStatus, { message: 'auth failure' })

    const failureResponse = await request(app).get('/person/A1234BC/ok?seedCourtAppearance=true')

    expect(failureResponse.status).toBe(302)
    expect(failureResponse.headers.location).toBe('/sign-out')

    const snapshotKey = 'session-recovery:user1:A1234BC'
    expect(fakeRedisStore.has(snapshotKey)).toBe(true)
    const snapshot = JSON.parse(fakeRedisStore.get(snapshotKey) as string)
    expect(snapshot.courtAppearances).toEqual(COURT_APPEARANCE_IN_PROGRESS)

    // --- Request 2: a *different* session (no cookie reuse), downstream call now succeeds ---
    nockSystemToken()
    nock(config.apis.prisonerSearchApi.url).get('/prisoner/A1234BC').reply(200, {
      prisonerNumber: 'A1234BC',
      bookingId: '1234',
      firstName: 'Cormac',
      lastName: 'Meza',
      dateOfBirth: '1965-02-03',
      prisonId: 'MDI',
      status: 'REMAND',
      prisonName: 'HMP Bedford',
      cellLocation: 'CELL-1',
    })

    const successResponse = await request(app).get('/person/A1234BC/ok')

    expect(successResponse.status).toBe(200)
    expect(successResponse.body.courtAppearances).toEqual(COURT_APPEARANCE_IN_PROGRESS)
    expect(fakeRedisStore.has(snapshotKey)).toBe(false)
  })
})
