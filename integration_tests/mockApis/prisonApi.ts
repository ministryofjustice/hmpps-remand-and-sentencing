import { SuperAgentRequest } from 'superagent'
import { stubFor } from './wiremock'

export default {
  stubGetPrisonerImage: (): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'GET',
        urlPattern: '/prison-api/api/bookings/offenderNo/A1234AB/image/data',
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'image/png' },
        base64Body:
          'iVBORw0KGgoAAAANSUhEUgAAAQAAAAEAAQMAAABmvDolAAAAA1BMVEW10NBjBBbqAAAAH0lEQVRoge3BAQ0AAADCoPdPbQ43oAAAAAAAAAAAvg0hAAABmmDh1QAAAABJRU5ErkJggg==',
      },
    })
  },

  stubGetUserCaseload: (): SuperAgentRequest =>
    stubFor({
      request: {
        method: 'GET',
        urlPattern: '/prison-api/api/users/me/caseLoads',
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: [
          {
            caseLoadId: 'MDI',
          },
          {
            caseLoadId: 'OUT',
          },
        ],
      },
    }),

  stubGetBookingById: (): SuperAgentRequest =>
    stubFor({
      request: {
        method: 'GET',
        urlPath: '/prison-api/api/bookings/1234',
        queryParameters: {
          basicInfo: {
            equalTo: 'true',
          },
        },
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: {
          offenderNo: 'A1234AB',
          bookingId: 1234,
          bookingNo: '12345A',
          offenderId: 1,
          rootOffenderId: 1,
          firstName: 'CORMAC',
          lastName: 'MEZA',
          dateOfBirth: '1965-02-03',
          activeFlag: true,
          agencyId: 'MDI',
          assignedLivingUnitId: 1,
        },
      },
    }),

  stubPrisonApiPing: (httpStatus = 200): SuperAgentRequest =>
    stubFor({
      request: {
        method: 'GET',
        urlPattern: '/prison-api/health/ping',
      },
      response: {
        status: httpStatus,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: { status: httpStatus === 200 ? 'UP' : 'DOWN' },
      },
    }),
}
