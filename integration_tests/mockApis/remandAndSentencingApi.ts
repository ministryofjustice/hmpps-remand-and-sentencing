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
        urlPattern: '/remand-and-sentencing-api/court-case',
        bodyPatterns: [
          {
            equalToJson:
              // eslint-disable-next-line no-template-curly-in-string
              '{"prisonerId": "A1234AB", "appearances": [{"outcome": "Remand in Custody (Bail Refused)", "courtCode": "Bradford Crown Court", "courtCaseReference": "1234", "appearanceDate": "2023-05-12", "nextCourtAppearance": {"appearanceDate": "2023-10-18", "courtCode": "Bradford Crown Court", "appearanceType": "Court appearance"}, "charges": [{"offenceCode": "PS90037", "offenceStartDate": "2023-05-12", "outcome": "Remand in Custody (Bail Refused)"}], "warrantType": "REMAND", "WarrantId":"${json-unit.any-string}"}]}',
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

  stubCreateSentenceCourtCase: (): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'POST',
        urlPattern: '/remand-and-sentencing-api/court-case',
        bodyPatterns: [
          {
            equalToJson:
              // eslint-disable-next-line no-template-curly-in-string
              '{"prisonerId": "A1234AB", "appearances": [{"outcome": "Sentencing outcome 1", "courtCode": "Bradford Crown Court", "courtCaseReference": "1234", "appearanceDate": "2023-05-12", "warrantType": "SENTENCING", "warrantId": "${json-unit.any-string}", "taggedBail": 5, "nextCourtAppearance": {"appearanceDate": "2023-10-18", "courtCode": "Bradford Crown Court", "appearanceType": "Court appearance"}, "charges": [{ "offenceCode": "PS90037", "offenceStartDate": "2023-05-12", "outcome": "Sentencing outcome 1" }]}]}',
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

  stubSearchCourtCases: ({ sortBy = 'desc' }: { sortBy: string }): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'GET',
        urlPath: '/remand-and-sentencing-api/court-case/search',
        queryParameters: {
          prisonerId: {
            equalTo: 'A1234AB',
          },
          sort: {
            equalTo: `latestCourtAppearance_appearanceDate,${sortBy}`,
          },
        },
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: {
          totalPages: 0,
          totalElements: 1,
          size: 20,
          content: [
            {
              prisonerId: 'A1234AB',
              courtCaseUuid: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
              latestAppearance: {
                appearanceUuid: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
                outcome: 'Remand in Custody (Bail Refused)',
                courtCode: 'Birmingham Crown Court',
                courtCaseReference: 'C894623',
                appearanceDate: '2023-12-15',
                nextCourtAppearance: {
                  appearanceDate: '2024-12-15',
                  courtCode: 'Birmingham Crown Court',
                  appearanceType: 'Court appearance',
                },
                charges: [
                  {
                    chargeUuid: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
                    offenceCode: 'PS90037',
                    offenceStartDate: '2023-12-15',
                    outcome: 'Remand in Custody (Bail Refused)',
                  },
                ],
              },
              appearances: [
                {
                  appearanceUuid: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
                  outcome: 'Remand in Custody (Bail Refused)',
                  courtCode: 'Birmingham Crown Court',
                  courtCaseReference: 'C894623',
                  appearanceDate: '2023-12-15',
                  nextCourtAppearance: {
                    appearanceDate: '2024-12-15',
                    courtCode: 'Birmingham Crown Court',
                    appearanceType: 'Court appearance',
                  },
                  charges: [
                    {
                      chargeUuid: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
                      offenceCode: 'PS90037',
                      offenceStartDate: '2023-12-15',
                      outcome: 'Remand in Custody (Bail Refused)',
                    },
                  ],
                },
                {
                  appearanceUuid: '5b4cbea0-edd3-4bac-9485-b3e3cd46ad77',
                  outcome: 'Sentence Postponed',
                  courtCode: 'Birmingham Crown Court',
                  courtCaseReference: 'F23325',
                  appearanceDate: '2022-10-15',
                  nextCourtAppearance: {
                    appearanceDate: '2023-12-15',
                    courtCode: 'Birmingham Crown Court',
                    appearanceType: 'Court appearance',
                  },
                  charges: [
                    {
                      chargeUuid: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
                      offenceCode: 'PS90037',
                      offenceStartDate: '2023-12-15',
                      outcome: 'Remand in Custody (Bail Refused)',
                    },
                  ],
                },
              ],
            },
          ],
          number: 0,
          sort: {
            empty: true,
            sorted: true,
            unsorted: true,
          },
          numberOfElements: 0,
          pageable: {
            offset: 0,
            sort: {
              empty: true,
              sorted: true,
              unsorted: true,
            },
            pageSize: 0,
            pageNumber: 0,
            paged: true,
            unpaged: true,
          },
          last: true,
          first: true,
          empty: true,
        },
      },
    })
  },

  verifyCreateCourtCaseRequest: (): Promise<number> => {
    return verifyRequest({
      requestUrlPattern: '/remand-and-sentencing-api/court-case',
      method: 'POST',
      body: {
        prisonerId: 'A1234AB',
        appearances: [
          {
            outcome: 'Remand in Custody (Bail Refused)',
            courtCode: 'Bradford Crown Court',
            courtCaseReference: '1234',
            appearanceDate: '2023-05-12',
            warrantType: 'REMAND',
            // eslint-disable-next-line no-template-curly-in-string
            warrantId: '${json-unit.any-string}',
            nextCourtAppearance: {
              appearanceDate: '2023-10-18',
              courtCode: 'Bradford Crown Court',
              appearanceType: 'Court appearance',
            },
            charges: [
              { offenceCode: 'PS90037', offenceStartDate: '2023-05-12', outcome: 'Remand in Custody (Bail Refused)' },
            ],
          },
        ],
      },
    })
  },

  verifyCreateSentenceCourtCaseRequest: (): Promise<number> => {
    return verifyRequest({
      requestUrlPattern: '/remand-and-sentencing-api/court-case',
      method: 'POST',
      body: {
        prisonerId: 'A1234AB',
        appearances: [
          {
            outcome: 'Sentencing outcome 1',
            courtCode: 'Bradford Crown Court',
            courtCaseReference: '1234',
            appearanceDate: '2023-05-12',
            warrantType: 'SENTENCING',
            // eslint-disable-next-line no-template-curly-in-string
            warrantId: '${json-unit.any-string}',
            taggedBail: 5,
            nextCourtAppearance: {
              appearanceDate: '2023-10-18',
              courtCode: 'Bradford Crown Court',
              appearanceType: 'Court appearance',
            },
            charges: [{ offenceCode: 'PS90037', offenceStartDate: '2023-05-12', outcome: 'Sentencing outcome 1' }],
          },
        ],
      },
    })
  },
}
