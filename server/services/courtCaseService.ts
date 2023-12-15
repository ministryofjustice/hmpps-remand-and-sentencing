import type { CourtAppearance, CourtCase } from 'models'

export default class CourtCaseService {
  getNewSessionCourtCaseId(session: CookieSessionInterfaces.CookieSessionObject, nomsId: string): string {
    return Object.keys(session.courtCases)
      .filter(key => key.startsWith(nomsId))
      .length.toString()
  }

  getSessionCourtCases(session: CookieSessionInterfaces.CookieSessionObject, nomsId: string): CourtCase[] {
    return Object.keys(session.courtCases)
      .filter(key => key.startsWith(nomsId))
      .map(key => session.courtCases[key])
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
    appearanceReference: number,
    courtAppearance: CourtAppearance,
  ): string {
    const persistId = this.getCourtCasePersistId(nomsId, courtCaseReference)
    const courtCase = this.getCourtCase(session.courtCases, persistId, courtCaseReference)
    if (courtCase.appearances.length >= appearanceReference) {
      courtCase.appearances[appearanceReference] = courtAppearance
    } else {
      courtCase.appearances.push(courtAppearance)
    }
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

  getLastSavedAppearance(
    session: CookieSessionInterfaces.CookieSessionObject,
    nomsId: string,
    courtCaseReference: string,
  ): CourtAppearance {
    const persistId = this.getCourtCasePersistId(nomsId, courtCaseReference)
    const { appearances } = this.getCourtCase(session.courtCases, persistId, courtCaseReference)
    return appearances[appearances.length - 1] ?? {}
  }

  getUniqueIdentifier(
    session: CookieSessionInterfaces.CookieSessionObject,
    nomsId: string,
    courtCaseReference: string,
  ) {
    const persistId = this.getCourtCasePersistId(nomsId, courtCaseReference)
    return this.getCourtCase(session.courtCases, persistId, courtCaseReference).uniqueIdentifier
  }

  addAllCourtCasesToSession(
    session: CookieSessionInterfaces.CookieSessionObject,
    nomsId: string,
    courtCases: CourtCase[],
  ) {
    courtCases.forEach(courtCase => {
      const persistId = this.getCourtCasePersistId(nomsId, courtCase.uniqueIdentifier)
      // eslint-disable-next-line no-param-reassign
      session.courtCases[persistId] = courtCase
    })
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

  private getCourtCase(courtCases: Map<string, CourtCase>, courtCaseId: string, courtCaseReference: string): CourtCase {
    return courtCases[courtCaseId] ?? { appearances: [], uniqueIdentifier: parseInt(courtCaseReference, 10) + 1 }
  }
}
