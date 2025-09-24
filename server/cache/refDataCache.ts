import { createRedisClient } from '../data/redisClient'
import logger from '../../logger'
import config from '../config'

const redisEnabled = config.redis.enabled
const redis = redisEnabled ? createRedisClient() : null
if (redisEnabled && redis) {
  redis.connect().catch(err => logger.error('Redis connect (refDataCache) failed', err))
} else {
  logger.info('Redis caching disabled — using API only')
}

const getFullCacheName = (key: string) => `ref-data:${key}`

export default async function getOrSetJson<T>(
  cacheKey: string,
  apiCall: () => Promise<T>,
  timeToLiveSeconds = 24 * 60 * 60, // 24 hours TTL
): Promise<T> {
  if (!config.redis.enabled || !redis) {
    return apiCall()
  }
  try {
    const cached = await redis.get(getFullCacheName(cacheKey))
    if (cached) {
      const cachedData = typeof cached === 'string' ? cached : cached.toString()
      return JSON.parse(cachedData) as T
    }
  } catch {
    logger.warn(`Fetching ref data from cache ${cacheKey} failed. Using api instead`)
  }

  const apiData = await apiCall()
  try {
    await redis.set(getFullCacheName(cacheKey), JSON.stringify(apiData), { EX: timeToLiveSeconds })
  } catch {
    logger.warn(`setting ref data into cache ${cacheKey} failed. Using api instead`)
  }
  return apiData
}
