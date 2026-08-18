import type { CourtAppearance, CourtCase, Offence } from 'models'
import { PrisonerSearchApiPrisoner } from '../prisonerSearchApi/prisonerSearchTypes'
import { HmppsUser } from '../../interfaces/hmppsUser'

export declare module 'express-session' {
  // Declare that the session will potentially contain these additional fields
  interface SessionData {
    returnTo: string
    courtCases: Map<string, CourtCase>
    courtAppearances: Map<string, CourtAppearance>
    savedCourtCases: Map<string, CourtCase>
    offences: Map<string, Offence>
    unknownRecallSentenceUuids: Map<string, string[]>
    aggravatingChargeUuids?: { chargeUuid: string; processed: boolean }[]
    outcomeUpdateChargeUuids?: string[]
    // Set by Passport's serializeUser once a user has logged in — stores exactly what the OAuth2
    // verify callback produced ({ token, username, authSource }, see setUpAuthentication.ts), not
    // the fuller HmppsUser profile assembled later by setUpCurrentUser.ts. Present on the raw session
    // before passport.session() has run for a given request, which is what lets us read the username
    // at points in the middleware chain that run before passport.session() (e.g. setUpWebSession.ts).
    passport?: { user?: Express.User }
  }
}

export declare global {
  namespace Express {
    interface User {
      username: string
      token: string
      authSource: string
    }

    interface Request {
      verified?: boolean
      id: string
      logout(done: (err: unknown) => void): void
      flash(type: string, message: Array<Record<string, string>>): number
      flash(message: 'errors'): Array<Record<string, string>>
      flash(type: string, message: Record<string, unknown>): number
    }

    interface Locals {
      user: HmppsUser
      prisoner: PrisonerSearchApiPrisoner
      cspNonce: string
      csrfToken: string
      asset_path: string
      applicationName: string
      environmentName: string
      environmentNameColour: string
      appInsightsConnectionString?: string
      appInsightsApplicationName?: string
      buildNumber?: string
    }
  }
}
