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
              '{"prisonerId": "A1234AB", "appearances": [{"outcomeUuid": "6da892fa-d85e-44de-95d4-a7f06c3a2dcb", "courtCode": "ACCRYC", "courtCaseReference": "T12345678", "appearanceDate": "2023-05-12", "nextCourtAppearance": {"appearanceDate": "2023-10-18", "courtCode": "ACCRYC", "appearanceType": "Court appearance"}, "charges": [{"offenceCode": "PS90037", "offenceStartDate": "2023-05-12", "outcomeUuid": "85ffc6bf-6a2c-4f2b-8db8-5b466b602537", "terrorRelated": true}], "warrantType": "REMAND"}]}',
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
              '{"prisonerId": "A1234AB", "appearances": [{"outcomeUuid": "4b2a225e-5bb1-4bf7-8719-6ff9f3ee0d10", "courtCode": "ACCRYC", "courtCaseReference": "T12345678", "appearanceDate": "2023-05-12", "charges": [{"offenceCode": "PS90037", "offenceStartDate": "2023-05-12", "outcomeUuid": "63920fee-e43a-45ff-a92d-4679f1af2527", "terrorRelated": true, "sentence": {"chargeNumber": "1", "periodLengths":[{"months": 5, "years": 4, "periodOrder": "years,months", "type": "SENTENCE_LENGTH"}], "sentenceServeType": "FORTHWITH", "sentenceTypeId": "467e2fa8-fce1-41a4-8110-b378c727eed3", "convictionDate": "2023-05-12"}}], "warrantType": "SENTENCING", "taggedBail": 5, "overallSentenceLength": {"months": 5, "years": 4, "periodOrder": "years,months", "type": "OVERALL_SENTENCE_LENGTH"}, "overallConvictionDate" : "2023-05-12"}]}',
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
                outcome: {
                  outcomeUuid: '6da892fa-d85e-44de-95d4-a7f06c3a2dcb',
                  outcomeName: 'Remanded in custody',
                  nomisCode: '3452',
                  outcomeType: 'REMAND',
                  displayOrder: 10,
                },
                courtCode: 'ACCRYC',
                status: 'ACTIVE',
                courtCaseReference: 'C894623',
                appearanceDate: '2023-12-15',
                nextCourtAppearance: {
                  appearanceDate: '2024-12-15',
                  appearanceTime: '10:30:00.000000000',
                  courtCode: 'Birmingham Crown Court',
                  appearanceType: 'Court appearance',
                },
                charges: [
                  {
                    chargeUuid: '71bb9f7e-971c-4c34-9a33-43478baee74f',
                    offenceCode: 'PS90037',
                    offenceStartDate: '2023-12-15',
                    outcome: {
                      outcomeUuid: '85ffc6bf-6a2c-4f2b-8db8-5b466b602537',
                      outcomeName: 'Remanded in custody',
                      nomisCode: '3452',
                      outcomeType: 'REMAND',
                      displayOrder: 10,
                      isSubList: false,
                    },
                  },
                ],
              },
              appearances: [
                {
                  appearanceUuid: 'a6400fd8-aef4-4567-b18c-d1f452651933',
                  outcome: {
                    outcomeUuid: '6da892fa-d85e-44de-95d4-a7f06c3a2dcb',
                    outcomeName: 'Remanded in custody',
                    nomisCode: '3452',
                    outcomeType: 'REMAND',
                    displayOrder: 10,
                  },
                  courtCode: 'ACCRYC',
                  courtCaseReference: 'C894623',
                  appearanceDate: '2023-12-15',
                  nextCourtAppearance: {
                    appearanceDate: '2024-12-15',
                    appearanceTime: '10:30:00.000000000',
                    courtCode: 'Birmingham Crown Court',
                    appearanceType: 'Court appearance',
                  },
                  charges: [
                    {
                      chargeUuid: '71bb9f7e-971c-4c34-9a33-43478baee74f',
                      offenceCode: 'PS90037',
                      offenceStartDate: '2023-12-15',
                      outcome: {
                        outcomeUuid: '85ffc6bf-6a2c-4f2b-8db8-5b466b602537',
                        outcomeName: 'Remanded in custody',
                        nomisCode: '3452',
                        outcomeType: 'REMAND',
                        displayOrder: 10,
                        isSubList: false,
                      },
                    },
                  ],
                },
                {
                  appearanceUuid: '5b4cbea0-edd3-4bac-9485-b3e3cd46ad77',
                  outcome: {
                    outcomeUuid: '7fd9efee-200e-4579-a766-e6bf9a499096',
                    outcomeName: 'Lie on file',
                    nomisCode: '7863',
                    outcomeType: 'REMAND',
                    displayOrder: 20,
                  },
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
                      outcome: {
                        outcomeUuid: '66032e17-977a-40f9-b634-1bc2b45e874d',
                        outcomeName: 'Lie on file',
                        nomisCode: '7863',
                        outcomeType: 'REMAND',
                        displayOrder: 20,
                        isSubList: true,
                      },
                    },
                  ],
                },
              ],
            },
            {
              prisonerId: 'A1234AB',
              courtCaseUuid: 'd316d5b7-022f-40e5-98ab-aebe8ac4abf4',
              appearances: [],
              status: 'INACTIVE',
            },
            {
              prisonerId: 'A1234AB',
              courtCaseUuid: '84ab3dc4-7bd7-4b14-a1ae-6434f7e2cc8b',
              status: 'ACTIVE',
              latestAppearance: {
                appearanceUuid: 'd48ce605-8f96-4ad7-93fe-5688986599e2',
                legacyData: {
                  eventId: '1',
                  caseId: '1',
                  postedDate: '10-10-2015',
                  nomisOutcomeCode: '5789714',
                  outcomeDescription: 'A Nomis outcome',
                },
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
                    chargeUuid: 'b5fbb9be-5773-47f8-9091-dcc9c154a7d5',
                    offenceCode: 'PS90037',
                    offenceStartDate: '2023-12-15',
                    legacyData: {
                      offenderChargeId: '1',
                      bookingId: '1',
                      postedDate: '10-10-2015',
                      nomisOutcomeCode: '5789714',
                      outcomeDescription: 'A Nomis outcome',
                    },
                  },
                ],
              },
              appearances: [
                {
                  appearanceUuid: 'd48ce605-8f96-4ad7-93fe-5688986599e2',
                  legacyData: {
                    eventId: '1',
                    caseId: '1',
                    postedDate: '10-10-2015',
                    nomisOutcomeCode: '5789714',
                    outcomeDescription: 'A Nomis outcome',
                  },
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
                      chargeUuid: 'b5fbb9be-5773-47f8-9091-dcc9c154a7d5',
                      offenceCode: 'PS90037',
                      offenceStartDate: '2023-12-15',
                      legacyData: {
                        offenderChargeId: '1',
                        bookingId: '1',
                        postedDate: '10-10-2015',
                        nomisOutcomeCode: '5789714',
                        outcomeDescription: 'A Nomis outcome',
                      },
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
          outcome: {
            outcomeUuid: '6da892fa-d85e-44de-95d4-a7f06c3a2dcb',
            outcomeName: 'Remanded in custody',
            nomisCode: '3452',
            outcomeType: 'REMAND',
            displayOrder: 10,
            relatedChargeOutcomeUuid: '85ffc6bf-6a2c-4f2b-8db8-5b466b602537',
            isSubList: false,
          },
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
              outcome: {
                outcomeUuid: '85ffc6bf-6a2c-4f2b-8db8-5b466b602537',
                outcomeName: 'Remanded in custody',
                nomisCode: '3452',
                outcomeType: 'REMAND',
                displayOrder: 10,
                isSubList: false,
              },
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
            outcomeUuid: '6da892fa-d85e-44de-95d4-a7f06c3a2dcb',
            courtCode: 'ACCRYC',
            courtCaseReference: 'T12345678',
            appearanceDate: '2023-05-12',
            warrantType: 'REMAND',
            nextCourtAppearance: {
              appearanceDate: '2023-10-18',
              courtCode: 'ACCRYC',
              appearanceType: 'Court appearance',
            },
            charges: [
              {
                offenceCode: 'PS90037',
                offenceStartDate: '2023-05-12',
                outcomeUuid: '85ffc6bf-6a2c-4f2b-8db8-5b466b602537',
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
            outcomeUuid: '4b2a225e-5bb1-4bf7-8719-6ff9f3ee0d10',
            courtCode: 'ACCRYC',
            courtCaseReference: 'T12345678',
            appearanceDate: '2023-05-12',
            charges: [
              {
                offenceCode: 'PS90037',
                offenceStartDate: '2023-05-12',
                outcomeUuid: '63920fee-e43a-45ff-a92d-4679f1af2527',
                terrorRelated: true,
                sentence: {
                  chargeNumber: '1',
                  periodLengths: [
                    {
                      months: 5,
                      years: 4,
                      periodOrder: 'years,months',
                      type: 'SENTENCE_LENGTH',
                    },
                  ],
                  sentenceServeType: 'FORTHWITH',
                  sentenceTypeId: '467e2fa8-fce1-41a4-8110-b378c727eed3',
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
              type: 'OVERALL_SENTENCE_LENGTH',
            },
            overallConvictionDate: '2023-05-12',
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
              '{"courtCaseUuid": "3fa85f64-5717-4562-b3fc-2c963f66afa6", "outcomeUuid": "6da892fa-d85e-44de-95d4-a7f06c3a2dcb", "courtCode": "ACCRYC", "courtCaseReference": "C894623", "appearanceDate": "2023-05-12", "charges": [{"offenceCode": "PS90037", "offenceStartDate": "2023-12-15", "outcomeUuid": "85ffc6bf-6a2c-4f2b-8db8-5b466b602537", "chargeUuid": "71bb9f7e-971c-4c34-9a33-43478baee74f" }, { "offenceCode": "PS90037", "offenceStartDate": "2023-05-12", "outcomeUuid": "85ffc6bf-6a2c-4f2b-8db8-5b466b602537", "terrorRelated": true}], "warrantType": "REMAND", "nextCourtAppearance": {"appearanceDate": "2023-10-18", "courtCode": "ACCRYC", "appearanceType": "Court appearance"}}',
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
        outcomeUuid: '6da892fa-d85e-44de-95d4-a7f06c3a2dcb',
        courtCode: 'ACCRYC',
        courtCaseReference: 'C894623',
        appearanceDate: '2023-05-12',
        charges: [
          {
            offenceCode: 'PS90037',
            offenceStartDate: '2023-12-15',
            outcomeUuid: '85ffc6bf-6a2c-4f2b-8db8-5b466b602537',
            chargeUuid: '71bb9f7e-971c-4c34-9a33-43478baee74f',
          },
          {
            offenceCode: 'PS90037',
            offenceStartDate: '2023-05-12',
            outcomeUuid: '85ffc6bf-6a2c-4f2b-8db8-5b466b602537',
            terrorRelated: true,
          },
        ],
        warrantType: 'REMAND',
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
              '{"courtCaseUuid": "3fa85f64-5717-4562-b3fc-2c963f66afa6", "outcomeUuid": "4b2a225e-5bb1-4bf7-8719-6ff9f3ee0d10", "courtCode": "ACCRYC", "courtCaseReference": "C894623", "appearanceDate": "2023-05-12", "charges": [{"offenceCode": "PS90037", "offenceStartDate": "2023-12-15", "outcomeUuid": "85ffc6bf-6a2c-4f2b-8db8-5b466b602537", "chargeUuid": "71bb9f7e-971c-4c34-9a33-43478baee74f" }, { "offenceCode": "PS90037", "offenceStartDate": "2023-05-12", "outcomeUuid": "63920fee-e43a-45ff-a92d-4679f1af2527", "terrorRelated": true, "sentence": {"chargeNumber": "1", "periodLengths": [{"months": 5, "years": 4, "periodOrder": "years,months", "type":"SENTENCE_LENGTH" }], "sentenceServeType": "FORTHWITH", "sentenceTypeId": "467e2fa8-fce1-41a4-8110-b378c727eed3", "convictionDate": "2023-05-12"}}], "warrantType": "SENTENCING", "taggedBail": 5, "overallSentenceLength": {"months": 5, "years": 4, "periodOrder": "years,months", "type":"OVERALL_SENTENCE_LENGTH" }, "overallConvictionDate" : "2023-05-12"}',
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
        outcomeUuid: '4b2a225e-5bb1-4bf7-8719-6ff9f3ee0d10',
        courtCode: 'ACCRYC',
        courtCaseReference: 'C894623',
        appearanceDate: '2023-05-12',
        charges: [
          {
            offenceCode: 'PS90037',
            offenceStartDate: '2023-12-15',
            outcomeUuid: '85ffc6bf-6a2c-4f2b-8db8-5b466b602537',
            chargeUuid: '71bb9f7e-971c-4c34-9a33-43478baee74f',
          },
          {
            offenceCode: 'PS90037',
            offenceStartDate: '2023-05-12',
            outcomeUuid: '63920fee-e43a-45ff-a92d-4679f1af2527',
            terrorRelated: true,
            sentence: {
              chargeNumber: '1',
              periodLengths: [
                {
                  months: 5,
                  years: 4,
                  periodOrder: 'years,months',
                  type: 'SENTENCE_LENGTH',
                },
              ],
              sentenceServeType: 'FORTHWITH',
              sentenceTypeId: '467e2fa8-fce1-41a4-8110-b378c727eed3',
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
          type: 'OVERALL_SENTENCE_LENGTH',
        },
        overallConvictionDate: '2023-05-12',
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
          outcome: {
            outcomeUuid: '6da892fa-d85e-44de-95d4-a7f06c3a2dcb',
            outcomeName: 'Remanded in custody',
            nomisCode: '3452',
            outcomeType: 'REMAND',
            displayOrder: 10,
            relatedChargeOutcomeUuid: '85ffc6bf-6a2c-4f2b-8db8-5b466b602537',
            isSubList: false,
          },
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
              outcome: {
                outcomeUuid: '85ffc6bf-6a2c-4f2b-8db8-5b466b602537',
                outcomeName: 'Remanded in custody',
                nomisCode: '3452',
                outcomeType: 'REMAND',
                displayOrder: 10,
                isSubList: false,
              },
            },
          ],
        },
      },
    })
  },

  stubGetLegacyAppearanceDetails: (): SuperAgentRequest => {
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
          legacyData: {
            eventId: '1',
            caseId: '1',
            postedDate: '10-10-2015',
            nomisOutcomeCode: 'NOMISCODE',
            outcomeDescription: 'A Nomis description',
          },
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
              legacyData: {
                offenderChargeId: '1',
                bookingId: '1',
                postedDate: '10-10-2015',
                nomisOutcomeCode: 'NOMISCODE',
                outcomeDescription: 'A Nomis description',
              },
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
          outcome: {
            outcomeUuid: '4b2a225e-5bb1-4bf7-8719-6ff9f3ee0d10',
            outcomeName: 'Imprisonment',
            nomisCode: '09753',
            outcomeType: 'SENTENCING',
            displayOrder: 10,
            relatedChargeOutcomeUuid: '85ffc6bf-6a2c-4f2b-8db8-5b466b602537',
            isSubList: false,
          },
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
              outcome: {
                outcomeUuid: '85ffc6bf-6a2c-4f2b-8db8-5b466b602537',
                outcomeName: 'Imprisonment',
                nomisCode: '09753',
                outcomeType: 'SENTENCING',
                displayOrder: 10,
                isSubList: false,
              },
              sentence: {
                sentenceUuid: '3a0a10d5-1ba0-403b-86d6-8cc75ee88454',
                chargeNumber: '1',
                periodLengths: [
                  {
                    years: 4,
                    periodOrder: 'years',
                    periodLengthType: 'SENTENCE_LENGTH',
                  },
                ],
                sentenceServeType: 'FORTHWITH',
                sentenceType: {
                  sentenceTypeUuid: '467e2fa8-fce1-41a4-8110-b378c727eed3',
                  description: 'SDS (Standard Determinate Sentence)',
                  classification: 'STANDARD',
                },
              },
            },
          ],
          overallSentenceLength: {
            years: 4,
            months: null,
            weeks: null,
            days: null,
            periodOrder: 'years',
            periodLengthType: 'OVERALL_SENTENCE_LENGTH',
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
              '{"courtCaseUuid": "83517113-5c14-4628-9133-1e3cb12e31fa", "appearanceUuid": "3fa85f64-5717-4562-b3fc-2c963f66afa6", "outcomeUuid": "6da892fa-d85e-44de-95d4-a7f06c3a2dcb", "warrantType": "REMAND", "courtCode": "STHHPM", "courtCaseReference": "T12345678", "appearanceDate": "2023-12-15", "nextCourtAppearance": {"appearanceDate": "2024-12-15", "courtCode": "Birmingham Crown Court", "appearanceType": "Court appearance"}, "charges": [{"chargeUuid": "71bb9f7e-971c-4c34-9a33-43478baee74f", "offenceCode": "PS90037", "offenceStartDate": "2023-12-15", "outcomeUuid": "85ffc6bf-6a2c-4f2b-8db8-5b466b602537"}]}',
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
        outcomeUuid: '6da892fa-d85e-44de-95d4-a7f06c3a2dcb',
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
            outcomeUuid: '85ffc6bf-6a2c-4f2b-8db8-5b466b602537',
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
            outcome: {
              outcomeUuid: '6da892fa-d85e-44de-95d4-a7f06c3a2dcb',
              outcomeName: 'Remanded in custody',
              nomisCode: '3452',
              outcomeType: 'REMAND',
              displayOrder: 10,
            },
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
                outcome: {
                  outcomeUuid: '85ffc6bf-6a2c-4f2b-8db8-5b466b602537',
                  outcomeName: 'Remanded in custody',
                  nomisCode: '3452',
                  outcomeType: 'REMAND',
                  displayOrder: 10,
                  isSubList: false,
                },
              },
            ],
          },
          appearances: [
            {
              appearanceUuid: 'a6400fd8-aef4-4567-b18c-d1f452651933',
              outcome: {
                outcomeUuid: '6da892fa-d85e-44de-95d4-a7f06c3a2dcb',
                outcomeName: 'Remanded in custody',
                nomisCode: '3452',
                outcomeType: 'REMAND',
                displayOrder: 10,
              },
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
                  outcome: {
                    outcomeUuid: '85ffc6bf-6a2c-4f2b-8db8-5b466b602537',
                    outcomeName: 'Remanded in custody',
                    nomisCode: '3452',
                    outcomeType: 'REMAND',
                    displayOrder: 10,
                    isSubList: false,
                  },
                },
              ],
            },
            {
              appearanceUuid: '5b4cbea0-edd3-4bac-9485-b3e3cd46ad77',
              outcome: {
                outcomeUuid: '7fd9efee-200e-4579-a766-e6bf9a499096',
                outcomeName: 'Lie on file',
                nomisCode: '7863',
                outcomeType: 'REMAND',
                displayOrder: 20,
              },
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
                  legacyData: {
                    offenderChargeId: '1',
                    bookingId: '1',
                    postedDate: '1-1-2010',
                    nomisOutcomeCode: '678324',
                    outcomeDescription: 'A Nomis Outcome',
                  },
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
            outcome: {
              outcomeUuid: '4b2a225e-5bb1-4bf7-8719-6ff9f3ee0d10',
              outcomeName: 'Imprisonment',
              nomisCode: '09753',
              outcomeType: 'SENTENCING',
              displayOrder: 10,
            },
            courtCode: 'ACCRYC',
            courtCaseReference: 'C894623',
            warrantType: 'SENTENCING',
            appearanceDate: '2023-12-15',
            taggedBail: 5,
            overallSentenceLength: {
              months: 5,
              years: 4,
              periodOrder: 'years,months',
              periodLengthType: 'OVERALL_SENTENCE_LENGTH',
            },
            charges: [
              {
                chargeUuid: '71bb9f7e-971c-4c34-9a33-43478baee74f',
                offenceCode: 'PS90037',
                offenceStartDate: '2023-12-15',
                outcome: 'Imprisonment',
                sentence: {
                  chargeNumber: '1',
                  periodLengths: [
                    {
                      months: 5,
                      years: 4,
                      periodOrder: 'years,months',
                      periodLengthType: 'SENTENCE_LENGTH',
                    },
                  ],
                  sentenceServeType: 'FORTHWITH',
                  sentenceType: {
                    sentenceTypeUuid: '467e2fa8-fce1-41a4-8110-b378c727eed3',
                    description: 'SDS (Standard Determinate Sentence)',
                    classification: 'STANDARD',
                  },
                },
              },
            ],
          },
          appearances: [
            {
              appearanceUuid: 'a6400fd8-aef4-4567-b18c-d1f452651933',
              outcome: {
                outcomeUuid: '4b2a225e-5bb1-4bf7-8719-6ff9f3ee0d10',
                outcomeName: 'Imprisonment',
                nomisCode: '09753',
                outcomeType: 'SENTENCING',
                displayOrder: 10,
              },
              courtCode: 'ACCRYC',
              courtCaseReference: 'C894623',
              appearanceDate: '2023-12-15',
              overallSentenceLength: {
                months: 5,
                years: 4,
                periodOrder: 'years,months',
                periodLengthType: 'OVERALL_SENTENCE_LENGTH',
              },
              charges: [
                {
                  chargeUuid: '71bb9f7e-971c-4c34-9a33-43478baee74f',
                  offenceCode: 'PS90037',
                  offenceStartDate: '2023-12-15',
                  outcome: 'Imprisonment',
                  sentence: {
                    chargeNumber: '1',
                    periodLengths: [
                      {
                        months: 5,
                        years: 4,
                        periodOrder: 'years,months',
                        periodLengthType: 'SENTENCE_LENGTH',
                      },
                    ],
                    sentenceServeType: 'FORTHWITH',
                    sentenceType: {
                      sentenceTypeUuid: '467e2fa8-fce1-41a4-8110-b378c727eed3',
                      description: 'SDS (Standard Determinate Sentence)',
                      classification: 'STANDARD',
                    },
                  },
                },
              ],
            },
            {
              appearanceUuid: '5b4cbea0-edd3-4bac-9485-b3e3cd46ad77',
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
              legacyData: {
                eventId: '1',
                caseId: '1',
                postedDate: '10-10-2015',
                nomisOutcomeCode: '3567',
                outcomeDescription: 'A Nomis Outcome',
              },
            },
          ],
        },
      },
    })
  },
  stubSearchSentenceTypes: (): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'GET',
        urlPath: '/remand-and-sentencing-api/sentence-type/search',
        queryParameters: {
          age: {
            equalTo: '58',
          },
          convictionDate: {
            equalTo: '2023-05-12',
          },
        },
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: [
          {
            sentenceTypeUuid: '467e2fa8-fce1-41a4-8110-b378c727eed3',
            description: 'SDS (Standard Determinate Sentence)',
            classification: 'STANDARD',
          },
          {
            sentenceTypeUuid: 'bc929dc9-019c-4acc-8fd9-9f9682ebbd72',
            description: 'EDS (Extended Determinate Sentence)',
            classification: 'EXTENDED',
          },
        ],
      },
    })
  },
  stubGetSentenceTypeById: ({
    sentenceTypeUuid = '467e2fa8-fce1-41a4-8110-b378c727eed3',
    description = 'SDS (Standard Determinate Sentence)',
  }: {
    sentenceTypeUuid: string
    description: string
  }): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'GET',
        urlPath: `/remand-and-sentencing-api/sentence-type/${sentenceTypeUuid}`,
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: {
          sentenceTypeUuid,
          description,
          classification: 'STANDARD',
        },
      },
    })
  },
  stubGetSentenceTypesByIds: (): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'GET',
        urlPath: '/remand-and-sentencing-api/sentence-type/uuid/multiple',
        queryParameters: {
          uuids: {
            equalTo: '467e2fa8-fce1-41a4-8110-b378c727eed3',
          },
        },
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: [
          {
            sentenceTypeUuid: '467e2fa8-fce1-41a4-8110-b378c727eed3',
            description: 'SDS (Standard Determinate Sentence)',
            classification: 'STANDARD',
          },
        ],
      },
    })
  },

  stubGetAllAppearanceOutcomes: (): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'GET',
        urlPath: '/remand-and-sentencing-api/appearance-outcome/all',
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: [
          {
            outcomeUuid: '6da892fa-d85e-44de-95d4-a7f06c3a2dcb',
            outcomeName: 'Remanded in custody',
            nomisCode: '3452',
            outcomeType: 'REMAND',
            displayOrder: 10,
            relatedChargeOutcomeUuid: '85ffc6bf-6a2c-4f2b-8db8-5b466b602537',
            isSubList: false,
          },
          {
            outcomeUuid: '6da892fa-d85e-44de-95d4-a7f06c3a2dcc',
            outcomeName: 'Another option',
            nomisCode: '3454',
            outcomeType: 'REMAND',
            displayOrder: 10,
            relatedChargeOutcomeUuid: '85ffc6bf-6a2c-4f2b-8db8-5b466b602537',
            isSubList: false,
          },
          {
            outcomeUuid: '7fd9efee-200e-4579-a766-e6bf9a499096',
            outcomeName: 'Lie on file',
            nomisCode: '7863',
            outcomeType: 'REMAND',
            displayOrder: 20,
            relatedChargeOutcomeUuid: '66032e17-977a-40f9-b634-1bc2b45e874d',
            isSubList: true,
          },
          {
            outcomeUuid: '4b2a225e-5bb1-4bf7-8719-6ff9f3ee0d10',
            outcomeName: 'Imprisonment',
            nomisCode: '09753',
            outcomeType: 'SENTENCING',
            displayOrder: 10,
            relatedChargeOutcomeUuid: '63920fee-e43a-45ff-a92d-4679f1af2527',
            isSubList: false,
          },
          {
            outcomeUuid: '4b2a225e-5bb1-4bf7-8719-6ff9f3ee0d11',
            outcomeName: 'Another option',
            nomisCode: '09753',
            outcomeType: 'SENTENCING',
            displayOrder: 10,
            relatedChargeOutcomeUuid: '63920fee-e43a-45ff-a92d-4679f1af2527',
            isSubList: false,
          },
        ],
      },
    })
  },
  stubGetAllAppearanceOutcomesWithSingleResults: (): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'GET',
        urlPath: '/remand-and-sentencing-api/appearance-outcome/all',
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: [
          {
            outcomeUuid: '6da892fa-d85e-44de-95d4-a7f06c3a2dcb',
            outcomeName: 'Remanded in custody',
            nomisCode: '3452',
            outcomeType: 'REMAND',
            displayOrder: 10,
            relatedChargeOutcomeUuid: '85ffc6bf-6a2c-4f2b-8db8-5b466b602537',
            isSubList: false,
          },
          {
            outcomeUuid: '7fd9efee-200e-4579-a766-e6bf9a499096',
            outcomeName: 'Lie on file',
            nomisCode: '7863',
            outcomeType: 'REMAND',
            displayOrder: 20,
            relatedChargeOutcomeUuid: '66032e17-977a-40f9-b634-1bc2b45e874d',
            isSubList: true,
          },
          {
            outcomeUuid: '4b2a225e-5bb1-4bf7-8719-6ff9f3ee0d10',
            outcomeName: 'Imprisonment',
            nomisCode: '09753',
            outcomeType: 'SENTENCING',
            displayOrder: 10,
            relatedChargeOutcomeUuid: '63920fee-e43a-45ff-a92d-4679f1af2527',
            isSubList: false,
          },
        ],
      },
    })
  },

  stubGetAppearanceOutcomeById: ({
    outcomeUuid = '6da892fa-d85e-44de-95d4-a7f06c3a2dcb',
    outcomeName = 'Remanded in custody',
    outcomeType = 'REMAND',
  }: {
    outcomeUuid: string
    outcomeName: string
    outcomeType: string
  }): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'GET',
        urlPath: `/remand-and-sentencing-api/appearance-outcome/${outcomeUuid}`,
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: {
          outcomeUuid,
          outcomeName,
          nomisCode: '3452',
          outcomeType,
          displayOrder: 10,
          relatedChargeOutcomeUuid: '85ffc6bf-6a2c-4f2b-8db8-5b466b602537',
          isSubList: false,
        },
      },
    })
  },

  stubGetAllChargeOutcomes: (): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'GET',
        urlPath: '/remand-and-sentencing-api/charge-outcome/all',
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: [
          {
            outcomeUuid: '85ffc6bf-6a2c-4f2b-8db8-5b466b602537',
            outcomeName: 'Remanded in custody',
            nomisCode: '3452',
            outcomeType: 'REMAND',
            displayOrder: 10,
            isSubList: false,
          },
          {
            outcomeUuid: '66032e17-977a-40f9-b634-1bc2b45e874d',
            outcomeName: 'Lie on file',
            nomisCode: '7863',
            outcomeType: 'REMAND',
            displayOrder: 20,
            isSubList: true,
          },
          {
            outcomeUuid: '63920fee-e43a-45ff-a92d-4679f1af2527',
            outcomeName: 'Imprisonment',
            nomisCode: '09753',
            outcomeType: 'SENTENCING',
            displayOrder: 10,
            isSubList: false,
          },
        ],
      },
    })
  },

  stubGetChargeOutcomeById: ({
    outcomeUuid = '85ffc6bf-6a2c-4f2b-8db8-5b466b602537',
    outcomeName = 'Remanded in custody',
    outcomeType = 'REMAND',
  }: {
    outcomeUuid: string
    outcomeName: string
    outcomeType: string
  }): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'GET',
        urlPath: `/remand-and-sentencing-api/charge-outcome/${outcomeUuid}`,
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: {
          outcomeUuid,
          outcomeName,
          nomisCode: '3452',
          outcomeType,
          displayOrder: 10,
          isSubList: false,
        },
      },
    })
  },
  stubGetChargeOutcomesByIds: (
    outcomes: [
      {
        outcomeUuid: string
        outcomeName: string
        outcomeType: string
      },
    ],
  ): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'GET',
        urlPath: '/remand-and-sentencing-api/charge-outcome/uuid/multiple',
        queryParameters: {
          uuids: {
            equalTo: outcomes.map(outcome => outcome.outcomeUuid).join(','),
          },
        },
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: outcomes.map(outcome => {
          return {
            nomisCode: '09753',
            displayOrder: 10,
            isSubList: false,
            ...outcome,
          }
        }),
      },
    })
  },
}
