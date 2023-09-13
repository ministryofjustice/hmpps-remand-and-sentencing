import { PrisonApiPrisoner } from '../@types/prisonApi/prisonClientTypes'
import PrisonApiClient from '../api/prisonApiClient'

export default class PrisonerService {
  async getPrisonerDetails(nomsId: string, token: string): Promise<PrisonApiPrisoner> {
    return new PrisonApiClient(token).getPrisonerDetail(nomsId)
  }
}
