import { SuperAgentRequest } from 'superagent'
import { stubFor } from './wiremock'

export default {
  stubUploadWarrant: (): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'POST',
        urlPattern:
          '/document-management-api/documents/HMCTS_WARRANT/[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$',
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: {
          foo: 'bar',
        },
      },
    })
  },

  stubDownloadFile: (): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'GET',
        urlPattern:
          '/document-management-api/documents/[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/file',
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/pdf' },
        bodyFileName: 'warrant.pdf',
      },
    })
  },
}
