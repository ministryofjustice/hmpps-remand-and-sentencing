import { asSystem, RestClient } from '@ministryofjustice/hmpps-rest-client'
import type { AuthenticationClient } from '@ministryofjustice/hmpps-auth-clients'
import type { FileDownload } from 'models'
import {
  AggravatingFactor,
  AllSentenceTypes,
  CourtAppearanceOutcome,
  AppearanceType,
  ConsecutiveChainValidationRequest,
  CourtAppearanceSubtype,
  CourtCaseCountNumbers,
  CourtCaseValidationDate,
  CreateAppearanceOutcome,
  CreateCharge,
  CreateChargeOutcome,
  CreateChargeResponse,
  CreateCourtAppearance,
  CreateCourtAppearanceResponse,
  CreateCourtCase,
  CreateCourtCaseResponse,
  CreateSentenceType,
  DeleteSentenceStatusDetails,
  FixSingleSentenceMultipleChargesPeople,
  HasSentenceAfterOnOtherCourtAppearanceResponse,
  HasSentenceToChainToResponse,
  LatestOffenceDate,
  LegacySentenceType,
  LegacySentenceTypeGroupingSummary,
  MissingSentenceAppearance,
  ChargeOutcome,
  CourtAppearance as PageCourtCaseAppearance,
  CourtCase as PageCourtCaseContent,
  PersonCourtCaseCount,
  PrisonerDocuments,
  PrisonerSentenceEnvelopes,
  SearchCourtCasesPage,
  SearchDocuments,
  SentenceConsecutiveToDetailsResponse,
  SentencedCharges,
  SentenceDetails,
  SentencesAfterOnOtherCourtAppearanceDetailsResponse,
  SentenceUuidsWithActiveSentencesAfterResponse,
  SentencesToChainToResponse,
  SentenceType,
  SentenceTypeChargeOutcomes,
  SentenceTypeDetails,
  SentenceTypeIsValid,
  UpdateCourtCaseStatus,
  UploadedDocument,
  CreateF986,
  F986EligibleCourtAppearance,
  UnconfirmedCourtCases,
  ConfirmConsecutiveToSentenceFixes,
  HmctsResultCode,
  CreateHmctsResultCode,
} from '../@types/remandAndSentencingApi/index'
import config from '../config'
import logger from '../../logger'

export default class RemandAndSentencingApiClient extends RestClient {
  constructor(authenticationClient: AuthenticationClient) {
    super('Remand and Sentencing API', config.apis.remandAndSentencingApi, logger, authenticationClient)
  }

  async putCourtCase(
    createCourtCase: CreateCourtCase,
    courtCaseUuid: string,
    username: string,
  ): Promise<CreateCourtCaseResponse> {
    return this.put(
      {
        data: createCourtCase,
        path: `/court-case/${courtCaseUuid}`,
      },
      asSystem(username),
    )
  }

  async updateCourtCaseStatus(
    courtCaseUuid: string,
    updateCourtCaseStatus: UpdateCourtCaseStatus,
    username: string,
  ): Promise<void> {
    return this.put(
      {
        data: updateCourtCaseStatus,
        path: `/court-case/${courtCaseUuid}/status`,
      },
      asSystem(username),
    )
  }

  async searchCourtCases(
    prisonerId: string,
    sortBy: string,
    appearanceDateFrom: string,
    appearanceDateTo: string,
    bookingId: string,
    page: number,
    username: string,
  ): Promise<SearchCourtCasesPage> {
    return this.get(
      {
        path: `/court-case/paged/search`,
        query: {
          prisonerId,
          pagedCourtCaseOrderBy: sortBy,
          appearanceDateFrom,
          appearanceDateTo,
          bookingId,
          page,
        },
      },
      asSystem(username),
    )
  }

  async getF986EligibleAppearances(prisonerId: string, username: string): Promise<F986EligibleCourtAppearance[]> {
    return this.get(
      {
        path: `/document-generator/f986/person/${prisonerId}/eligible-appearances`,
      },
      asSystem(username),
    )
  }

