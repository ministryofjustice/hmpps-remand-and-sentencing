import type { OffenceOutcome } from '../@types/remandAndSentencingApi/remandAndSentencingClientTypes'
import RemandAndSentencingApiClient from '../data/remandAndSentencingApiClient'
import getOrSetRefDataInCache from '../cache/refDataCache'

export default class OffenceOutcomeService {
  constructor(private readonly remandAndSentencingApiClient: RemandAndSentencingApiClient) {}

  async getAllOutcomes(username: string): Promise<OffenceOutcome[]> {
    const cacheKey = 'charge-outcomes:all'
    return getOrSetRefDataInCache(cacheKey, () => this.remandAndSentencingApiClient.getAllChargeOutcomes(username))
  }

  async getOutcomeMap(outcomeIds: string[], username: string): Promise<{ [key: string]: OffenceOutcome }> {
    const outcomeIdsToSearch = outcomeIds.filter(outcomeId => outcomeId)
    if (!outcomeIdsToSearch.length) return {}

    const allActiveOutcomes = await this.getAllOutcomes(username)
    const allExistInCache = outcomeIdsToSearch.every(id => allActiveOutcomes.some(active => active.outcomeUuid === id))

    if (allExistInCache) {
      const outcomeList = allActiveOutcomes.filter(o => outcomeIdsToSearch.includes(o.outcomeUuid))
      return Object.fromEntries(outcomeList.map(outcome => [outcome.outcomeUuid, outcome]))
    }

    // Fetch from API if not all are present in cache (e.g. if outcome is inactive)
    const outcomes = await this.remandAndSentencingApiClient.getChargeOutcomesByIds(outcomeIdsToSearch, username)
    return Object.fromEntries(outcomes.map(outcome => [outcome.outcomeUuid, outcome]))
  }

  async getOutcomeById(outcomeId: string, username: string): Promise<OffenceOutcome> {
    const allActiveOutcomes = await this.getAllOutcomes(username)
    const outcome = allActiveOutcomes.find(o => o.outcomeUuid === outcomeId)
    if (outcome) {
      return outcome
    }
    return this.remandAndSentencingApiClient.getChargeOutcomeById(outcomeId, username)
  }
}
