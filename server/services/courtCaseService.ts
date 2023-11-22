import type { CourtAppearance, CourtCase } from 'models'

export default class CourtCaseService {
  getSessionCourtCase(session: CookieSessionInterfaces.CookieSessionObject, nomsId: string) {
    return this.getCourtCase(session.courtCases, nomsId)
  }

  saveSessionCourtCase(
    session: CookieSessionInterfaces.CookieSessionObject,
    nomsId: string,
    courtAppearance: CourtAppearance,
  ): string {
    const courtCase = this.getCourtCase(session.courtCases, nomsId)
    courtCase.appearances.push(courtAppearance)
    // eslint-disable-next-line no-param-reassign
    session.courtCases[this.getCourtCasePersistId(nomsId, courtCase.uniqueIdentifier)] = courtCase
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

  private getCourtCase(courtCases: Map<string, CourtCase>, nomsId: string): CourtCase {
    return courtCases[nomsId] ?? { appearances: [], uniqueIdentifier: Object.keys(courtCases).length + 1 }
  }
}
