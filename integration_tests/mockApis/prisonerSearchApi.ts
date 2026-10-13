import { SuperAgentRequest } from 'superagent'
import { stubFor } from './wiremock'

export default {
  stubGetPrisonerDetails: (): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'GET',
        urlPattern: '/prisoner-search-api/prisoner/A1234AB',
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: {
          prisonerNumber: 'A1234AB',
          bookingId: '1234',
          firstName: 'Cormac',
          lastName: 'Meza',
          dateOfBirth: '1965-02-03',
          prisonId: 'MDI',
          status: 'REMAND',
          prisonName: 'HMP Bedford',
          cellLocation: 'CELL-1',
          pncNumber: '1231/XX/121',
          imprisonmentStatusDescription: 'Sentenced with a sentence c',
        },
      },
    })
  },

  stubGetPrisonerDetailsByNumber: (prisonerNumber: string): SuperAgentRequest =>
    stubFor({
      request: {
        method: 'GET',
        urlPattern: `/prisoner-search-api/prisoner/${prisonerNumber}`,
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: {
          prisonerNumber,
          bookingId: '1234',
          firstName: 'Another',
          lastName: 'Prisoner',
          dateOfBirth: '1970-01-01',
          prisonId: 'MDI',
          status: 'REMAND',
          prisonName: 'HMP Bedford',
          cellLocation: 'CELL-2',
          pncNumber: '1231/XX/122',
          imprisonmentStatusDescription: 'Remand',
        },
      },
    }),

  stubNotFoundPrisonerDetails: (): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'GET',
        urlPattern: '/prisoner-search-api/prisoner/A1234AB',
      },
      response: {
        status: 404,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: {
          status: 404,
          developerMessage: 'A1234AB not found',
        },
      },
    })
  },

  stubPrisonerSearchPing: (httpStatus = 200): SuperAgentRequest =>
    stubFor({
      request: {
        method: 'GET',
        urlPattern: '/prisoner-search-api/health/ping',
      },
      response: {
        status: httpStatus,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: { status: httpStatus === 200 ? 'UP' : 'DOWN' },
      },
    }),
}
