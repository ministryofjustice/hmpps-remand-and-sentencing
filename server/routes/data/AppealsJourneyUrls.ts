import type { UrlParameters } from 'models'

export default class AppealsJourneyUrls {
  static taskList = (urlParameters: UrlParameters) => {
    return `${AppealsJourneyUrls.basePath(urlParameters)}/task-list`
  }

  static criminalOfficeReference = (
    urlParameters: UrlParameters,
    hasErrors?: string,
    submitToCheckAnswers?: string,
  ) => {
    return `${AppealsJourneyUrls.basePath(urlParameters)}/criminal-office-reference${AppealsJourneyUrls.getQueryParameters(hasErrors, submitToCheckAnswers)}`
  }

  static appealDate = (urlParameters: UrlParameters, hasErrors?: string, submitToCheckAnswers?: string) => {
    return `${AppealsJourneyUrls.basePath(urlParameters)}/appeal-date${AppealsJourneyUrls.getQueryParameters(hasErrors, submitToCheckAnswers)}`
  }

  static appealCourt = (urlParameters: UrlParameters, hasErrors?: string, submitToCheckAnswers?: string) => {
    return `${AppealsJourneyUrls.basePath(urlParameters)}/appeal-court${AppealsJourneyUrls.getQueryParameters(hasErrors, submitToCheckAnswers)}`
  }

  static overallCaseOutcome = (urlParameters: UrlParameters, hasErrors?: string, submitToCheckAnswers?: string) => {
    return `${AppealsJourneyUrls.basePath(urlParameters)}/overall-case-outcome${AppealsJourneyUrls.getQueryParameters(hasErrors, submitToCheckAnswers)}`
  }

  static checkHearingAnswers = (urlParameters: UrlParameters) => {
    return `${AppealsJourneyUrls.basePath(urlParameters)}/check-hearing-answers`
  }

  static recordAppeal = (urlParameters: UrlParameters, hasErrors?: string) => {
    return `${AppealsJourneyUrls.basePath(urlParameters)}/record-appeal${AppealsJourneyUrls.getQueryParameters(hasErrors)}`
  }

  static selectOffenceAppealOutcome = (urlParameters: UrlParameters, hasErrors?: string) => {
    return `${AppealsJourneyUrls.basePath(urlParameters)}/offences/${urlParameters.chargeUuid}/select-appeal-outcome${AppealsJourneyUrls.getQueryParameters(hasErrors)}`
  }

  static uploadCourtDocuments = (urlParameters: UrlParameters) => {
    return `${AppealsJourneyUrls.basePath(urlParameters)}/upload-court-documents`
  }

  static uploadAppealsOrder = (urlParameters: UrlParameters, hasErrors?: string) => {
    return `${AppealsJourneyUrls.basePath(urlParameters)}/upload-appeal-order${AppealsJourneyUrls.getQueryParameters(hasErrors)}`
  }

  static viewAppealsOrder = (urlParameters: UrlParameters, backToUpload?: string) => {
    return `${AppealsJourneyUrls.basePath(urlParameters)}/view-appeal-order${backToUpload ? '?backToUpload=true' : ''}`
  }

  static deleteDocument = (urlParameters: UrlParameters, hasErrors?: string) => {
    return `${AppealsJourneyUrls.basePath(urlParameters)}/${urlParameters.documentUuid}/delete-document${AppealsJourneyUrls.getQueryParameters(hasErrors)}`
  }

  static confirmation = (urlParameters: UrlParameters) => {
    return `${AppealsJourneyUrls.basePath(urlParameters)}/confirmation`
  }

  static hearingDetails = (urlParameters: UrlParameters, hasErrors?: string) => {
    return `${AppealsJourneyUrls.basePath(urlParameters)}/hearing-details${AppealsJourneyUrls.getQueryParameters(hasErrors)}`
  }

  static cannotDeleteConsecutiveOffence = (urlParameters: UrlParameters) => {
    return `${AppealsJourneyUrls.basePath(urlParameters)}/offences/${urlParameters.chargeUuid}/cannot-delete-consecutive-offence`
  }

  static cannotDeletePeriodLengthOffence = (urlParameters: UrlParameters) => {
    return `${AppealsJourneyUrls.basePath(urlParameters)}/offences/${urlParameters.chargeUuid}/cannot-delete-period-length-offence`
  }

  private static basePath(urlParameters: UrlParameters): string {
    return `/person/${urlParameters.nomsId}/${urlParameters.addOrEditCourtCase}/${urlParameters.courtCaseReference}/${urlParameters.addOrEditCourtAppearance}/${urlParameters.appearanceReference}/appeals`
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
