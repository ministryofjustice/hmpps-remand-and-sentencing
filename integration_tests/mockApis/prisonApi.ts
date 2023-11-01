import { SuperAgentRequest } from 'superagent'
import { stubFor } from './wiremock'

export default {
  stubGetPrisonerDetails: (): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'GET',
        urlPattern: '/prison-api/api/offenders/A1234AB',
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: {
          offenderNo: 'A1234AB',
          bookingId: '1234',
          firstName: 'Marvin',
          lastName: 'Haggler',
          dateOfBirth: '1965-02-03',
          agencyId: 'MDI',
          assignedLivingUnit: {
            agencyName: 'HMP Bedford',
            description: 'CELL-1',
          },
          identifiers: [
            {
              type: 'PNC',
              value: '1231/XX/121',
              offenderNo: 'A1234AB',
              bookingId: 1231223,
              issuedAuthorityText: 'Important Auth',
              issuedDate: '2018-01-21',
              caseloadType: 'GENERAL',
              whenCreated: '2021-07-05T10:35:17',
            },
          ],
          legalStatus: 'REMAND',
        },
      },
    })
  },
}
