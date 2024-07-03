import config, { ApiConfig } from '../config'
import RestClient from '../data/restClient'
import logger from '../../logger'
import getSanitisedError from '../sanitisedError'
import { TokenDto } from '../@types/tokenVerificationApi/tokenVerificationClientTypes'

export default class TokenVerificationApiClient {
  restClient: RestClient

  constructor(token: string) {
    this.restClient = new RestClient('Token Verification API', config.apis.tokenVerification as ApiConfig, token)
  }

  async verifyToken(): Promise<boolean> {
    try {
      const response = (await this.restClient.post({ path: `/token/verify`, retry: true, data: null })) as TokenDto
      return response?.active || false
    } catch (error) {
      logger.error(getSanitisedError(error), 'Error calling tokenVerificationApi')
      return false
    }
  }
}
