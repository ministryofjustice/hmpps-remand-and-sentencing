import { RestClient, asUser } from '@ministryofjustice/hmpps-rest-client'
import type { AuthenticationClient } from '@ministryofjustice/hmpps-auth-clients'
import config from '../config'
import logger from '../../logger'

export interface Component {
  html: string
  css: string[]
  javascript: string[]
}

export type AvailableComponent = 'header' | 'footer'

export default class FeComponentsClient extends RestClient {
  constructor(authenticationClient: AuthenticationClient) {
    super('HMPPS Components Client', config.apis.frontendComponents, logger, authenticationClient)
  }

  getComponents<T extends AvailableComponent[]>(
    components: T,
    userToken: string,
  ): Promise<Record<T[number], Component>> {
    return this.get(
      {
        path: `/components`,
        query: `component=${components.join('&component=')}`,
        headers: { 'x-user-token': userToken },
      },
      asUser(userToken),
    ) as Promise<Record<T[number], Component>>
  }
}
