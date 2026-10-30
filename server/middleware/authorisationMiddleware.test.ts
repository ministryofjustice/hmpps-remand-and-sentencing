import jwt from 'jsonwebtoken'
import type { Request, Response } from 'express'

import authorisationMiddleware from './authorisationMiddleware'
import { snapshotSessionForRecovery } from '../errorHandler'

jest.mock('../errorHandler', () => ({
  snapshotSessionForRecovery: jest.fn(),
}))

function createToken(authorities: string[]) {
  const payload = {
    user_name: 'USER1',
    scope: ['read', 'write'],
    auth_source: 'nomis',
    authorities,
    jti: 'a610a10-cca6-41db-985f-e87efb303aaf',
    client_id: 'clientid',
  }

  return jwt.sign(payload, 'secret', { expiresIn: '1h' })
}

describe('authorisationMiddleware', () => {
  const req: Request = {} as jest.Mocked<Request>
  const next = jest.fn()

  function createResWithToken({ authorities }: { authorities: string[] }): Response {
    return {
      locals: {
        user: {
          token: createToken(authorities),
        },
      },
      redirect: jest.fn(),
    } as unknown as Response
  }

  beforeEach(() => {
    jest.resetAllMocks()
  })

  it('should return next when no required roles', () => {
    const res = createResWithToken({ authorities: [] })

    authorisationMiddleware()(req, res, next)

    expect(next).toHaveBeenCalled()
    expect(res.redirect).not.toHaveBeenCalled()
  })

  it('should redirect when user has no authorised roles', () => {
    const res = createResWithToken({ authorities: [] })

    authorisationMiddleware(['SOME_REQUIRED_ROLE'])(req, res, next)

    expect(next).not.toHaveBeenCalled()
    expect(res.redirect).toHaveBeenCalledWith('/authError')
  })

  it('should return next when user has authorised role', () => {
    const res = createResWithToken({ authorities: ['ROLE_SOME_REQUIRED_ROLE'] })

    authorisationMiddleware(['SOME_REQUIRED_ROLE'])(req, res, next)

    expect(next).toHaveBeenCalled()
    expect(res.redirect).not.toHaveBeenCalled()
  })

  it('should return next when user has authorised role and middleware created with ROLE_ prefix', () => {
    const res = createResWithToken({ authorities: ['ROLE_SOME_REQUIRED_ROLE'] })

    authorisationMiddleware(['ROLE_SOME_REQUIRED_ROLE'])(req, res, next)

    expect(next).toHaveBeenCalled()
    expect(res.redirect).not.toHaveBeenCalled()
  })

  it('should return next when user has only one of multiple required roles', () => {
    const res = createResWithToken({ authorities: ['ROLE_TWO'] })

    authorisationMiddleware(['ROLE_ONE', 'ROLE_TWO', 'ROLE_THREE'])(req, res, next)

    expect(next).toHaveBeenCalled()
    expect(res.redirect).not.toHaveBeenCalled()
  })

  describe('when there is no token on res.locals.user', () => {
    it('should snapshot the session for recovery before redirecting to sign-in', async () => {
      const request = {
        originalUrl: '/person/A1234BC/court-cases',
        session: {} as Request['session'],
      } as unknown as Request
      const response = { locals: {}, redirect: jest.fn() } as unknown as Response

      await authorisationMiddleware()(request, response, next)

      expect(snapshotSessionForRecovery).toHaveBeenCalledWith(response, request)
      expect(request.session.returnTo).toBe('/person/A1234BC/court-cases')
      expect(response.redirect).toHaveBeenCalledWith('/sign-in')
      expect(next).not.toHaveBeenCalled()
    })
  })
})
