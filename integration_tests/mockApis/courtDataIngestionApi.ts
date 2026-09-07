import { SuperAgentRequest } from 'superagent'
import { stubFor } from './wiremock'

export default {
  stubGetCourtHearing: (): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'GET',
        urlPath:
          '/court-data-ingestion-api/court-hearings/prisoner/A1234AB/hearing/abf395c2-8e3c-419c-bd9c-71d544e5d811',
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
          charges: [
            {
              listingNumber: 1,
              offenceLegislation:
                'Contrary to paragraph 6 of Schedule 4 to, and regulation 19(2) of, the Food Safety and Hygiene (England) Regulations 2013.',
              code: 'FS13012',
              pleaDate: '2026-09-05',
              pleaValue: 'NOT_GUILTY',
              startDate: '2026-06-06',
              endDate: null,
              title: 'Keep cooked or reheated food at temperature below 63 Celsius',
              wording: 'Keep cooked or reheated food at temperature below 63 Celsius',
              results: [
                {
                  code: 'WDRN',
                  description: 'Withdrawn\nComplaint withdrawn.',
                },
              ],
            },
            {
              listingNumber: 1,
              offenceLegislation: 'Contrary to section 178(2) and (4) of the Broadcasting Act 1990.',
              code: 'BC90005',
              pleaDate: '2026-09-05',
              pleaValue: 'NOT_GUILTY',
              startDate: '2026-06-06',
              endDate: null,
              title: 'Offer to supply a foreign satellite programme',
              wording: 'Offer to supply a foreign satellite programme',
              results: [
                {
                  code: 'RI',
                  description:
                    "Remanded in custody\nRemanded in custody until hearing on 05/09/2026 at 10:00 in Courtroom 01, Lavender Hill Magistrates' Court. Basis: Charged with a violent or sexual offence. Adjournment reason: To attend or a warrant to issue. Bail exceptions: Breach of bail. Reason for applying: Broken bail conditions.",
                },
              ],
            },
            {
              listingNumber: 1,
              offenceLegislation: 'Contrary to section 178(2) and (4) of the Broadcasting Act 1990.',
              code: 'PS90037',
              pleaDate: '2026-09-05',
              pleaValue: 'NOT_GUILTY',
              startDate: '2026-06-06',
              endDate: null,
              title: 'An offence description',
              wording: 'An offence description',
            },
          ],
          nextHearing: {
            courtName: 'South Western (lavender Hill) Magistrate',
            hmctsCourtId: 'f8254db1-1683-483e-afb3-b87fde5a0a26',
            hmppsCourtId: 'STHLMC',
            hearingDate: '2026-09-05T10:00:00',
          },
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
