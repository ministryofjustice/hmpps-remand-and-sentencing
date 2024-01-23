import {
  CreateCourtAppearance,
  CreateCourtAppearanceResponse,
  CreateCourtCase,
  CreateCourtCaseResponse,
  PageCourtCase,
  PageCourtCaseAppearance,
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
      path: '/court-case',
    })) as unknown as Promise<CreateCourtCaseResponse>
  }

  async searchCourtCases(prisonerId: string, sortBy: string): Promise<PageCourtCase> {
    return (await this.restClient.get({
      path: `/court-case/search`,
      query: {
        prisonerId,
        sort: `latestCourtAppearance_appearanceDate,${sortBy}`,
      },
    })) as unknown as Promise<PageCourtCase>
  }

  async createCourtAppearance(createCourtAppearance: CreateCourtAppearance): Promise<CreateCourtAppearanceResponse> {
    return (await this.restClient.post({
      data: createCourtAppearance,
      path: '/court-appearance',
    })) as unknown as Promise<CreateCourtAppearanceResponse>
  }

  async getLatestAppearanceByCourtCaseUuid(courtCaseUuid: string): Promise<PageCourtCaseAppearance> {
    return (await this.restClient.get({
      path: `/court-case/${courtCaseUuid}/latest-appearance`,
    })) as unknown as Promise<PageCourtCaseAppearance>
  }
}
