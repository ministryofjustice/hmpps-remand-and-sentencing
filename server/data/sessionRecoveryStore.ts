import { createHmac } from 'crypto'
import type { Session, SessionData } from 'express-session'
import { createRedisClient } from './redisClient'
import config from '../config'
import logger from '../../logger'

const redisEnabled = config.redis.enabled
const redis = redisEnabled ? createRedisClient() : null
if (redisEnabled && redis) {
  redis.connect().catch(err => logger.error('Redis connect (sessionRecoveryStore) failed', err))
} else {
  logger.info('Redis session recovery disabled — journey data will not survive a token refresh')
}

const RECOVERY_TTL_SECONDS = config.session.recoveryTtlMinutes * 60

// Keyed on the session secret so the Redis key doesn't reveal username/nomsId in human-readable form —
// anyone with Redis access could otherwise browse (e.g. `KEYS session-recovery:*`) and see exactly
// whose data each entry is, without needing to read the value at all.
const getKey = (username: string, nomsId: string) =>
  `session-recovery:${createHmac('sha256', config.session.secret).update(`${username}:${nomsId}`).digest('hex')}`

export async function saveSession(
  username: string,
  nomsId: string,
  session: Session & Partial<SessionData>,
): Promise<void> {
  if (!config.redis.enabled || !redis) {
    return
  }
  try {
    await redis.set(getKey(username, nomsId), JSON.stringify(session), { EX: RECOVERY_TTL_SECONDS })
  } catch (err) {
    logger.warn(`Failed to save session recovery data for ${username}/${nomsId}`, err)
  }
}

export async function restoreAndClearSession(username: string, nomsId: string): Promise<Partial<SessionData> | null> {
  if (!config.redis.enabled || !redis) {
    return null
  }
  const key = getKey(username, nomsId)
  try {
    const cached = await redis.get(key)
    if (!cached) {
      return null
    }
    await redis.del(key)
    const cachedData = typeof cached === 'string' ? cached : cached.toString()
    return JSON.parse(cachedData) as Partial<SessionData>
  } catch (err) {
    logger.warn(`Failed to restore session recovery data for ${username}/${nomsId}`, err)
    return null
  }
}
