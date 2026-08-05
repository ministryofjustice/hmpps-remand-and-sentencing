import type { UrlParameters } from 'models'

export default class NonSentencingJourneyUrls {
  static cannotDeleteConsecutiveOffence = (urlParameters: UrlParameters) => {
    return `${this.basePath(urlParameters)}/offences/${urlParameters.chargeUuid}/cannot-delete-consecutive-offence`
  }

  private static basePath(urlParameters: UrlParameters): string {
    return `/person/${urlParameters.nomsId}/${urlParameters.addOrEditCourtCase}/${urlParameters.courtCaseReference}/${urlParameters.addOrEditCourtAppearance}/${urlParameters.appearanceReference}/non-sentencing`
  }
}
