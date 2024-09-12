import { SuperAgentRequest } from 'superagent'
import { stubFor, verifyRequest } from './wiremock'

export default {
  stubCreateCourtCase: (): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'POST',
        urlPattern: '/remand-and-sentencing-api/court-case',
        bodyPatterns: [
          {
            equalToJson:
              // eslint-disable-next-line no-template-curly-in-string
              '{"prisonerId": "A1234AB", "appearances": [{"outcome": "Remanded in custody", "courtCode": "ACCRYC", "courtCaseReference": "T12345678", "appearanceDate": "2023-05-12", "taggedBail": 5, "nextCourtAppearance": {"appearanceDate": "2023-10-18", "courtCode": "ACCRYC", "appearanceType": "Court appearance"}, "charges": [{"offenceCode": "PS90037", "offenceStartDate": "2023-05-12", "outcome": "Remanded in custody", "terrorRelated": true}], "warrantType": "REMAND"}]}',
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
              '{"prisonerId": "A1234AB", "appearances": [{"outcome": "Imprisonment", "courtCode": "ACCRYC", "courtCaseReference": "T12345678", "appearanceDate": "2023-05-12", "charges": [{"offenceCode": "PS90037", "offenceStartDate": "2023-05-12", "outcome": "Imprisonment", "terrorRelated": true, "sentence": {"chargeNumber": "1", "custodialPeriodLength": {"months": 5, "years": 4, "periodOrder": "years,months"}, "sentenceServeType": "FORTHWITH", "sentenceType": "SDS (Standard Determinate Sentence)", "convictionDate": "2023-05-12"}}], "warrantType": "SENTENCING", "taggedBail": 5, "overallSentenceLength": {"months": 5, "years": 4, "periodOrder": "years,months"}}]}',
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
                appearanceUuid: 'a6400fd8-aef4-4567-b18c-d1f452651933',
                outcome: 'Remand in Custody (Bail Refused)',
                courtCode: 'ACCRYC',
                courtCaseReference: 'C894623',
                appearanceDate: '2023-12-15',
                nextCourtAppearance: {
                  appearanceDate: '2024-12-15',
                  courtCode: 'Birmingham Crown Court',
                  appearanceType: 'Court appearance',
                },
                charges: [
                  {
                    chargeUuid: '71bb9f7e-971c-4c34-9a33-43478baee74f',
                    offenceCode: 'PS90037',
                    offenceStartDate: '2023-12-15',
                    outcome: 'Remand in Custody (Bail Refused)',
                  },
                ],
              },
              appearances: [
                {
                  appearanceUuid: 'a6400fd8-aef4-4567-b18c-d1f452651933',
                  outcome: 'Remand in Custody (Bail Refused)',
                  courtCode: 'ACCRYC',
                  courtCaseReference: 'C894623',
                  appearanceDate: '2023-12-15',
                  nextCourtAppearance: {
                    appearanceDate: '2024-12-15',
                    courtCode: 'Birmingham Crown Court',
                    appearanceType: 'Court appearance',
                  },
                  charges: [
                    {
                      chargeUuid: '71bb9f7e-971c-4c34-9a33-43478baee74f',
                      offenceCode: 'PS90037',
                      offenceStartDate: '2023-12-15',
                      outcome: 'Remand in Custody (Bail Refused)',
                    },
                  ],
                },
                {
                  appearanceUuid: '5b4cbea0-edd3-4bac-9485-b3e3cd46ad77',
                  outcome: 'Sentence Postponed',
                  courtCode: 'ACCRYC',
                  courtCaseReference: 'F23325',
                  appearanceDate: '2022-10-15',
                  nextCourtAppearance: {
                    appearanceDate: '2023-12-15',
                    courtCode: 'Birmingham Crown Court',
                    appearanceType: 'Court appearance',
                  },
                  charges: [
                    {
                      chargeUuid: '9056c1f3-b090-4d1e-bc6e-4f66ebed2ed5',
                      offenceCode: 'PS90037',
                      offenceStartDate: '2023-12-15',
                      outcome: 'Remand in Custody (Bail Refused)',
                    },
                  ],
                },
              ],
            },
            {
              prisonerId: 'A1234AB',
              courtCaseUuid: 'd316d5b7-022f-40e5-98ab-aebe8ac4abf4',
              appearances: [],
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

  stubGetLatestCourtAppearance: (): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'GET',
        urlPattern: '/remand-and-sentencing-api/court-case/3fa85f64-5717-4562-b3fc-2c963f66afa6/latest-appearance',
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: {
          appearanceUuid: 'a6400fd8-aef4-4567-b18c-d1f452651933',
          outcome: 'Remand in Custody (Bail Refused)',
          courtCode: 'ACCRYC',
          courtCaseReference: 'C894623',
          appearanceDate: '2023-12-15',
          nextCourtAppearance: {
            appearanceDate: '2024-12-15',
            courtCode: 'ACCRYC',
            appearanceType: 'Court appearance',
          },
          charges: [
            {
              chargeUuid: '71bb9f7e-971c-4c34-9a33-43478baee74f',
              offenceCode: 'PS90037',
              offenceStartDate: '2023-12-15',
              outcome: 'Remand in Custody (Bail Refused)',
            },
          ],
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
            outcome: 'Remanded in custody',
            courtCode: 'ACCRYC',
            courtCaseReference: 'T12345678',
            appearanceDate: '2023-05-12',
            warrantType: 'REMAND',
            taggedBail: 5,
            nextCourtAppearance: {
              appearanceDate: '2023-10-18',
              courtCode: 'ACCRYC',
              appearanceType: 'Court appearance',
            },
            charges: [
              {
                offenceCode: 'PS90037',
                offenceStartDate: '2023-05-12',
                outcome: 'Remanded in custody',
                terrorRelated: true,
              },
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
            outcome: 'Imprisonment',
            courtCode: 'ACCRYC',
            courtCaseReference: 'T12345678',
            appearanceDate: '2023-05-12',
            charges: [
              {
                offenceCode: 'PS90037',
                offenceStartDate: '2023-05-12',
                outcome: 'Imprisonment',
                terrorRelated: true,
                sentence: {
                  chargeNumber: '1',
                  custodialPeriodLength: {
                    months: 5,
                    years: 4,
                    periodOrder: 'years,months',
                  },
                  sentenceServeType: 'FORTHWITH',
                  sentenceType: 'SDS (Standard Determinate Sentence)',
                  convictionDate: '2023-05-12',
                },
              },
            ],
            warrantType: 'SENTENCING',
            taggedBail: 5,
            overallSentenceLength: {
              months: 5,
              years: 4,
              periodOrder: 'years,months',
            },
          },
        ],
      },
    })
  },

  stubCreateCourtAppearance: (): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'POST',
        urlPattern: '/remand-and-sentencing-api/court-appearance',
        bodyPatterns: [
          {
            equalToJson:
              // eslint-disable-next-line no-template-curly-in-string
              '{"courtCaseUuid": "3fa85f64-5717-4562-b3fc-2c963f66afa6", "outcome": "Remanded in custody", "courtCode": "ACCRYC", "courtCaseReference": "C894623", "appearanceDate": "2023-05-12", "charges": [{"offenceCode": "PS90037", "offenceStartDate": "2023-12-15", "outcome": "Remand in Custody (Bail Refused)", "chargeUuid": "71bb9f7e-971c-4c34-9a33-43478baee74f" }, { "offenceCode": "PS90037", "offenceStartDate": "2023-05-12", "outcome": "Remanded in custody", "terrorRelated": true}], "warrantType": "REMAND", "taggedBail": 5, "nextCourtAppearance": {"appearanceDate": "2023-10-18", "courtCode": "ACCRYC", "appearanceType": "Court appearance"}}',
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

  verifyCreateCourtAppearanceRequest: (): Promise<number> => {
    return verifyRequest({
      requestUrlPattern: '/remand-and-sentencing-api/court-appearance',
      method: 'POST',
      body: {
        courtCaseUuid: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
        outcome: 'Remanded in custody',
        courtCode: 'ACCRYC',
        courtCaseReference: 'C894623',
        appearanceDate: '2023-05-12',
        charges: [
          {
            offenceCode: 'PS90037',
            offenceStartDate: '2023-12-15',
            outcome: 'Remand in Custody (Bail Refused)',
            chargeUuid: '71bb9f7e-971c-4c34-9a33-43478baee74f',
          },
          {
            offenceCode: 'PS90037',
            offenceStartDate: '2023-05-12',
            outcome: 'Remanded in custody',
            terrorRelated: true,
          },
        ],
        warrantType: 'REMAND',
        taggedBail: 5,
        nextCourtAppearance: {
          appearanceDate: '2023-10-18',
          courtCode: 'ACCRYC',
          appearanceType: 'Court appearance',
        },
      },
    })
  },

  stubCreateSentenceCourtAppearance: (): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'POST',
        urlPattern: '/remand-and-sentencing-api/court-appearance',
        bodyPatterns: [
          {
            equalToJson:
              // eslint-disable-next-line no-template-curly-in-string
              '{"courtCaseUuid": "3fa85f64-5717-4562-b3fc-2c963f66afa6", "outcome": "Imprisonment", "courtCode": "ACCRYC", "courtCaseReference": "C894623", "appearanceDate": "2023-05-12", "charges": [{"offenceCode": "PS90037", "offenceStartDate": "2023-12-15", "outcome": "Remand in Custody (Bail Refused)", "chargeUuid": "71bb9f7e-971c-4c34-9a33-43478baee74f" }, { "offenceCode": "PS90037", "offenceStartDate": "2023-05-12", "outcome": "Imprisonment", "terrorRelated": true, "sentence": {"chargeNumber": "1", "custodialPeriodLength": {"months": 5, "years": 4, "periodOrder": "years,months"}, "sentenceServeType": "FORTHWITH", "sentenceType": "SDS (Standard Determinate Sentence)", "convictionDate": "2023-05-12"}}], "warrantType": "SENTENCING", "taggedBail": 5, "overallSentenceLength": {"months": 5, "years": 4, "periodOrder": "years,months"}}',
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

  verifyCreateSentenceCourtAppearanceRequest: (): Promise<number> => {
    return verifyRequest({
      requestUrlPattern: '/remand-and-sentencing-api/court-appearance',
      method: 'POST',
      body: {
        courtCaseUuid: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
        outcome: 'Imprisonment',
        courtCode: 'ACCRYC',
        courtCaseReference: 'C894623',
        appearanceDate: '2023-05-12',
        charges: [
          {
            offenceCode: 'PS90037',
            offenceStartDate: '2023-12-15',
            outcome: 'Remand in Custody (Bail Refused)',
            chargeUuid: '71bb9f7e-971c-4c34-9a33-43478baee74f',
          },
          {
            offenceCode: 'PS90037',
            offenceStartDate: '2023-05-12',
            outcome: 'Imprisonment',
            terrorRelated: true,
            sentence: {
              chargeNumber: '1',
              custodialPeriodLength: {
                months: 5,
                years: 4,
                periodOrder: 'years,months',
              },
              sentenceServeType: 'FORTHWITH',
              sentenceType: 'SDS (Standard Determinate Sentence)',
              convictionDate: '2023-05-12',
            },
          },
        ],
        warrantType: 'SENTENCING',
        taggedBail: 5,
        overallSentenceLength: {
          months: 5,
          years: 4,
          periodOrder: 'years,months',
        },
      },
    })
  },

  stubGetRemandAppearanceDetails: (): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'GET',
        urlPattern: '/remand-and-sentencing-api/court-appearance/3fa85f64-5717-4562-b3fc-2c963f66afa6',
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: {
          appearanceUuid: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
          outcome: 'Remand in Custody (Bail Refused)',
          warrantType: 'REMAND',
          courtCode: 'STHHPM',
          courtCaseReference: 'C894623',
          appearanceDate: '2023-12-15',
          nextCourtAppearance: {
            appearanceDate: '2024-12-15',
            appearanceTime: null,
            courtCode: 'Birmingham Crown Court',
            appearanceType: 'Court appearance',
          },
          charges: [
            {
              chargeUuid: '71bb9f7e-971c-4c34-9a33-43478baee74f',
              offenceCode: 'PS90037',
              offenceStartDate: '2023-12-15',
              outcome: 'Remand in Custody (Bail Refused)',
            },
          ],
        },
      },
    })
  },

  stubGetSentenceAppearanceDetails: (): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'GET',
        urlPattern: '/remand-and-sentencing-api/court-appearance/3fa85f64-5717-4562-b3fc-2c963f66afa6',
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: {
          appearanceUuid: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
          outcome: 'Imprisonment',
          warrantType: 'SENTENCING',
          courtCode: 'STHHPM',
          courtCaseReference: 'C894623',
          appearanceDate: '2023-12-15',
          overallConvictionDate: '2024-09-12',
          charges: [
            {
              chargeUuid: '71bb9f7e-971c-4c34-9a33-43478baee74f',
              offenceCode: 'PS90037',
              offenceStartDate: '2023-12-15',
              outcome: 'Imprisonment',
              sentence: {
                sentenceUuid: '3a0a10d5-1ba0-403b-86d6-8cc75ee88454',
                chargeNumber: '1',
                custodialPeriodLength: {
                  years: 4,
                  periodOrder: 'years',
                },
                sentenceServeType: 'FORTHWITH',
                sentenceType: 'SDS (Standard Determinate Sentence)',
              },
            },
          ],
          overallSentenceLength: {
            years: 4,
            months: null,
            weeks: null,
            days: null,
            periodOrder: 'years',
          },
        },
      },
    })
  },

  stubUpdateCourtAppearance: (): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'PUT',
        urlPattern: '/remand-and-sentencing-api/court-appearance/3fa85f64-5717-4562-b3fc-2c963f66afa6',
        bodyPatterns: [
          {
            equalToJson:
              // eslint-disable-next-line no-template-curly-in-string
              '{"courtCaseUuid": "83517113-5c14-4628-9133-1e3cb12e31fa", "appearanceUuid": "3fa85f64-5717-4562-b3fc-2c963f66afa6", "outcome": "Remand in Custody (Bail Refused)", "warrantType": "REMAND", "courtCode": "STHHPM", "courtCaseReference": "T12345678", "appearanceDate": "2023-12-15", "nextCourtAppearance": {"appearanceDate": "2024-12-15", "courtCode": "Birmingham Crown Court", "appearanceType": "Court appearance"}, "charges": [{"chargeUuid": "71bb9f7e-971c-4c34-9a33-43478baee74f", "offenceCode": "PS90037", "offenceStartDate": "2023-12-15", "outcome": "Remand in Custody (Bail Refused)"}]}',
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

  verifyUpdateCourtAppearanceRequest: (): Promise<number> => {
    return verifyRequest({
      requestUrlPattern: '/remand-and-sentencing-api/court-appearance/3fa85f64-5717-4562-b3fc-2c963f66afa6',
      method: 'PUT',
      body: {
        courtCaseUuid: '83517113-5c14-4628-9133-1e3cb12e31fa',
        appearanceUuid: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
        outcome: 'Remand in Custody (Bail Refused)',
        warrantType: 'REMAND',
        courtCode: 'STHHPM',
        courtCaseReference: 'T12345678',
        appearanceDate: '2023-12-15',
        nextCourtAppearance: {
          appearanceDate: '2024-12-15',
          courtCode: 'Birmingham Crown Court',
          appearanceType: 'Court appearance',
        },
        charges: [
          {
            chargeUuid: '71bb9f7e-971c-4c34-9a33-43478baee74f',
            offenceCode: 'PS90037',
            offenceStartDate: '2023-12-15',
            outcome: 'Remand in Custody (Bail Refused)',
          },
        ],
      },
    })
  },

  stubGetCourtCaseRemandLatest: (): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'GET',
        urlPath: '/remand-and-sentencing-api/court-case/3fa85f64-5717-4562-b3fc-2c963f66afa6',
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: {
          prisonerId: 'A1234AB',
          courtCaseUuid: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
          latestAppearance: {
            appearanceUuid: 'a6400fd8-aef4-4567-b18c-d1f452651933',
            outcome: 'Remand in Custody (Bail Refused)',
            courtCode: 'ACCRYC',
            courtCaseReference: 'C894623',
            appearanceDate: '2023-12-15',
            nextCourtAppearance: {
              appearanceDate: '2024-12-15',
              courtCode: 'ACCRYC',
              appearanceType: 'Court appearance',
            },
            charges: [
              {
                chargeUuid: '71bb9f7e-971c-4c34-9a33-43478baee74f',
                offenceCode: 'PS90037',
                offenceStartDate: '2023-12-15',
                outcome: 'Remand in Custody (Bail Refused)',
              },
            ],
          },
          appearances: [
            {
              appearanceUuid: 'a6400fd8-aef4-4567-b18c-d1f452651933',
              outcome: 'Remand in Custody (Bail Refused)',
              courtCode: 'ACCRYC',
              courtCaseReference: 'C894623',
              appearanceDate: '2023-12-15',
              nextCourtAppearance: {
                appearanceDate: '2024-12-15',
                courtCode: 'ACCRYC',
                appearanceType: 'Court appearance',
              },
              charges: [
                {
                  chargeUuid: '71bb9f7e-971c-4c34-9a33-43478baee74f',
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
                  chargeUuid: '9056c1f3-b090-4d1e-bc6e-4f66ebed2ed5',
                  offenceCode: 'PS90037',
                  offenceStartDate: '2023-12-15',
                  outcome: 'Remand in Custody (Bail Refused)',
                },
              ],
            },
          ],
        },
      },
    })
  },

  stubGetCourtCaseSentenceLatest: (): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'GET',
        urlPath: '/remand-and-sentencing-api/court-case/3fa85f64-5717-4562-b3fc-2c963f66afa6',
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: {
          prisonerId: 'A1234AB',
          courtCaseUuid: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
          latestAppearance: {
            appearanceUuid: 'a6400fd8-aef4-4567-b18c-d1f452651933',
            outcome: 'Imprisonment',
            courtCode: 'ACCRYC',
            courtCaseReference: 'C894623',
            warrantType: 'SENTENCING',
            appearanceDate: '2023-12-15',
            taggedBail: 5,
            overallSentenceLength: {
              months: 5,
              years: 4,
              periodOrder: 'years,months',
            },
            charges: [
              {
                chargeUuid: '71bb9f7e-971c-4c34-9a33-43478baee74f',
                offenceCode: 'PS90037',
                offenceStartDate: '2023-12-15',
                outcome: 'Imprisonment',
                sentence: {
                  chargeNumber: '1',
                  custodialPeriodLength: {
                    months: 5,
                    years: 4,
                    periodOrder: 'years,months',
                  },
                  sentenceServeType: 'FORTHWITH',
                  sentenceType: 'SDS (Standard Determinate Sentence)',
                },
              },
            ],
          },
          appearances: [
            {
              appearanceUuid: 'a6400fd8-aef4-4567-b18c-d1f452651933',
              outcome: 'Imprisonment',
              courtCode: 'ACCRYC',
              courtCaseReference: 'C894623',
              appearanceDate: '2023-12-15',
              overallSentenceLength: {
                months: 5,
                years: 4,
                periodOrder: 'years,months',
              },
              charges: [
                {
                  chargeUuid: '71bb9f7e-971c-4c34-9a33-43478baee74f',
                  offenceCode: 'PS90037',
                  offenceStartDate: '2023-12-15',
                  outcome: 'Imprisonment',
                  sentence: {
                    chargeNumber: '1',
                    custodialPeriodLength: {
                      months: 5,
                      years: 4,
                      periodOrder: 'years,months',
                    },
                    sentenceServeType: 'FORTHWITH',
                    sentenceType: 'SDS (Standard Determinate Sentence)',
                  },
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
                  chargeUuid: '9056c1f3-b090-4d1e-bc6e-4f66ebed2ed5',
                  offenceCode: 'PS90037',
                  offenceStartDate: '2023-12-15',
                  outcome: 'Remand in Custody (Bail Refused)',
                },
              ],
            },
          ],
        },
      },
    })
  },
}
