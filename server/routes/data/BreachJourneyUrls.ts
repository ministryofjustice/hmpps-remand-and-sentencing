import type { UrlParameters } from 'models'

export default class BreachJourneyUrls {
  static taskList = (urlParameters: UrlParameters) => {
    return `${this.basePath(urlParameters)}/task-list`
  }

  static breachType(urlParameters: UrlParameters, hasErrors?: string): string {
    return `${this.basePath(urlParameters)}/breach-type${this.getQueryParameters(hasErrors)}`
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
