import session, { MemoryStore, Store } from 'express-session'
import { RedisStore } from 'connect-redis'
import express, { Router } from 'express'
import type { CourtAppearance, CourtCase, Offence } from 'models'
import { randomUUID } from 'crypto'
import { createRedisClient } from '../data/redisClient'
import { restoreAndClearSession } from '../data/sessionRecoveryStore'
import extractNomsIdFromUrl from '../utils/extractNomsIdFromUrl'
import config from '../config'
import logger from '../../logger'

export default function setUpWebSession(): Router {
  let store: Store
  if (config.redis.enabled) {
    const client = createRedisClient()
    client.connect().catch((err: Error) => logger.error(`Error connecting to Redis`, err))
    store = new RedisStore({ client })
  } else {
    store = new MemoryStore()
  }

  const router = express.Router()
  router.use(
    session({
      store,
      name: 'hmpps-remand-and-sentencing.session',
      cookie: { secure: config.https, sameSite: 'lax', maxAge: config.session.expiryMinutes * 60 * 1000 },
      secret: config.session.secret,
      resave: false, // redis implements touch so shouldn't need this
      saveUninitialized: false,
      rolling: true,
    }),
  )

  // Restore a session snapshotted before a forced re-authentication (see setUpAuthentication.ts).
  // req.session.passport.user is read directly here (rather than req.user/res.locals.user) because
  // passport.session() hasn't run yet at this point in the middleware chain — this router is mounted
  // before setUpAuthentication() in app.ts, so req.user doesn't exist here on this request, even
  // though the value Passport previously stored on the session itself does.
  router.use(async (req, res, next) => {
    const username = req.session.passport?.user?.username
    const nomsId = extractNomsIdFromUrl(req.originalUrl)
    if (username && nomsId) {
      const recovered = await restoreAndClearSession(username, nomsId)
      if (recovered) {
        // Exclude cookie: it's session-store-owned metadata (expiry etc.) for the old, now-destroyed
        // session and must not overwrite the new session's own cookie.
        const { cookie, ...journeyData } = recovered as Record<string, unknown>
        Object.assign(req.session, journeyData)
        logger.info(`Restored session data for user ${username} and prisoner ${nomsId} after token refresh`)
      }
    }
    next()
  })

  router.use((req, res, next) => {
    if (!req.session.courtCases) {
      req.session.courtCases = new Map<string, CourtCase>()
    }
    if (!req.session.savedCourtCases) {
      req.session.savedCourtCases = new Map<string, CourtCase>()
    }
    if (!req.session.offences) {
      req.session.offences = new Map<string, Offence>()
    }
    if (!req.session.courtAppearances) {
      logger.debug('initialising court appearances for session')
      req.session.courtAppearances = new Map<string, CourtAppearance>()
    }
    if (!req.session.unknownRecallSentenceUuids) {
      req.session.unknownRecallSentenceUuids = new Map<string, string[]>()
    }
    next()
  })

  router.use((req, res, next) => {
    const headerName = 'X-Request-Id'
    const oldValue = req.get(headerName)
    const id = oldValue === undefined ? randomUUID() : oldValue

    res.set(headerName, id)
    req.id = id

    next()
  })

  return router
}
