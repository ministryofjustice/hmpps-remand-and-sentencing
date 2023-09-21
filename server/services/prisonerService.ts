import { Readable } from 'stream'
import { PrisonApiPrisoner } from '../@types/prisonApi/prisonClientTypes'
import PrisonApiClient from '../api/prisonApiClient'

export default class PrisonerService {
  async getPrisonerDetails(nomsId: string, token: string): Promise<PrisonApiPrisoner> {
    return new PrisonApiClient(token).getPrisonerDetail(nomsId)
  }

  getPrisonerImage(nomsId: string, token: string): Promise<Readable> {
    return new PrisonApiClient(token).getPrisonerImage(nomsId)
  }
}
