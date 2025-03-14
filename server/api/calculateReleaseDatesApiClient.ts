import RestClient from '../data/restClient'
import config, { ApiConfig } from '../config'
import {
  OverallSentenceLengthComparison,
  OverallSentenceLengthRequest,
} from '../@types/calculateReleaseDatesApi/calculateReleaseDatesClientTypes'

export default class CalculateReleaseDatesApiClient {
  restClient: RestClient

  constructor(token: string) {
    this.restClient = new RestClient(
      'Calculate Release Dates API',
      config.apis.calculateReleaseDatesApi as ApiConfig,
      token,
    )
  }

  async compareOverallSentenceLength(request: OverallSentenceLengthRequest): Promise<OverallSentenceLengthComparison> {
    return this.restClient.post({
      path: `/overall-sentence-length`,
      data: request,
    }) as Promise<OverallSentenceLengthComparison>
  }
}
