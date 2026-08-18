import express from 'express'
import request from 'supertest'
import setUpWebSession from './setUpWebSession'
import { restoreAndClearSession } from '../data/sessionRecoveryStore'

jest.mock('../data/sessionRecoveryStore')

function buildApp() {
  const app = express()
  app.use(setUpWebSession())
  app.get('/seed', (req, res) => {
    req.session.passport = { user: { username: 'user1', token: 'user-token', authSource: 'nomis' } }
    res.status(200).send('seeded')
  })
  app.get('/person/:nomsId/ok', (req, res) => res.status(200).json({ courtAppearances: req.session.courtAppearances }))
  return app
}

describe('setUpWebSession — restore on a session with a known user', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('restores recovered journey data once a session carries a username and the URL has a nomsId', async () => {
    ;(restoreAndClearSession as jest.Mock).mockResolvedValue({
      courtAppearances: { A1234BC: { appearanceUuid: 'appearance-1' } },
    })

    const agent = request.agent(buildApp())
    await agent.get('/seed')

    const response = await agent.get('/person/A1234BC/ok')

    expect(restoreAndClearSession).toHaveBeenCalledWith('user1', 'A1234BC')
    expect(response.body.courtAppearances).toEqual({ A1234BC: { appearanceUuid: 'appearance-1' } })
  })

  it('does not attempt to restore when the session has no known user yet', async () => {
    ;(restoreAndClearSession as jest.Mock).mockResolvedValue({
      courtAppearances: { A1234BC: { appearanceUuid: 'appearance-1' } },
    })

    const response = await request(buildApp()).get('/person/A1234BC/ok')

    expect(restoreAndClearSession).not.toHaveBeenCalled()
    expect(response.body.courtAppearances).toEqual({})
  })

  it('does not attempt to restore when the URL has no nomsId', async () => {
    const agent = request.agent(buildApp())
    await agent.get('/seed')

    await agent.get('/seed')

    expect(restoreAndClearSession).not.toHaveBeenCalled()
  })

  it('leaves the session untouched when there is nothing to recover', async () => {
    ;(restoreAndClearSession as jest.Mock).mockResolvedValue(null)

    const agent = request.agent(buildApp())
    await agent.get('/seed')

    const response = await agent.get('/person/A1234BC/ok')

    expect(response.body.courtAppearances).toEqual({})
  })
})
