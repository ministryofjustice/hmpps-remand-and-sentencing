export default class DatafixJourneyUrls {
  static home = (success?: string) => {
    return `/admin/data-fix${this.getQueryParameters(success)}`
  }

  private static getQueryParameters(success?: string): string {
    const queryParameters = []
    if (success) {
      queryParameters.push('success=true')
    }
    return queryParameters.length ? `?${queryParameters.join('&')}` : ''
  }
}
