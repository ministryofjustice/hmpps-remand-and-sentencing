import {
  AppearanceOutcome,
  AppearanceType,
  CreateCourtAppearance,
  CreateCourtAppearanceResponse,
  CreateCourtCase,
  CreateCourtCaseResponse,
  DraftCourtAppearance,
  DraftCourtAppearanceCreatedResponse,
  DraftCourtCaseCreatedResponse,
  DraftCreateCourtAppearance,
  DraftCreateCourtCase,
  OffenceOutcome,
  PageCourtCase,
  PageCourtCaseAppearance,
  PageCourtCaseContent,
  SentenceType,
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

  async createCourtCase(createCourtCase: CreateCourtCase): Promise<CreateCourtCaseResponse> {
    return (await this.restClient.post({
      data: createCourtCase,
      path: '/court-case',
    })) as unknown as Promise<CreateCourtCaseResponse>
  }

  async createDraftCourtCase(draftCreateCourtCase: DraftCreateCourtCase): Promise<DraftCourtCaseCreatedResponse> {
    return (await this.restClient.post({
      data: draftCreateCourtCase,
      path: '/draft/court-case',
    })) as unknown as Promise<DraftCourtCaseCreatedResponse>
  }

  async createDraftCourtAppearance(
    courtCaseUuid: string,
    draftCreateCourtAppearance: DraftCreateCourtAppearance,
  ): Promise<DraftCourtAppearanceCreatedResponse> {
    return (await this.restClient.post({
      data: draftCreateCourtAppearance,
      path: `/draft/court-case/${courtCaseUuid}/appearance`,
    })) as unknown as Promise<DraftCourtAppearanceCreatedResponse>
  }

  async updateDraftCourtAppearance(
    courtAppearanceUuid: string,
    draftCreateCourtAppearance: DraftCreateCourtAppearance,
  ): Promise<void> {
    return (await this.restClient.put({
      data: draftCreateCourtAppearance,
      path: `/draft/court-appearance/${courtAppearanceUuid}`,
    })) as unknown as Promise<void>
  }

  async searchCourtCases(prisonerId: string, sortBy: string, page: number): Promise<PageCourtCase> {
    return (await this.restClient.get({
      path: `/court-case/search`,
      query: {
        prisonerId,
        sort: `latestCourtAppearance_appearanceDate,${sortBy}`,
        page,
      },
    })) as unknown as Promise<PageCourtCase>
  }

  async createCourtAppearance(createCourtAppearance: CreateCourtAppearance): Promise<CreateCourtAppearanceResponse> {
    return (await this.restClient.post({
      data: createCourtAppearance,
      path: '/court-appearance',
    })) as unknown as Promise<CreateCourtAppearanceResponse>
  }

  async putCourtAppearance(
    appearanceUuid: string,
    createCourtAppearance: CreateCourtAppearance,
  ): Promise<CreateCourtAppearanceResponse> {
    return (await this.restClient.put({
      data: createCourtAppearance,
      path: `/court-appearance/${appearanceUuid}`,
    })) as unknown as Promise<CreateCourtAppearanceResponse>
  }

  async getLatestAppearanceByCourtCaseUuid(courtCaseUuid: string): Promise<PageCourtCaseAppearance> {
    return (await this.restClient.get({
      path: `/court-case/${courtCaseUuid}/latest-appearance`,
    })) as unknown as Promise<PageCourtCaseAppearance>
  }

  async getCourtAppearanceByAppearanceUuid(appearanceUuid: string): Promise<PageCourtCaseAppearance> {
    return (await this.restClient.get({
      path: `/court-appearance/${appearanceUuid}`,
    })) as unknown as Promise<PageCourtCaseAppearance>
  }

  async getDraftCourtAppearanceByDraftUuid(appearanceUuid: string): Promise<DraftCourtAppearance> {
    return (await this.restClient.get({
      path: `/draft/court-appearance/${appearanceUuid}`,
    })) as unknown as Promise<DraftCourtAppearance>
  }

  async getCourtCaseByUuid(courtCaseUuid: string): Promise<PageCourtCaseContent> {
    return (await this.restClient.get({
      path: `/court-case/${courtCaseUuid}`,
    })) as unknown as Promise<PageCourtCaseContent>
  }

  async searchSentenceTypes(age: number, convictionDate: string): Promise<SentenceType[]> {
    return (await this.restClient.get({
      path: `/sentence-type/search`,
      query: {
        age,
        convictionDate,
      },
    })) as unknown as Promise<SentenceType[]>
  }

  async getSentenceTypeById(sentenceTypeId: string): Promise<SentenceType> {
    return (await this.restClient.get({
      path: `/sentence-type/${sentenceTypeId}`,
    })) as unknown as Promise<SentenceType>
  }

  async getSentenceTypesByIds(sentenceTypeIds: string[]): Promise<SentenceType[]> {
    return (await this.restClient.get({
      path: `/sentence-type/uuid/multiple`,
      query: {
        uuids: sentenceTypeIds.join(','),
      },
    })) as unknown as Promise<SentenceType[]>
  }

  async getAllAppearanceOutcomes(): Promise<AppearanceOutcome[]> {
    return (await this.restClient.get({
      path: `/appearance-outcome/status`,
      query: {
        statuses: 'ACTIVE',
      },
    })) as unknown as Promise<AppearanceOutcome[]>
  }

  async getAppearanceOutcomeByUuid(uuid: string): Promise<AppearanceOutcome> {
    return (await this.restClient.get({
      path: `/appearance-outcome/${uuid}`,
    })) as unknown as Promise<AppearanceOutcome>
  }

  async getAllChargeOutcomes(): Promise<OffenceOutcome[]> {
    return (await this.restClient.get({
      path: `/charge-outcome/all`,
    })) as unknown as Promise<OffenceOutcome[]>
  }

  async getChargeOutcomesByIds(outcomeIds: string[]): Promise<OffenceOutcome[]> {
    return (await this.restClient.get({
      path: `/charge-outcome/uuid/multiple`,
      query: {
        uuids: outcomeIds.join(','),
      },
    })) as unknown as Promise<OffenceOutcome[]>
  }

  async getChargeOutcomeById(outcomeId: string): Promise<OffenceOutcome> {
    return (await this.restClient.get({
      path: `/charge-outcome/${outcomeId}`,
    })) as unknown as Promise<OffenceOutcome>
  }

  async getAppearanceTypes(): Promise<AppearanceType[]> {
    return (await this.restClient.get({
      path: `/appearance-type/status`,
      query: {
        statuses: 'ACTIVE',
      },
    })) as unknown as Promise<AppearanceType[]>
  }

  async getAppearanceTypeByUuid(appearanceTypeUuid: string): Promise<AppearanceType> {
    return (await this.restClient.get({
      path: `/appearance-type/${appearanceTypeUuid}`,
    })) as unknown as Promise<AppearanceType>
  }
}
