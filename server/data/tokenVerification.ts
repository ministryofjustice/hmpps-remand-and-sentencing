import type { Request } from 'express'
import config from '../config'
import logger from '../../logger'
import TokenVerificationApiClient from '../api/tokenVerificationApiClient'

export type TokenVerifier = (request: Request) => Promise<boolean | void>

const tokenVerifier: TokenVerifier = async request => {
  const { user, verified } = request

  if (!config.apis.tokenVerification.enabled) {
    logger.debug('Token verification disabled, returning token is valid')
    return true
  }

  if (verified) {
    return true
  }

  logger.debug(`token request for user "${user.username}'`)

  const result = await new TokenVerificationApiClient(user.token).verifyToken()
  if (result) {
    request.verified = true
  }
  return result
}

export default tokenVerifier
