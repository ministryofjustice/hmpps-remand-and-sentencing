import { Dayjs } from 'dayjs'
import {
  AllSentenceTypes,
  AppearanceOutcome,
  AppearanceType,
  CourtAppearanceSubtype,
  CreateAppearanceOutcome,
  CreateChargeOutcome,
  CreateSentenceType,
  OffenceOutcome,
  SentenceType,
  SentenceTypeDetails,
} from '../@types/remandAndSentencingApi/remandAndSentencingClientTypes'
import RemandAndSentencingApiClient from '../data/remandAndSentencingApiClient'
import getOrSetRefDataInCache, { clearCache } from '../cache/refDataCache'

export default class RefDataService {
  chargeOutcomeCacheKey = 'charge-outcomes:all'

  appearanceOutcomeCacheKey = 'appearance-outcomes:all'

  appearanceSubtypeCacheKey = 'court-appearance-subtypes:all'

  constructor(private readonly remandAndSentencingApiClient: RemandAndSentencingApiClient) {}

  async getAllChargeOutcomes(username: string): Promise<OffenceOutcome[]> {
    return getOrSetRefDataInCache(this.chargeOutcomeCacheKey, () =>
      this.remandAndSentencingApiClient.getAllChargeOutcomes(username),
    )
  }

  async getAllUncachedChargeOutcomes(username: string): Promise<OffenceOutcome[]> {
    return this.remandAndSentencingApiClient.getAllChargeOutcomes(username, 'ACTIVE,INACTIVE')
  }

  async createChargeOutcome(createChargeOutcome: CreateChargeOutcome, username: string): Promise<OffenceOutcome> {
    return this.remandAndSentencingApiClient.createChargeOutcome(createChargeOutcome, username)
  }

  async clearChargeOutcomeCache(): Promise<number | `${number}`> {
    return clearCache(this.chargeOutcomeCacheKey)
  }

  async updateChargeOutcome(
    chargeOutcomeUuid: string,
    updateChargeOutcome: CreateChargeOutcome,
    username: string,
  ): Promise<OffenceOutcome> {
    return this.remandAndSentencingApiClient.updateChargeOutcome(chargeOutcomeUuid, updateChargeOutcome, username)
  }

  async getChargeOutcomeMap(outcomeIds: string[], username: string): Promise<{ [key: string]: OffenceOutcome }> {
    const outcomeIdsToSearch = outcomeIds.filter(outcomeId => outcomeId)
    if (!outcomeIdsToSearch.length) return {}

    const allActiveOutcomes = await this.getAllChargeOutcomes(username)
    const allExistInCache = outcomeIdsToSearch.every(id => allActiveOutcomes.some(active => active.outcomeUuid === id))

    if (allExistInCache) {
      const outcomeList = allActiveOutcomes.filter(o => outcomeIdsToSearch.includes(o.outcomeUuid))
      return Object.fromEntries(outcomeList.map(outcome => [outcome.outcomeUuid, outcome]))
    }

    // Fetch from API if not all are present in cache (e.g. if outcome is inactive)
    const outcomes = await this.remandAndSentencingApiClient.getChargeOutcomesByIds(outcomeIdsToSearch, username)
    return Object.fromEntries(outcomes.map(outcome => [outcome.outcomeUuid, outcome]))
  }

  async getChargeOutcomeById(outcomeId: string, username: string): Promise<OffenceOutcome> {
    const allActiveOutcomes = await this.getAllChargeOutcomes(username)
    const outcome = allActiveOutcomes.find(o => o.outcomeUuid === outcomeId)
    if (outcome) {
      return outcome
    }
    return this.remandAndSentencingApiClient.getChargeOutcomeById(outcomeId, username)
  }

  async getAllAppearanceOutcomes(username: string): Promise<AppearanceOutcome[]> {
    return getOrSetRefDataInCache(this.appearanceOutcomeCacheKey, () =>
      this.remandAndSentencingApiClient.getAllAppearanceOutcomes(username),
    )
  }

  async getAllUncachedAppearanceOutcomes(username: string): Promise<AppearanceOutcome[]> {
    return this.remandAndSentencingApiClient.getAllAppearanceOutcomes(username, 'ACTIVE,INACTIVE')
  }

  async createAppearanceOutcome(
    createAppearanceOutcome: CreateAppearanceOutcome,
    username: string,
  ): Promise<AppearanceOutcome> {
    return this.remandAndSentencingApiClient.createAppearanceOutcome(createAppearanceOutcome, username)
  }

  async updateAppearanceOutcome(
    appearanceOutcomeUuid: string,
    updateAppearanceOutcome: CreateAppearanceOutcome,
    username: string,
  ): Promise<AppearanceOutcome> {
    return this.remandAndSentencingApiClient.updateAppearanceOutcome(
      appearanceOutcomeUuid,
      updateAppearanceOutcome,
      username,
    )
  }

  async clearAppearanceOutcomeCache(): Promise<number | `${number}`> {
    return clearCache(this.appearanceOutcomeCacheKey)
  }

