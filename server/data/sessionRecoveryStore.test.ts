import type { Session, SessionData } from 'express-session'

const mockClient = {
  connect: jest.fn().mockResolvedValue(undefined),
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
  on: jest.fn(),
}

describe('sessionRecoveryStore', () => {
  let saveSession: typeof import('./sessionRecoveryStore').saveSession
  let restoreAndClearSession: typeof import('./sessionRecoveryStore').restoreAndClearSession

  function loadStoreWithRedisEnabled(enabled: boolean) {
    jest.clearAllMocks()
    jest.isolateModules(() => {
      jest.doMock('./redisClient', () => ({ createRedisClient: jest.fn(() => mockClient) }))
      // eslint-disable-next-line global-require, @typescript-eslint/no-require-imports
      const config = require('../config').default
      config.redis.enabled = enabled
      // eslint-disable-next-line global-require, @typescript-eslint/no-require-imports
      const store = require('./sessionRecoveryStore')
      saveSession = store.saveSession
      restoreAndClearSession = store.restoreAndClearSession
    })
  }

  describe('when redis is enabled', () => {
    beforeEach(() => {
      loadStoreWithRedisEnabled(true)
    })

    it('saves session data under a username+nomsId key with a 30 minute TTL', async () => {
      const session = { courtAppearances: { A1234BC: { appearanceUuid: '123' } } } as unknown as Session &
        Partial<SessionData>

      await saveSession('user1', 'A1234BC', session)

      expect(mockClient.set).toHaveBeenCalledWith('session-recovery:user1:A1234BC', JSON.stringify(session), {
        EX: 1800,
      })
    })

    it('fails soft and does not throw when the redis set call fails', async () => {
      mockClient.set.mockRejectedValueOnce(new Error('redis unavailable'))

      await expect(
        saveSession('user1', 'A1234BC', {} as unknown as Session & Partial<SessionData>),
      ).resolves.toBeUndefined()
    })

    it('restores and deletes the stored session data when present', async () => {
      mockClient.get.mockResolvedValueOnce(JSON.stringify({ offences: { key: {} } }))

      const result = await restoreAndClearSession('user1', 'A1234BC')

      expect(mockClient.get).toHaveBeenCalledWith('session-recovery:user1:A1234BC')
      expect(mockClient.del).toHaveBeenCalledWith('session-recovery:user1:A1234BC')
      expect(result).toEqual({ offences: { key: {} } })
    })

    it('returns null and does not delete anything when there is nothing stored', async () => {
      mockClient.get.mockResolvedValueOnce(null)

      const result = await restoreAndClearSession('user1', 'A1234BC')

      expect(result).toBeNull()
      expect(mockClient.del).not.toHaveBeenCalled()
    })

    it('fails soft and returns null when the redis get call fails', async () => {
      mockClient.get.mockRejectedValueOnce(new Error('redis unavailable'))

      const result = await restoreAndClearSession('user1', 'A1234BC')

      expect(result).toBeNull()
    })

    it('keys entries independently per username and per prisoner', async () => {
      await saveSession('user1', 'A1234BC', {} as unknown as Session & Partial<SessionData>)
      await saveSession('user2', 'A1234BC', {} as unknown as Session & Partial<SessionData>)
      await saveSession('user1', 'B5678CD', {} as unknown as Session & Partial<SessionData>)

      const keysUsed = mockClient.set.mock.calls.map(call => call[0])
      expect(new Set(keysUsed).size).toBe(3)
    })
  })

  describe('when redis is disabled', () => {
    beforeEach(() => {
      loadStoreWithRedisEnabled(false)
    })

    it('does not attempt to save session data', async () => {
      await saveSession('user1', 'A1234BC', {} as unknown as Session & Partial<SessionData>)

      expect(mockClient.set).not.toHaveBeenCalled()
    })

    it('returns null without calling redis when attempting to restore', async () => {
      const result = await restoreAndClearSession('user1', 'A1234BC')

      expect(result).toBeNull()
      expect(mockClient.get).not.toHaveBeenCalled()
    })
  })
})
