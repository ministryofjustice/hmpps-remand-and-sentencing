import RestClient from '../data/restClient'
import config, { ApiConfig } from '../config'
import { Court } from '../@types/courtRegisterApi/courtRegisterClientTypes'
import { CourtDtoPage } from '../@types/courtRegisterApi/types'

export default class CourtRegisterApiClient {
  restClient: RestClient

  constructor(token: string) {
    this.restClient = new RestClient('Court Register API', config.apis.courtRegisterApi as ApiConfig, token)
  }

  async getAllCourts(): Promise<Court[]> {
    return (await this.restClient.get({ path: '/courts/all' })) as unknown as Promise<Court[]>
  }

  async searchCourt(textSearch: string): Promise<CourtDtoPage> {
    return (await this.restClient.get({
      path: '/courts/paged',
      query: { page: 0, size: 50, sort: 'courtName', textSearch },
    })) as unknown as Promise<CourtDtoPage>
  }
}
