/* eslint-disable prettier/prettier */
import type { UrlParameters } from 'models'

export default class JudicialFindingsJourneyUrls {

  static selectOffenceWithJudicialFindings = (urlParameters: UrlParameters, hasErrors?: string, fromCheckAnswers?: string): string => {
    return `${this.basePath(urlParameters)}/select-offence-with-judicial-findings${this.getQueryParameters(hasErrors, fromCheckAnswers)}`
  }

  static checkAnswers = (urlParameters: UrlParameters) => {
    return `${this.basePath(urlParameters)}/check-answers`
  }

  private static basePath(urlParameters: UrlParameters): string {
    return `/person/${urlParameters.nomsId}/${urlParameters.addOrEditCourtCase}/${urlParameters.courtCaseReference}/${urlParameters.addOrEditCourtAppearance}/${urlParameters.appearanceReference}/judicial-findings`
  }

  private static getQueryParameters(hasErrors?: string, fromCheckAnswers?: string): string {
    const queryParameters = []
    if (hasErrors) {
      queryParameters.push('hasErrors=true')
    }
    if (fromCheckAnswers) {
      queryParameters.push('fromCheckAnswers=true')
    }
    return queryParameters.length ? `?${queryParameters.join('&')}` : ''
  }
}
