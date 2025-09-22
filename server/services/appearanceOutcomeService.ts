import getOrSetRefDataInCache from '../cache/refDataCache'
import RemandAndSentencingApiClient from '../data/remandAndSentencingApiClient'
import { AppearanceOutcome } from '../@types/remandAndSentencingApi/remandAndSentencingClientTypes'

export default class AppearanceOutcomeService {
  constructor(private readonly remandAndSentencingApiClient: RemandAndSentencingApiClient) {}

  async getAllOutcomes(username: string): Promise<AppearanceOutcome[]> {
    const cacheKey = 'appearance-outcomes:all'
    return getOrSetRefDataInCache(cacheKey, () => this.remandAndSentencingApiClient.getAllAppearanceOutcomes(username))
  }

  async getOutcomeByUuid(appearanceOutcomeUuid: string, username: string): Promise<AppearanceOutcome> {
    const allActiveOutcomes = await this.getAllOutcomes(username)
    const outcome = allActiveOutcomes.find(o => o.outcomeUuid === appearanceOutcomeUuid)
    if (outcome) {
      return outcome
    }
    // There is the potential that the outcome for the appearanceOutcomeUuid is inactive, therefore call the api in this scenario
    return this.remandAndSentencingApiClient.getAppearanceOutcomeByUuid(appearanceOutcomeUuid, username)
  }
}
