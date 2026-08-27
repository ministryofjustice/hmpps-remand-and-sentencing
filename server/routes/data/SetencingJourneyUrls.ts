import type { UrlParameters } from 'models'

export default class SentencingJourneyUrls {
  static cannotDeleteConsecutiveOffence = (urlParameters: UrlParameters) => {
    return `${this.basePath(urlParameters)}/offences/${urlParameters.chargeUuid}/cannot-delete-consecutive-offence`
  }

  static cannotDeletePeriodLengthOffence = (urlParameters: UrlParameters) => {
    return `${this.basePath(urlParameters)}/offences/${urlParameters.chargeUuid}/cannot-delete-period-length-offence`
  }

  static selectSentencesToMarkAsInactive = (urlParameters: UrlParameters) => {
    return `${this.basePath(urlParameters)}/select-sentences-to-mark-as-inactive`
  }

  static provideReasonForMarkingSentencesAsInactive = (urlParameters: UrlParameters) => {
    return `${this.basePath(urlParameters)}/provide-reason-for-marking-sentences-as-inactive`
  }

  static cannotMarkSentencesAsInactive = (urlParameters: UrlParameters) => {
    return `${this.basePath(urlParameters)}/cannot-mark-sentences-as-inactive`
  }

  private static basePath(urlParameters: UrlParameters): string {
    return `/person/${urlParameters.nomsId}/${urlParameters.addOrEditCourtCase}/${urlParameters.courtCaseReference}/${urlParameters.addOrEditCourtAppearance}/${urlParameters.appearanceReference}/sentencing`
  }
}
