import type { UrlParameters } from 'models'

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

  static enterOffence = (urlParameters: UrlParameters, hasErrors?: string): string => {
    return `${this.basePath(urlParameters)}/enter-offence${this.getQueryParameters(hasErrors)}`
  }

  private static getQueryParameters(hasErrors?: string): string {
    const queryParameters = []
    if (hasErrors) {
      queryParameters.push('hasErrors=true')
    }
    return queryParameters.length ? `?${queryParameters.join('&')}` : ''
  }

  private static basePath(urlParameters: UrlParameters): string {
    return `/person/${urlParameters.nomsId}/${urlParameters.addOrEditCourtCase}/${urlParameters.courtCaseReference}/${urlParameters.addOrEditCourtAppearance}/${urlParameters.appearanceReference}/offences/${urlParameters.chargeUuid}}`
  }
}
