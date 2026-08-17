import type { Session, SessionData } from 'express-session'
import { restoreJourneySession } from './setUpWebSession'

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
