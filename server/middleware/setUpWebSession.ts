import { v4 as uuidv4 } from 'uuid'
import session, { MemoryStore, Store } from 'express-session'
import RedisStore from 'connect-redis'
import express, { Router } from 'express'
import type { CourtAppearance, CourtCase, Offence } from 'models'
import { createRedisClient } from '../data/redisClient'
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
      name: 'hmpps-template-typescript.session',
      cookie: { secure: config.https, sameSite: 'lax', maxAge: config.session.expiryMinutes * 60 * 1000 },
      secret: config.session.secret,
      resave: false, // redis implements touch so shouldn't need this
      saveUninitialized: false,
      rolling: true,
    }),
  )

  // Update a value in the cookie so that the set-cookie will be sent.
  // Only changes every minute so that it's not sent with every request.
  router.use((req, res, next) => {
    req.session.nowInMinutes = Math.floor(Date.now() / 60e3)
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
      req.session.courtAppearances = new Map<string, CourtAppearance>()
    }
    next()
  })

  router.use((req, res, next) => {
    const headerName = 'X-Request-Id'
    const oldValue = req.get(headerName)
    const id = oldValue === undefined ? uuidv4() : oldValue

    res.set(headerName, id)
    req.id = id

    next()
  })

  return router
}
