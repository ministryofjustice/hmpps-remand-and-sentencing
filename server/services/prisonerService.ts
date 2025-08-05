import { Readable } from 'stream'
import PrisonApiClient from '../data/prisonApiClient'
import { CaseLoad } from '../@types/prisonApi/types'

export default class PrisonerService {
  constructor(private readonly prisonApiClient: PrisonApiClient) {}

  async getPrisonerImage(nomsId: string, username: string): Promise<Readable> {
    return this.prisonApiClient.getPrisonerImage(nomsId, username)
  }

  async getUsersCaseloads(token: string): Promise<CaseLoad[]> {
    return this.prisonApiClient.getUsersCaseloads(token)
  }
}
