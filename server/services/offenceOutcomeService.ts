import type { OffenceOutcome } from '../@types/remandAndSentencingApi/remandAndSentencingClientTypes'
import RemandAndSentencingApiClient from '../api/remandAndSentencingApiClient'
import { HmppsAuthClient } from '../data'

export default class OffenceOutcomeService {
  constructor(private readonly hmppsAuthClient: HmppsAuthClient) {}

  async getAllOutcomes(username: string): Promise<OffenceOutcome[]> {
    return new RemandAndSentencingApiClient(await this.getSystemClientToken(username)).getAllChargeOutcomes()
  }

  async getOutcomeMap(outcomeIds: string[], username: string): Promise<{ [key: string]: string }> {
    let outcomeMap = {}
    const outcomeIdsToSearch = outcomeIds.filter(outcomeId => outcomeId)
    if (outcomeIdsToSearch.length) {
      const outcomes = await new RemandAndSentencingApiClient(
        await this.getSystemClientToken(username),
      ).getChargeOutcomesByIds(outcomeIdsToSearch)
      outcomeMap = Object.fromEntries(outcomes.map(outcome => [outcome.outcomeUuid, outcome.outcomeName]))
    }
    return outcomeMap
  }

  async getOutcomeById(outcomeId: string, username: string): Promise<OffenceOutcome> {
    return new RemandAndSentencingApiClient(await this.getSystemClientToken(username)).getChargeOutcomeById(outcomeId)
  }

  private async getSystemClientToken(username: string): Promise<string> {
    return this.hmppsAuthClient.getSystemClientToken(username)
  }
}
