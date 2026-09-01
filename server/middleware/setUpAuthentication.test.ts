import express from 'express'
import session from 'express-session'
import request from 'supertest'

type SessionWithPassport = Express.Request['session'] & { passport?: { user: unknown } }
const verifyToken = jest.fn()
jest.mock('@ministryofjustice/hmpps-auth-clients', () => ({
  ...jest.requireActual('@ministryofjustice/hmpps-auth-clients'),
  VerificationClient: jest.fn().mockImplementation(() => ({ verifyToken })),
}))

jest.mock('../errorHandler', () => ({
  snapshotSessionForRecovery: jest.fn(),
}))

// eslint-disable-next-line import/first
import setupAuthentication from './setUpAuthentication'
// eslint-disable-next-line import/first
import { snapshotSessionForRecovery } from '../errorHandler'

function init() {
  const app = express()
  app.use(session({ secret: 'test-secret', resave: false, saveUninitialized: true }))
  app.use((req, _res, next) => {
    ;(req.session as SessionWithPassport).passport = {
      user: { username: 'user1', token: 'tok', authSource: 'nomis' },
    }
    next()
  })
  app.use(setupAuthentication())
  app.get('/person/A1117BC/task-list', (_req, res) => res.status(200).send('ok'))
  return app
}

describe('setUpAuthentication token verification', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should snapshot the session for recovery and redirects to /sign-in when token fails verification', async () => {
    verifyToken.mockResolvedValue(false)
    const app = init()

    const res = await request(app).get('/person/A1117BC/task-list')

    expect(res.status).toBe(302)
    expect(res.headers.location).toBe('/sign-in')
    expect(snapshotSessionForRecovery).toHaveBeenCalledTimes(1)
  })

  it('should not snapshot or redirect when token verifies successfully', async () => {
    verifyToken.mockResolvedValue(true)
    const app = init()

    const res = await request(app).get('/person/A1117BC/task-list')

    expect(res.status).toBe(200)
    expect(res.text).toBe('ok')
    expect(snapshotSessionForRecovery).not.toHaveBeenCalled()
  })
})
