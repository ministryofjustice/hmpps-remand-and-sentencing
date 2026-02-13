import { Dayjs } from 'dayjs'
import {
  AppearanceOutcome,
  AppearanceType,
  OffenceOutcome,
  SentenceType,
} from '../@types/remandAndSentencingApi/remandAndSentencingClientTypes'
import RemandAndSentencingApiClient from '../data/remandAndSentencingApiClient'
import getOrSetRefDataInCache from '../cache/refDataCache'

export default class RefDataService {
  constructor(private readonly remandAndSentencingApiClient: RemandAndSentencingApiClient) {}

  async getAllChargeOutcomes(username: string): Promise<OffenceOutcome[]> {
    const cacheKey = 'charge-outcomes:all'
    return getOrSetRefDataInCache(cacheKey, () => this.remandAndSentencingApiClient.getAllChargeOutcomes(username))
  }

  async getAllUncachedChargeOutcomes(username: string): Promise<OffenceOutcome[]> {
    return this.remandAndSentencingApiClient.getAllChargeOutcomes(username, 'ACTIVE,INACTIVE')
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
    const cacheKey = 'appearance-outcomes:all'
    return getOrSetRefDataInCache(cacheKey, () => this.remandAndSentencingApiClient.getAllAppearanceOutcomes(username))
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
}
