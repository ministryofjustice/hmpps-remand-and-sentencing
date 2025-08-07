import { Readable } from 'stream'
import { RestClient, asSystem, asUser } from '@ministryofjustice/hmpps-rest-client'
import type { AuthenticationClient } from '@ministryofjustice/hmpps-auth-clients'
import config from '../config'
import logger from '../../logger'
import { CaseLoad } from '../@types/prisonApi/types'

export default class PrisonApiClient extends RestClient {
  constructor(authenticationClient: AuthenticationClient) {
    super('Prison API', config.apis.prisonApi, logger, authenticationClient)
  }

  async getPrisonerImage(nomsId: string, username: string): Promise<Readable> {
    try {
      return await this.stream(
        {
          path: `/api/bookings/offenderNo/${nomsId}/image/data`,
        },
        asSystem(username),
      )
    } catch (error) {
      return error
    }
  }

  async getUsersCaseloads(userToken: string): Promise<CaseLoad[]> {
    return this.get({ path: `/api/users/me/caseLoads` }, asUser(userToken)) as Promise<CaseLoad[]>
  }
}
