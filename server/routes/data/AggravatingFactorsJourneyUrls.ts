export default class AggravatingFactorsJourneyUrls {
  private static withErrors(hasErrors?: string) {
    return hasErrors === 'true' ? '?hasErrors=true' : ''
  }

  static checkAggravatingFactorsAnswers = (
    nomsId: string,
    addOrEditCourtCase: string,
    courtCaseUuid: string,
    addOrEditCourtAppearance: string,
    courtAppearanceUuid: string,
    hasErrors?: string,
  ) => {
    return `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseUuid}/${addOrEditCourtAppearance}/${courtAppearanceUuid}/aggravating-factors/check-aggravating-factors-answers${this.withErrors(hasErrors)}`
  }

  static selectOffenceWithAggravatingFactors = (
    nomsId: string,
    addOrEditCourtCase: string,
    courtCaseUuid: string,
    addOrEditCourtAppearance: string,
    courtAppearanceUuid: string,
    hasErrors?: string,
  ) => {
    return `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseUuid}/${addOrEditCourtAppearance}/${courtAppearanceUuid}/aggravating-factors/select-offence-with-aggravated-factors${this.withErrors(hasErrors)}`
  }

  static selectWhichAggravatingFactorsApply = (
    nomsId: string,
    addOrEditCourtCase: string,
    courtCaseUuid: string,
    addOrEditCourtAppearance: string,
    courtAppearanceUuid: string,
    chargeUuid: string,
    hasErrors?: string,
  ) => {
    return `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseUuid}/${addOrEditCourtAppearance}/${courtAppearanceUuid}/aggravating-factors/${chargeUuid}/select-which-aggravating-factors-apply${this.withErrors(hasErrors)}`
  }
}
