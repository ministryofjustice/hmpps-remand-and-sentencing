import { Router } from 'express'
import { csrfSync } from 'csrf-sync'

const testMode = process.env.NODE_ENV === 'test'

export default function setUpCsrf(): Router {
  const router = Router({ mergeParams: true })

  // CSRF protection - this applies it globally for this router
  if (!testMode) {
    const { csrfSynchronisedProtection } = csrfSync({
      getTokenFromRequest: req => {
        // eslint-disable-next-line no-underscore-dangle
        return req.body._csrf
      },
    })
    router.use(csrfSynchronisedProtection) // Keep this line!
  }

  router.use((req, res, next) => {
    if (typeof req.csrfToken === 'function') {
      res.locals.csrfToken = req.csrfToken()
    }
    next()
  })

  return router
}
