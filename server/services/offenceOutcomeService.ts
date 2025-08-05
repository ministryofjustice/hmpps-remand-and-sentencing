import type { OffenceOutcome } from '../@types/remandAndSentencingApi/remandAndSentencingClientTypes'
import RemandAndSentencingApiClient from '../data/remandAndSentencingApiClient'

export default class OffenceOutcomeService {
  constructor(private readonly remandAndSentencingApiClient: RemandAndSentencingApiClient) {}

  async getAllOutcomes(username: string): Promise<OffenceOutcome[]> {
    return this.remandAndSentencingApiClient.getAllChargeOutcomes(username)
  }

  async getOutcomeMap(outcomeIds: string[], username: string): Promise<{ [key: string]: OffenceOutcome }> {
    let outcomeMap = {}
    const outcomeIdsToSearch = outcomeIds.filter(outcomeId => outcomeId)
    if (outcomeIdsToSearch.length) {
      const outcomes = await this.remandAndSentencingApiClient.getChargeOutcomesByIds(outcomeIdsToSearch, username)
      outcomeMap = Object.fromEntries(outcomes.map(outcome => [outcome.outcomeUuid, outcome]))
    }
    return outcomeMap
  }

  async getOutcomeById(outcomeId: string, username: string): Promise<OffenceOutcome> {
    return this.remandAndSentencingApiClient.getChargeOutcomeById(outcomeId, username)
  }
}
