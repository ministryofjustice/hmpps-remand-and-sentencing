import type { CourtAppearance } from 'models'

export default class CourtAppearanceService {
  setCaseReferenceNumber(
    session: CookieSessionInterfaces.CookieSessionObject,
    nomsId: string,
    caseReferenceNumber: string,
  ) {
    const courtAppearance = this.getCourtAppearance(session.courtAppearances, nomsId)
    courtAppearance.caseReferenceNumber = caseReferenceNumber
    // eslint-disable-next-line no-param-reassign
    session.courtAppearances[nomsId] = courtAppearance
  }

  getCaseReferenceNumber(session: CookieSessionInterfaces.CookieSessionObject, nomsId: string): string {
    return this.getCourtAppearance(session.courtAppearances, nomsId).caseReferenceNumber
  }

  setWarrantDate(session: CookieSessionInterfaces.CookieSessionObject, nomsId: string, warrantDate: Date) {
    const courtAppearance = this.getCourtAppearance(session.courtAppearances, nomsId)
    courtAppearance.warrantDate = warrantDate
    // eslint-disable-next-line no-param-reassign
    session.courtAppearances[nomsId] = courtAppearance
  }

  getWarrantDate(session: CookieSessionInterfaces.CookieSessionObject, nomsId: string): Date {
    return new Date(this.getCourtAppearance(session.courtAppearances, nomsId).warrantDate)
  }

  setCourtName(session: CookieSessionInterfaces.CookieSessionObject, nomsId: string, courtName: string) {
    const courtAppearance = this.getCourtAppearance(session.courtAppearances, nomsId)
    courtAppearance.courtName = courtName
    // eslint-disable-next-line no-param-reassign
    session.courtAppearances[nomsId] = courtAppearance
  }

  getCourtName(session: CookieSessionInterfaces.CookieSessionObject, nomsId: string): string {
    return this.getCourtAppearance(session.courtAppearances, nomsId).courtName
  }

  getSessionCourtAppearance(session: CookieSessionInterfaces.CookieSessionObject, nomsId: string): CourtAppearance {
    return this.getCourtAppearance(session.courtAppearances, nomsId)
  }

  private getCourtAppearance(courtAppearances: Map<string, CourtAppearance>, nomsId: string): CourtAppearance {
    return courtAppearances[nomsId] ?? {}
  }
}
