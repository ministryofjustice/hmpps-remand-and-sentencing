import type { AppearanceOutcome } from '../@types/remandAndSentencingApi/remandAndSentencingClientTypes'
import RemandAndSentencingApiClient from '../api/remandAndSentencingApiClient'
import { HmppsAuthClient } from '../data'

export default class AppearanceOutcomeService {
  constructor(private readonly hmppsAuthClient: HmppsAuthClient) {}

  async getAllOutcomes(username: string): Promise<AppearanceOutcome[]> {
    return new RemandAndSentencingApiClient(await this.getSystemClientToken(username)).getAllAppearanceOutcomes()
  }

  private async getSystemClientToken(username: string): Promise<string> {
    return this.hmppsAuthClient.getSystemClientToken(username)
  }
}
