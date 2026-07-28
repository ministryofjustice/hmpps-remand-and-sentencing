import { SuperAgentRequest } from 'superagent'
import { stubFor } from './wiremock'

export default {
  stubGetCourtHearing: (): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'GET',
        urlPath: '/court-data-ingestion-api/court-hearings/abf395c2-8e3c-419c-bd9c-71d544e5d811',
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: {
          hearingId: 'abf395c2-8e3c-419c-bd9c-71d544e5d811',
          courtName: 'Liverpool Crown Court',
          courtId: '9b583616-049b-30f9-a14f-028a53b7cfe8',
          courtCode: 'LVRPCC',
          hearingDate: '2026-06-23T12:30:00',
          caseReferences: ['28DI3664010'],
          hearingType: 'Trial',
          documents: [
            {
              documentType: 'PRISON_COURT_REGISTER',
              documentId: '6a856d25-4a2b-4d57-acb7-7346b6210a24',
              ingestionAt: '2026-06-23T12:44:22.488095',
            },
          ],
        },
      },
    })
  },
  stubCourtDataIngestionApiPing: (httpStatus = 200): SuperAgentRequest =>
    stubFor({
      request: {
        method: 'GET',
        urlPattern: '/court-data-ingestion-api/health/ping',
      },
      response: {
        status: httpStatus,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: { status: httpStatus === 200 ? 'UP' : 'DOWN' },
      },
    }),
}
