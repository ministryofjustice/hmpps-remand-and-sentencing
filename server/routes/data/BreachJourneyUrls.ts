import type { UrlParameters } from 'models'

export default class BreachJourneyUrls {
  static breachType(urlParameters: UrlParameters, hasErrors?: string): string {
    return `${this.basePath(urlParameters)}/breach-type${this.getQueryParameters(hasErrors)}`
  }

  static taskList = (urlParameters: UrlParameters) => {
    return `${this.basePath(urlParameters)}/task-list`
  }

  static hearingDate(urlParameters: UrlParameters, hasErrors?: string, submitToCheckAnswers?: string): string {
    return `${this.basePath(urlParameters)}/hearing-date${this.getQueryParameters(hasErrors, submitToCheckAnswers)}`
  }

  static breachCourt(urlParameters: UrlParameters, hasErrors?: string, submitToCheckAnswers?: string): string {
    return `${this.basePath(urlParameters)}/breach-court${this.getQueryParameters(hasErrors, submitToCheckAnswers)}`
  }

  static breachTermLength(urlParameters: UrlParameters, hasErrors?: string, submitToCheckAnswers?: string): string {
    return `${this.basePath(urlParameters)}/breach-term-length${this.getQueryParameters(hasErrors, submitToCheckAnswers)}`
  }

  static alternativeBreachTermLength(
    urlParameters: UrlParameters,
    hasErrors?: string,
    submitToCheckAnswers?: string,
  ): string {
    return `${this.basePath(urlParameters)}/alternative-breach-term-length${this.getQueryParameters(hasErrors, submitToCheckAnswers)}`
  }

  static checkHearingAnswers = (urlParameters: UrlParameters) => {
    return `${this.basePath(urlParameters)}/check-hearing-answers`
  }

  static addOffences = (urlParameters: UrlParameters) => {
    return `${this.basePath(urlParameters)}/check-hearing-answers`
  }

  static uploadBreachOrder = (urlParameters: UrlParameters, hasErrors?: string) => {
    return `${this.basePath(urlParameters)}/upload-breach-order${this.getQueryParameters(hasErrors)}`
  }

  static viewBreachOrder = (urlParameters: UrlParameters, backToUpload?: string) => {
    return `${this.basePath(urlParameters)}/view-breach-order${backToUpload ? '?backToUpload=true' : ''}`
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
    return `/person/${urlParameters.nomsId}/${urlParameters.addOrEditCourtCase}/${urlParameters.courtCaseReference}/${urlParameters.addOrEditCourtAppearance}/${urlParameters.appearanceReference}/breach`
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
