import type { CourtCase } from 'models'

export default class CourtCaseService {
  setCourtCaseReference(session: CookieSessionInterfaces.CookieSessionObject, nomsId: string, referenceNumber: string) {
    const courtCase = this.getCourtCase(session.courtCases, nomsId)
    courtCase.referenceNumber = referenceNumber
    // eslint-disable-next-line no-param-reassign
    session.courtCases[nomsId] = courtCase
  }

  getCourtCaseReference(session: CookieSessionInterfaces.CookieSessionObject, nomsId: string): string {
    return this.getCourtCase(session.courtCases, nomsId).referenceNumber
  }

  setWarrantDate(session: CookieSessionInterfaces.CookieSessionObject, nomsId: string, warrantDate: Date) {
    const courtCase = this.getCourtCase(session.courtCases, nomsId)
    courtCase.warrantDate = warrantDate
    // eslint-disable-next-line no-param-reassign
    session.courtCases[nomsId] = courtCase
  }

  getWarrantDate(session: CookieSessionInterfaces.CookieSessionObject, nomsId: string): Date {
    return new Date(this.getCourtCase(session.courtCases, nomsId).warrantDate)
  }

  setCourtName(session: CookieSessionInterfaces.CookieSessionObject, nomsId: string, courtName: string) {
    const courtCase = this.getCourtCase(session.courtCases, nomsId)
    courtCase.courtName = courtName
    // eslint-disable-next-line no-param-reassign
    session.courtCases[nomsId] = courtCase
  }

  getCourtName(session: CookieSessionInterfaces.CookieSessionObject, nomsId: string): string {
    return this.getCourtCase(session.courtCases, nomsId).courtName
  }

  setNextCourtDate(session: CookieSessionInterfaces.CookieSessionObject, nomsId: string, nextCourtDate: Date) {
    const courtCase = this.getCourtCase(session.courtCases, nomsId)
    courtCase.nextCourtDate = nextCourtDate
    // eslint-disable-next-line no-param-reassign
    session.courtCases[nomsId] = courtCase
  }

  deleteNextCourtDate(session: CookieSessionInterfaces.CookieSessionObject, nomsId: string) {
    const courtCase = this.getCourtCase(session.courtCases, nomsId)
    delete courtCase.nextCourtDate
  }

  getSessionCourtCase(session: CookieSessionInterfaces.CookieSessionObject, nomsId: string) {
    return this.getCourtCase(session.courtCases, nomsId)
  }

  saveCourtCase(session: CookieSessionInterfaces.CookieSessionObject, nomsId: string): string {
    const courtCase = this.getCourtCase(session.courtCases, nomsId)
    // eslint-disable-next-line no-param-reassign
    session.savedCourtCases[`${nomsId}-${courtCase.referenceNumber}`] = courtCase
    return courtCase.referenceNumber
  }

  getSessionSavedCourtCase(
    session: CookieSessionInterfaces.CookieSessionObject,
    nomsId: string,
    courtCaseReference: string,
  ): CourtCase {
    return this.getSavedCourtCases(session.savedCourtCases, nomsId, courtCaseReference)
  }

  private getSavedCourtCases(
    savedCourtCases: Map<string, Map<string, CourtCase>>,
    nomsId: string,
    courtCaseReference: string,
  ): CourtCase {
    return savedCourtCases[`${nomsId}-${courtCaseReference}`]
  }

  private getCourtCase(courtCases: Map<string, CourtCase>, nomsId: string): CourtCase {
    return courtCases[nomsId] ?? {}
  }
}
