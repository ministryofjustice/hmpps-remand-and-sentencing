import { SuperAgentRequest } from 'superagent'
import { stubFor } from './wiremock'

export default {
  stubOverallSentenceLengthFail: (): SuperAgentRequest =>
    stubFor({
      request: {
        method: 'POST',
        urlPattern: '/calculate-release-dates-api/overall-sentence-length',
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: {
          custodialLength: {
            years: 10,
          },
          custodialLengthMatches: false,
        },
      },
    }),
  stubOverallSentenceLengthPass: (): SuperAgentRequest =>
    stubFor({
      request: {
        method: 'POST',
        urlPattern: '/calculate-release-dates-api/overall-sentence-length',
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: {
          custodialLength: {
            years: 4,
            months: 5,
          },
          custodialLengthMatches: true,
        },
      },
    }),

  stubCalculateReleaseDatesPing: (httpStatus = 200): SuperAgentRequest =>
    stubFor({
      request: {
        method: 'GET',
        urlPattern: '/calculate-release-dates-api/health/ping',
      },
      response: {
        status: httpStatus,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: { status: httpStatus === 200 ? 'UP' : 'DOWN' },
      },
    }),
}
