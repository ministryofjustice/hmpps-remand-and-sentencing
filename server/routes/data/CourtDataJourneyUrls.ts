export default class CourtDataJourneyUrls {
  static courtDataIngestionStart = (nomsId: string, hearingId: string, courtCase?: string) => {
    return `/person/${nomsId}/review-new-documents/${hearingId}/start${courtCase ? `/${courtCase}` : ''}`
  }

  static courtDataIngestionLanding = (nomsId: string, hearingId: string, existingCase: boolean) => {
    return `/person/${nomsId}/review-new-documents/${hearingId}/landing${existingCase ? '/existing-case' : ''}`
  }

  static courtDataIngestionSelectCase = (nomsId: string, hearingId: string) => {
    return `/person/${nomsId}/review-new-documents/${hearingId}/select-court-case`
  }
}
