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
    }
  }
}
