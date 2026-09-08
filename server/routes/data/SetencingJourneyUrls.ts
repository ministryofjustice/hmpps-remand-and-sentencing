import type { UrlParameters } from 'models'

export default class SentencingJourneyUrls {
  static cannotDeleteConsecutiveOffence = (urlParameters: UrlParameters) => {
    return `${this.basePath(urlParameters)}/offences/${urlParameters.chargeUuid}/cannot-delete-consecutive-offence`
  }

  static cannotDeletePeriodLengthOffence = (urlParameters: UrlParameters) => {
    return `${this.basePath(urlParameters)}/offences/${urlParameters.chargeUuid}/cannot-delete-period-length-offence`
  }

  static selectSentencesToMarkAsInactive = (urlParameters: UrlParameters, hasErrors?: string) => {
    return `${this.basePath(urlParameters)}/select-sentences-to-mark-as-inactive${this.getQueryParameters(hasErrors)}`
  }

  static provideReasonForMarkingSentencesAsInactive = (urlParameters: UrlParameters) => {
    return `${this.basePath(urlParameters)}/provide-reason-for-marking-sentences-as-inactive`
  }

  static cannotMarkSentencesAsInactive = (urlParameters: UrlParameters) => {
    return `${this.basePath(urlParameters)}/cannot-mark-sentences-as-inactive`
  }

  static confirmMarkSentenceAsActive = (urlParameters: UrlParameters) => {
    return `${this.basePath(urlParameters)}/offences/${urlParameters.chargeUuid}/confirm-mark-sentence-as-active`
  }

  static cannotMarkSentenceAsActiveInactiveCase = (urlParameters: UrlParameters) => {
    return `${this.basePath(urlParameters)}/offences/${urlParameters.chargeUuid}/cannot-mark-sentence-as-active-inactive-case`
  }

  static cannotMarkSentenceAsActiveConsecutiveChain = (urlParameters: UrlParameters) => {
    return `${this.basePath(urlParameters)}/offences/${urlParameters.chargeUuid}/cannot-mark-sentence-as-active-consecutive-chain`
  }

  private static basePath(urlParameters: UrlParameters): string {
    return `/person/${urlParameters.nomsId}/${urlParameters.addOrEditCourtCase}/${urlParameters.courtCaseReference}/${urlParameters.addOrEditCourtAppearance}/${urlParameters.appearanceReference}/sentencing`
  }

  private static getQueryParameters(hasErrors?: string): string {
    if (!hasErrors) {
      return ''
    }
    return `?hasErrors=${hasErrors}`
  }
}