  async hasF986EligibleAppearances(prisonerId: string, username: string): Promise<boolean> {
    return this.get(
      {
        path: `/document-generator/f986/person/${prisonerId}/eligible-appearances/exists`,
      },
      asSystem(username),
    )
  }

  async putCourtAppearance(
    appearanceUuid: string,
    createCourtAppearance: CreateCourtAppearance,
    username: string,
  ): Promise<CreateCourtAppearanceResponse> {
    return this.put(
      {
        data: createCourtAppearance,
        path: `/court-appearance/${appearanceUuid}`,
      },
      asSystem(username),
    )
  }

  async getLatestAppearanceByCourtCaseUuid(courtCaseUuid: string, username: string): Promise<PageCourtCaseAppearance> {
    return this.get(
      {
        path: `/court-case/${courtCaseUuid}/latest-appearance`,
      },
      asSystem(username),
    )
  }

  async getCourtAppearanceByAppearanceUuid(appearanceUuid: string, username: string): Promise<PageCourtCaseAppearance> {
    return this.get(
      {
        path: `/court-appearance/${appearanceUuid}`,
      },
      asSystem(username),
    )
  }

  async deleteCourtAppearance(appearanceUuid: string, username: string): Promise<void> {
    return this.delete(
      {
        path: `/court-appearance/${appearanceUuid}`,
      },
      asSystem(username),
    )
  }

  async getCourtCaseByUuid(courtCaseUuid: string, username: string): Promise<PageCourtCaseContent> {
    return this.get(
      {
        path: `/court-case/${courtCaseUuid}`,
      },
      asSystem(username),
    )
  }

  async searchSentenceTypes(
    age: number,
    convictionDate: string,
    offenceDate: string,
    chargeOutcomeUuid: string,
    username: string,
  ): Promise<SentenceTypeDetails[]> {
    return this.get(
      {
        path: `/sentence-type/search`,
        query: {
          age,
          convictionDate,
          statuses: 'ACTIVE',
          offenceDate,
          ...(chargeOutcomeUuid ? { chargeOutcomeUuid } : {}),
        },
      },
      asSystem(username),
    )
  }

  async getSentenceTypeById(sentenceTypeId: string, username: string): Promise<SentenceType> {
    return this.get(
      {
        path: `/sentence-type/${sentenceTypeId}`,
      },
      asSystem(username),
    )
  }

  async getSentenceTypesByIds(sentenceTypeIds: string[], username: string): Promise<SentenceType[]> {
    return this.get(
      {
        path: `/sentence-type/uuid/multiple`,
        query: {
          uuids: sentenceTypeIds.join(','),
        },
      },
      asSystem(username),
    )
  }

  async getAllAppearanceOutcomes(username: string, statuses: string = 'ACTIVE'): Promise<CourtAppearanceOutcome[]> {
    return this.get(
      {
        path: `/appearance-outcome/status`,
        query: {
          statuses,
        },
      },
      asSystem(username),
    )
  }

  async getAppearanceOutcomeByUuid(uuid: string, username: string): Promise<CourtAppearanceOutcome> {
    return this.get(
      {
        path: `/appearance-outcome/${uuid}`,
      },
      asSystem(username),
    )
  }

  async getAllChargeOutcomes(username: string, statuses: string = 'ACTIVE'): Promise<ChargeOutcome[]> {
    return this.get(
      {
        path: `/charge-outcome/status`,
        query: {
          statuses,
        },
      },
      asSystem(username),
    )
  }

  async getChargeOutcomesByIds(outcomeIds: string[], username: string): Promise<ChargeOutcome[]> {
    return this.get(
      {
        path: `/charge-outcome/uuid/multiple`,
        query: {
          uuids: outcomeIds.join(','),
        },
      },
      asSystem(username),
    )
  }

  async getChargeOutcomeById(outcomeId: string, username: string): Promise<ChargeOutcome> {
    return this.get(
      {
        path: `/charge-outcome/${outcomeId}`,
      },
      asSystem(username),
    )
  }

