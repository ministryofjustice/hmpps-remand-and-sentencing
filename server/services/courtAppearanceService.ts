import type { CourtAppearance, Offence } from 'models'
import CourtCaseService from './courtCaseService'

export default class CourtAppearanceService {
  constructor(private readonly courtCaseService: CourtCaseService) {}

  setCaseReferenceNumber(
    session: CookieSessionInterfaces.CookieSessionObject,
    nomsId: string,
    courtCaseReference: string,
    caseReferenceNumber: string,
  ) {
    const courtAppearance = this.getCourtAppearance(session, nomsId, courtCaseReference)
    courtAppearance.caseReferenceNumber = caseReferenceNumber
    // eslint-disable-next-line no-param-reassign
    session.courtAppearances[nomsId] = courtAppearance
  }

  getCaseReferenceNumber(
    session: CookieSessionInterfaces.CookieSessionObject,
    nomsId: string,
    courtCaseReference: string,
  ): string {
    return this.getCourtAppearance(session, nomsId, courtCaseReference).caseReferenceNumber
  }

  setWarrantDate(
    session: CookieSessionInterfaces.CookieSessionObject,
    nomsId: string,
    courtCaseReference: string,
    warrantDate: Date,
  ) {
    const courtAppearance = this.getCourtAppearance(session, nomsId, courtCaseReference)
    courtAppearance.warrantDate = warrantDate
    // eslint-disable-next-line no-param-reassign
    session.courtAppearances[nomsId] = courtAppearance
  }

  getWarrantDate(
    session: CookieSessionInterfaces.CookieSessionObject,
    nomsId: string,
    courtCaseReference: string,
  ): Date {
    return new Date(this.getCourtAppearance(session, nomsId, courtCaseReference).warrantDate)
  }

  setCourtName(
    session: CookieSessionInterfaces.CookieSessionObject,
    nomsId: string,
    courtCaseReference: string,
    courtName: string,
  ) {
    const courtAppearance = this.getCourtAppearance(session, nomsId, courtCaseReference)
    courtAppearance.courtName = courtName
    // eslint-disable-next-line no-param-reassign
    session.courtAppearances[nomsId] = courtAppearance
  }

  getCourtName(
    session: CookieSessionInterfaces.CookieSessionObject,
    nomsId: string,
    courtCaseReference: string,
  ): string {
    return this.getCourtAppearance(session, nomsId, courtCaseReference).courtName
  }

  getNextHearingCourtSelect(
    session: CookieSessionInterfaces.CookieSessionObject,
    nomsId: string,
    courtCaseReference: string,
  ): boolean {
    return this.getCourtAppearance(session, nomsId, courtCaseReference).nextHearingCourtSelect
  }

  setNextHearingCourtSelect(
    session: CookieSessionInterfaces.CookieSessionObject,
    nomsId: string,
    courtCaseReference: string,
    nextHearingCourtSelect: boolean,
  ) {
    const courtAppearance = this.getCourtAppearance(session, nomsId, courtCaseReference)
    courtAppearance.nextHearingCourtSelect = nextHearingCourtSelect
    if (nextHearingCourtSelect) {
      courtAppearance.nextHearingCourtName = courtAppearance.courtName
    }
    // eslint-disable-next-line no-param-reassign
    session.courtAppearances[nomsId] = courtAppearance
  }

  getNextHearingCourtName(
    session: CookieSessionInterfaces.CookieSessionObject,
    nomsId: string,
    courtCaseReference: string,
  ): string {
    return this.getCourtAppearance(session, nomsId, courtCaseReference).nextHearingCourtName
  }

  setNextHearingCourtName(
    session: CookieSessionInterfaces.CookieSessionObject,
    nomsId: string,
    courtCaseReference: string,

    nextHearingCourtName: string,
  ) {
    const courtAppearance = this.getCourtAppearance(session, nomsId, courtCaseReference)
    courtAppearance.nextHearingCourtName = nextHearingCourtName
    // eslint-disable-next-line no-param-reassign
    session.courtAppearances[nomsId] = courtAppearance
  }

  setOverallCaseOutcome(
    session: CookieSessionInterfaces.CookieSessionObject,
    nomsId: string,
    courtCaseReference: string,
    overallCaseOutcome: string,
  ) {
    const courtAppearance = this.getCourtAppearance(session, nomsId, courtCaseReference)
    courtAppearance.overallCaseOutcome = overallCaseOutcome
    // eslint-disable-next-line no-param-reassign
    session.courtAppearances[nomsId] = courtAppearance
  }

  getOverallCaseOutcome(
    session: CookieSessionInterfaces.CookieSessionObject,
    nomsId: string,
    courtCaseReference: string,
  ): string {
    return this.getCourtAppearance(session, nomsId, courtCaseReference).overallCaseOutcome
  }

