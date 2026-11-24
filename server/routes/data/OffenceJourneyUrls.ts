export default class OffenceJourneyUrls {
  static confirmOffenceCode = (
    nomsId: string,
    addOrEditCourtCase: string,
    courtCaseUuid: string,
    addOrEditCourtAppearance: string,
    courtAppearanceUuid: string,
    chargeUuid: string,
    submitToEditOffence: string,
  ) => {
    return `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseUuid}/${addOrEditCourtAppearance}/${courtAppearanceUuid}/offences/${chargeUuid}/confirm-offence-code${submitToEditOffence ? '?submitToEditOffence=true' : ''}`
  }

  static isOffenceAggravated = (
    nomsId: string,
    addOrEditCourtCase: string,
    courtCaseUuid: string,
    addOrEditCourtAppearance: string,
    courtAppearanceUuid: string,
    chargeUuid: string,
    submitToEditOffence: string,
  ) => {
    return `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseUuid}/${addOrEditCourtAppearance}/${courtAppearanceUuid}/offences/${chargeUuid}/is-offence-aggravated${submitToEditOffence ? '?submitToEditOffence=true' : ''}`
  }

  static offenceCode = (
    nomsId: string,
    addOrEditCourtCase: string,
    courtCaseUuid: string,
    addOrEditCourtAppearance: string,
    courtAppearanceUuid: string,
    chargeUuid: string,
    submitToEditOffence: string,
  ) => {
    return `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseUuid}/${addOrEditCourtAppearance}/${courtAppearanceUuid}/offences/${chargeUuid}/offence-code${submitToEditOffence ? '?submitToEditOffence=true' : ''}`
  }

  static inactiveOffence = (
    nomsId: string,
    addOrEditCourtCase: string,
    courtCaseUuid: string,
    addOrEditCourtAppearance: string,
    courtAppearanceUuid: string,
    chargeUuid: string,
    submitToEditOffence: string,
  ) => {
    return `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseUuid}/${addOrEditCourtAppearance}/${courtAppearanceUuid}/offences/${chargeUuid}/inactive-offence${submitToEditOffence ? '?submitToEditOffence=true' : ''}`
  }

  static offenceValue = (
    nomsId: string,
    addOrEditCourtCase: string,
    courtCaseUuid: string,
    addOrEditCourtAppearance: string,
    courtAppearanceUuid: string,
    chargeUuid: string,
    hasErrors?: string,
    submitToEditOffence?: string,
  ) => {
    return `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseUuid}/${addOrEditCourtAppearance}/${courtAppearanceUuid}/offences/${chargeUuid}/offence-value${OffenceJourneyUrls.getQueryParameters(hasErrors, submitToEditOffence)}`
  }

  static countNumber = (
    nomsId: string,
    addOrEditCourtCase: string,
    courtCaseUuid: string,
    addOrEditCourtAppearance: string,
    courtAppearanceUuid: string,
    chargeUuid: string,
  ) => {
    return `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseUuid}/${addOrEditCourtAppearance}/${courtAppearanceUuid}/offences/${chargeUuid}/count-number`
  }

  private static getQueryParameters(hasErrors?: string, submitToEditOffence?: string): string {
    const queryParameters = []
    if (hasErrors) {
      queryParameters.push('hasErrors=true')
    }
    if (submitToEditOffence) {
      queryParameters.push('submitToEditOffence=true')
    }
    return queryParameters.length ? `?${queryParameters.join('&')}` : ''
  }
}
