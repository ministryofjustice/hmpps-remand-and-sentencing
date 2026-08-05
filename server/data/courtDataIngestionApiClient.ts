import { RestClient, asSystem } from '@ministryofjustice/hmpps-rest-client'
import type { AuthenticationClient } from '@ministryofjustice/hmpps-auth-clients'
import config from '../config'
import logger from '../../logger'
import { CourtHearing } from '../@types/courtDataIngestionApi/types'

export default class CourtDataIngestionApiClient extends RestClient {
  constructor(authenticationClient: AuthenticationClient) {
    super('Court Data Ingestion API', config.apis.courtDataIngestionApi, logger, authenticationClient)
  }

  async getCourtHearing(courtHearingId: string, prisonerNumber: string, username: string): Promise<CourtHearing> {
    return this.get(
      { path: `/court-hearings/prisoner/${prisonerNumber}/hearing/${courtHearingId}` },
      asSystem(username),
    )
  }
}