  async getAppearanceTypes(username: string): Promise<AppearanceType[]> {
    return this.get(
      {
        path: `/appearance-type/status`,
        query: {
          statuses: 'ACTIVE',
        },
      },
      asSystem(username),
    )
  }

  async getAppearanceTypeByUuid(appearanceTypeUuid: string, username: string): Promise<AppearanceType> {
    return this.get(
      {
        path: `/appearance-type/${appearanceTypeUuid}`,
      },
      asSystem(username),
    )
  }

  async getLegacySentenceTypesSummaryAll(username: string): Promise<LegacySentenceTypeGroupingSummary[]> {
    return this.get(
      {
        path: `/legacy/sentence-type/all/summary`,
      },
      asSystem(username),
    )
  }

  async getLegacySentenceTypesAll(username: string): Promise<LegacySentenceType[]> {
    return this.get(
      {
        path: `/legacy/sentence-type/all`,
      },
      asSystem(username),
    )
  }

  async getLegacySentenceTypesDetail(
    nomisSentenceTypeReference: string,
    username: string,
  ): Promise<LegacySentenceType[]> {
    const encodedReference = encodeURIComponent(nomisSentenceTypeReference)

    return this.get(
      {
        path: `/legacy/sentence-type/?nomisSentenceTypeReference=${encodedReference}`,
      },
      asSystem(username),
    )
  }

  async getLegacySentenceTypesSummary(
    nomisSentenceTypeReference: string,
    username: string,
  ): Promise<LegacySentenceTypeGroupingSummary> {
    const encodedReference = encodeURIComponent(nomisSentenceTypeReference)

    return this.get(
      {
        path: `/legacy/sentence-type/summary/?nomisSentenceTypeReference=${encodedReference}`,
      },
      asSystem(username),
    )
  }

  async hasSentenceToChainTo(
    prisonerId: string,
    beforeOrOnAppearanceDate: string,
    bookingId: string,
    username: string,
  ): Promise<HasSentenceToChainToResponse> {
    return this.get(
      {
        path: `/person/${prisonerId}/has-sentence-to-chain-to`,
        query: {
          beforeOrOnAppearanceDate,
          bookingId,
        },
      },
      asSystem(username),
    )
  }

  async sentencesToChainTo(
    prisonerId: string,
    beforeOrOnAppearanceDate: string,
    bookingId: string,
    username: string,
  ): Promise<SentencesToChainToResponse> {
    return this.get(
      {
        path: `/person/${prisonerId}/sentences-to-chain-to`,
        query: {
          beforeOrOnAppearanceDate,
          bookingId,
        },
      },
      asSystem(username),
    )
  }

  async consecutiveToDetails(sentenceUuids: string[], username: string): Promise<SentenceConsecutiveToDetailsResponse> {
    return this.get(
      {
        path: '/sentence/consecutive-to-details',
        query: {
          sentenceUuids: sentenceUuids.join(','),
        },
      },
      asSystem(username),
    )
  }

  async courtCaseCountNumbers(courtCaseUuid: string, username: string): Promise<CourtCaseCountNumbers> {
    return this.get(
      {
        path: `/court-case/${courtCaseUuid}/count-numbers`,
      },
      asSystem(username),
    )
  }

  async isSentenceTypeStillValid(
    sentenceTypeId: string,
    age: number,
    convictionDate: string,
    offenceDate: string,
    username: string,
  ): Promise<SentenceTypeIsValid> {
    return this.get(
      {
        path: `/sentence-type/${sentenceTypeId}/is-still-valid`,
        query: {
          age,
          convictionDate,
          statuses: 'ACTIVE',
          offenceDate,
        },
      },
      asSystem(username),
    )
  }

  async createUploadedDocument(documents: UploadedDocument[], username: string): Promise<void> {
    return this.post(
      {
        path: `/uploaded-documents`,
        data: {
          documents,
        },
      },
      asSystem(username),
    )
  }

