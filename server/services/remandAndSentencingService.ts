import type { CourtAppearance, CourtCase, Offence, UploadedDocument } from 'models'
import { Dayjs } from 'dayjs'
import {
  AppearanceType,
  ConsecutiveChainValidationRequest,
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
  SentenceDetailsForConsecValidation,
  SentencesAfterOnOtherCourtAppearanceDetailsResponse,
  SentencesToChainToResponse,
  SentenceType,
  SentenceTypeIsValid,
} from '../@types/remandAndSentencingApi/remandAndSentencingClientTypes'
import RemandAndSentencingApiClient from '../data/remandAndSentencingApiClient'
import {
  courtAppearanceToCreateCourtAppearance,
  courtAppearanceToDraftCreateCourtAppearance,
  courtCaseToCreateCourtCase,
  courtCaseToDraftCreateCourtCase,
} from '../utils/mappingUtils'

export default class RemandAndSentencingService {
  constructor(private readonly remandAndSentencingApiClient: RemandAndSentencingApiClient) {}

  async createCourtCase(
    prisonerId: string,
    username: string,
    courtCase: CourtCase,
    prisonId: string,
    courtCaseUuid: string,
  ): Promise<CreateCourtCaseResponse> {
    const createCourtCase = courtCaseToCreateCourtCase(prisonerId, courtCase, prisonId, courtCaseUuid)
    return this.remandAndSentencingApiClient.putCourtCase(createCourtCase, courtCaseUuid, username)
  }

  async searchCourtCases(
    prisonerId: string,
    username: string,
    sortBy: string,
    page: number,
  ): Promise<PagePagedCourtCase> {
    return this.remandAndSentencingApiClient.searchCourtCases(prisonerId, sortBy, page, username)
  }

  async createCourtAppearance(
    username: string,
    courtCaseUuid: string,
    appearanceUuid: string,
    courtAppearance: CourtAppearance,
    prisonId: string,
  ): Promise<CreateCourtAppearanceResponse> {
    const createCourtAppearance = courtAppearanceToCreateCourtAppearance(
      courtAppearance,
      prisonId,
      courtCaseUuid,
      appearanceUuid,
    )
    return this.remandAndSentencingApiClient.putCourtAppearance(appearanceUuid, createCourtAppearance, username)
  }

  async createDraftCourtCase(
    username: string,
    nomsId: string,
    courtCase: CourtCase,
  ): Promise<DraftCourtCaseCreatedResponse> {
    const createDraftCourtCase = courtCaseToDraftCreateCourtCase(nomsId, courtCase)
    return this.remandAndSentencingApiClient.createDraftCourtCase(createDraftCourtCase, username)
  }

  async createDraftCourtAppearance(
    username: string,
    courtCaseUuid: string,
    courtAppearance: CourtAppearance,
  ): Promise<DraftCourtAppearanceCreatedResponse> {
    const createDraftCourtAppearance = courtAppearanceToDraftCreateCourtAppearance(courtAppearance)
    return this.remandAndSentencingApiClient.createDraftCourtAppearance(
      courtCaseUuid,
      createDraftCourtAppearance,
      username,
    )
  }

  async updateDraftCourtAppearance(
    username: string,
    courtAppearanceUuid: string,
    courtAppearance: CourtAppearance,
  ): Promise<void> {
    const createDraftCourtAppearance = courtAppearanceToDraftCreateCourtAppearance(courtAppearance)
    return this.remandAndSentencingApiClient.updateDraftCourtAppearance(
      courtAppearanceUuid,
      createDraftCourtAppearance,
      username,
    )
  }

  async updateCourtAppearance(
    username: string,
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
    return this.remandAndSentencingApiClient.putCourtAppearance(appearanceUuid, updateCourtAppearance, username)
  }

  async getLatestCourtAppearanceByCourtCaseUuid(
    username: string,
    courtCaseUuid: string,
  ): Promise<PageCourtCaseAppearance> {
    return this.remandAndSentencingApiClient.getLatestAppearanceByCourtCaseUuid(courtCaseUuid, username)
  }

