import type { CourtCase } from 'models'

export default class CourtCaseService {
  setCourtCaseReference(session: CookieSessionInterfaces.CookieSessionObject, nomsId: string, referenceNumber: string) {
    const courtCase = this.getCourtCase(session.courtCases, nomsId)
    courtCase.referenceNumber = referenceNumber
    // eslint-disable-next-line no-param-reassign
    session.courtCases[nomsId] = courtCase
  }

  setWarrantDate(session: CookieSessionInterfaces.CookieSessionObject, nomsId: string, warrantDate: Date) {
    const courtCase = this.getCourtCase(session.courtCases, nomsId)
    courtCase.warrantDate = warrantDate.toLocaleString('en-GB', { timeZone: 'Europe/London' })
    // eslint-disable-next-line no-param-reassign
    session.courtCases[nomsId] = courtCase
  }

  setCourtName(session: CookieSessionInterfaces.CookieSessionObject, nomsId: string, courtName: string) {
    const courtCase = this.getCourtCase(session.courtCases, nomsId)
    courtCase.courtName = courtName
    // eslint-disable-next-line no-param-reassign
    session.courtCases[nomsId] = courtCase
  }

  setNextCourtDate(session: CookieSessionInterfaces.CookieSessionObject, nomsId: string, nextCourtDate: Date) {
    const courtCase = this.getCourtCase(session.courtCases, nomsId)
    courtCase.nextCourtDate = nextCourtDate.toLocaleString('en-GB', { timeZone: 'Europe/London' })
    // eslint-disable-next-line no-param-reassign
    session.courtCases[nomsId] = courtCase
  }

  getSessionCourtCase(session: CookieSessionInterfaces.CookieSessionObject, nomsId: string) {
    return this.getCourtCase(session.courtCases, nomsId)
  }

  private getCourtCase(courtCases: Map<string, CourtCase>, nomsId: string): CourtCase {
    return courtCases[nomsId] ?? {}
  }
}
