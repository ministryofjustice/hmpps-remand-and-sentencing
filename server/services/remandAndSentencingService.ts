import type { CourtAppearance, CourtCase } from 'models'
import { Dayjs } from 'dayjs'
import {
  CreateCourtAppearanceResponse,
  CreateCourtCaseResponse,
  DraftCourtAppearanceCreatedResponse,
  DraftCourtCaseCreatedResponse,
  PageCourtCase,
  PageCourtCaseAppearance,
  PageCourtCaseContent,
  SentenceType,
} from '../@types/remandAndSentencingApi/remandAndSentencingClientTypes'
import RemandAndSentencingApiClient from '../api/remandAndSentencingApiClient'
import {
  courtAppearanceToCreateCourtAppearance,
  courtAppearanceToDraftCreateCourtAppearance,
  courtCaseToCreateCourtCase,
  courtCaseToDraftCreateCourtCase,
} from '../utils/mappingUtils'
import { HmppsAuthClient } from '../data'

export default class RemandAndSentencingService {
  constructor(private readonly hmppsAuthClient: HmppsAuthClient) {}

  async createCourtCase(prisonerId: string, token: string, courtCase: CourtCase): Promise<CreateCourtCaseResponse> {
    const createCourtCase = courtCaseToCreateCourtCase(prisonerId, courtCase)
    return new RemandAndSentencingApiClient(token).createCourtCase(createCourtCase)
  }

  async searchCourtCases(prisonerId: string, token: string, sortBy: string): Promise<PageCourtCase> {
    return new RemandAndSentencingApiClient(token).searchCourtCases(prisonerId, sortBy)
  }

  async createCourtAppearance(
    token: string,
    courtCaseUuid: string,
    courtAppearance: CourtAppearance,
  ): Promise<CreateCourtAppearanceResponse> {
    const createCourtAppearance = courtAppearanceToCreateCourtAppearance(courtAppearance, courtCaseUuid)
    return new RemandAndSentencingApiClient(token).createCourtAppearance(createCourtAppearance)
  }

  async createDraftCourtCase(
    username: string,
    nomsId: string,
    courtCase: CourtCase,
  ): Promise<DraftCourtCaseCreatedResponse> {
    const createDraftCourtCase = courtCaseToDraftCreateCourtCase(nomsId, courtCase)
    return new RemandAndSentencingApiClient(await this.getSystemClientToken(username)).createDraftCourtCase(
      createDraftCourtCase,
    )
  }

  async createDraftCourtAppearance(
    username: string,
    courtCaseUuid: string,
    courtAppearance: CourtAppearance,
  ): Promise<DraftCourtAppearanceCreatedResponse> {
    const createDraftCourtAppearance = courtAppearanceToDraftCreateCourtAppearance(courtAppearance)
    return new RemandAndSentencingApiClient(await this.getSystemClientToken(username)).createDraftCourtAppearance(
      courtCaseUuid,
      createDraftCourtAppearance,
    )
  }

  async updateCourtAppearance(
    token: string,
    courtCaseUuid: string,
    appearanceUuid: string,
    courtAppearance: CourtAppearance,
  ): Promise<CreateCourtAppearanceResponse> {
    const updateCourtAppearance = courtAppearanceToCreateCourtAppearance(courtAppearance, courtCaseUuid, appearanceUuid)
    return new RemandAndSentencingApiClient(token).putCourtAppearance(appearanceUuid, updateCourtAppearance)
  }

  async getLatestCourtAppearanceByCourtCaseUuid(
    token: string,
    courtCaseUuid: string,
  ): Promise<PageCourtCaseAppearance> {
    return new RemandAndSentencingApiClient(token).getLatestAppearanceByCourtCaseUuid(courtCaseUuid)
  }

  async getCourtAppearanceByAppearanceUuid(appearanceUuid: string, token: string): Promise<PageCourtCaseAppearance> {
    return new RemandAndSentencingApiClient(token).getCourtAppearanceByAppearanceUuid(appearanceUuid)
  }

  async getCourtCaseDetails(courtCaseUuid: string, token: string): Promise<PageCourtCaseContent> {
    return new RemandAndSentencingApiClient(token).getCourtCaseByUuid(courtCaseUuid)
  }

  async getSentenceTypes(age: number, convictionDate: Dayjs, username: string): Promise<SentenceType[]> {
    return new RemandAndSentencingApiClient(await this.getSystemClientToken(username)).searchSentenceTypes(
      age,
      convictionDate.format('YYYY-MM-DD'),
    )
  }

  async getSentenceTypeById(sentenceTypeId: string, username: string): Promise<SentenceType> {
    return new RemandAndSentencingApiClient(await this.getSystemClientToken(username)).getSentenceTypeById(
      sentenceTypeId,
    )
  }

  async getSentenceTypeMap(sentenceTypeIds: string[], username: string): Promise<{ [key: string]: string }> {
    let sentenceTypeMap = {}
    const sentenceTypeIdsToSearch = sentenceTypeIds.filter(sentenceTypeId => sentenceTypeId)
    if (sentenceTypeIdsToSearch.length) {
      const sentenceTypes = await new RemandAndSentencingApiClient(
        await this.getSystemClientToken(username),
      ).getSentenceTypesByIds(sentenceTypeIdsToSearch)
      sentenceTypeMap = Object.fromEntries(
        sentenceTypes.map(sentenceType => [sentenceType.sentenceTypeUuid, sentenceType.description]),
      )
    }
    return sentenceTypeMap
  }

  private async getSystemClientToken(username: string): Promise<string> {
    return this.hmppsAuthClient.getSystemClientToken(username)
  }
}
