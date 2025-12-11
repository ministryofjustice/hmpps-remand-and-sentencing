import { RestClient, asSystem } from '@ministryofjustice/hmpps-rest-client'
import type { AuthenticationClient } from '@ministryofjustice/hmpps-auth-clients'
import config from '../config'
import logger from '../../logger'
import type { Offence, Schedule } from '../@types/manageOffencesApi/manageOffencesClientTypes'

export default class ManageOffencesApiClient extends RestClient {
  constructor(authenticationClient: AuthenticationClient) {
    super('Manage Offences API', config.apis.manageOffencesApi, logger, authenticationClient)
  }

  async getOffenceByCode(code: string, username: string): Promise<Offence> {
    return (await this.get(
      { path: `/offences/code/unique/${code}` },
      asSystem(username),
    )) as unknown as Promise<Offence>
  }

  async searchOffence(searchString: string, username: string): Promise<Offence[]> {
    return (await this.get(
      {
        path: `/offences/search`,
        query: { excludeLegislation: true, searchString },
      },
      asSystem(username),
    )) as unknown as Promise<Offence[]>
  }

  async getOffencesByCodes(codes: string[], username: string): Promise<Offence[]> {
    return (await this.get(
      {
        path: '/offences/code/multiple',
        query: { offenceCodes: codes.join() },
      },
      asSystem(username),
    )) as unknown as Promise<Offence[]>
  }

  async getScheduleById(scheduleId: number, username: string): Promise<Schedule> {
    return (await this.get(
      {
        path: `/schedule/by-id/${scheduleId}`,
      },
      asSystem(username),
    )) as unknown as Promise<Schedule>
  }
}
