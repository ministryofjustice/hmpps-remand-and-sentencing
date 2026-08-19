import { RequestHandler, Router } from 'express'
import type { Session, SessionData } from 'express-session'
import type { CourtAppearance, CourtCase, Offence } from 'models'
import logger from '../../logger'
import { restoreAndClearSession } from '../data/sessionRecoveryStore'

export const initialiseJourneySessionDefaults: RequestHandler = (req, res, next) => {
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
}

/**
 * Merges journey data recovered from sessionRecoveryStore into a (new) session. Excludes `cookie`:
 * that's session-store-owned metadata (expiry etc.) for the old, now-destroyed session and must not
 * overwrite the new session's own cookie.
 */
export function restoreJourneySession(currentSession: Session & Partial<SessionData>, recovered: Partial<SessionData>) {
  const { cookie, ...journeyData } = recovered as Record<string, unknown>
  Object.assign(currentSession, journeyData)
}

/** Pulls any snapshot saved for this user+prisoner out of Redis and merges it into the session. */
export async function restoreRecoveredJourneySession(
  session: Session & Partial<SessionData>,
  username: string,
  nomsId: string,
): Promise<void> {
  const recovered = await restoreAndClearSession(username, nomsId)
  if (recovered) {
    restoreJourneySession(session, recovered)
    logger.info(`Restored session data for user ${username} and prisoner ${nomsId} after token refresh`)
  }
}

export default function setUpJourneySession(): Router {
  const router = Router()
  router.use(initialiseJourneySessionDefaults)
  return router
}
