import type { CourtAppearance, CourtCase, UploadedDocument } from 'models'
import { Dayjs } from 'dayjs'
import {
  AppearanceType,
  CourtCaseCountNumbers,
  CreateCourtAppearanceResponse,
  CreateCourtCaseResponse,
  DraftCourtAppearance,
  DraftCourtAppearanceCreatedResponse,
  DraftCourtCaseCreatedResponse,
  HasSentenceAfterOnOtherCourtAppearanceResponse,
  HasSentenceToChainToResponse,
  LegacySentenceType,
  LegacySentenceTypeGroupingSummary,
  PageCourtCaseAppearance,
  PageCourtCaseContent,
  PagePagedCourtCase,
  SentenceConsecutiveToDetailsResponse,
  SentencesAfterOnOtherCourtAppearanceDetailsResponse,
  SentencesToChainToResponse,
  SentenceType,
  SentenceTypeIsValid,
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

  async createCourtCase(
    prisonerId: string,
    token: string,
    courtCase: CourtCase,
    prisonId: string,
  ): Promise<CreateCourtCaseResponse> {
    const createCourtCase = courtCaseToCreateCourtCase(prisonerId, courtCase, prisonId)
    return new RemandAndSentencingApiClient(token).createCourtCase(createCourtCase)
  }

  async searchCourtCases(
    prisonerId: string,
    username: string,
    sortBy: string,
    page: number,
  ): Promise<PagePagedCourtCase> {
    return new RemandAndSentencingApiClient(await this.getSystemClientToken(username)).searchCourtCases(
      prisonerId,
      sortBy,
      page,
    )
  }

  async createCourtAppearance(
    token: string,
    courtCaseUuid: string,
    courtAppearance: CourtAppearance,
    prisonId: string,
  ): Promise<CreateCourtAppearanceResponse> {
    const createCourtAppearance = courtAppearanceToCreateCourtAppearance(courtAppearance, prisonId, courtCaseUuid)
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

  async updateDraftCourtAppearance(
    username: string,
    courtAppearanceUuid: string,
    courtAppearance: CourtAppearance,
  ): Promise<void> {
    const createDraftCourtAppearance = courtAppearanceToDraftCreateCourtAppearance(courtAppearance)
    return new RemandAndSentencingApiClient(await this.getSystemClientToken(username)).updateDraftCourtAppearance(
      courtAppearanceUuid,
      createDraftCourtAppearance,
    )
  }

  async updateCourtAppearance(
    token: string,
    courtCaseUuid: string,
    appearanceUuid: string,
    courtAppearance: CourtAppearance,
    prisonId: string,
  ): Promise<CreateCourtAppearanceResponse> {
    const updateCourtAppearance = courtAppearanceToCreateCourtAppearance(
      courtAppearance,
      prisonId,
      courtCaseUuid,
      appearanceUuid,
    )
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

  async getDraftCourtAppearanceByAppearanceUuid(draftUuid: string, username: string): Promise<DraftCourtAppearance> {
    return new RemandAndSentencingApiClient(
      await this.getSystemClientToken(username),
    ).getDraftCourtAppearanceByDraftUuid(draftUuid)
  }

  async getCourtCaseDetails(courtCaseUuid: string, token: string): Promise<PageCourtCaseContent> {
    return new RemandAndSentencingApiClient(token).getCourtCaseByUuid(courtCaseUuid)
  }

  async getSentenceTypes(
    age: number,
    convictionDate: Dayjs,
    offenceDate: Dayjs,
    username: string,
  ): Promise<SentenceType[]> {
    return new RemandAndSentencingApiClient(await this.getSystemClientToken(username)).searchSentenceTypes(
      age,
      convictionDate.format('YYYY-MM-DD'),
      offenceDate.format('YYYY-MM-DD'),
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

  async getAllAppearanceTypes(username: string): Promise<AppearanceType[]> {
    return new RemandAndSentencingApiClient(await this.getSystemClientToken(username)).getAppearanceTypes()
  }

  async getAppearanceTypeByUuid(appearanceTypeUuid: string, username: string): Promise<AppearanceType> {
    return new RemandAndSentencingApiClient(await this.getSystemClientToken(username)).getAppearanceTypeByUuid(
      appearanceTypeUuid,
    )
  }

  async getLegacySentenceTypesSummaryAll(username: string): Promise<LegacySentenceTypeGroupingSummary[]> {
    return new RemandAndSentencingApiClient(
      await this.getSystemClientToken(username),
    ).getLegacySentenceTypesSummaryAll()
  }

  async getLegacySentenceType(nomisSentenceTypeReference: string, username: string): Promise<LegacySentenceType[]> {
    return new RemandAndSentencingApiClient(await this.getSystemClientToken(username)).getLegacySentenceTypesDetail(
      nomisSentenceTypeReference,
    )
  }

  async hasSentenceToChainTo(
    prisonerId: string,
    warrantDate: Dayjs,
    username: string,
  ): Promise<HasSentenceToChainToResponse> {
    return new RemandAndSentencingApiClient(await this.getSystemClientToken(username)).hasSentenceToChainTo(
      prisonerId,
      warrantDate.format('YYYY-MM-DD'),
    )
  }

  async getSentencesToChainTo(
    prisonerId: string,
    warrantDate: Dayjs,
    username: string,
  ): Promise<SentencesToChainToResponse> {
    return new RemandAndSentencingApiClient(await this.getSystemClientToken(username)).sentencesToChainTo(
      prisonerId,
      warrantDate.format('YYYY-MM-DD'),
    )
  }

  async getConsecutiveToDetails(
    sentenceUuids: string[],
    username: string,
  ): Promise<SentenceConsecutiveToDetailsResponse> {
    return sentenceUuids.filter(sentenceUuid => sentenceUuid).length
      ? new RemandAndSentencingApiClient(await this.getSystemClientToken(username)).consecutiveToDetails(sentenceUuids)
      : { sentences: [] }
  }

  async getCourtCaseCountNumbers(courtCaseUuid: string, username: string): Promise<CourtCaseCountNumbers> {
    return new RemandAndSentencingApiClient(await this.getSystemClientToken(username)).courtCaseCountNumbers(
      courtCaseUuid,
    )
  }

  async getIsSentenceTypeStillValid(
    sentenceTypeId: string,
    age: number,
    convictionDate: Dayjs,
    offenceDate: Dayjs,
    username: string,
  ): Promise<SentenceTypeIsValid> {
    return new RemandAndSentencingApiClient(await this.getSystemClientToken(username)).isSentenceTypeStillValid(
      sentenceTypeId,
      age,
      convictionDate.format('YYYY-MM-DD'),
      offenceDate.format('YYYY-MM-DD'),
    )
  }

  async createUploadDocument(uploadedDocument: UploadedDocument, username: string): Promise<void> {
    return new RemandAndSentencingApiClient(await this.getSystemClientToken(username)).createUploadedDocument([
      uploadedDocument,
    ])
  }

  async getLatestOffenceDateForCourtCase(courtCaseUuid: string, username: string): Promise<string | null> {
    return new RemandAndSentencingApiClient(await this.getSystemClientToken(username)).getLatestOffenceDateForCourtCase(
      courtCaseUuid,
    )
  }

  async hasSentenceAfterOnOtherCourtAppearance(
    sentenceUuid: string,
    username: string,
  ): Promise<HasSentenceAfterOnOtherCourtAppearanceResponse> {
    return new RemandAndSentencingApiClient(
      await this.getSystemClientToken(username),
    ).hasSentenceAfterOnOtherCourtAppearance(sentenceUuid)
  }

  async getSentencesAfterOnOtherCourtAppearanceDetails(
    sentenceUuid: string,
    username: string,
  ): Promise<SentencesAfterOnOtherCourtAppearanceDetailsResponse> {
    return new RemandAndSentencingApiClient(
      await this.getSystemClientToken(username),
    ).getSentencesAfterOnOtherCourtAppearanceDetails(sentenceUuid)
  }

  private async getSystemClientToken(username: string): Promise<string> {
    return this.hmppsAuthClient.getSystemClientToken(username)
  }
}
