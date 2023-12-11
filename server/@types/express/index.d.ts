import type { CourtAppearance, CourtCase, Offence } from 'models'
import type { UserDetails } from '../../services/userService'

export default {}

declare module 'express-session' {
  // Declare that the session will potentially contain these additional fields
  interface SessionData {
    returnTo: string
    nowInMinutes: number
    courtCases: Map<string, CourtCase>
    courtAppearances: Map<string, CourtAppearance>
    savedCourtCases: Map<string, CourtCase>
    offences: Map<string, Offence>
  }
}

export declare global {
  namespace Express {
    interface User extends Partial<UserDetails> {
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
      flash(message: 'offenceCodeForm'): Record<string, unknown>
    }

    interface Locals {
      user: Express.User
    }
  }
}
