/* eslint-disable prettier/prettier */
import type { UrlParameters } from 'models'

export default class JudicialFindingsJourneyUrls {

  static selectOffenceWithJudicialFindings = (urlParameters: UrlParameters) => {
    return `${this.basePath(urlParameters)}/select-offence-with-judicial-findings`
  }

  static checkAnswers = (urlParameters: UrlParameters) => {
    return `${this.basePath(urlParameters)}/check-answers`
  }

  private static basePath(urlParameters: UrlParameters): string {
    return `/person/${urlParameters.nomsId}/${urlParameters.addOrEditCourtCase}/${urlParameters.courtCaseReference}/${urlParameters.addOrEditCourtAppearance}/${urlParameters.appearanceReference}/judicial-findings`
  }
}
