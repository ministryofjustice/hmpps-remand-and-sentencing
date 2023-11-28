import RestClient from '../data/restClient'
import config, { ApiConfig } from '../config'

export default class DocumentManagementApiClient {
  restClient: RestClient

  constructor(token: string) {
    this.restClient = new RestClient('Document Management API', config.apis.documentManagementApi as ApiConfig, token)
  }
}
