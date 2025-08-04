/* eslint-disable import/first */
/*
 * Do appinsights first as it does some magic instrumentation work, i.e. it affects other 'require's
 * In particular, applicationinsights automatically collects bunyan logs
 */
import { AuthenticationClient, InMemoryTokenStore, RedisTokenStore } from '@ministryofjustice/hmpps-auth-clients'
import { initialiseAppInsights, buildAppInsightsClient } from '../utils/azureAppInsights'
import applicationInfoSupplier from '../applicationInfo'

const applicationInfo = applicationInfoSupplier()
initialiseAppInsights()
buildAppInsightsClient(applicationInfo)

import { createRedisClient } from './redisClient'
import config from '../config'
import FeComponentsClient from './feComponentsClient'
import HmppsAuditClient from './hmppsAuditClient'
import logger from '../../logger'
import ExampleApiClient from './exampleApiClient'
import CalculateReleaseDatesApiClient from './calculateReleaseDatesApiClient'

export const dataAccess = () => {
  const hmppsAuthClient = new AuthenticationClient(
    config.apis.hmppsAuth,
    logger,
    config.redis.enabled ? new RedisTokenStore(createRedisClient()) : new InMemoryTokenStore(),
  )

  return {
    applicationInfo,
    hmppsAuthClient,
    hmppsAuditClient: new HmppsAuditClient(config.sqs.audit),
    feComponentsClient: new FeComponentsClient(),
    calculateReleaseDatesApiClient: new CalculateReleaseDatesApiClient(hmppsAuthClient),
  }
}

export type DataAccess = ReturnType<typeof dataAccess>

export { AuthenticationClient, HmppsAuditClient, ExampleApiClient }
