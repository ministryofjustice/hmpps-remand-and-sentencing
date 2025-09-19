import { createRedisClient } from '../data/redisClient'
import logger from '../../logger'

const redis = createRedisClient()
redis.connect().catch(err => logger.error('Redis connect (refDataCache) failed', err))

const getFullCacheName = (key: string) => `ref-data:${key}`

export default async function getOrSetJson<T>(
  cacheKey: string,
  apiCall: () => Promise<T>,
  timeToLiveSeconds = 2 * 60, // 2 mins for testing TODO change
): Promise<T> {
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