  async getCourtAppearanceByAppearanceUuid(appearanceUuid: string, username: string): Promise<PageCourtCaseAppearance> {
    return this.remandAndSentencingApiClient.getCourtAppearanceByAppearanceUuid(appearanceUuid, username)
  }

  async getDraftCourtAppearanceByAppearanceUuid(draftUuid: string, username: string): Promise<DraftCourtAppearance> {
    return this.remandAndSentencingApiClient.getDraftCourtAppearanceByDraftUuid(draftUuid, username)
  }

  async deleteCourtAppearance(appearanceUuid: string, username: string): Promise<void> {
    return this.remandAndSentencingApiClient.deleteCourtAppearance(appearanceUuid, username)
  }

  async getCourtCaseDetails(courtCaseUuid: string, username: string): Promise<PageCourtCaseContent> {
    return this.remandAndSentencingApiClient.getCourtCaseByUuid(courtCaseUuid, username)
  }

  async getSentenceTypes(
    age: number,
    convictionDate: Dayjs,
    offenceDate: Dayjs,
    username: string,
  ): Promise<SentenceType[]> {
    return this.remandAndSentencingApiClient.searchSentenceTypes(
      age,
      convictionDate.format('YYYY-MM-DD'),
      offenceDate.format('YYYY-MM-DD'),
      username,
    )
  }

  async getSentenceTypeById(sentenceTypeId: string, username: string): Promise<SentenceType> {
    return this.remandAndSentencingApiClient.getSentenceTypeById(sentenceTypeId, username)
  }

  async getSentenceTypeMap(sentenceTypeIds: string[], username: string): Promise<{ [key: string]: string }> {
    let sentenceTypeMap = {}
    const sentenceTypeIdsToSearch = sentenceTypeIds.filter(sentenceTypeId => sentenceTypeId)
    if (sentenceTypeIdsToSearch.length) {
      const sentenceTypes = await this.remandAndSentencingApiClient.getSentenceTypesByIds(
        sentenceTypeIdsToSearch,
        username,
      )
      sentenceTypeMap = Object.fromEntries(
        sentenceTypes.map(sentenceType => [sentenceType.sentenceTypeUuid, sentenceType.description]),
      )
    }
    return sentenceTypeMap
  }

  async getAllAppearanceTypes(username: string): Promise<AppearanceType[]> {
    return this.remandAndSentencingApiClient.getAppearanceTypes(username)
  }

  async getAppearanceTypeByUuid(appearanceTypeUuid: string, username: string): Promise<AppearanceType> {
    return this.remandAndSentencingApiClient.getAppearanceTypeByUuid(appearanceTypeUuid, username)
  }

  async getLegacySentenceTypesSummaryAll(username: string): Promise<LegacySentenceTypeGroupingSummary[]> {
    return this.remandAndSentencingApiClient.getLegacySentenceTypesSummaryAll(username)
  }

  async getLegacySentenceType(nomisSentenceTypeReference: string, username: string): Promise<LegacySentenceType[]> {
    return this.remandAndSentencingApiClient.getLegacySentenceTypesDetail(nomisSentenceTypeReference, username)
  }

  async hasSentenceToChainTo(
    prisonerId: string,
    warrantDate: Dayjs,
    bookingId: string,
    username: string,
  ): Promise<HasSentenceToChainToResponse> {
    return this.remandAndSentencingApiClient.hasSentenceToChainTo(
      prisonerId,
      warrantDate.format('YYYY-MM-DD'),
      bookingId,
      username,
    )
  }

  async getSentencesToChainTo(
    prisonerId: string,
    warrantDate: Dayjs,
    bookingId: string,
    username: string,
  ): Promise<SentencesToChainToResponse> {
    return this.remandAndSentencingApiClient.sentencesToChainTo(
      prisonerId,
      warrantDate.format('YYYY-MM-DD'),
      bookingId,
      username,
    )
  }

  async getConsecutiveToDetails(
    sentenceUuids: string[],
    username: string,
  ): Promise<SentenceConsecutiveToDetailsResponse> {
    return sentenceUuids.filter(sentenceUuid => sentenceUuid).length
      ? this.remandAndSentencingApiClient.consecutiveToDetails(sentenceUuids, username)
      : { sentences: [] }
  }

