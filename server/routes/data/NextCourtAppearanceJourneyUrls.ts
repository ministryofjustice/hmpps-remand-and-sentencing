export default class NextCourtAppearanceJourneyUrls {
  static nextAppearanceType(
    nomsId: string,
    addOrEditCourtCase: string,
    courtCaseUuid: string,
    addOrEditCourtAppearance: string,
    courtAppearanceUuid: string,
  ): string {
    return `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseUuid}/${addOrEditCourtAppearance}/${courtAppearanceUuid}/next-appearance-type`
  }

  static nextAppearanceSubtype(
    nomsId: string,
    addOrEditCourtCase: string,
    courtCaseUuid: string,
    addOrEditCourtAppearance: string,
    courtAppearanceUuid: string,
    hasErrors?: string,
    submitToCheckAnswers?: string,
  ): string {
    return `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseUuid}/${addOrEditCourtAppearance}/${courtAppearanceUuid}/next-appearance-subtype${this.getQueryParameters(hasErrors, submitToCheckAnswers)}`
  }

  private static getQueryParameters(hasErrors?: string, submitToCheckAnswers?: string): string {
    const queryParameters = []
    if (hasErrors) {
      queryParameters.push('hasErrors=true')
    }
    if (submitToCheckAnswers) {
      queryParameters.push('submitToCheckAnswers=true')
    }
    return queryParameters.length ? `?${queryParameters.join('&')}` : ''
  }
}
