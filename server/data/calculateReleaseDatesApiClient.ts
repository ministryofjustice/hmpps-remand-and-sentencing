import { RestClient, asSystem } from '@ministryofjustice/hmpps-rest-client'
import type { AuthenticationClient } from '@ministryofjustice/hmpps-auth-clients'
import config from '../config'
import logger from '../../logger'
import {
  OverallSentenceLengthComparison,
  OverallSentenceLengthRequest,
} from '../@types/calculateReleaseDatesApi/calculateReleaseDatesClientTypes'

export default class CalculateReleaseDatesApiClient extends RestClient {
  constructor(authenticationClient: AuthenticationClient) {
    super('Calculate Release Dates API', config.apis.calculateReleaseDatesApi, logger, authenticationClient)
  }

  async compareOverallSentenceLength(
    request: OverallSentenceLengthRequest,
    username: string,
  ): Promise<OverallSentenceLengthComparison> {
    return this.post(
      {
        path: `/overall-sentence-length`,
        data: request,
      },
      asSystem(username),
    ) as Promise<OverallSentenceLengthComparison>
  }
}
