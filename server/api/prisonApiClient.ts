import { Readable } from 'stream'
import config, { ApiConfig } from '../config'
import RestClient from '../data/restClient'
import { PrisonApiPrisoner } from '../@types/prisonApi/prisonClientTypes'

export default class PrisonApiClient {
  restClient: RestClient

  constructor(token: string) {
    this.restClient = new RestClient('Prison API', config.apis.prisonApi as ApiConfig, token)
  }

  async getPrisonerDetail(nomsId: string): Promise<PrisonApiPrisoner> {
    return (await this.restClient.get({ path: `/api/offenders/${nomsId}` })) as Promise<PrisonApiPrisoner>
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
