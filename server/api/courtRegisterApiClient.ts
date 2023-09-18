import RestClient from '../data/restClient'
import config, { ApiConfig } from '../config'
import { Court } from '../@types/courtRegisterApi/courtRegisterClientTypes'

export default class CourtRegisterApiClient {
  restClient: RestClient

  constructor(token: string) {
    this.restClient = new RestClient('Court Register API', config.apis.courtRegisterApi as ApiConfig, token)
  }

  async getAllCourts(): Promise<Court[]> {
    return (await this.restClient.get({ path: '/courts/all' })) as Promise<Court[]>
  }
}
