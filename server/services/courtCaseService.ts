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
    courtCase.warrantDate = warrantDate
    // eslint-disable-next-line no-param-reassign
    session.courtCases[nomsId] = courtCase
  }

  private getCourtCase(courtCases: Map<string, CourtCase>, nomsId: string): CourtCase {
    return courtCases[nomsId] ?? {}
  }
}