  async getAppearanceOutcomeByUuid(appearanceOutcomeUuid: string, username: string): Promise<AppearanceOutcome> {
    const allActiveOutcomes = await this.getAllAppearanceOutcomes(username)
    const outcome = allActiveOutcomes.find(o => o.outcomeUuid === appearanceOutcomeUuid)
    if (outcome) {
      return outcome
    }
    // There is the potential that the outcome for the appearanceOutcomeUuid is inactive, therefore call the api in this scenario
    return this.remandAndSentencingApiClient.getAppearanceOutcomeByUuid(appearanceOutcomeUuid, username)
  }

  async getPrimaryNonCustodialChargeOutcomes(
    appearanceOutcomeUuid: string,
    warrantType: string,
    username: string,
  ): Promise<{
    primaryOutcomes: OffenceOutcome[]
    nonCustodialOutcomes: OffenceOutcome[]
    allOutcomes: OffenceOutcome[]
  }> {
    const appearanceOutcomePromise: Promise<AppearanceOutcome> = appearanceOutcomeUuid
      ? this.getAppearanceOutcomeByUuid(appearanceOutcomeUuid, username)
      : Promise.resolve({
          outcomeUuid: '-1',
          outcomeName: 'no outcome',
          displayOrder: -1,
          dispositionCode: 'UNKNOWN',
          isSubList: false,
          nomisCode: '-1',
          outcomeType: 'UNKNOWN',
          relatedChargeOutcomeUuid: '-1',
          warrantType: 'UNKNOWN',
          status: 'INACTIVE',
        })
    const [appearanceOutcome, chargeOutcomes] = await Promise.all([
      appearanceOutcomePromise,
      this.getAllChargeOutcomes(username),
    ])
    let outcomeTypes = ['REMAND', 'NON_CUSTODIAL']
    if (appearanceOutcome.outcomeType === 'NON_CUSTODIAL') {
      outcomeTypes = ['NON_CUSTODIAL']
    } else if (appearanceOutcome.outcomeType === 'SENTENCING') {
      outcomeTypes = ['SENTENCING', 'NON_CUSTODIAL']
    } else if (warrantType === 'SENTENCING') {
      outcomeTypes = ['SENTENCING']
    }
    const allOutcomes = chargeOutcomes
      .filter(caseOutcome => outcomeTypes.includes(caseOutcome.outcomeType))
      .sort((a, b) => a.displayOrder - b.displayOrder)

    const primaryOutcomes = allOutcomes.filter(o => o.outcomeType !== 'NON_CUSTODIAL')
    const nonCustodialOutcomes = allOutcomes.filter(o => o.outcomeType === 'NON_CUSTODIAL')
    return { primaryOutcomes, nonCustodialOutcomes, allOutcomes }
  }

  async getSentenceTypes(
    age: number,
    convictionDate: Dayjs,
    offenceDate: Dayjs,
    chargeOutcomeUuid: string,
    username: string,
  ): Promise<SentenceType[]> {
    return this.remandAndSentencingApiClient.searchSentenceTypes(
      age,
      convictionDate.format('YYYY-MM-DD'),
      offenceDate.format('YYYY-MM-DD'),
      chargeOutcomeUuid,
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

  async getAllAppearanceSubtypes(username: string): Promise<CourtAppearanceSubtype[]> {
    return getOrSetRefDataInCache(this.appearanceSubtypeCacheKey, () =>
      this.remandAndSentencingApiClient.getAllAppearanceSubtypes(username),
    )
  }

  async getAppearanceSubtypeByUuid(appearanceSubtypeUuid: string, username: string): Promise<CourtAppearanceSubtype> {
    const allActiveSubtypes = await this.getAllAppearanceSubtypes(username)
    const subtype = allActiveSubtypes.find(st => st.appearanceSubtypeUuid === appearanceSubtypeUuid)
    if (subtype) {
      return subtype
    }
    // There is the potential that the subtype for the appearanceSubtypeUuid is inactive, therefore call the api in this scenario
    return this.remandAndSentencingApiClient.getAppearanceSubtypeByUuid(appearanceSubtypeUuid, username)
  }

  async getAllUncachedSentenceTypes(username: string): Promise<AllSentenceTypes> {
    return this.remandAndSentencingApiClient.getAllSentenceTypes(username)
  }

  async createSentenceType(createSentenceType: CreateSentenceType, username: string): Promise<SentenceTypeDetails> {
    return this.remandAndSentencingApiClient.createSentenceType(createSentenceType, username)
  }

  async getSentenceTypeDetailsById(sentenceTypeUuid: string, username: string): Promise<SentenceTypeDetails> {
    return this.remandAndSentencingApiClient.getSentenceTypeDetailsById(sentenceTypeUuid, username)
  }

  async updateSentenceType(
    sentenceTypeUuid: string,
    updateSentenceType: CreateSentenceType,
    username: string,
  ): Promise<SentenceTypeDetails> {
    return this.remandAndSentencingApiClient.updateSentenceType(sentenceTypeUuid, updateSentenceType, username)
  }
}
