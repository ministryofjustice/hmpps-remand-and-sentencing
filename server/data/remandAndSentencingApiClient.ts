import { asSystem, RestClient } from '@ministryofjustice/hmpps-rest-client'
import type { AuthenticationClient } from '@ministryofjustice/hmpps-auth-clients'
import {
  AppearanceOutcome,
  AppearanceType,
  ConsecutiveChainValidationRequest,
  CourtCaseCountNumbers,
  CreateCourtAppearance,
  CreateCourtAppearanceResponse,
  CreateCourtCase,
  CreateCourtCaseResponse,
  DraftCourtAppearance,
  DraftCourtAppearanceCreatedResponse,
  DraftCourtCaseCreatedResponse,
  DraftCreateCourtAppearance,
  DraftCreateCourtCase,
  HasSentenceAfterOnOtherCourtAppearanceResponse,
  HasSentenceToChainToResponse,
  LatestOffenceDate,
  LegacySentenceType,
  LegacySentenceTypeGroupingSummary,
  OffenceOutcome,
  PageCourtCaseAppearance,
  PageCourtCaseContent,
  PagePagedCourtCase,
  SentenceConsecutiveToDetailsResponse,
  SentencesAfterOnOtherCourtAppearanceDetailsResponse,
  SentencesToChainToResponse,
  SentenceType,
  SentenceTypeIsValid,
  UploadedDocument,
} from '../@types/remandAndSentencingApi/remandAndSentencingClientTypes'
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
    return (await this.put(
      {
        data: createCourtCase,
        path: `/court-case/${courtCaseUuid}`,
      },
      asSystem(username),
    )) as unknown as Promise<CreateCourtCaseResponse>
  }

  async createDraftCourtCase(
    draftCreateCourtCase: DraftCreateCourtCase,
    username: string,
  ): Promise<DraftCourtCaseCreatedResponse> {
    return (await this.post(
      {
        data: draftCreateCourtCase,
        path: '/draft/court-case',
      },
      asSystem(username),
    )) as unknown as Promise<DraftCourtCaseCreatedResponse>
  }

  async createDraftCourtAppearance(
    courtCaseUuid: string,
    draftCreateCourtAppearance: DraftCreateCourtAppearance,
    username: string,
  ): Promise<DraftCourtAppearanceCreatedResponse> {
    return (await this.post(
      {
        data: draftCreateCourtAppearance,
        path: `/draft/court-case/${courtCaseUuid}/appearance`,
      },
      asSystem(username),
    )) as unknown as Promise<DraftCourtAppearanceCreatedResponse>
  }

  async updateDraftCourtAppearance(
    courtAppearanceUuid: string,
    draftCreateCourtAppearance: DraftCreateCourtAppearance,
    username: string,
  ): Promise<void> {
    return (await this.put(
      {
        data: draftCreateCourtAppearance,
        path: `/draft/court-appearance/${courtAppearanceUuid}`,
      },
      asSystem(username),
    )) as unknown as Promise<void>
  }

  async searchCourtCases(
    prisonerId: string,
    sortBy: string,
    page: number,
    username: string,
  ): Promise<PagePagedCourtCase> {
    return (await this.get(
      {
        path: `/court-case/paged/search`,
        query: {
          prisonerId,
          pagedCourtCaseOrderBy: sortBy,
          page,
        },
      },
      asSystem(username),
    )) as unknown as Promise<PagePagedCourtCase>
  }

  async putCourtAppearance(
    appearanceUuid: string,
    createCourtAppearance: CreateCourtAppearance,
    username: string,
  ): Promise<CreateCourtAppearanceResponse> {
    console.log(' HERE >>>>>>')
    console.log(JSON.stringify(createCourtAppearance))
    return (await this.put(
      {
        data: createCourtAppearance,
        path: `/court-appearance/${appearanceUuid}`,
      },
      asSystem(username),
    )) as unknown as Promise<CreateCourtAppearanceResponse>
  }

  async getLatestAppearanceByCourtCaseUuid(courtCaseUuid: string, username: string): Promise<PageCourtCaseAppearance> {
    return (await this.get(
      {
        path: `/court-case/${courtCaseUuid}/latest-appearance`,
      },
      asSystem(username),
    )) as unknown as Promise<PageCourtCaseAppearance>
  }

  async getCourtAppearanceByAppearanceUuid(appearanceUuid: string, username: string): Promise<PageCourtCaseAppearance> {
    return (await this.get(
      {
        path: `/court-appearance/${appearanceUuid}`,
      },
      asSystem(username),
    )) as unknown as Promise<PageCourtCaseAppearance>
  }

  async getDraftCourtAppearanceByDraftUuid(appearanceUuid: string, username: string): Promise<DraftCourtAppearance> {
    return (await this.get(
      {
        path: `/draft/court-appearance/${appearanceUuid}`,
      },
      asSystem(username),
    )) as unknown as Promise<DraftCourtAppearance>
  }

  async deleteCourtAppearance(appearanceUuid: string, username: string): Promise<void> {
    return (await this.delete(
      {
        path: `/court-appearance/${appearanceUuid}`,
      },
      asSystem(username),
    )) as unknown as Promise<void>
  }

  async getCourtCaseByUuid(courtCaseUuid: string, username: string): Promise<PageCourtCaseContent> {
    return (await this.get(
      {
        path: `/court-case/${courtCaseUuid}`,
      },
      asSystem(username),
    )) as unknown as Promise<PageCourtCaseContent>
  }

  async searchSentenceTypes(
    age: number,
    convictionDate: string,
    offenceDate: string,
    username: string,
  ): Promise<SentenceType[]> {
    return (await this.get(
      {
        path: `/sentence-type/search`,
        query: {
          age,
          convictionDate,
          statuses: 'ACTIVE',
          offenceDate,
        },
      },
      asSystem(username),
    )) as unknown as Promise<SentenceType[]>
  }

  async getSentenceTypeById(sentenceTypeId: string, username: string): Promise<SentenceType> {
    return (await this.get(
      {
        path: `/sentence-type/${sentenceTypeId}`,
      },
      asSystem(username),
    )) as unknown as Promise<SentenceType>
  }

  async getSentenceTypesByIds(sentenceTypeIds: string[], username: string): Promise<SentenceType[]> {
    return (await this.get(
      {
        path: `/sentence-type/uuid/multiple`,
        query: {
          uuids: sentenceTypeIds.join(','),
        },
      },
      asSystem(username),
    )) as unknown as Promise<SentenceType[]>
  }

  async getAllAppearanceOutcomes(username: string): Promise<AppearanceOutcome[]> {
    return (await this.get(
      {
        path: `/appearance-outcome/status`,
        query: {
          statuses: 'ACTIVE',
        },
      },
      asSystem(username),
    )) as unknown as Promise<AppearanceOutcome[]>
  }

  async getAppearanceOutcomeByUuid(uuid: string, username: string): Promise<AppearanceOutcome> {
    return (await this.get(
      {
        path: `/appearance-outcome/${uuid}`,
      },
      asSystem(username),
    )) as unknown as Promise<AppearanceOutcome>
  }

  async getAllChargeOutcomes(username: string): Promise<OffenceOutcome[]> {
    return (await this.get(
      {
        path: `/charge-outcome/status`,
        query: {
          statuses: 'ACTIVE',
        },
      },
      asSystem(username),
    )) as unknown as Promise<OffenceOutcome[]>
  }

  async getChargeOutcomesByIds(outcomeIds: string[], username: string): Promise<OffenceOutcome[]> {
    return (await this.get(
      {
        path: `/charge-outcome/uuid/multiple`,
        query: {
          uuids: outcomeIds.join(','),
        },
      },
      asSystem(username),
    )) as unknown as Promise<OffenceOutcome[]>
  }

  async getChargeOutcomeById(outcomeId: string, username: string): Promise<OffenceOutcome> {
    return (await this.get(
      {
        path: `/charge-outcome/${outcomeId}`,
      },
      asSystem(username),
    )) as unknown as Promise<OffenceOutcome>
  }

  async getAppearanceTypes(username: string): Promise<AppearanceType[]> {
    return (await this.get(
      {
        path: `/appearance-type/status`,
        query: {
          statuses: 'ACTIVE',
        },
      },
      asSystem(username),
    )) as unknown as Promise<AppearanceType[]>
  }

  async getAppearanceTypeByUuid(appearanceTypeUuid: string, username: string): Promise<AppearanceType> {
    return (await this.get(
      {
        path: `/appearance-type/${appearanceTypeUuid}`,
      },
      asSystem(username),
    )) as unknown as Promise<AppearanceType>
  }

  async getLegacySentenceTypesSummaryAll(username: string): Promise<LegacySentenceTypeGroupingSummary[]> {
    return (await this.get(
      {
        path: `/legacy/sentence-type/all/summary`,
      },
      asSystem(username),
    )) as unknown as Promise<LegacySentenceTypeGroupingSummary[]>
  }

  async getLegacySentenceTypesAll(username: string): Promise<LegacySentenceType[]> {
    return (await this.get(
      {
        path: `/legacy/sentence-type/all`,
      },
      asSystem(username),
    )) as unknown as Promise<LegacySentenceType[]>
  }

  async getLegacySentenceTypesDetail(
    nomisSentenceTypeReference: string,
    username: string,
  ): Promise<LegacySentenceType[]> {
    const encodedReference = encodeURIComponent(nomisSentenceTypeReference)

    return (await this.get(
      {
        path: `/legacy/sentence-type/?nomisSentenceTypeReference=${encodedReference}`,
      },
      asSystem(username),
    )) as unknown as Promise<LegacySentenceType[]>
  }

  async getLegacySentenceTypesSummary(
    nomisSentenceTypeReference: string,
    username: string,
  ): Promise<LegacySentenceTypeGroupingSummary> {
    const encodedReference = encodeURIComponent(nomisSentenceTypeReference)

    return (await this.get(
      {
        path: `/legacy/sentence-type/summary/?nomisSentenceTypeReference=${encodedReference}`,
      },
      asSystem(username),
    )) as unknown as Promise<LegacySentenceTypeGroupingSummary>
  }

  async hasSentenceToChainTo(
    prisonerId: string,
    beforeOrOnAppearanceDate: string,
    bookingId: string,
    username: string,
  ): Promise<HasSentenceToChainToResponse> {
    return (await this.get(
      {
        path: `/person/${prisonerId}/has-sentence-to-chain-to`,
        query: {
          beforeOrOnAppearanceDate,
          bookingId,
        },
      },
      asSystem(username),
    )) as unknown as Promise<HasSentenceToChainToResponse>
  }

  async sentencesToChainTo(
    prisonerId: string,
    beforeOrOnAppearanceDate: string,
    bookingId: string,
    username: string,
  ): Promise<SentencesToChainToResponse> {
    return (await this.get(
      {
        path: `/person/${prisonerId}/sentences-to-chain-to`,
        query: {
          beforeOrOnAppearanceDate,
          bookingId,
        },
      },
      asSystem(username),
    )) as unknown as Promise<SentencesToChainToResponse>
  }

  async consecutiveToDetails(sentenceUuids: string[], username: string): Promise<SentenceConsecutiveToDetailsResponse> {
    return (await this.get(
      {
        path: '/sentence/consecutive-to-details',
        query: {
          sentenceUuids: sentenceUuids.join(','),
        },
      },
      asSystem(username),
    )) as unknown as Promise<SentenceConsecutiveToDetailsResponse>
  }

  async courtCaseCountNumbers(courtCaseUuid: string, username: string): Promise<CourtCaseCountNumbers> {
    return (await this.get(
      {
        path: `/court-case/${courtCaseUuid}/count-numbers`,
      },
      asSystem(username),
    )) as unknown as Promise<CourtCaseCountNumbers>
  }

  async isSentenceTypeStillValid(
    sentenceTypeId: string,
    age: number,
    convictionDate: string,
    offenceDate: string,
    username: string,
  ): Promise<SentenceTypeIsValid> {
    return (await this.get(
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
    )) as unknown as Promise<SentenceTypeIsValid>
  }

  async createUploadedDocument(documents: UploadedDocument[], username: string): Promise<void> {
    return (await this.post(
      {
        path: `/uploaded-documents`,
        data: {
          documents,
        },
      },
      asSystem(username),
    )) as unknown as Promise<void>
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

  async hasSentenceAfterOnOtherCourtAppearance(
    sentenceUuid: string,
    username: string,
  ): Promise<HasSentenceAfterOnOtherCourtAppearanceResponse> {
    return (await this.get(
      {
        path: `/sentence/${sentenceUuid}/has-sentences-after-on-other-court-appearance`,
      },
      asSystem(username),
    )) as unknown as Promise<HasSentenceAfterOnOtherCourtAppearanceResponse>
  }

  async getSentencesAfterOnOtherCourtAppearanceDetails(
    sentenceUuid: string,
    username: string,
  ): Promise<SentencesAfterOnOtherCourtAppearanceDetailsResponse> {
    return (await this.get(
      {
        path: `/sentence/${sentenceUuid}/sentences-after-on-other-court-appearance-details`,
      },
      asSystem(username),
    )) as unknown as Promise<SentencesAfterOnOtherCourtAppearanceDetailsResponse>
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
}
