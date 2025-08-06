import type { AppearanceOutcome } from '../@types/remandAndSentencingApi/remandAndSentencingClientTypes'
import RemandAndSentencingApiClient from '../data/remandAndSentencingApiClient'

export default class AppearanceOutcomeService {
  constructor(private readonly remandAndSentencingApiClient: RemandAndSentencingApiClient) {}

  async getAllOutcomes(username: string): Promise<AppearanceOutcome[]> {
    return this.remandAndSentencingApiClient.getAllAppearanceOutcomes(username)
  }

  async getOutcomeByUuid(appearanceOutcomeUuid: string, username: string): Promise<AppearanceOutcome> {
    return this.remandAndSentencingApiClient.getAppearanceOutcomeByUuid(appearanceOutcomeUuid, username)
  }
}
