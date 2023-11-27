import type { CourtAppearance, Offence } from 'models'

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

  getNextHearingCourtSelect(session: CookieSessionInterfaces.CookieSessionObject, nomsId: string): boolean {
    return this.getCourtAppearance(session.courtAppearances, nomsId).nextHearingCourtSelect
  }

  setNextHearingCourtSelect(
    session: CookieSessionInterfaces.CookieSessionObject,
    nomsId: string,
    nextHearingCourtSelect: boolean,
  ) {
    const courtAppearance = this.getCourtAppearance(session.courtAppearances, nomsId)
    courtAppearance.nextHearingCourtSelect = nextHearingCourtSelect
    if (nextHearingCourtSelect) {
      courtAppearance.nextHearingCourtName = courtAppearance.courtName
    }
    // eslint-disable-next-line no-param-reassign
    session.courtAppearances[nomsId] = courtAppearance
  }

  getNextHearingCourtName(session: CookieSessionInterfaces.CookieSessionObject, nomsId: string): string {
    return this.getCourtAppearance(session.courtAppearances, nomsId).nextHearingCourtName
  }

  setNextHearingCourtName(
    session: CookieSessionInterfaces.CookieSessionObject,
    nomsId: string,
    nextHearingCourtName: string,
  ) {
    const courtAppearance = this.getCourtAppearance(session.courtAppearances, nomsId)
    courtAppearance.nextHearingCourtName = nextHearingCourtName
    // eslint-disable-next-line no-param-reassign
    session.courtAppearances[nomsId] = courtAppearance
  }

  setOverallCaseOutcome(
    session: CookieSessionInterfaces.CookieSessionObject,
    nomsId: string,
    overallCaseOutcome: string,
  ) {
    const courtAppearance = this.getCourtAppearance(session.courtAppearances, nomsId)
    courtAppearance.overallCaseOutcome = overallCaseOutcome
    // eslint-disable-next-line no-param-reassign
    session.courtAppearances[nomsId] = courtAppearance
  }

  getOverallCaseOutcome(session: CookieSessionInterfaces.CookieSessionObject, nomsId: string): string {
    return this.getCourtAppearance(session.courtAppearances, nomsId).overallCaseOutcome
  }

  setCaseOutcomeAppliedAll(
    session: CookieSessionInterfaces.CookieSessionObject,
    nomsId: string,
    caseOutcomeAppliedAll: boolean,
  ) {
    const courtAppearance = this.getCourtAppearance(session.courtAppearances, nomsId)
    courtAppearance.caseOutcomeAppliedAll = caseOutcomeAppliedAll
    // eslint-disable-next-line no-param-reassign
    session.courtAppearances[nomsId] = courtAppearance
  }

  getCaseOutcomeAppliedAll(session: CookieSessionInterfaces.CookieSessionObject, nomsId: string): boolean {
    return this.getCourtAppearance(session.courtAppearances, nomsId).caseOutcomeAppliedAll
  }

  getNextHearingSelect(session: CookieSessionInterfaces.CookieSessionObject, nomsId: string): boolean {
    return this.getCourtAppearance(session.courtAppearances, nomsId).nextHearingSelect
  }

  setNextHearingSelect(
    session: CookieSessionInterfaces.CookieSessionObject,
    nomsId: string,
    nextHearingSelect: boolean,
  ) {
    const courtAppearance = this.getCourtAppearance(session.courtAppearances, nomsId)
    courtAppearance.nextHearingSelect = nextHearingSelect
    // eslint-disable-next-line no-param-reassign
    session.courtAppearances[nomsId] = courtAppearance
  }

  getNextHearingType(session: CookieSessionInterfaces.CookieSessionObject, nomsId: string): string {
    return this.getCourtAppearance(session.courtAppearances, nomsId).nextHearingType
  }

  setNextHearingType(session: CookieSessionInterfaces.CookieSessionObject, nomsId: string, nextHearingType: string) {
    const courtAppearance = this.getCourtAppearance(session.courtAppearances, nomsId)
    courtAppearance.nextHearingType = nextHearingType
    // eslint-disable-next-line no-param-reassign
    session.courtAppearances[nomsId] = courtAppearance
  }

  getNextHearingDate(session: CookieSessionInterfaces.CookieSessionObject, nomsId: string): Date {
    return this.getCourtAppearance(session.courtAppearances, nomsId).nextHearingDate
  }

  setNextHearingDate(
    session: CookieSessionInterfaces.CookieSessionObject,
    nomsId: string,
    nextHearingDate: Date,
    nextHearingTimeSet: boolean,
  ) {
    const courtAppearance = this.getCourtAppearance(session.courtAppearances, nomsId)
    courtAppearance.nextHearingDate = nextHearingDate
    courtAppearance.nextHearingTimeSet = nextHearingTimeSet
    // eslint-disable-next-line no-param-reassign
    session.courtAppearances[nomsId] = courtAppearance
  }

  getSessionCourtAppearance(session: CookieSessionInterfaces.CookieSessionObject, nomsId: string): CourtAppearance {
    return this.getCourtAppearance(session.courtAppearances, nomsId)
  }

  addOffence(
    session: CookieSessionInterfaces.CookieSessionObject,
    nomsId: string,
    offenceReference: number,
    offence: Offence,
  ) {
    const courtAppearance = this.getCourtAppearance(session.courtAppearances, nomsId)
    if (courtAppearance.offences.length >= offenceReference) {
      courtAppearance.offences[offenceReference] = offence
    } else {
      courtAppearance.offences.push(offence)
    }
    // eslint-disable-next-line no-param-reassign
    session.courtAppearances[nomsId] = courtAppearance
  }

  private getCourtAppearance(courtAppearances: Map<string, CourtAppearance>, nomsId: string): CourtAppearance {
    return courtAppearances[nomsId] ?? { offences: [] }
  }
}
