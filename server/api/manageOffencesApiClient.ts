import RestClient from '../data/restClient'
import config, { ApiConfig } from '../config'
import type { Offence } from '../@types/manageOffencesApi/manageOffencesClientTypes'

export default class ManageOffencesApiClient {
  restClient: RestClient

  constructor(token: string) {
    this.restClient = new RestClient('Manage Offences API', config.apis.manageOffencesApi as ApiConfig, token)
  }

  async getOffenceByCode(code: string): Promise<Offence> {
    return (await this.restClient.get({ path: `/offences/code/unique/${code}` })) as Promise<Offence>
  }
}