  async getLatestOffenceDateForCourtCase(
    courtCaseUuid: string,
    username: string,
    appearanceUuidToExclude?: string,
  ): Promise<LatestOffenceDate> {
    const query = appearanceUuidToExclude ? `?appearanceUuidToExclude=${appearanceUuidToExclude}` : ''
    return this.get<LatestOffenceDate>(
      {
        path: `/court-case/${courtCaseUuid}/latest-offence-date${query}`,
      },
      asSystem(username),
    )
  }

  async getValidationDatesForCourtCase(
    courtCaseUuid: string,
    username: string,
    appearanceUuidToExclude: string,
  ): Promise<CourtCaseValidationDate> {
    return this.get<CourtCaseValidationDate>(
      {
        path: `/court-case/${courtCaseUuid}/validation-dates`,
        query: {
          appearanceUuidToExclude,
        },
      },
      asSystem(username),
    )
  }

  async hasSentenceAfterOnOtherCourtAppearance(
    sentenceUuids: string[],
    username: string,
  ): Promise<HasSentenceAfterOnOtherCourtAppearanceResponse> {
    return this.get(
      {
        path: `/sentence/has-sentences-after-on-other-court-appearance`,
        query: {
          sentenceUuids: sentenceUuids.join(','),
        },
      },
      asSystem(username),
    )
  }

  async getSentenceUuidsWithActiveSentencesAfter(
    sentenceUuids: string[],
    username: string,
  ): Promise<SentenceUuidsWithActiveSentencesAfterResponse> {
    return this.get<SentenceUuidsWithActiveSentencesAfterResponse>(
      {
        path: `/sentence/has-active-sentences-after-on-other-court-appearance`,
        query: {
          sentenceUuids: sentenceUuids.join(','),
        },
      },
      asSystem(username),
    )
  }

  async getSentencesAfterOnOtherCourtAppearanceDetails(
    sentenceUuids: string[],
    username: string,
  ): Promise<SentencesAfterOnOtherCourtAppearanceDetailsResponse> {
    return this.get(
      {
        path: `/sentence/sentences-after-on-other-court-appearance-details`,
        query: {
          sentenceUuids: sentenceUuids.join(','),
        },
      },
      asSystem(username),
    )
  }

  async hasLoopInChain(
    consecutiveChainValidationRequest: ConsecutiveChainValidationRequest,
    username: string,
  ): Promise<boolean> {
    return this.post(
      {
        path: '/sentence/consecutive-chain/has-a-loop',
        data: consecutiveChainValidationRequest,
      },
      asSystem(username),
    )
  }

  async getPrisonerDocuments(
    prisonerId: string,
    searchDocuments: SearchDocuments,
    username: string,
  ): Promise<PrisonerDocuments> {
    return this.get(
      {
        path: `/person/${prisonerId}/documents`,
        query: {
          ...searchDocuments,
        },
      },
      asSystem(username),
    )
  }

  async getSentenceEnvelopes(prisonerId: string, username: string): Promise<PrisonerSentenceEnvelopes> {
    return this.get(
      {
        path: `/person/${prisonerId}/sentence-envelopes`,
      },
      asSystem(username),
    )
  }

  async getSentenceDetails(sentenceUuid: string, username: string): Promise<SentenceDetails> {
    return this.get(
      {
        path: `/sentence/${sentenceUuid}/details`,
      },
      asSystem(username),
    )
  }

  async getSentencesWithUnknownRecallType(
    sentenceUuids: string[],
    username: string,
  ): Promise<Array<MissingSentenceAppearance>> {
    return this.get(
      {
        path: `/sentence/unknown-recall-type`,
        query: {
          sentenceUuids,
        },
      },
      asSystem(username),
    )
  }

  async updateCharge(createCharge: CreateCharge, chargeUuid: string, username: string): Promise<CreateChargeResponse> {
    return this.put(
      {
        path: `/charge/${chargeUuid}`,
        data: createCharge,
      },
      asSystem(username),
    )
  }

