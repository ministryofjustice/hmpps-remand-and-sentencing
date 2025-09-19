import getOrSetRefDataInCache from '../cache/refDataCache'
import RemandAndSentencingApiClient from '../data/remandAndSentencingApiClient'

export default class AppearanceOutcomeService {
  constructor(private readonly remandAndSentencingApiClient: RemandAndSentencingApiClient) {}

  async getAllOutcomes(username: string) {
    const cacheKey = 'appearance-outcomes:all'
    return getOrSetRefDataInCache(cacheKey, () => this.remandAndSentencingApiClient.getAllAppearanceOutcomes(username))
  }

  async getOutcomeByUuid(appearanceOutcomeUuid: string, username: string) {
    return this.remandAndSentencingApiClient.getAppearanceOutcomeByUuid(appearanceOutcomeUuid, username)
  }
}
