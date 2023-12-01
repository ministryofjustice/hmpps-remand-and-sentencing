import type { CourtAppearance, CourtCase } from 'models'

export default class CourtCaseService {
  getNewSessionCourtCaseId(session: CookieSessionInterfaces.CookieSessionObject, nomsId: string): string {
    return Object.keys(session.courtCases)
      .filter(key => key.startsWith(nomsId))
      .length.toString()
  }

  getSessionCourtCase(
    session: CookieSessionInterfaces.CookieSessionObject,
    nomsId: string,
    courtCaseReference: string,
  ) {
    const persistId = this.getCourtCasePersistId(nomsId, courtCaseReference)
    return this.getCourtCase(session.courtCases, persistId, courtCaseReference)
  }

  saveSessionCourtCase(
    session: CookieSessionInterfaces.CookieSessionObject,
    nomsId: string,
    courtCaseReference: string,
    courtAppearance: CourtAppearance,
  ): string {
    const persistId = this.getCourtCasePersistId(nomsId, courtCaseReference)
    const courtCase = this.getCourtCase(session.courtCases, persistId, courtCaseReference)
    courtCase.appearances.push(courtAppearance)
    // eslint-disable-next-line no-param-reassign
    session.courtCases[persistId] = courtCase
    return courtCase.uniqueIdentifier
  }

  getSessionSavedCourtCase(
    session: CookieSessionInterfaces.CookieSessionObject,
    nomsId: string,
    courtCaseReference: string,
  ): CourtCase {
    return this.getSavedCourtCases(session.courtCases, nomsId, courtCaseReference)
  }

  private getSavedCourtCases(
    savedCourtCases: Map<string, Map<string, CourtCase>>,
    nomsId: string,
    courtCaseReference: string,
  ): CourtCase {
    return savedCourtCases[this.getCourtCasePersistId(nomsId, courtCaseReference)]
  }

  private getCourtCasePersistId(nomsId: string, courtCaseReference: string) {
    return `${nomsId}-${courtCaseReference}`
  }

  private getCourtCase(courtCases: Map<string, CourtCase>, courtCaseId: string, uniqueIdentifier: string): CourtCase {
    return courtCases[courtCaseId] ?? { appearances: [], uniqueIdentifier }
  }
}
