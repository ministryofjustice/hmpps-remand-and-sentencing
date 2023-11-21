import type { CourtAppearance, CourtCase } from 'models'

export default class CourtCaseService {
  setOverallCaseOutcome(
    session: CookieSessionInterfaces.CookieSessionObject,
    nomsId: string,
    overallCaseOutcome: string,
  ) {
    const courtCase = this.getCourtCase(session.courtCases, nomsId)
    courtCase.overallCaseOutcome = overallCaseOutcome
    // eslint-disable-next-line no-param-reassign
    session.courtCases[nomsId] = courtCase
  }

  getOverallCaseOutcome(session: CookieSessionInterfaces.CookieSessionObject, nomsId: string): string {
    return this.getCourtCase(session.courtCases, nomsId).overallCaseOutcome
  }

  setCaseOutcomeAppliedAll(
    session: CookieSessionInterfaces.CookieSessionObject,
    nomsId: string,
    caseOutcomeAppliedAll: boolean,
  ) {
    const courtCase = this.getCourtCase(session.courtCases, nomsId)
    courtCase.caseOutcomeAppliedAll = caseOutcomeAppliedAll
    // eslint-disable-next-line no-param-reassign
    session.courtCases[nomsId] = courtCase
  }

  getCaseOutcomeAppliedAll(session: CookieSessionInterfaces.CookieSessionObject, nomsId: string): boolean {
    return this.getCourtCase(session.courtCases, nomsId).caseOutcomeAppliedAll
  }

  getNextHearingSelect(session: CookieSessionInterfaces.CookieSessionObject, nomsId: string): boolean {
    return this.getCourtCase(session.courtCases, nomsId).nextHearingSelect
  }

  setNextHearingSelect(
    session: CookieSessionInterfaces.CookieSessionObject,
    nomsId: string,
    nextHearingSelect: boolean,
  ) {
    const courtCase = this.getCourtCase(session.courtCases, nomsId)
    courtCase.nextHearingSelect = nextHearingSelect
    // eslint-disable-next-line no-param-reassign
    session.courtCases[nomsId] = courtCase
  }

  getNextHearingType(session: CookieSessionInterfaces.CookieSessionObject, nomsId: string): string {
    return this.getCourtCase(session.courtCases, nomsId).nextHearingType
  }

  setNextHearingType(session: CookieSessionInterfaces.CookieSessionObject, nomsId: string, nextHearingType: string) {
    const courtCase = this.getCourtCase(session.courtCases, nomsId)
    courtCase.nextHearingType = nextHearingType
    // eslint-disable-next-line no-param-reassign
    session.courtCases[nomsId] = courtCase
  }

  getNextHearingCourtSelect(session: CookieSessionInterfaces.CookieSessionObject, nomsId: string): boolean {
    return this.getCourtCase(session.courtCases, nomsId).nextHearingCourtSelect
  }

  setNextHearingCourtSelect(
    session: CookieSessionInterfaces.CookieSessionObject,
    nomsId: string,
    nextHearingCourtSelect: boolean,
  ) {
    const courtCase = this.getCourtCase(session.courtCases, nomsId)
    courtCase.nextHearingCourtSelect = nextHearingCourtSelect
    if (nextHearingCourtSelect) {
      courtCase.nextHearingCourtName = courtCase.courtName
    }
    // eslint-disable-next-line no-param-reassign
    session.courtCases[nomsId] = courtCase
  }

  getNextHearingCourtName(session: CookieSessionInterfaces.CookieSessionObject, nomsId: string): string {
    return this.getCourtCase(session.courtCases, nomsId).nextHearingCourtName
  }

  setNextHearingCourtName(
    session: CookieSessionInterfaces.CookieSessionObject,
    nomsId: string,
    nextHearingCourtName: string,
  ) {
    const courtCase = this.getCourtCase(session.courtCases, nomsId)
    courtCase.nextHearingCourtName = nextHearingCourtName
    // eslint-disable-next-line no-param-reassign
    session.courtCases[nomsId] = courtCase
  }

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
