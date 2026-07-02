import type { UrlParameters } from 'models'

export default class BreachJourneyUrls {
  static breachType(urlParameters: UrlParameters): string {
    return `${this.basePath(urlParameters)}/breach-type`
  }

  private static basePath(urlParameters: UrlParameters): string {
    return `/person/${urlParameters.nomsId}/${urlParameters.addOrEditCourtCase}/${urlParameters.courtCaseReference}/${urlParameters.addOrEditCourtAppearance}/${urlParameters.appearanceReference}/breach`
  }
}
