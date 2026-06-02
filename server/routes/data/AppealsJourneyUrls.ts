import type { UrlParameters } from 'models'

export default class AppealsJourneyUrls {
  static taskList = (urlParameters: UrlParameters) => {
    return `${this.basePath(urlParameters)}/task-list`
  }

  static criminalOfficeReference = (
    urlParameters: UrlParameters,
    hasErrors?: string,
    submitToCheckAnswers?: string,
  ) => {
    return `${this.basePath(urlParameters)}/criminal-office-reference${this.getQueryParameters(hasErrors, submitToCheckAnswers)}`
  }

  static appealDate = (urlParameters: UrlParameters, hasErrors?: string, submitToCheckAnswers?: string) => {
    return `${this.basePath(urlParameters)}/appeal-date${this.getQueryParameters(hasErrors, submitToCheckAnswers)}`
  }

  static appealCourt = (urlParameters: UrlParameters, hasErrors?: string, submitToCheckAnswers?: string) => {
    return `${this.basePath(urlParameters)}/appeal-court${this.getQueryParameters(hasErrors, submitToCheckAnswers)}`
  }

  static overallCaseOutcome = (urlParameters: UrlParameters, hasErrors?: string, submitToCheckAnswers?: string) => {
    return `${this.basePath(urlParameters)}/overall-case-outcome${this.getQueryParameters(hasErrors, submitToCheckAnswers)}`
  }

  static checkHearingAnswers = (urlParameters: UrlParameters) => {
    return `${this.basePath(urlParameters)}/check-hearing-answers`
  }

  static recordAppeal = (urlParameters: UrlParameters, hasErrors?: string) => {
    return `${this.basePath(urlParameters)}/record-appeal${this.getQueryParameters(hasErrors)}`
  }

  static selectOffenceAppealOutcome = (urlParameters: UrlParameters, hasErrors?: string) => {
    return `${this.basePath(urlParameters)}/offences/${urlParameters.chargeUuid}/select-appeal-outcome${this.getQueryParameters(hasErrors)}`
  }

  static uploadCourtDocuments = (urlParameters: UrlParameters) => {
    return `${this.basePath(urlParameters)}/upload-court-documents`
  }

  static uploadAppealsOrder = (urlParameters: UrlParameters, hasErrors?: string) => {
    return `${this.basePath(urlParameters)}/upload-appeal-order${this.getQueryParameters(hasErrors)}`
  }

  static viewAppealsOrder = (urlParameters: UrlParameters, backToUpload?: string) => {
    return `${this.basePath(urlParameters)}/view-appeal-order${backToUpload ? '?backToUpload=true' : ''}`
  }

  static deleteDocument = (urlParameters: UrlParameters, hasErrors?: string) => {
    return `${this.basePath(urlParameters)}/${urlParameters.documentUuid}/delete-document${this.getQueryParameters(hasErrors)}`
  }

  static confirmation = (urlParameters: UrlParameters) => {
    return `${this.basePath(urlParameters)}/confirmation`
  }

  static hearingDetails = (urlParameters: UrlParameters, hasErrors?: string) => {
    return `${this.basePath(urlParameters)}/hearing-details${this.getQueryParameters(hasErrors)}`
  }

  static cannotDeleteOffence = (urlParameters: UrlParameters) => {
    return `${this.basePath(urlParameters)}/offences/${urlParameters.chargeUuid}/cannot-delete-offence`
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
