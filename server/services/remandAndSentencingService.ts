import type { RemandAndSentencingPerson } from '../@types/remandAndSentencingApi/remandAndSentencingClientTypes'
import RemandAndSentencingApiClient from '../api/remandAndSentencingApiClient'

export default class RemandAndSentencingService {
  async getPersonDetails(prisonerId: string, token: string): Promise<RemandAndSentencingPerson> {
    return new RemandAndSentencingApiClient(token).getPersonDetail(prisonerId)
  }
}
