import { SuperAgentRequest } from 'superagent'
import { stubFor, verifyRequest } from './wiremock'

export default {
  stubGetPersonDetails: (): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'GET',
        urlPattern: '/remand-and-sentencing-api/person/A1234AB',
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: {
          personId: 'A1234AB',
          firstName: 'Marvin',
          lastName: 'Haggler',
          establishment: 'HMP Bedford',
          cellNumber: 'CELL-1',
          dateOfBirth: '1965-02-03',
          pncNumber: '1231/XX/121',
          status: 'REMAND',
        },
      },
    })
  },

  stubCreateCourtCase: (): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'POST',
        urlPattern: '/remand-and-sentencing-api/courtCase',
        bodyPatterns: [
          {
            equalToJson:
              '{"prisonerId": "A1234AB", "appearances": [{"outcome": "Remand in Custody (Bail Refused)", "courtCode": "Bradford Crown Court", "courtCaseReference": "1234", "appearanceDate": "2023-05-12", "nextCourtAppearance": {"appearanceDate": "2023-10-18", "courtCode": "Bradford Crown Court", "appearanceType": "Court appearance"}, "charges": [{"offenceCode": "CC12345", "offenceStartDate": "2023-05-12", "outcome": "Remand in Custody (Bail Refused)"}]}]}',
          },
        ],
      },
      response: {
        status: 201,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: {
          courtCaseUuid: 'c455ab5b-fb49-4ac3-bf44-57b7f9b73019',
        },
      },
    })
  },

  verifyCreateCourtCaseRequest: (): Promise<number> => {
    return verifyRequest({
      requestUrlPattern: '/remand-and-sentencing-api/courtCase',
      method: 'POST',
      body: {
        prisonerId: 'A1234AB',
        appearances: [
          {
            outcome: 'Remand in Custody (Bail Refused)',
            courtCode: 'Bradford Crown Court',
            courtCaseReference: '1234',
            appearanceDate: '2023-05-12',
            nextCourtAppearance: {
              appearanceDate: '2023-10-18',
              courtCode: 'Bradford Crown Court',
              appearanceType: 'Court appearance',
            },
            charges: [
              { offenceCode: 'CC12345', offenceStartDate: '2023-05-12', outcome: 'Remand in Custody (Bail Refused)' },
            ],
          },
        ],
      },
    })
  },
}
