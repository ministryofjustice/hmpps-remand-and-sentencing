import express from 'express'
import request from 'supertest'
import setupAuthentication from './setUpAuthentication'
import { saveSession } from '../data/sessionRecoveryStore'

jest.mock('../data/sessionRecoveryStore')

let verifyTokenResult = true

jest.mock('@ministryofjustice/hmpps-auth-clients', () => {
  const actual = jest.requireActual('@ministryofjustice/hmpps-auth-clients')
  return {
    ...actual,
    VerificationClient: jest.fn().mockImplementation(() => ({
      verifyToken: jest.fn(async () => verifyTokenResult),
    })),
  }
})

function buildApp() {
  const app = express()
  app.use((req, _res, next) => {
    req.session = { save: (cb?: () => void) => cb?.() } as never
    req.user = { username: 'user1', token: 'user-token', authSource: 'nomis' } as Express.User
    req.isAuthenticated = (() => true) as typeof req.isAuthenticated
    next()
  })
  app.use(setupAuthentication())
  app.get('/person/:nomsId/ok', (_req, res) => res.status(200).send('reached the route'))
  return app
}

describe('setUpAuthentication — token invalidation snapshot', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    verifyTokenResult = true
  })

  it('saves the session before redirecting to /sign-in when the token has been invalidated', async () => {
    verifyTokenResult = false

    const response = await request(buildApp()).get('/person/A1234BC/ok')

    expect(response.status).toBe(302)
    expect(response.headers.location).toBe('/sign-in')
    expect(saveSession).toHaveBeenCalledWith('user1', 'A1234BC', expect.anything())
  })

  it('does not snapshot when there is no nomsId in the URL', async () => {
    verifyTokenResult = false

    const response = await request(buildApp()).get('/some-other-route')

    expect(response.status).toBe(302)
    expect(response.headers.location).toBe('/sign-in')
    expect(saveSession).not.toHaveBeenCalled()
  })

  it('does not snapshot and lets the request through when the token is valid', async () => {
    verifyTokenResult = true

    const response = await request(buildApp()).get('/person/A1234BC/ok')

    expect(response.status).toBe(200)
    expect(saveSession).not.toHaveBeenCalled()
  })
})
