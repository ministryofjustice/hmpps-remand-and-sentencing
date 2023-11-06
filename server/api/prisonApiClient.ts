import { Readable } from 'stream'
import config, { ApiConfig } from '../config'
import RestClient from '../data/restClient'

export default class PrisonApiClient {
  restClient: RestClient

  constructor(token: string) {
    this.restClient = new RestClient('Prison API', config.apis.prisonApi as ApiConfig, token)
  }

  async getPrisonerImage(nomsId: string): Promise<Readable> {
    try {
      return await this.restClient.stream({
        path: `/api/bookings/offenderNo/${nomsId}/image/data`,
      })
    } catch (error) {
      return error
    }
  }
}
