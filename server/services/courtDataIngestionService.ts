import { CourtHearing } from '../@types/courtDataIngestionApi/types'
import CourtDataIngestionApiClient from '../data/courtDataIngestionApiClient'

export default class CourtDataIngestionService {
  constructor(private readonly courtDataIngestionApiClient: CourtDataIngestionApiClient) {}

  async getCourtHearing(courtHearingId: string, prisonerNumber: string, username: string): Promise<CourtHearing> {
    return this.courtDataIngestionApiClient.getCourtHearing(courtHearingId, prisonerNumber, username)
  }
}
