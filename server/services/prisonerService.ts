import { Readable } from 'stream'
import PrisonApiClient from '../api/prisonApiClient'
import { PrisonApiUserCaseloads } from '../@types/prisonApi/types'

export default class PrisonerService {
  getPrisonerImage(nomsId: string, token: string): Promise<Readable> {
    return new PrisonApiClient(token).getPrisonerImage(nomsId)
  }

  async getUsersCaseloads(token: string): Promise<PrisonApiUserCaseloads[]> {
    return new PrisonApiClient(token).getUsersCaseloads()
  }
}
