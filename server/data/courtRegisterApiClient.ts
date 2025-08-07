import { RestClient, asSystem } from '@ministryofjustice/hmpps-rest-client'
import type { AuthenticationClient } from '@ministryofjustice/hmpps-auth-clients'
import config from '../config'
import logger from '../../logger'
import { CourtDto, CourtDtoPage } from '../@types/courtRegisterApi/types'

export default class CourtRegisterApiClient extends RestClient {
  constructor(authenticationClient: AuthenticationClient) {
    super('Court Register API', config.apis.courtRegisterApi, logger, authenticationClient)
  }

  async getAllCourts(username: string): Promise<CourtDto[]> {
    return (await this.get({ path: '/courts/all' }, asSystem(username))) as unknown as Promise<CourtDto[]>
  }

  async searchCourt(textSearch: string, username: string): Promise<CourtDtoPage> {
    return (await this.get(
      {
        path: '/courts/paged',
        query: { page: 0, size: 50, sort: 'courtName', textSearch },
      },
      asSystem(username),
    )) as unknown as Promise<CourtDtoPage>
  }

  async findCourtById(courtCode: string, username: string): Promise<CourtDto> {
    return (await this.get(
      {
        path: `/courts/id/${courtCode}`,
      },
      asSystem(username),
    )) as unknown as Promise<CourtDto>
  }

  async findCourtsByIds(courtIds: string[], username: string): Promise<CourtDto[]> {
    return (await this.get(
      {
        path: `/courts/id/multiple`,
        query: { courtIds },
      },
      asSystem(username),
    )) as unknown as Promise<CourtDto[]>
  }
}
