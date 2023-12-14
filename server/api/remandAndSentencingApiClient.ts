import {
  CreateCourtCase,
  CreateCourtCaseResponse,
  RemandAndSentencingPerson,
} from '../@types/remandAndSentencingApi/remandAndSentencingClientTypes'
import config, { ApiConfig } from '../config'
import RestClient from '../data/restClient'

export default class RemandAndSentencingApiClient {
  restClient: RestClient

  constructor(token: string) {
    this.restClient = new RestClient(
      'Remand and Sentencing API',
      config.apis.remandAndSentencingApi as ApiConfig,
      token,
    )
  }

  async getPersonDetail(prisonerId: string): Promise<RemandAndSentencingPerson> {
    return (await this.restClient.get({
      path: `/person/${prisonerId}`,
    })) as unknown as Promise<RemandAndSentencingPerson>
  }

  async createCourtCase(createCourtCase: CreateCourtCase): Promise<CreateCourtCaseResponse> {
    return (await this.restClient.post({
      data: createCourtCase,
      path: '/courtCase',
    })) as unknown as Promise<CreateCourtCaseResponse>
  }
}
