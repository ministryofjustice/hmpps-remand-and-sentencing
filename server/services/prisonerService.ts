import { Readable } from 'stream'
import PrisonApiClient from '../api/prisonApiClient'
import { CaseLoad } from '../@types/prisonApi/types'
import { HmppsAuthClient } from '../data'

export default class PrisonerService {
  constructor(private readonly hmppsAuthClient: HmppsAuthClient) {}

  async getPrisonerImage(nomsId: string, username: string): Promise<Readable> {
    return new PrisonApiClient(await this.getSystemClientToken(username)).getPrisonerImage(nomsId)
  }

  async getUsersCaseloads(token: string): Promise<CaseLoad[]> {
    return new PrisonApiClient(token).getUsersCaseloads()
  }

  private async getSystemClientToken(username: string): Promise<string> {
    return this.hmppsAuthClient.getSystemClientToken(username)
  }
}
