export default class AggravatingFactorsJourneyUrls {
  static checkAggravatingFactorsAnswers = (
    nomsId: string,
    addOrEditCourtCase: string,
    courtCaseUuid: string,
    addOrEditCourtAppearance: string,
    courtAppearanceUuid: string,
    hasErrors?: string,
    fromCheckAnswers?: string,
  ) => {
    return `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseUuid}/${addOrEditCourtAppearance}/${courtAppearanceUuid}/aggravating-factors/check-aggravating-factors-answers${this.getQueryParameters(hasErrors, fromCheckAnswers)}`
  }

  static selectOffenceWithAggravatingFactors = (
    nomsId: string,
    addOrEditCourtCase: string,
    courtCaseUuid: string,
    addOrEditCourtAppearance: string,
    courtAppearanceUuid: string,
    hasErrors?: string,
    fromCheckAnswers?: string,
  ) => {
    return `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseUuid}/${addOrEditCourtAppearance}/${courtAppearanceUuid}/aggravating-factors/select-offence-with-aggravated-factors${this.getQueryParameters(hasErrors, fromCheckAnswers)}`
  }

  static selectWhichAggravatingFactorsApply = (
    nomsId: string,
    addOrEditCourtCase: string,
    courtCaseUuid: string,
    addOrEditCourtAppearance: string,
    courtAppearanceUuid: string,
    chargeUuid: string,
    fromCheckAnswers?: string,
    hasErrors?: string,
  ) => {
    return `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseUuid}/${addOrEditCourtAppearance}/${courtAppearanceUuid}/aggravating-factors/${chargeUuid}/select-which-aggravating-factors-apply${this.getQueryParameters(hasErrors, fromCheckAnswers)}`
  }

  private static getQueryParameters(hasErrors?: string, fromCheckAnswers?: string): string {
    const queryParameters = []
    if (hasErrors) {
      queryParameters.push('hasErrors=true')
    }
    if (fromCheckAnswers) {
      queryParameters.push('fromCheckAnswers=true')
    }
    return queryParameters.length ? `?${queryParameters.join('&')}` : ''
  }
}
