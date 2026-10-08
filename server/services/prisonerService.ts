import { Readable } from 'stream'
import PrisonApiClient from '../data/prisonApiClient'
import { Agency, CaseLoad, InmateDetail } from '../@types/prisonApi/types'

export default class PrisonerService {
  constructor(private readonly prisonApiClient: PrisonApiClient) {}

  async getPrisonerImage(nomsId: string, username: string): Promise<Readable> {
    return this.prisonApiClient.getPrisonerImage(nomsId, username)
  }

  async getUsersCaseloads(token: string): Promise<CaseLoad[]> {
    return this.prisonApiClient.getUsersCaseloads(token)
  }

  async getBookingDetails(bookingId: string, username: string): Promise<InmateDetail> {
    return this.prisonApiClient.getBookingDetails(bookingId, username)
  }

  async getAgencyDetails(agencyId: string, username: string): Promise<Agency> {
    return this.prisonApiClient.getAgencyDetails(agencyId, username)
  }
}
