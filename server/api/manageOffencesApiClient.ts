import RestClient from '../data/restClient'
import config, { ApiConfig } from '../config'
import type { Offence } from '../@types/manageOffencesApi/manageOffencesClientTypes'

export default class ManageOffencesApiClient {
  restClient: RestClient

  constructor(token: string) {
    this.restClient = new RestClient('Manage Offences API', config.apis.manageOffencesApi as ApiConfig, token)
  }

  async getOffenceByCode(code: string): Promise<Offence> {
    return (await this.restClient.get({ path: `/offences/code/unique/${code}` })) as unknown as Promise<Offence>
  }

  async searchOffence(searchString: string): Promise<Offence[]> {
    return (await this.restClient.get({
      path: `/offences/search`,
      query: { excludeLegislation: true, searchString },
    })) as unknown as Promise<Offence[]>
  }

  async getOffencesByCodes(codes: string[]): Promise<Offence[]> {
    return (await this.restClient.get({
      path: '/offences/code/multiple',
      query: { offenceCodes: codes.join() },
    })) as unknown as Promise<Offence[]>
  }
}
