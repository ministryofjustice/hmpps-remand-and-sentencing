import express from 'express'
import request from 'supertest'
import nock from 'nock'
import { AuthenticationClient, InMemoryTokenStore } from '@ministryofjustice/hmpps-auth-clients'
import type { HmppsUser } from './interfaces/hmppsUser'
import config from './config'
import logger from '../logger'
import errorHandler from './errorHandler'
import nunjucksSetup from './utils/nunjucksSetup'
import setUpWebSession from './middleware/setUpWebSession'
import populateCurrentPrisoner from './middleware/populateCurrentPrisoner'
import PrisonerSearchApiClient from './data/prisonerSearchApiClient'
import PrisonerSearchService from './services/prisonerSearchService'

/**
 * Integration test proving what errorHandler.ts actually receives at runtime for a real downstream
 * API failure, and that its status-normalization fix (extractStatus in errorHandler.ts) correctly
 * recognises it. The real object thrown by any API client built on
 * `@ministryofjustice/hmpps-rest-client` is `SanitisedError`, which carries `.responseStatus`, not
 * `.status` — errorHandler.ts's function signature (`HTTPError | FullPageError`) is an unenforced
 * assertion that doesn't match this at runtime. This exercises the REAL, unmocked RestClient ->
 * AuthenticationClient -> PrisonerSearchApiClient -> populateCurrentPrisoner -> errorHandler chain,
 * with only the network layer (nock) stubbed, to prove the fix actually recognises a genuine 401/403
 * rather than letting it fall through to a generic 500.
 */
describe('errorHandler.ts vs a real SanitisedError from an API client', () => {
  let app: express.Express

  const buildApp = () => {
    const authenticationClient = new AuthenticationClient(config.apis.hmppsAuth, logger, new InMemoryTokenStore())
    const prisonerSearchApiClient = new PrisonerSearchApiClient(authenticationClient)
    const prisonerSearchService = new PrisonerSearchService(prisonerSearchApiClient)

    const testApp = express()
    testApp.set('view engine', 'njk')
    nunjucksSetup(testApp, {
      applicationName: 'test',
      buildNumber: '1',
      gitRef: 'ref',
      gitShortHash: 'short',
      branchName: 'main',
      productId: 'P1',
    })

    testApp.use(setUpWebSession())
    testApp.use((req, res, next) => {
      req.user = { username: 'user1', token: 'user-token', authSource: 'nomis' } as Express.User
      res.locals = {
        user: { ...req.user } as HmppsUser,
        cspNonce: '',
        csrfToken: '',
        asset_path: '',
        applicationName: '',
        environmentName: '',
        environmentNameColour: '',
      } as Express.Locals
      next()
    })
    testApp.use('/person/:nomsId', populateCurrentPrisoner(prisonerSearchService))
    testApp.get('/person/:nomsId/ok', (_req, res) => res.status(200).send('reached the route'))
    testApp.use(errorHandler(false))

    return testApp
  }

  beforeEach(() => {
    nock.cleanAll()
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

  it('a real 401 from the API client is correctly recognised and redirects to /sign-out', async () => {
    nockSystemToken()
    nock(config.apis.prisonerSearchApi.url).get('/prisoner/A1234BC').reply(401, { message: 'Unauthorized' })

    const response = await request(app).get('/person/A1234BC/ok')

    expect(response.status).toBe(302)
    expect(response.headers.location).toBe('/sign-out')
    expect(nock.isDone()).toBe(true)
  })

  it('a real 403 from the API client is also correctly recognised and redirects to /sign-out', async () => {
    nockSystemToken()
    nock(config.apis.prisonerSearchApi.url).get('/prisoner/A1234BC').reply(403, { message: 'Forbidden' })

    const response = await request(app).get('/person/A1234BC/ok')

    expect(response.status).toBe(302)
    expect(response.headers.location).toBe('/sign-out')
    expect(nock.isDone()).toBe(true)
  })

  it('confirms the thrown error is shaped like SanitisedError (.responseStatus), not HTTPError (.status)', async () => {
    nockSystemToken()
    nock(config.apis.prisonerSearchApi.url).get('/prisoner/A1234BC').reply(401, { message: 'Unauthorized' })

    let caughtError: { status?: number; responseStatus?: number } | undefined
    const authenticationClient = new AuthenticationClient(config.apis.hmppsAuth, logger, new InMemoryTokenStore())
    const prisonerSearchApiClient = new PrisonerSearchApiClient(authenticationClient)

    try {
      await prisonerSearchApiClient.getPrisonerDetails('A1234BC', 'user1')
    } catch (error) {
      caughtError = error
    }

    expect(caughtError).toBeDefined()
    expect(caughtError.responseStatus).toBe(401)
    expect(caughtError.status).toBeUndefined()
  })
})
