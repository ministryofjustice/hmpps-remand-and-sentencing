import type { OffenceOutcome } from '../@types/remandAndSentencingApi/remandAndSentencingClientTypes'
import RemandAndSentencingApiClient from '../api/remandAndSentencingApiClient'
import { HmppsAuthClient } from '../data'

export default class OffenceOutcomeService {
  constructor(private readonly hmppsAuthClient: HmppsAuthClient) {}

  async getAllOutcomes(username: string): Promise<OffenceOutcome[]> {
    return new RemandAndSentencingApiClient(await this.getSystemClientToken(username)).getAllChargeOutcomes()
  }

  private async getSystemClientToken(username: string): Promise<string> {
    return this.hmppsAuthClient.getSystemClientToken(username)
  }
}