  async createChargeOutcome(createChargeOutcome: CreateChargeOutcome, username: string): Promise<ChargeOutcome> {
    return this.post(
      {
        path: '/charge-outcome',
        data: createChargeOutcome,
      },
      asSystem(username),
    )
  }

  async updateChargeOutcome(
    chargeOutcomeUuid: string,
    updateChargeOutcome: CreateChargeOutcome,
    username: string,
  ): Promise<ChargeOutcome> {
    return this.put(
      {
        path: `/charge-outcome/${chargeOutcomeUuid}`,
        data: updateChargeOutcome,
      },
      asSystem(username),
    )
  }

  async createAppearanceOutcome(
    createAppearanceOutcome: CreateAppearanceOutcome,
    username: string,
  ): Promise<CourtAppearanceOutcome> {
    return this.post(
      {
        path: '/appearance-outcome',
        data: createAppearanceOutcome,
      },
      asSystem(username),
    )
  }

  async updateAppearanceOutcome(
    appearanceOutcomeUuid: string,
    updateAppearanceOutcome: CreateAppearanceOutcome,
    username: string,
  ): Promise<CourtAppearanceOutcome> {
    return this.put(
      {
        path: `/appearance-outcome/${appearanceOutcomeUuid}`,
        data: updateAppearanceOutcome,
      },
      asSystem(username),
    )
  }

  async getAllSentenceTypes(username: string): Promise<AllSentenceTypes> {
    return this.get(
      {
        path: `/sentence-type/all`,
      },
      asSystem(username),
    )
  }

  async createSentenceType(createSentenceType: CreateSentenceType, username: string): Promise<SentenceTypeDetails> {
    return this.post(
      {
        path: '/sentence-type',
        data: createSentenceType,
      },
      asSystem(username),
    )
  }

  async getBookingCourtCaseCount(
    prisonerId: string,
    bookingId: string,
    username: string,
  ): Promise<PersonCourtCaseCount> {
    return this.get(
      {
        path: `/person/${prisonerId}/booking-court-case-count`,
        query: {
          bookingId,
        },
      },
      asSystem(username),
    )
  }

  async getAllAppearanceSubtypes(username: string): Promise<CourtAppearanceSubtype[]> {
    return this.get(
      {
        path: `/court-appearance-subtype/status`,
        query: {
          statuses: 'ACTIVE',
        },
      },
      asSystem(username),
    )
  }

  async getAppearanceSubtypeByUuid(appearanceSubtypeUuid: string, username: string): Promise<CourtAppearanceSubtype> {
    return this.get(
      {
        path: `/court-appearance-subtype/${appearanceSubtypeUuid}`,
      },
      asSystem(username),
    )
  }

  async getSentenceTypeDetailsById(sentenceTypeUuid: string, username: string): Promise<SentenceTypeDetails> {
    return this.get(
      {
        path: `/sentence-type/${sentenceTypeUuid}/details`,
      },
      asSystem(username),
    )
  }

  async updateSentenceType(
    sentenceTypeUuid: string,
    updateSentenceType: CreateSentenceType,
    username: string,
  ): Promise<SentenceTypeDetails> {
    return this.put(
      {
        path: `/sentence-type/${sentenceTypeUuid}`,
        data: updateSentenceType,
      },
      asSystem(username),
    )
  }

  async getAllSentenceTypeChargeOutcomes(username: string): Promise<SentenceTypeChargeOutcomes> {
    return this.get(
      {
        path: '/sentence-type/charge-outcome/all',
      },
      asSystem(username),
    )
  }

  async getSentencedCharges(
    courtCaseUuid: string,
    sentenceStatuses: string[],
    username: string,
  ): Promise<SentencedCharges> {
    return this.get(
      {
        path: `/court-case/${courtCaseUuid}/sentenced-charges`,
        query: {
          sentenceStatuses: sentenceStatuses.join(','),
        },
      },
      asSystem(username),
    )
  }