  async getCourtCaseCountNumbers(courtCaseUuid: string, username: string): Promise<CourtCaseCountNumbers> {
    return this.remandAndSentencingApiClient.courtCaseCountNumbers(courtCaseUuid, username)
  }

  async getIsSentenceTypeStillValid(
    sentenceTypeId: string,
    age: number,
    convictionDate: Dayjs,
    offenceDate: Dayjs,
    username: string,
  ): Promise<SentenceTypeIsValid> {
    return this.remandAndSentencingApiClient.isSentenceTypeStillValid(
      sentenceTypeId,
      age,
      convictionDate.format('YYYY-MM-DD'),
      offenceDate.format('YYYY-MM-DD'),
      username,
    )
  }

  async createUploadDocument(uploadedDocument: UploadedDocument, username: string): Promise<void> {
    return this.remandAndSentencingApiClient.createUploadedDocument([uploadedDocument], username)
  }

  async getLatestOffenceDateForCourtCase(
    courtCaseUuid: string,
    username: string,
    appearanceUuidToExclude?: string,
  ): Promise<string | null> {
    return this.remandAndSentencingApiClient.getLatestOffenceDateForCourtCase(
      courtCaseUuid,
      username,
      appearanceUuidToExclude,
    )
  }

  async hasSentenceAfterOnOtherCourtAppearance(
    sentenceUuid: string,
    username: string,
  ): Promise<HasSentenceAfterOnOtherCourtAppearanceResponse> {
    return this.remandAndSentencingApiClient.hasSentenceAfterOnOtherCourtAppearance(sentenceUuid, username)
  }

  async getSentencesAfterOnOtherCourtAppearanceDetails(
    sentenceUuid: string,
    username: string,
  ): Promise<SentencesAfterOnOtherCourtAppearanceDetailsResponse> {
    return this.remandAndSentencingApiClient.getSentencesAfterOnOtherCourtAppearanceDetails(sentenceUuid, username)
  }

  async validateConsecutiveLoops(
    useConsecutiveToRef: boolean,
    targetSentenceReferenceOrUuId: string,
    sessionCourtAppearance: CourtAppearance,
    nomsId: string,
    sourceSentenceUuid: string,
    username: string,
  ): Promise<
    {
      text?: string
      html?: string
      href: string
    }[]
  > {
    const sentences = sessionCourtAppearance.offences
      .filter(offence => offence.sentence)
      .map(offence => {
        return {
          sentenceUuid: offence.sentence.sentenceUuid,
          consecutiveToSentenceUuid: this.getConsecutiveToSentenceUuid(offence, sessionCourtAppearance),
        } as SentenceDetailsForConsecValidation
      })

    // Source sentence has not beed added to sentences yet, therefore cannot be part of a loop yet
    if (!sentences.some(s => s.sentenceUuid === sourceSentenceUuid)) return []

    const targetSentenceUuid = useConsecutiveToRef
      ? sessionCourtAppearance.offences
          .filter(offence => offence.sentence)
          .find(o => o.sentence.sentenceReference === targetSentenceReferenceOrUuId).sentence.sentenceUuid
      : targetSentenceReferenceOrUuId

    const request: ConsecutiveChainValidationRequest = {
      prisonerId: nomsId,
      appearanceUuid: sessionCourtAppearance.appearanceUuid,
      sourceSentenceUuid,
      targetSentenceUuid,
      sentences,
    }

    const loopExists = await this.remandAndSentencingApiClient.hasLoopInChain(request, username)
    if (loopExists)
      return [
        {
          html: 'The sentence you have selected is already part of the consecutive chain<br>You must select a sentence that has not been used in this chain.',
          href: '#',
        },
      ]
    return []
  }

  private getConsecutiveToSentenceUuid(offence: Offence, sessionCourtAppearance: CourtAppearance) {
    return offence.sentence.consecutiveToSentenceUuid
      ? offence.sentence.consecutiveToSentenceUuid
      : offence.sentence.consecutiveToSentenceReference &&
          sessionCourtAppearance.offences.find(
            o => o.sentence.sentenceReference === offence.sentence.consecutiveToSentenceReference,
          ).sentence.sentenceUuid
  }
}
