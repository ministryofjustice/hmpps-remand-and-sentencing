import type { CourtAppearance, CourtCase, Offence, UploadedDocument } from 'models'
import { Dayjs } from 'dayjs'
import {
  ConsecutiveChainValidationRequest,
  CourtCaseCountNumbers,
  CourtCaseValidationDate,
  CreateCourtAppearanceResponse,
  CreateCourtCaseResponse,
  HasSentenceAfterOnOtherCourtAppearanceResponse,
  HasSentenceToChainToResponse,
  LatestOffenceDate,
  LegacySentenceType,
  LegacySentenceTypeGroupingSummary,
  PageCourtCaseAppearance,
  PageCourtCaseContent,
  PagePagedCourtCase,
  PrisonerDocuments,
  PrisonerSentenceEnvelopes,
  SearchDocuments,
  SentenceConsecutiveToDetailsResponse,
  SentenceDetails,
  SentenceDetailsForConsecValidation,
  SentencesAfterOnOtherCourtAppearanceDetailsResponse,
  SentencesToChainToResponse,
  SentenceTypeIsValid,
} from '../@types/remandAndSentencingApi/remandAndSentencingClientTypes'
import RemandAndSentencingApiClient from '../data/remandAndSentencingApiClient'
import { courtAppearanceToCreateCourtAppearance, courtCaseToCreateCourtCase } from '../utils/mappingUtils'

export default class RemandAndSentencingService {
  constructor(private readonly remandAndSentencingApiClient: RemandAndSentencingApiClient) {}

  async createCourtCase(
    prisonerId: string,
    username: string,
    courtCase: CourtCase,
    prisonId: string,
    courtCaseUuid: string,
    offencesBeingReplaced: Map<string, Offence>,
  ): Promise<CreateCourtCaseResponse> {
    const createCourtCase = courtCaseToCreateCourtCase(
      prisonerId,
      courtCase,
      prisonId,
      courtCaseUuid,
      offencesBeingReplaced,
    )
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
    offencesBeingReplaced: Map<string, Offence>,
  ): Promise<CreateCourtAppearanceResponse> {
    const createCourtAppearance = courtAppearanceToCreateCourtAppearance(
      courtAppearance,
      prisonId,
      courtCaseUuid,
      appearanceUuid,
      offencesBeingReplaced,
    )
    return this.remandAndSentencingApiClient.putCourtAppearance(appearanceUuid, createCourtAppearance, username)
  }

  async updateCourtAppearance(
    username: string,
    courtCaseUuid: string,
    appearanceUuid: string,
    courtAppearance: CourtAppearance,
    prisonId: string,
    offencesBeingReplaced: Map<string, Offence>,
  ): Promise<CreateCourtAppearanceResponse> {
    const updateCourtAppearance = courtAppearanceToCreateCourtAppearance(
      courtAppearance,
      prisonId,
      courtCaseUuid,
      appearanceUuid,
      offencesBeingReplaced,
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

  async deleteCourtAppearance(appearanceUuid: string, username: string): Promise<void> {
    return this.remandAndSentencingApiClient.deleteCourtAppearance(appearanceUuid, username)
  }

  async getCourtCaseDetails(courtCaseUuid: string, username: string): Promise<PageCourtCaseContent> {
    return this.remandAndSentencingApiClient.getCourtCaseByUuid(courtCaseUuid, username)
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
  ): Promise<LatestOffenceDate> {
    return this.remandAndSentencingApiClient.getLatestOffenceDateForCourtCase(
      courtCaseUuid,
      username,
      appearanceUuidToExclude,
    )
  }

  async getValidationDatesForCourtCase(
    courtCaseUuid: string,
    username: string,
    appearanceUuidToExclude: string,
  ): Promise<CourtCaseValidationDate> {
    return this.remandAndSentencingApiClient.getValidationDatesForCourtCase(
      courtCaseUuid,
      username,
      appearanceUuidToExclude,
    )
  }

  async hasSentenceAfterOnOtherCourtAppearance(
    sentenceUuids: string[],
    username: string,
  ): Promise<HasSentenceAfterOnOtherCourtAppearanceResponse> {
    return this.remandAndSentencingApiClient.hasSentenceAfterOnOtherCourtAppearance(sentenceUuids, username)
  }

  async getSentencesAfterOnOtherCourtAppearanceDetails(
    sentenceUuids: string[],
    username: string,
  ): Promise<SentencesAfterOnOtherCourtAppearanceDetailsResponse> {
    return this.remandAndSentencingApiClient.getSentencesAfterOnOtherCourtAppearanceDetails(sentenceUuids, username)
  }

  async validateConsecutiveLoops(
    targetSentenceUuid: string,
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
          consecutiveToSentenceUuid: offence.sentence.consecutiveToSentenceUuid || undefined,
        } as SentenceDetailsForConsecValidation
      })

    // Source sentence has not been added to sentences yet, therefore cannot be part of a loop yet
    if (!sentences.some(s => s.sentenceUuid === sourceSentenceUuid)) return []

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

  async getPrisonerDocuments(
    prisonerId: string,
    searchDocuments: SearchDocuments,
    username: string,
  ): Promise<PrisonerDocuments> {
    return this.remandAndSentencingApiClient.getPrisonerDocuments(prisonerId, searchDocuments, username)
  }

  async getSentenceEnvelopes(prisonerId: string, username: string): Promise<PrisonerSentenceEnvelopes> {
    return this.remandAndSentencingApiClient.getSentenceEnvelopes(prisonerId, username)
  }

  async getSentenceDetails(sentenceUuid: string, username: string): Promise<SentenceDetails> {
    return this.remandAndSentencingApiClient.getSentenceDetails(sentenceUuid, username)
  }
}