  setCaseOutcomeAppliedAll(
    session: CookieSessionInterfaces.CookieSessionObject,
    nomsId: string,
    courtCaseReference: string,
    caseOutcomeAppliedAll: boolean,
  ) {
    const courtAppearance = this.getCourtAppearance(session, nomsId, courtCaseReference)
    courtAppearance.caseOutcomeAppliedAll = caseOutcomeAppliedAll
    // eslint-disable-next-line no-param-reassign
    session.courtAppearances[nomsId] = courtAppearance
  }

  getCaseOutcomeAppliedAll(
    session: CookieSessionInterfaces.CookieSessionObject,
    nomsId: string,
    courtCaseReference: string,
  ): boolean {
    return this.getCourtAppearance(session, nomsId, courtCaseReference).caseOutcomeAppliedAll
  }

  getNextHearingSelect(
    session: CookieSessionInterfaces.CookieSessionObject,
    nomsId: string,
    courtCaseReference: string,
  ): boolean {
    return this.getCourtAppearance(session, nomsId, courtCaseReference).nextHearingSelect
  }

  setNextHearingSelect(
    session: CookieSessionInterfaces.CookieSessionObject,
    nomsId: string,
    courtCaseReference: string,
    nextHearingSelect: boolean,
  ) {
    const courtAppearance = this.getCourtAppearance(session, nomsId, courtCaseReference)
    courtAppearance.nextHearingSelect = nextHearingSelect
    // eslint-disable-next-line no-param-reassign
    session.courtAppearances[nomsId] = courtAppearance
  }

  getNextHearingType(
    session: CookieSessionInterfaces.CookieSessionObject,
    nomsId: string,
    courtCaseReference: string,
  ): string {
    return this.getCourtAppearance(session, nomsId, courtCaseReference).nextHearingType
  }

  setNextHearingType(
    session: CookieSessionInterfaces.CookieSessionObject,
    nomsId: string,
    courtCaseReference: string,
    nextHearingType: string,
  ) {
    const courtAppearance = this.getCourtAppearance(session, nomsId, courtCaseReference)
    courtAppearance.nextHearingType = nextHearingType
    // eslint-disable-next-line no-param-reassign
    session.courtAppearances[nomsId] = courtAppearance
  }

  getNextHearingDate(
    session: CookieSessionInterfaces.CookieSessionObject,
    nomsId: string,
    courtCaseReference: string,
  ): Date {
    return this.getCourtAppearance(session, nomsId, courtCaseReference).nextHearingDate
  }

  setNextHearingDate(
    session: CookieSessionInterfaces.CookieSessionObject,
    nomsId: string,
    courtCaseReference: string,
    nextHearingDate: Date,
    nextHearingTimeSet: boolean,
  ) {
    const courtAppearance = this.getCourtAppearance(session, nomsId, courtCaseReference)
    courtAppearance.nextHearingDate = nextHearingDate
    courtAppearance.nextHearingTimeSet = nextHearingTimeSet
    // eslint-disable-next-line no-param-reassign
    session.courtAppearances[nomsId] = courtAppearance
  }

  getSessionCourtAppearance(
    session: CookieSessionInterfaces.CookieSessionObject,
    nomsId: string,
    courtCaseReference: string,
  ): CourtAppearance {
    return this.getCourtAppearance(session, nomsId, courtCaseReference)
  }

  addOffence(
    session: CookieSessionInterfaces.CookieSessionObject,
    nomsId: string,
    courtCaseReference: string,
    offenceReference: number,
    offence: Offence,
  ) {
    const courtAppearance = this.getCourtAppearance(session, nomsId, courtCaseReference)
    if (courtAppearance.offences.length >= offenceReference) {
      courtAppearance.offences[offenceReference] = offence
    } else {
      courtAppearance.offences.push(offence)
    }
    // eslint-disable-next-line no-param-reassign
    session.courtAppearances[nomsId] = courtAppearance
  }

  deleteOffence(
    session: CookieSessionInterfaces.CookieSessionObject,
    nomsId: string,
    courtCaseReference: string,
    offenceReference: number,
  ) {
    const courtAppearance = this.getCourtAppearance(session, nomsId, courtCaseReference)
    courtAppearance.offences.splice(offenceReference, 1)
    // eslint-disable-next-line no-param-reassign
    session.courtAppearances[nomsId] = courtAppearance
  }

  getOffence(
    session: CookieSessionInterfaces.CookieSessionObject,
    nomsId: string,
    courtCaseReference: string,
    offenceReference: number,
  ): Offence {
    const courtAppearance = this.getCourtAppearance(session, nomsId, courtCaseReference)
    return courtAppearance.offences[offenceReference]
  }

  clearSessionCourtAppearance(session: CookieSessionInterfaces.CookieSessionObject, nomsId: string) {
    // eslint-disable-next-line no-param-reassign
    delete session.courtAppearances[nomsId]
  }

  private getCourtAppearance(
    session: CookieSessionInterfaces.CookieSessionObject,
    nomsId: string,
    courtCaseReference: string,
  ): CourtAppearance {
    const lastSavedAppearance = this.courtCaseService.getLastSavedAppearance(session, nomsId, courtCaseReference)
    return session.courtAppearances[nomsId] ?? { offences: lastSavedAppearance.offences ?? [] }
  }
}
