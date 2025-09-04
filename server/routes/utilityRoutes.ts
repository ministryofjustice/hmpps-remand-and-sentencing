import { Router, Request, Response } from 'express'
import type { SessionData } from 'express-session'
import type { Services } from '../services'

type CustomSessionData = SessionData & { nomsId?: string }

export default function utilityRoutes(services: Services): Router {
  const router = Router()

  // GET /session/session-status
  router.get('/session/session-status', (req: Request, res: Response): void => {
    const sid = req.sessionID

    if (!sid) {
      res.status(401).json({ isLoggedIn: false })
      return
    }

    req.sessionStore.get(sid, (err: Error | null, sess: SessionData | null) => {
      if (err) {
        res.status(500).json({ isLoggedIn: false })
        return
      }

      if (!sess || !sess.cookie?.expires) {
        res.status(401).json({ isLoggedIn: false })
        return
      }

      const expiresAt = new Date(sess.cookie.expires).getTime()
      res.setHeader('Cache-Control', 'no-store')
      res.json({
        expiresAt,
        serverNow: Date.now(),
        isLoggedIn: true,
        nomsId: (sess as CustomSessionData).nomsId || undefined,
      })
    })
  })

  // POST /session/session-status
  router.post('/session/session-status', async (req: Request, res: Response): Promise<void> => {
    if (req.session) {
      req.session.touch()
      req.session.lastTouched = Date.now()
      req.session.save(() => {
        const expiresAt = req.session.cookie.expires.getTime()
        res.status(200).json({ status: 'Session extended', expiresAt })
      })
    } else {
      res.status(401).json({ status: 'Session not found' })
    }
  })

  // GET /session/timeout
  router.get('/person/:nomsId/timeout', (req: Request, res: Response) => {
    const nomsId = req.params.nomsId || req.session?.nomsId
    services.courtAppearanceService.clearSessionCourtAppearance(req.session, nomsId)
    res.render('pages/timeout.njk', {
      nomsId,
      csrfToken: req.csrfToken?.(),
      applicationName: res.locals.applicationName,
    })
  })

  return router
}