  async getHmctsCourtData(
    hmctsHearingId: string,
    prisonerNumber: string,
    username: string,
  ): Promise<PageCourtCaseAppearance> {
    return this.get(
      {
        path: `/hmcts-court-data/${hmctsHearingId}/prisoner/${prisonerNumber}/appearance`,
      },
      asSystem(username),
    )
  }

  async getAllAggravatingFactors(username: string, statuses: string = 'ACTIVE'): Promise<AggravatingFactor[]> {
    return this.get(
      {
        path: `/aggravating-factors/status`,
        query: {
          statuses,
        },
      },
      asSystem(username),
    )
  }

  async getSentenceDeleteStatus(
    sentenceUuid: string,
    sentenceUuidsInChain: string[],
    username: string,
  ): Promise<DeleteSentenceStatusDetails> {
    return this.get(
      {
        path: `/sentence/${sentenceUuid}/delete-status`,
        ...(sentenceUuidsInChain.length && { query: { sentenceUuidsInChain: sentenceUuidsInChain.join(',') } }),
      },
      asSystem(username),
    )
  }

  async fixPrisonersManyChargesToSentence(
    fixSingleSentenceMultipleChargesPeople: FixSingleSentenceMultipleChargesPeople,
    username: string,
  ): Promise<void> {
    return this.post(
      {
        path: '/person-admin/fix-many-charges-to-sentence',
        data: fixSingleSentenceMultipleChargesPeople,
      },
      asSystem(username),
    )
  }

  async generateF986Document(
    prisonerId: string,
    generateF986DocumentRequest: CreateF986,
    username: string,
  ): Promise<FileDownload> {
    return this.post(
      {
        path: `/document-generator/f986/person/${prisonerId}`,
        data: generateF986DocumentRequest,
        responseType: 'blob',
        raw: true,
      },
      asSystem(username),
    )
  }

  async getUnconfirmedSentenceFixCourtCases(prisonerId: string, username: string): Promise<UnconfirmedCourtCases> {
    return this.get(
      {
        path: `/person/${prisonerId}/unconfirmed-sentence-fix-court-cases`,
      },
      asSystem(username),
    )
  }

  async getUnconfirmedSentenceFixCourtCasesByUuids(
    courtCaseUuids: string[],
    username: string,
  ): Promise<UnconfirmedCourtCases> {
    return this.get(
      {
        path: '/court-case/multiple/unconfirmed-sentence-fix-court-cases',
        query: {
          courtCaseUuids: courtCaseUuids.join(','),
        },
      },
      asSystem(username),
    )
  }

  async confirmConsecutiveToSentenceFixes(
    confirmConsecutiveToSentenceFixes: ConfirmConsecutiveToSentenceFixes,
    username: string,
  ): Promise<void> {
    return this.put(
      {
        path: '/sentence/confirm-consecutive-to-sentence-fix',
        data: confirmConsecutiveToSentenceFixes,
      },
      asSystem(username),
    )
  }

  async getAllHmctsResultCodes(username: string, statuses: string = 'ACTIVE'): Promise<HmctsResultCode[]> {
    return this.get(
      {
        path: `/hmcts-result-code/status`,
        query: {
          statuses,
        },
      },
      asSystem(username),
    )
  }

  async getHmctsResultCodeById(resultUuid: string, username: string): Promise<HmctsResultCode> {
    return this.get(
      {
        path: `/hmcts-result-code/${resultUuid}`,
      },
      asSystem(username),
    )
  }

  async createHmctsResultCode(
    createHmctsResultCode: CreateHmctsResultCode,
    username: string,
  ): Promise<HmctsResultCode> {
    return this.post(
      {
        path: '/hmcts-result-code',
        data: createHmctsResultCode,
      },
      asSystem(username),
    )
  }

  async updateHmctsResultCode(
    resultUuid: string,
    updateHmctsResultCode: CreateHmctsResultCode,
    username: string,
  ): Promise<HmctsResultCode> {
    return this.put(
      {
        path: `/hmcts-result-code/${resultUuid}`,
        data: updateHmctsResultCode,
      },
      asSystem(username),
    )
  }
}
