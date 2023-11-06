import { Readable } from 'stream'
import PrisonApiClient from '../api/prisonApiClient'

export default class PrisonerService {
  getPrisonerImage(nomsId: string, token: string): Promise<Readable> {
    return new PrisonApiClient(token).getPrisonerImage(nomsId)
  }
}
