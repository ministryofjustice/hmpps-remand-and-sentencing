import type { Request, Response } from 'express'
import type { Session, SessionData } from 'express-session'
import {
  initialiseJourneySessionDefaults,
  restoreJourneySession,
  restoreRecoveredJourneySession,
} from './setUpJourneySession'
import { restoreAndClearSession } from '../data/sessionRecoveryStore'

jest.mock('../data/sessionRecoveryStore')

describe('initialiseJourneySessionDefaults', () => {
  it('initialises all journey session maps when absent', () => {
    const req = { session: {} } as unknown as Request
    const next = jest.fn()

    initialiseJourneySessionDefaults(req, {} as Response, next)

    expect(req.session.courtCases).toBeInstanceOf(Map)
    expect(req.session.savedCourtCases).toBeInstanceOf(Map)
    expect(req.session.offences).toBeInstanceOf(Map)
    expect(req.session.courtAppearances).toBeInstanceOf(Map)
    expect(req.session.unknownRecallSentenceUuids).toBeInstanceOf(Map)
    expect(next).toHaveBeenCalledWith()
  })

  it('leaves existing journey session maps untouched', () => {
    const existingCourtCases = new Map([['A1234BC', {}]])
    const req = { session: { courtCases: existingCourtCases } } as unknown as Request
    const next = jest.fn()

    initialiseJourneySessionDefaults(req, {} as Response, next)

    expect(req.session.courtCases).toBe(existingCourtCases)
  })
})

describe('restoreJourneySession', () => {
  it('merges recovered journey data into the current session', () => {
    const currentSession = { courtAppearances: {} } as unknown as Session & Partial<SessionData>
    const recovered = { courtAppearances: { A1234BC: { appearanceUuid: '123' } }, offences: { key: {} } }

    restoreJourneySession(currentSession, recovered as unknown as Partial<SessionData>)

    expect(currentSession.courtAppearances).toEqual({ A1234BC: { appearanceUuid: '123' } })
    expect(currentSession.offences).toEqual({ key: {} })
  })

  it('does not overwrite the current session cookie with a recovered one', () => {
    const currentSession = { cookie: { maxAge: 123 }, offences: {} } as unknown as Session & Partial<SessionData>
    const recovered = { cookie: { maxAge: 999 }, offences: { key: {} } }

    restoreJourneySession(currentSession, recovered as unknown as Partial<SessionData>)

    expect(currentSession.cookie).toEqual({ maxAge: 123 })
    expect(currentSession.offences).toEqual({ key: {} })
  })

  it('leaves fields not present in the recovered data untouched', () => {
    const currentSession = {
      courtAppearances: { existing: true },
      offences: { existing: true },
    } as unknown as Session & Partial<SessionData>

    restoreJourneySession(currentSession, { offences: { key: {} } } as unknown as Partial<SessionData>)

    expect(currentSession.courtAppearances).toEqual({ existing: true })
    expect(currentSession.offences).toEqual({ key: {} })
  })
})

describe('restoreRecoveredJourneySession', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('pulls the snapshot for this user+prisoner from Redis and merges it into the session', async () => {
    ;(restoreAndClearSession as jest.Mock).mockResolvedValue({
      courtAppearances: { A1234BC: { appearanceUuid: '123' } },
    })
    const session = { courtAppearances: {} } as unknown as Session & Partial<SessionData>

    await restoreRecoveredJourneySession(session, 'user1', 'A1234BC')

    expect(restoreAndClearSession).toHaveBeenCalledWith('user1', 'A1234BC')
    expect(session.courtAppearances).toEqual({ A1234BC: { appearanceUuid: '123' } })
  })

  it('leaves the session untouched when there is nothing to recover', async () => {
    ;(restoreAndClearSession as jest.Mock).mockResolvedValue(null)
    const session = { courtAppearances: { existing: true } } as unknown as Session & Partial<SessionData>

    await restoreRecoveredJourneySession(session, 'user1', 'A1234BC')

    expect(session.courtAppearances).toEqual({ existing: true })
  })
})
