import type { Express, Request, Response } from 'express'
import type { HTTPError } from 'superagent'
import request from 'supertest'
import { appWithAllRoutes } from './routes/testutils/appSetup'
import createErrorHandler from './errorHandler'
import { saveSession } from './data/sessionRecoveryStore'

function httpError(message: string, status: number): HTTPError {
  return Object.assign(new Error(message), { status }) as unknown as HTTPError
}

// Shaped like the real SanitisedError thrown by @ministryofjustice/hmpps-rest-client API clients —
// .responseStatus, no .status. See errorHandlerStatusMismatch.test.ts for the full unmocked proof.
function sanitisedError(message: string, responseStatus: number): HTTPError {
  return Object.assign(new Error(message), { responseStatus }) as unknown as HTTPError
}

jest.mock('./data/sessionRecoveryStore')

let app: Express

beforeEach(() => {
  app = appWithAllRoutes({})
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('GET 404', () => {
  it('should render content with stack in dev mode', () => {
    return request(app)
      .get('/unknown')
      .expect(404)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('NotFoundError: Not Found')
        expect(res.text).not.toContain('Something went wrong. The error has been logged. Please try again')
      })
  })

  it('should render content without stack in production mode', () => {
    return request(appWithAllRoutes({ production: true }))
      .get('/unknown')
      .expect(404)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Something went wrong. The error has been logged. Please try again')
        expect(res.text).not.toContain('NotFoundError: Not Found')
      })
  })
})

describe('auth error handling (401/403)', () => {
  const next = jest.fn()

  function createReqRes({ nomsId, username }: { nomsId?: string; username?: string }) {
    const req = {
      originalUrl: nomsId ? `/person/${nomsId}/court-cases` : '/some-non-prisoner-route',
      params: nomsId ? { nomsId } : {},
      session: { courtAppearances: { [nomsId]: { appearanceUuid: '123' } } },
    } as unknown as Request

    const res = {
      locals: { user: username ? { username } : undefined },
      redirect: jest.fn(),
      render: jest.fn(),
      status: jest.fn().mockReturnThis(),
    } as unknown as Response

    return { req, res }
  }

  it('snapshots the session and redirects to sign-out on a 401', async () => {
    const { req, res } = createReqRes({ nomsId: 'A1234BC', username: 'user1' })
    const error = httpError('unauthorized', 401)

    await createErrorHandler(false)(error, req, res, next)

    expect(saveSession).toHaveBeenCalledWith('user1', 'A1234BC', req.session)
    expect(res.redirect).toHaveBeenCalledWith('/sign-out')
  })

  it('snapshots the session and redirects to sign-out on a 403', async () => {
    const { req, res } = createReqRes({ nomsId: 'A1234BC', username: 'user1' })
    const error = httpError('forbidden', 403)

    await createErrorHandler(false)(error, req, res, next)

    expect(saveSession).toHaveBeenCalledWith('user1', 'A1234BC', req.session)
    expect(res.redirect).toHaveBeenCalledWith('/sign-out')
  })

  it('does not snapshot when there is no nomsId in scope, but still signs out', async () => {
    const { req, res } = createReqRes({ username: 'user1' })
    const error = httpError('unauthorized', 401)

    await createErrorHandler(false)(error, req, res, next)

    expect(saveSession).not.toHaveBeenCalled()
    expect(res.redirect).toHaveBeenCalledWith('/sign-out')
  })

  it('does not snapshot when there is no authenticated user', async () => {
    const { req, res } = createReqRes({ nomsId: 'A1234BC' })
    const error = httpError('unauthorized', 401)

    await createErrorHandler(false)(error, req, res, next)

    expect(saveSession).not.toHaveBeenCalled()
    expect(res.redirect).toHaveBeenCalledWith('/sign-out')
  })

  it('still snapshots (any error can mean lost work) but does not redirect to sign-out for non-auth errors', async () => {
    const { req, res } = createReqRes({ nomsId: 'A1234BC', username: 'user1' })
    const error = httpError('server error', 500)

    await createErrorHandler(false)(error, req, res, next)

    expect(saveSession).toHaveBeenCalledWith('user1', 'A1234BC', req.session)
    expect(res.redirect).not.toHaveBeenCalled()
    expect(res.render).toHaveBeenCalledWith('pages/error')
  })

  it('recognises a SanitisedError-shaped 401 (.responseStatus, no .status) the same as a real API client throws', async () => {
    const { req, res } = createReqRes({ nomsId: 'A1234BC', username: 'user1' })
    const error = sanitisedError('unauthorized', 401)

    await createErrorHandler(false)(error, req, res, next)

    expect(saveSession).toHaveBeenCalledWith('user1', 'A1234BC', req.session)
    expect(res.redirect).toHaveBeenCalledWith('/sign-out')
  })

  it('recognises a SanitisedError-shaped 403 (.responseStatus, no .status) the same as a real API client throws', async () => {
    const { req, res } = createReqRes({ nomsId: 'A1234BC', username: 'user1' })
    const error = sanitisedError('forbidden', 403)

    await createErrorHandler(false)(error, req, res, next)

    expect(saveSession).toHaveBeenCalledWith('user1', 'A1234BC', req.session)
    expect(res.redirect).toHaveBeenCalledWith('/sign-out')
  })

  it('should fall back to req.user when res.locals.user is not yet set', async () => {
    const { req, res } = createReqRes({ nomsId: 'A1234BC' })
    res.locals.user = undefined
    req.user = { username: 'user1', token: 'tok', authSource: 'nomis' } as Express.User
    const error = httpError('unauthorized', 401)

    await createErrorHandler(false)(error, req, res, next)

    expect(saveSession).toHaveBeenCalledWith('user1', 'A1234BC', req.session)
  })

  it('should prefer res.locals.user over req.user when both are present', async () => {
    const { req, res } = createReqRes({ nomsId: 'A1234BC', username: 'locals-user' })
    req.user = { username: 'req-user', token: 'tok', authSource: 'nomis' } as Express.User
    const error = httpError('unauthorized', 401)

    await createErrorHandler(false)(error, req, res, next)

    expect(saveSession).toHaveBeenCalledWith('locals-user', 'A1234BC', req.session)
  })
})
