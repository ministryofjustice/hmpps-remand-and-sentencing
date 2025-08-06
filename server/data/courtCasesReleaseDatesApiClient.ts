import { RestClient, asUser } from '@ministryofjustice/hmpps-rest-client'
import type { AuthenticationClient } from '@ministryofjustice/hmpps-auth-clients'
import config from '../config'
import logger from '../../logger'
import type { CcrdServiceDefinitions } from '../@types/courtCasesReleaseDatesApi/types'

export default class CourtCasesReleaseDatesApiClient extends RestClient {
  constructor(authenticationClient: AuthenticationClient) {
    super('Court Cases Release Dates API', config.apis.courtCasesReleaseDatesApi, logger, authenticationClient)
  }

  getServiceDefinitions(prisonerId: string, token: string): Promise<CcrdServiceDefinitions> {
    return this.get(
      {
        path: `/service-definitions/prisoner/${prisonerId}`,
      },
      asUser(token),
    ) as Promise<CcrdServiceDefinitions>
  }
}
