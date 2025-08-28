import { SuperAgentRequest } from 'superagent'
import { stubFor, verifyRequest } from './wiremock'

export default {
  stubCreateCourtCase: ({ nextHearingDate = '' }: { nextHearingDate: string }): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'PUT',
        urlPattern:
          '/remand-and-sentencing-api/court-case/([a-f0-9]{8}-?[a-f0-9]{4}-?4[a-f0-9]{3}-?[89ab][a-f0-9]{3}-?[a-f0-9]{12})',
        bodyPatterns: [
          {
            equalToJson: `{"prisonerId": "A1234AB", "prisonId": "MDI", "appearances": [{"courtCaseUuid": "\${json-unit.any-string}", "appearanceUuid": "\${json-unit.any-string}", "outcomeUuid": "6da892fa-d85e-44de-95d4-a7f06c3a2dcb", "courtCode": "ACCRYC", "courtCaseReference": "T12345678", "appearanceDate": "2023-05-13", "prisonId": "MDI", "nextCourtAppearance": {"appearanceDate": "${nextHearingDate}", "courtCode": "ACCRYC", "appearanceTypeUuid": "63e8fce0-033c-46ad-9edf-391b802d547a", "prisonId": "MDI"}, "charges": [{"chargeUuid": "\${json-unit.any-string}", "offenceCode": "PS90037", "offenceStartDate": "2023-05-10", "outcomeUuid": "85ffc6bf-6a2c-4f2b-8db8-5b466b602537", "prisonId": "MDI"}], "warrantType": "REMAND"}]}`,
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

  stubCreateDraftCourtCaseForRemand: (): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'POST',
        urlPattern: '/remand-and-sentencing-api/draft/court-case',
        bodyPatterns: [
          {
            equalToJson:
              '{"prisonerId": "A1234AB", "draftAppearances": [{"sessionBlob": {"offences": [], "warrantType": "REMAND", "caseReferenceNumber": "T12345678", "warrantDate": "2023-05-12", "courtCode": "ACCRYC", "appearanceOutcomeUuid": "6da892fa-d85e-44de-95d4-a7f06c3a2dcb", "relatedOffenceOutcomeUuid": "85ffc6bf-6a2c-4f2b-8db8-5b466b602537", "caseOutcomeAppliedAll": "false", "appearanceInformationAccepted": true}}]}',
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

  stubCreateDraftCourtCaseForSentencing: (): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'POST',
        urlPattern: '/remand-and-sentencing-api/draft/court-case',
        bodyPatterns: [
          {
            equalToJson:
              '{"prisonerId": "A1234AB", "draftAppearances": [{"sessionBlob": {"offences": [], "warrantType": "SENTENCING", "caseReferenceNumber": "T12345678", "warrantDate": "2023-05-12", "courtCode": "ACCRYC", "appearanceOutcomeUuid": "4b2a225e-5bb1-4bf7-8719-6ff9f3ee0d10", "relatedOffenceOutcomeUuid": "63920fee-e43a-45ff-a92d-4679f1af2527", "caseOutcomeAppliedAll": "true", "appearanceInformationAccepted": true}}]}',
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
        method: 'PUT',
        urlPattern:
          '/remand-and-sentencing-api/court-case/([a-f0-9]{8}-?[a-f0-9]{4}-?4[a-f0-9]{3}-?[89ab][a-f0-9]{3}-?[a-f0-9]{12})',
        bodyPatterns: [
          {
            equalToJson:
              // eslint-disable-next-line no-template-curly-in-string
              '{ "prisonerId" : "A1234AB", "appearances" : [ { "courtCaseUuid": "${json-unit.any-string}", "appearanceUuid": "${json-unit.any-string}", "outcomeUuid" : "62412083-9892-48c9-bf01-7864af4a8b3c", "courtCode" : "ACCRYC", "courtCaseReference" : "T12345678", "appearanceDate" : "2023-05-12", "charges" : [ { "chargeUuid": "${json-unit.any-string}", "offenceCode" : "PS90037", "offenceStartDate" : "2023-05-10", "outcomeUuid" : "f17328cf-ceaa-43c2-930a-26cf74480e18", "prisonId" : "MDI", "sentence" : { "sentenceUuid": "${json-unit.any-string}", "chargeNumber" : "1", "periodLengths" : [ { "periodLengthUuid": "${json-unit.any-string}", "days" : 4, "weeks" : 3, "months" : 2, "years" : 1, "periodOrder" : "years,months,weeks,days", "type" : "SENTENCE_LENGTH", "prisonId" : "MDI" } ], "sentenceServeType" : "FORTHWITH", "sentenceTypeId" : "467e2fa8-fce1-41a4-8110-b378c727eed3", "prisonId" : "MDI", "sentenceReference" : "0", "convictionDate" : "2023-05-12" } } ], "warrantType" : "SENTENCING", "prisonId" : "MDI", "overallSentenceLength" : { "periodLengthUuid": "${json-unit.any-string}", "days" : 2, "weeks" : 3, "months" : 5, "years" : 4, "periodOrder" : "years,months,weeks,days", "type" : "OVERALL_SENTENCE_LENGTH", "prisonId" : "MDI" }, "overallConvictionDate" : "2023-05-12" } ], "prisonId" : "MDI" }',
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

  stubSearchCourtCases: ({ sortBy = 'STATUS_APPEARANCE_DATE_DESC' }: { sortBy: string }): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'GET',
        urlPath: '/remand-and-sentencing-api/court-case/paged/search',
        queryParameters: {
          prisonerId: {
            equalTo: 'A1234AB',
          },
          pagedCourtCaseOrderBy: {
            equalTo: sortBy,
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
              courtCaseStatus: 'ACTIVE',
              appearanceCount: 2,
              caseReferences: ['C894623', 'F23325', 'J39596'],
              firstDayInCustody: '2022-10-15',
              latestCourtAppearance: {
                caseReference: 'C894623',
                courtCode: 'ACCRYC',
                warrantDate: '2023-12-15',
                warrantType: 'REMAND',
                outcome: 'Remanded in custody',
                nextCourtAppearance: {
                  appearanceDate: '2024-12-15',
                  appearanceTime: '10:30:00.000000000',
                  courtCode: 'BCC',
                  appearanceTypeDescription: 'Court appearance',
                },
                charges: [
                  {
                    offenceCode: 'PS90037',
                    offenceStartDate: '2023-12-15',
                    outcome: {
                      outcomeUuid: '85ffc6bf-6a2c-4f2b-8db8-5b466b602537',
                      outcomeName: 'Remanded in custody',
                    },
                  },
                  {
                    offenceCode: 'PS11111',
                    outcome: {
                      outcomeUuid: '92e69bb5-9769-478b-9ee6-77c91808d9af',
                      outcomeName: 'Commit to Crown Court for trial in custody',
                    },
                    legacyData: {
                      offenceDescription: 'A legacy offence description',
                    },
                  },
                ],
              },
              legacyData: {
                caseReferences: [
                  {
                    offenderCaseReference: 'C894623',
                    updatedDate: '2023-12-15T10:15:30',
                  },
                  {
                    offenderCaseReference: 'F23325',
                    updatedDate: '2022-10-15T10:15:30',
                  },
                  {
                    offenderCaseReference: 'J39596',
                    updatedDate: '2021-10-15T10:15:30',
                  },
                ],
              },
            },
            {
              prisonerId: 'A1234AB',
              courtCaseUuid: '84ab3dc4-7bd7-4b14-a1ae-6434f7e2cc8b',
              courtCaseStatus: 'INACTIVE',
              appearanceCount: 1,
              caseReferences: ['C894623'],
              firstDayInCustody: '2023-12-15',
              latestCourtAppearance: {
                caseReference: 'C894623',
                courtCode: 'ACCRYC',
                warrantDate: '2023-12-15',
                warrantType: 'REMAND',
                outcome: 'A Nomis outcome',
                legacyData: {
                  postedDate: '10-10-2015',
                  nomisOutcomeCode: '5789714',
                  outcomeDescription: 'A Nomis outcome',
                  outcomeDispositionCode: 'I',
                  outcomeConvictionFlag: false,
                },
                nextCourtAppearance: {
                  appearanceDate: '2024-12-15',
                  courtCode: 'Birmingham Crown Court',
                  appearanceTypeDescription: 'Court appearance',
                },
                charges: [
                  {
                    offenceCode: 'PS90037',
                    offenceStartDate: '2023-12-15',
                    legacyData: {
                      postedDate: '10-10-2015',
                      nomisOutcomeCode: '5789714',
                      outcomeDescription: 'A Nomis outcome',
                      outcomeDispositionCode: 'I',
                      outcomeConvictionFlag: false,
                    },
                  },
                ],
              },
            },
            {
              prisonerId: 'A1234AB',
              courtCaseUuid: '261911e2-6346-42e0-b025-a806048f4d04',
              courtCaseStatus: 'ACTIVE',
              legacyData: {
                caseReferences: [
                  {
                    updatedDate: '2024-10-10T08:47:37Z',
                    offenderCaseReference: 'XX1234',
                  },
                  {
                    updatedDate: '2024-10-09T13:40:56Z',
                    offenderCaseReference: 'YY1234',
                  },
                ],
              },
              appearanceCount: 1,
              caseReferences: ['XX1234', 'YY1234'],
              firstDayInCustody: '2024-01-23',
              overallSentenceLength: {
                years: 1,
                months: null,
                weeks: null,
                days: null,
                order: 'years,months,weeks,days',
                type: 'OVERALL_SENTENCE_LENGTH',
              },
              mergedFromCases: null,
              latestCourtAppearance: {
                caseReference: 'XX1234',
                courtCode: 'ACCRYC',
                warrantDate: '2024-01-23',
                warrantType: 'SENTENCING',
                outcome: 'Imprisonment',
                convictionDate: '2023-10-23',
                legacyData: null,
                nextCourtAppearance: null,
                charges: [
                  {
                    offenceCode: 'PS90037',
                    offenceStartDate: '2023-10-11',
                    offenceEndDate: null,
                    outcome: {
                      outcomeUuid: 'f4617346-3b8e-467b-acc4-a4fab809ed3b',
                      outcomeName: 'Imprisonment',
                    },
                    legacyData: null,
                    sentence: {
                      sentenceUuid: '29fa8c7f-7ba1-4033-ac4d-83ff0c125a45',
                      chargeNumber: '1',
                      sentenceServeType: 'FORTHWITH',
                      consecutiveToSentenceUuid: null,
                      convictionDate: '2023-10-12',
                      sentenceType: null,
                      legacyData: {
                        sentenceCalcType: 'A',
                        sentenceCategory: 'B',
                        sentenceTypeDesc: 'A NOMIS Sentence Type',
                      },
                      fineAmount: null,
                      periodLengths: [
                        {
                          periodLengthUuid: '5f4214fe-f607-4c04-9990-e7dacc9ba26d',
                          years: 1,
                          months: null,
                          weeks: null,
                          days: null,
                          order: 'years,months,weeks,days',
                          type: 'TARIFF_LENGTH',
                          legacyData: null,
                        },
                      ],
                      hasRecall: false,
                    },
                  },
                  {
                    offenceCode: 'PS90037',
                    offenceStartDate: '2024-05-11',
                    offenceEndDate: null,
                    outcome: {
                      outcomeUuid: 'f4617346-3b8e-467b-acc4-a4fab809ed3b',
                      outcomeName: 'Imprisonment',
                    },
                    legacyData: null,
                    sentence: {
                      sentenceUuid: '7484fdbc-8e74-4590-b842-b131a004ab61',
                      chargeNumber: '2',
                      sentenceServeType: 'CONCURRENT',
                      consecutiveToSentenceUuid: null,
                      convictionDate: '2024-05-11',
                      sentenceType: null,
                      legacyData: {
                        sentenceCalcType: 'C',
                        sentenceCategory: 'D',
                        sentenceTypeDesc: 'A NOMIS Fine Sentence Type',
                      },
                      fineAmount: 10,
                      periodLengths: [
                        {
                          periodLengthUuid: '103273ac-3c40-4f93-82e0-d1680bfd12a4',
                          years: null,
                          months: 6,
                          weeks: null,
                          days: null,
                          order: 'years,months,weeks,days',
                          type: 'TERM_LENGTH',
                          legacyData: null,
                        },
                      ],
                    },
                  },
                  {
                    offenceCode: 'PS90037',
                    offenceStartDate: '2023-05-11',
                    offenceEndDate: null,
                    legacyData: null,
                    outcome: {
                      outcomeUuid: 'f4617346-3b8e-467b-acc4-a4fab809ed3b',
                      outcomeName: 'Imprisonment',
                    },
                    sentence: {
                      sentenceUuid: 'fda6e6b3-fd5d-480d-b7e6-cf6457e2826b',
                      chargeNumber: '3',
                      sentenceServeType: 'CONSECUTIVE',
                      consecutiveToSentenceUuid: '8e33074a-3240-4073-923a-b69b642e037c',
                      convictionDate: '2024-05-11',
                      sentenceType: null,
                      legacyData: {
                        sentenceCalcType: 'C',
                        sentenceCategory: 'D',
                        sentenceTypeDesc: 'A NOMIS Fine Sentence Type',
                      },
                      fineAmount: 10,
                      periodLengths: [
                        {
                          periodLengthUuid: '3599b7c7-7393-4022-b23d-5eb889b02af5',
                          years: null,
                          months: 2,
                          weeks: null,
                          days: null,
                          order: 'years,months,weeks,days',
                          type: 'TERM_LENGTH',
                          legacyData: null,
                        },
                      ],
                    },
                  },
                  {
                    offenceCode: 'PS90037',
                    offenceStartDate: '2024-01-07',
                    offenceEndDate: null,
                    outcome: {
                      outcomeUuid: 'f4617346-3b8e-467b-acc4-a4fab809ed3b',
                      outcomeName: 'Imprisonment',
                    },
                    legacyData: null,
                    sentence: {
                      sentenceUuid: 'f8fb24e0-aef2-4cab-ab39-23ba9429579d',
                      chargeNumber: '4',
                      sentenceServeType: 'CONSECUTIVE',
                      consecutiveToSentenceUuid: '29fa8c7f-7ba1-4033-ac4d-83ff0c125a45',
                      convictionDate: '2024-05-11',
                      sentenceType: null,
                      legacyData: {
                        sentenceCalcType: 'C',
                        sentenceCategory: 'D',
                        sentenceTypeDesc: 'A NOMIS Fine Sentence Type',
                      },
                      fineAmount: 10,
                      periodLengths: [
                        {
                          periodLengthUuid: '1f099408-29fb-4636-8d66-fc95b8f1540d',
                          years: null,
                          months: 3,
                          weeks: null,
                          days: null,
                          order: 'years,months,weeks,days',
                          type: 'TERM_LENGTH',
                          legacyData: null,
                        },
                      ],
                    },
                  },
                ],
              },
            },
            {
              prisonerId: 'A1234AB',
              courtCaseUuid: 'e3ef1929-98b7-4034-bfdf-5c597f51fca7',
              status: 'courtCaseStatus',
              appearanceCount: 1,
              caseReferences: ['XX1234'],
              firstDayInCustody: '2024-01-23',
              latestCourtAppearance: {
                caseReference: 'XX1234',
                courtCode: 'ACCRYC',
                warrantDate: '2024-01-23',
                warrantType: 'SENTENCING',
                outcome: 'Imprisonment',
                convictionDate: null,
                legacyData: null,
                nextCourtAppearance: null,
                charges: [
                  {
                    offenceCode: 'PS90037',
                    offenceStartDate: '2025-05-20',
                    outcome: {
                      outcomeUuid: 'f4617346-3b8e-467b-acc4-a4fab809ed3b',
                      outcomeName: 'Imprisonment',
                    },
                    legacyData: null,
                    sentence: {
                      sentenceUuid: 'f327bc1d-610f-41ee-b700-410c08a9cefa',
                      chargeNumber: '1',
                      sentenceServeType: 'FORTHWITH',
                      consecutiveToSentenceUuid: null,
                      convictionDate: '2023-10-12',
                      sentenceType: null,
                      legacyData: {
                        sentenceCalcType: 'A',
                        sentenceCategory: 'B',
                        sentenceTypeDesc: 'A NOMIS Sentence Type',
                      },
                      fineAmount: null,
                      periodLengths: [
                        {
                          periodLengthUuid: '88d80943-fb33-4e48-a694-2e4a980261d9',
                          years: 1,
                          months: null,
                          weeks: null,
                          days: null,
                          order: 'years,months,weeks,days',
                          type: 'TARIFF_LENGTH',
                          legacyData: null,
                        },
                      ],
                      hasRecall: true,
                    },
                  },
                ],
              },
            },
            {
              prisonerId: 'PRI123',
              courtCaseUuid: 'c0f90a3c-f1c5-4e2e-9360-2a9d7bd33dda',
              courtCaseStatus: 'ACTIVE',
              legacyData: {
                caseReferences: [
                  {
                    offenderCaseReference: 'NOMIS123',
                    updatedDate: '2025-06-05T07:23:16.79636',
                  },
                ],
              },
              appearanceCount: 1,
              caseReferences: ['NOMIS123'],
              firstDayInCustody: '2025-06-05',
              overallSentenceLength: null,
              latestCourtAppearance: {
                caseReference: 'NOMIS123',
                courtCode: 'ACCRYC',
                warrantDate: '2025-06-05',
                warrantType: 'REMAND',
                outcome: 'Outcome Description',
                convictionDate: null,
                legacyData: {
                  postedDate: '2025-06-05',
                  nomisOutcomeCode: '1',
                  outcomeDescription: 'Outcome Description',
                  nextEventDateTime: '2025-06-15T07:23:16.796353',
                  appearanceTime: '07:23:16',
                  outcomeDispositionCode: 'I',
                  outcomeConvictionFlag: false,
                },
                nextCourtAppearance: null,
                charges: [
                  {
                    offenceCode: 'PS90037',
                    offenceStartDate: '2025-06-05',
                    offenceEndDate: null,
                    outcome: null,
                    legacyData: {
                      postedDate: '2025-06-05',
                      nomisOutcomeCode: '1',
                      outcomeDescription: 'Outcome Description',
                      outcomeDispositionCode: 'I',
                      outcomeConvictionFlag: false,
                    },
                    sentence: null,
                    mergedFromCase: {
                      caseReference: 'NOMIS123',
                      courtCode: 'ACCRYC',
                      warrantDate: '2025-06-05',
                      mergedFromDate: '2019-06-05',
                    },
                  },
                ],
              },
              mergedFromCases: [
                {
                  caseReference: 'NOMIS123',
                  courtCode: 'ACCRYC',
                  warrantDate: '2025-06-05',
                  mergedFromDate: '2019-06-05',
                },
              ],
              mergedToCase: {
                caseReference: 'NOMIS897',
                courtCode: 'ACCRYC',
                warrantDate: '2025-06-26',
                mergedToDate: '2024-02-25',
              },
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

  stubEmptySearchCourtCases: ({ sortBy = 'STATUS_APPEARANCE_DATE_DESC' }: { sortBy: string }): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'GET',
        urlPath: '/remand-and-sentencing-api/court-case/paged/search',
        queryParameters: {
          prisonerId: {
            equalTo: 'A1234AB',
          },
          pagedCourtCaseOrderBy: {
            equalTo: sortBy,
          },
        },
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: {
          totalPages: 0,
          totalElements: 0,
          size: 0,
          content: [],
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
          last: false,
          first: false,
          empty: true,
        },
      },
    })
  },

  stubGetLatestCourtAppearance: ({
    courtCaseUuid = '3fa85f64-5717-4562-b3fc-2c963f66afa6',
  }: {
    courtCaseUuid: string
  }): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'GET',
        urlPattern: `/remand-and-sentencing-api/court-case/${courtCaseUuid}/latest-appearance`,
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: {
          appearanceUuid: 'a6400fd8-aef4-4567-b18c-d1f452651933',
          warrantType: 'REMAND',
          outcome: {
            outcomeUuid: '6da892fa-d85e-44de-95d4-a7f06c3a2dcb',
            outcomeName: 'Remanded in custody',
            nomisCode: '3452',
            outcomeType: 'REMAND',
            displayOrder: 10,
            relatedChargeOutcomeUuid: '85ffc6bf-6a2c-4f2b-8db8-5b466b602537',
          },
          courtCode: 'ACCRYC',
          courtCaseReference: 'C894623',
          appearanceDate: '2023-12-15',
          nextCourtAppearance: {
            appearanceDate: '2024-12-15',
            courtCode: 'ACCRYC',
            appearanceType: {
              appearanceTypeUuid: '63e8fce0-033c-46ad-9edf-391b802d547a',
              description: 'Court appearance',
              displayOrder: 10,
            },
          },
          charges: [
            {
              chargeUuid: '71bb9f7e-971c-4c34-9a33-43478baee74f',
              offenceCode: 'PS90037',
              offenceStartDate: '2023-05-12',
              outcome: {
                outcomeUuid: '85ffc6bf-6a2c-4f2b-8db8-5b466b602537',
                outcomeName: 'Remanded in custody',
                nomisCode: '3452',
                outcomeType: 'REMAND',
                displayOrder: 10,
                dispositionCode: 'INTERIM',
              },
            },
          ],
        },
      },
    })
  },

  stubGetLatestCourtAppearanceWithSentencing: ({
    courtCaseUuid = '3fa85f64-5717-4562-b3fc-2c963f66afa6',
  }: {
    courtCaseUuid: string
  }): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'GET',
        urlPattern: `/remand-and-sentencing-api/court-case/${courtCaseUuid}/latest-appearance`,
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: {
          appearanceUuid: 'a6400fd8-aef4-4567-b18c-d1f452651933',
          outcome: {
            outcomeUuid: '4b2a225e-5bb1-4bf7-8719-6ff9f3ee0d10',
            outcomeName: 'Imprisonment',
            nomisCode: '09753',
            outcomeType: 'SENTENCING',
            displayOrder: 10,
            relatedChargeOutcomeUuid: '85ffc6bf-6a2c-4f2b-8db8-5b466b602537',
          },
          courtCode: 'ACCRYC',
          courtCaseReference: 'C894623',
          appearanceDate: '2023-12-15',
          warrantType: 'SENTENCING',
          overallSentenceLength: {
            years: 4,
            months: 5,
            weeks: null,
            days: null,
            periodOrder: 'years,months',
            periodLengthType: 'OVERALL_SENTENCE_LENGTH',
          },
          charges: [
            {
              chargeUuid: '71bb9f7e-971c-4c34-9a33-43478baee74f',
              offenceCode: 'PS90037',
              offenceStartDate: '2023-12-15',
              outcome: {
                outcomeUuid: '4b2a225e-5bb1-4bf7-8719-6ff9f3ee0d10',
                outcomeName: 'Imprisonment',
                nomisCode: '09753',
                outcomeType: 'SENTENCING',
                displayOrder: 10,
                dispositionCode: 'FINAL',
              },
              sentence: {
                sentenceUuid: '3a0a10d5-1ba0-403b-86d6-8cc75ee88454',
                countNumber: '1',
                periodLengths: [
                  {
                    years: 4,
                    months: 5,
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
      },
    })
  },

  stubGetLatestCourtAppearanceSameNextHearingDate: ({
    warrantDate = '',
  }: {
    warrantDate: string
  }): SuperAgentRequest => {
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
          },
          courtCode: 'ACCRYC',
          courtCaseReference: 'C894623',
          appearanceDate: '2023-12-15',
          nextCourtAppearance: {
            appearanceDate: warrantDate,
            courtCode: 'WRTH',
            appearanceType: {
              appearanceTypeUuid: '63e8fce0-033c-46ad-9edf-391b802d547a',
              description: 'Court appearance',
              displayOrder: 10,
            },
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
                dispositionCode: 'INTERIM',
              },
            },
          ],
        },
      },
    })
  },

  verifyCreateCourtCaseRequest: ({ nextHearingDate = '' }: { nextHearingDate: string }): Promise<number> => {
    return verifyRequest({
      requestUrlPattern:
        '/remand-and-sentencing-api/court-case/([a-f0-9]{8}-?[a-f0-9]{4}-?4[a-f0-9]{3}-?[89ab][a-f0-9]{3}-?[a-f0-9]{12})',
      method: 'PUT',
      body: {
        prisonerId: 'A1234AB',
        prisonId: 'MDI',
        appearances: [
          {
            // eslint-disable-next-line no-template-curly-in-string
            courtCaseUuid: '${json-unit.any-string}',
            // eslint-disable-next-line no-template-curly-in-string
            appearanceUuid: '${json-unit.any-string}',
            outcomeUuid: '6da892fa-d85e-44de-95d4-a7f06c3a2dcb',
            courtCode: 'ACCRYC',
            courtCaseReference: 'T12345678',
            appearanceDate: '2023-05-13',
            warrantType: 'REMAND',
            prisonId: 'MDI',
            nextCourtAppearance: {
              appearanceDate: nextHearingDate,
              courtCode: 'ACCRYC',
              appearanceTypeUuid: '63e8fce0-033c-46ad-9edf-391b802d547a',
              prisonId: 'MDI',
            },
            charges: [
              {
                // eslint-disable-next-line no-template-curly-in-string
                chargeUuid: '${json-unit.any-string}',
                offenceCode: 'PS90037',
                offenceStartDate: '2023-05-10',
                outcomeUuid: '85ffc6bf-6a2c-4f2b-8db8-5b466b602537',
                prisonId: 'MDI',
              },
            ],
          },
        ],
      },
    })
  },

  verifyCreateSentenceCourtCaseRequest: (): Promise<number> => {
    return verifyRequest({
      requestUrlPattern:
        '/remand-and-sentencing-api/court-case/([a-f0-9]{8}-?[a-f0-9]{4}-?4[a-f0-9]{3}-?[89ab][a-f0-9]{3}-?[a-f0-9]{12})',
      method: 'PUT',
      body: {
        prisonerId: 'A1234AB',
        appearances: [
          {
            // eslint-disable-next-line no-template-curly-in-string
            courtCaseUuid: '${json-unit.any-string}',
            // eslint-disable-next-line no-template-curly-in-string
            appearanceUuid: '${json-unit.any-string}',
            outcomeUuid: '62412083-9892-48c9-bf01-7864af4a8b3c',
            courtCode: 'ACCRYC',
            courtCaseReference: 'T12345678',
            appearanceDate: '2023-05-12',
            charges: [
              {
                // eslint-disable-next-line no-template-curly-in-string
                chargeUuid: '${json-unit.any-string}',
                offenceCode: 'PS90037',
                offenceStartDate: '2023-05-10',
                outcomeUuid: 'f17328cf-ceaa-43c2-930a-26cf74480e18',
                prisonId: 'MDI',
                sentence: {
                  // eslint-disable-next-line no-template-curly-in-string
                  sentenceUuid: '${json-unit.any-string}',
                  chargeNumber: '1',
                  periodLengths: [
                    {
                      // eslint-disable-next-line no-template-curly-in-string
                      periodLengthUuid: '${json-unit.any-string}',
                      days: 4,
                      weeks: 3,
                      months: 2,
                      years: 1,
                      periodOrder: 'years,months,weeks,days',
                      type: 'SENTENCE_LENGTH',
                      prisonId: 'MDI',
                    },
                  ],
                  sentenceServeType: 'FORTHWITH',
                  sentenceTypeId: '467e2fa8-fce1-41a4-8110-b378c727eed3',
                  prisonId: 'MDI',
                  sentenceReference: '0',
                  convictionDate: '2023-05-12',
                },
              },
            ],
            warrantType: 'SENTENCING',
            prisonId: 'MDI',
            overallSentenceLength: {
              // eslint-disable-next-line no-template-curly-in-string
              periodLengthUuid: '${json-unit.any-string}',
              days: 2,
              weeks: 3,
              months: 5,
              years: 4,
              periodOrder: 'years,months,weeks,days',
              type: 'OVERALL_SENTENCE_LENGTH',
              prisonId: 'MDI',
            },
            overallConvictionDate: '2023-05-12',
          },
        ],
        prisonId: 'MDI',
      },
    })
  },

  stubCreateCourtAppearance: ({ nextHearingDate = '' }: { nextHearingDate: string }): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'PUT',
        urlPattern:
          '/remand-and-sentencing-api/court-appearance/([a-f0-9]{8}-?[a-f0-9]{4}-?4[a-f0-9]{3}-?[89ab][a-f0-9]{3}-?[a-f0-9]{12})',
        bodyPatterns: [
          {
            equalToJson: `{"courtCaseUuid": "3fa85f64-5717-4562-b3fc-2c963f66afa6", "appearanceUuid": "\${json-unit.any-string}", "outcomeUuid": "6da892fa-d85e-44de-95d4-a7f06c3a2dcb", "courtCode": "ACCRYC", "courtCaseReference": "C894623", "appearanceDate": "2023-05-13", "prisonId": "MDI", "charges": [{"offenceCode": "PS90037", "offenceStartDate": "2023-05-12", "outcomeUuid": "85ffc6bf-6a2c-4f2b-8db8-5b466b602537", "prisonId": "MDI", "chargeUuid": "71bb9f7e-971c-4c34-9a33-43478baee74f" }, { "chargeUuid": "\${json-unit.any-string}", "offenceCode": "PS90037", "offenceStartDate": "2023-05-10", "outcomeUuid": "85ffc6bf-6a2c-4f2b-8db8-5b466b602537", "prisonId": "MDI" }], "warrantType": "REMAND", "nextCourtAppearance": {"appearanceDate": "${nextHearingDate}", "courtCode": "ACCRYC", "appearanceTypeUuid": "63e8fce0-033c-46ad-9edf-391b802d547a", "prisonId": "MDI"}}`,
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

  verifyCreateCourtAppearanceRequest: ({ nextHearingDate = '' }: { nextHearingDate: string }): Promise<number> => {
    return verifyRequest({
      requestUrlPattern:
        '/remand-and-sentencing-api/court-appearance/([a-f0-9]{8}-?[a-f0-9]{4}-?4[a-f0-9]{3}-?[89ab][a-f0-9]{3}-?[a-f0-9]{12})',
      method: 'PUT',
      body: {
        courtCaseUuid: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
        // eslint-disable-next-line no-template-curly-in-string
        appearanceUuid: '${json-unit.any-string}',
        outcomeUuid: '6da892fa-d85e-44de-95d4-a7f06c3a2dcb',
        courtCode: 'ACCRYC',
        courtCaseReference: 'C894623',
        appearanceDate: '2023-05-13',
        prisonId: 'MDI',
        charges: [
          {
            offenceCode: 'PS90037',
            offenceStartDate: '2023-05-12',
            outcomeUuid: '85ffc6bf-6a2c-4f2b-8db8-5b466b602537',
            chargeUuid: '71bb9f7e-971c-4c34-9a33-43478baee74f',
            prisonId: 'MDI',
          },
          {
            // eslint-disable-next-line no-template-curly-in-string
            chargeUuid: '${json-unit.any-string}',
            offenceCode: 'PS90037',
            offenceStartDate: '2023-05-10',
            outcomeUuid: '85ffc6bf-6a2c-4f2b-8db8-5b466b602537',
            prisonId: 'MDI',
          },
        ],
        warrantType: 'REMAND',
        nextCourtAppearance: {
          appearanceDate: nextHearingDate,
          courtCode: 'ACCRYC',
          appearanceTypeUuid: '63e8fce0-033c-46ad-9edf-391b802d547a',
          prisonId: 'MDI',
        },
      },
    })
  },

  stubCreateSentenceCourtAppearance: (): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'PUT',
        urlPattern:
          '/remand-and-sentencing-api/court-appearance/([a-f0-9]{8}-?[a-f0-9]{4}-?4[a-f0-9]{3}-?[89ab][a-f0-9]{3}-?[a-f0-9]{12})',
        bodyPatterns: [
          {
            equalToJson:
              // eslint-disable-next-line no-template-curly-in-string
              '{ "courtCaseUuid" : "3fa85f64-5717-4562-b3fc-2c963f66afa6", "appearanceUuid": "${json-unit.any-string}", "outcomeUuid" : "62412083-9892-48c9-bf01-7864af4a8b3c", "courtCode" : "ACCRYC", "courtCaseReference" : "C894623", "appearanceDate" : "2023-05-13", "charges" : [ { "offenceCode" : "PS90037", "offenceStartDate" : "2023-05-12", "outcomeUuid" : "63920fee-e43a-45ff-a92d-4679f1af2527", "prisonId" : "MDI", "chargeUuid" : "71bb9f7e-971c-4c34-9a33-43478baee74f", "sentence" : { "sentenceUuid": "${json-unit.any-string}", "chargeNumber" : "1", "periodLengths" : [ { "periodLengthUuid": "${json-unit.any-string}", "months" : 5, "years" : 4, "periodOrder" : "years,months,weeks,days", "type" : "SENTENCE_LENGTH", "prisonId" : "MDI" } ], "sentenceServeType" : "FORTHWITH", "sentenceTypeId" : "467e2fa8-fce1-41a4-8110-b378c727eed3", "prisonId" : "MDI", "sentenceReference" : "71bb9f7e-971c-4c34-9a33-43478baee74f", "convictionDate" : "2023-05-12" } } ], "warrantType" : "SENTENCING", "prisonId" : "MDI", "overallSentenceLength" : { "periodLengthUuid": "${json-unit.any-string}", "months" : 5, "years" : 4, "periodOrder" : "years,months,weeks,days", "type" : "OVERALL_SENTENCE_LENGTH", "prisonId" : "MDI" }, "overallConvictionDate" : "2023-05-12" }',
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
      requestUrlPattern:
        '/remand-and-sentencing-api/court-appearance/([a-f0-9]{8}-?[a-f0-9]{4}-?4[a-f0-9]{3}-?[89ab][a-f0-9]{3}-?[a-f0-9]{12})',
      method: 'PUT',
      body: {
        courtCaseUuid: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
        // eslint-disable-next-line no-template-curly-in-string
        appearanceUuid: '${json-unit.any-string}',
        outcomeUuid: '62412083-9892-48c9-bf01-7864af4a8b3c',
        courtCode: 'ACCRYC',
        courtCaseReference: 'C894623',
        appearanceDate: '2023-05-13',
        charges: [
          {
            offenceCode: 'PS90037',
            offenceStartDate: '2023-05-12',
            outcomeUuid: '63920fee-e43a-45ff-a92d-4679f1af2527',
            prisonId: 'MDI',
            chargeUuid: '71bb9f7e-971c-4c34-9a33-43478baee74f',
            sentence: {
              // eslint-disable-next-line no-template-curly-in-string
              sentenceUuid: '${json-unit.any-string}',
              chargeNumber: '1',
              periodLengths: [
                {
                  // eslint-disable-next-line no-template-curly-in-string
                  periodLengthUuid: '${json-unit.any-string}',
                  months: 5,
                  years: 4,
                  periodOrder: 'years,months,weeks,days',
                  type: 'SENTENCE_LENGTH',
                  prisonId: 'MDI',
                },
              ],
              sentenceServeType: 'FORTHWITH',
              sentenceTypeId: '467e2fa8-fce1-41a4-8110-b378c727eed3',
              prisonId: 'MDI',
              sentenceReference: '71bb9f7e-971c-4c34-9a33-43478baee74f',
              convictionDate: '2023-05-12',
            },
          },
        ],
        warrantType: 'SENTENCING',
        prisonId: 'MDI',
        overallSentenceLength: {
          // eslint-disable-next-line no-template-curly-in-string
          periodLengthUuid: '${json-unit.any-string}',
          months: 5,
          years: 4,
          periodOrder: 'years,months,weeks,days',
          type: 'OVERALL_SENTENCE_LENGTH',
          prisonId: 'MDI',
        },
        overallConvictionDate: '2023-05-12',
      },
    })
  },

  stubGetRemandAppearanceDetails: (appearanceUuid = '3fa85f64-5717-4562-b3fc-2c963f66afa6'): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'GET',
        urlPattern: `/remand-and-sentencing-api/court-appearance/${appearanceUuid}`,
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: {
          appearanceUuid,
          outcome: {
            outcomeUuid: '6da892fa-d85e-44de-95d4-a7f06c3a2dcb',
            outcomeName: 'Remanded in custody',
            nomisCode: '3452',
            outcomeType: 'REMAND',
            displayOrder: 10,
            relatedChargeOutcomeUuid: '85ffc6bf-6a2c-4f2b-8db8-5b466b602537',
          },
          warrantType: 'REMAND',
          courtCode: 'STHHPM',
          courtCaseReference: 'C894623',
          appearanceDate: '2023-12-15',
          nextCourtAppearance: {
            appearanceDate: '2024-12-15',
            appearanceTime: null,
            courtCode: 'STHHPM',
            appearanceType: {
              appearanceTypeUuid: '63e8fce0-033c-46ad-9edf-391b802d547a',
              description: 'Court appearance',
              displayOrder: 10,
            },
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
                dispositionCode: 'INTERIM',
              },
              mergedFromCase: {
                caseReference: 'C894623',
                courtCode: 'STHHPM',
                warrantDate: '2023-12-15',
                mergedFromDate: '2023-12-15',
              },
            },
          ],
        },
      },
    })
  },
  stubGetRemandNomisAppearanceDetails: (): SuperAgentRequest => {
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
          },
          warrantType: 'REMAND',
          courtCode: 'STHHPM',
          courtCaseReference: 'C894623',
          appearanceDate: '2023-12-15',
          charges: [
            {
              chargeUuid: '71bb9f7e-971c-4c34-9a33-43478baee74f',
              offenceCode: 'PS90037',
              offenceStartDate: null,
              outcome: {
                outcomeUuid: '85ffc6bf-6a2c-4f2b-8db8-5b466b602537',
                outcomeName: 'Remanded in custody',
                nomisCode: '3452',
                outcomeType: 'REMAND',
                displayOrder: 10,
                dispositionCode: 'INTERIM',
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
            appearanceType: {
              appearanceTypeUuid: '63e8fce0-033c-46ad-9edf-391b802d547a',
              description: 'Court appearance',
              displayOrder: 10,
            },
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
                outcomeDispositionCode: 'I',
              },
            },
            {
              chargeUuid: '9b622879-8191-4a7f-9fe8-71b680417220',
              offenceCode: 'PS90037',
              outcome: {
                outcomeUuid: '85ffc6bf-6a2c-4f2b-8db8-5b466b602537',
                outcomeName: 'Remanded in custody',
                nomisCode: '3452',
                outcomeType: 'REMAND',
                displayOrder: 10,
                dispositionCode: 'I',
              },
            },
          ],
        },
      },
    })
  },

  stubGetLegacySentenceAppearanceDetails: (): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'GET',
        urlPattern: '/remand-and-sentencing-api/court-appearance/3f20856f-fa17-493b-89c7-205970c749b8',
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: {
          appearanceUuid: '3f20856f-fa17-493b-89c7-205970c749b8',
          legacyData: {
            eventId: '1',
            caseId: '1',
            postedDate: '10-10-2015',
            nomisOutcomeCode: 'NOMISCODE',
            outcomeDescription: 'A Nomis description',
            outcomeDispositionCode: 'F',
            outcomeConvictionFlag: true,
          },
          warrantType: 'SENTENCING',
          courtCode: 'STHHPM',
          courtCaseReference: 'BB7937',
          appearanceDate: '2025-01-27',
          nextCourtAppearance: null,
          charges: [
            {
              chargeUuid: 'b2565181-6066-4b55-b4a7-32c2ddf8c36d',
              offenceCode: 'PS90037',
              offenceStartDate: '2023-12-15',
              legacyData: {
                offenderChargeId: '1',
                bookingId: '1',
                postedDate: '10-10-2015',
                nomisOutcomeCode: 'NOMISCODE',
                outcomeDescription: 'A Nomis description',
                outcomeDispositionCode: 'F',
                outcomeConvictionFlag: true,
              },
              sentence: {
                sentenceUuid: '4fec0281-ec54-4a15-b588-dee8fab6c250',
                sentenceLifetimeUuid: '11060e5b-da7e-4475-94f6-a27d27e28672',
                chargeNumber: '1',
                periodLengths: [
                  {
                    years: 2,
                    periodOrder: 'years',
                    periodLengthType: 'UNSUPPORTED',
                    legacyData: {
                      lifeSentence: false,
                      sentenceTermCode: 'SEC_86',
                      sentenceTermDescription: 'Section 86 of 2000 Act',
                    },
                  },
                ],
                sentenceServeType: 'UNKNOWN',
                consecutiveToChargeNumber: null,
                sentenceType: null,
                convictionDate: null,
                fineAmount: null,
                legacyData: {
                  sentenceCalcType: '1',
                  sentenceCategory: '1',
                  sentenceTypeDesc: 'A Nomis sentence type description',
                  postedDate: '10-10-2015',
                },
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
                dispositionCode: 'FINAL',
              },
              sentence: {
                sentenceUuid: '3a0a10d5-1ba0-403b-86d6-8cc75ee88454',
                chargeNumber: '1',
                periodLengths: [
                  {
                    periodLengthUuid: 'bf6e75e4-2137-48ee-84fe-df0a18e65047',
                    years: 4,
                    periodOrder: 'years,months,weeks,days',
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
            {
              chargeUuid: 'a94b4ba8-d6b4-443e-bf69-7f1dab98a6bf',
              offenceCode: 'PS90037',
              offenceStartDate: '2023-12-14',
              outcome: {
                outcomeUuid: '85ffc6bf-6a2c-4f2b-8db8-5b466b602537',
                outcomeName: 'Imprisonment',
                nomisCode: '09753',
                outcomeType: 'SENTENCING',
                displayOrder: 10,
                dispositionCode: 'FINAL',
              },
              sentence: {
                sentenceUuid: '10a45197-642a-4b20-b9d8-1ae89edf77cc',
                chargeNumber: '2',
                periodLengths: [
                  {
                    periodLengthUuid: 'f15d1f04-f124-4662-b076-f9be92727304',
                    months: 2,
                    years: 1,
                    periodOrder: 'years,months,weeks,days',
                    periodLengthType: 'SENTENCE_LENGTH',
                  },
                ],
                sentenceServeType: 'CONSECUTIVE',
                consecutiveToSentenceUuid: 'b0f83d31-efbe-462c-970d-5293975acb17',
                sentenceType: null,
                legacyData: {
                  sentenceCalcType: '1',
                  sentenceCategory: '1',
                  sentenceTypeDesc: 'A Nomis sentence type',
                  postedDate: '10-10-2024',
                },
              },
            },
            {
              chargeUuid: 'a6d6dbaf-9dc8-443d-acb4-5b52dd919f11',
              offenceCode: 'PS90037',
              offenceStartDate: '2023-12-15',
              outcome: {
                outcomeUuid: '85ffc6bf-6a2c-4f2b-8db8-5b466b602537',
                outcomeName: 'Imprisonment',
                nomisCode: '09753',
                outcomeType: 'SENTENCING',
                displayOrder: 10,
                dispositionCode: 'FINAL',
              },
              sentence: {
                sentenceUuid: 'b0f83d31-efbe-462c-970d-5293975acb17',
                chargeNumber: '3',
                periodLengths: [
                  {
                    periodLengthUuid: '2b8002ad-f2d4-45a6-a186-df2326e37159',
                    years: 1,
                    months: null,
                    weeks: null,
                    days: null,
                    periodOrder: 'years,months,weeks,days',
                    periodLengthType: 'CUSTODIAL_TERM',
                    legacyData: null,
                  },
                  {
                    periodLengthUuid: 'ef7984c6-fcbf-407b-b5dd-896cb5793d7f',
                    years: 2,
                    months: null,
                    weeks: null,
                    days: null,
                    periodOrder: 'years,months,weeks,days',
                    periodLengthType: 'LICENCE_PERIOD',
                    legacyData: null,
                  },
                ],
                sentenceServeType: 'CONSECUTIVE',
                consecutiveToSentenceUuid: '3a0a10d5-1ba0-403b-86d6-8cc75ee88454',
                sentenceType: {
                  sentenceTypeUuid: '0197d1a8-3663-432d-b78d-16933b219ec7',
                  description: 'EDS (Extended Determinate Sentence)',
                  classification: 'EXTENDED',
                  hintText: null,
                },
              },
            },
            {
              chargeUuid: '8cb559d1-b9e9-4c60-8ef7-f40abf368196',
              offenceCode: 'PS90037',
              offenceStartDate: '2023-12-10',
              outcome: {
                outcomeUuid: '85ffc6bf-6a2c-4f2b-8db8-5b466b602537',
                outcomeName: 'Imprisonment',
                nomisCode: '09753',
                outcomeType: 'SENTENCING',
                displayOrder: 10,
                dispositionCode: 'FINAL',
              },
              sentence: {
                sentenceUuid: 'd70e57ae-09c3-40c0-a513-132f040b09a5',
                chargeNumber: '4',
                periodLengths: [
                  {
                    periodLengthUuid: '64953986-1bf2-4bcb-a981-c391621cc863',
                    years: 1,
                    months: null,
                    weeks: null,
                    days: null,
                    periodOrder: 'years,months,weeks,days',
                    periodLengthType: 'TERM_LENGTH',
                    legacyData: null,
                  },
                ],
                sentenceServeType: 'CONCURRENT',
                consecutiveToSentenceUuid: null,
                sentenceType: {
                  sentenceTypeUuid: 'c71ceefe-932b-4a69-b87c-7c1294e37cf7',
                  description: 'Imprisonment in Default of Fine',
                  classification: 'FINE',
                  hintText: null,
                },
                convictionDate: '2024-09-12',
                fineAmount: {
                  fineAmount: 50,
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

  stubGetSentenceAppearanceDetailsSupportedSentenceLengthsForMismatch: (): SuperAgentRequest => {
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
                dispositionCode: 'FINAL',
              },
              sentence: {
                sentenceUuid: '3a0a10d5-1ba0-403b-86d6-8cc75ee88454',
                chargeNumber: '1',
                periodLengths: [
                  {
                    periodLengthUuid: 'bf6e75e4-2137-48ee-84fe-df0a18e65047',
                    years: 4,
                    periodOrder: 'years,months,weeks,days',
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
            {
              chargeUuid: 'a94b4ba8-d6b4-443e-bf69-7f1dab98a6bf',
              offenceCode: 'PS90037',
              offenceStartDate: '2023-12-14',
              outcome: {
                outcomeUuid: '85ffc6bf-6a2c-4f2b-8db8-5b466b602537',
                outcomeName: 'Imprisonment',
                nomisCode: '09753',
                outcomeType: 'SENTENCING',
                displayOrder: 10,
                dispositionCode: 'FINAL',
              },
              sentence: {
                sentenceUuid: '10a45197-642a-4b20-b9d8-1ae89edf77cc',
                chargeNumber: '2',
                periodLengths: [
                  {
                    periodLengthUuid: 'f15d1f04-f124-4662-b076-f9be92727304',
                    months: 2,
                    years: 1,
                    periodOrder: 'years,months,weeks,days',
                    periodLengthType: 'SENTENCE_LENGTH',
                  },
                ],
                sentenceServeType: 'CONSECUTIVE',
                consecutiveToSentenceUuid: 'b0f83d31-efbe-462c-970d-5293975acb17',
                sentenceType: null,
                legacyData: {
                  sentenceCalcType: '1',
                  sentenceCategory: '1',
                  sentenceTypeDesc: 'A Nomis sentence type',
                  postedDate: '10-10-2024',
                },
              },
            },
            {
              chargeUuid: 'a6d6dbaf-9dc8-443d-acb4-5b52dd919f11',
              offenceCode: 'PS90037',
              offenceStartDate: '2023-12-15',
              outcome: {
                outcomeUuid: '85ffc6bf-6a2c-4f2b-8db8-5b466b602537',
                outcomeName: 'Imprisonment',
                nomisCode: '09753',
                outcomeType: 'SENTENCING',
                displayOrder: 10,
                dispositionCode: 'FINAL',
              },
              sentence: {
                sentenceUuid: 'b0f83d31-efbe-462c-970d-5293975acb17',
                chargeNumber: '3',
                periodLengths: [
                  {
                    periodLengthUuid: '2b8002ad-f2d4-45a6-a186-df2326e37159',
                    years: 1,
                    months: null,
                    weeks: null,
                    days: null,
                    periodOrder: 'years,months,weeks,days',
                    periodLengthType: 'CUSTODIAL_TERM',
                    legacyData: null,
                  },
                  {
                    periodLengthUuid: 'ef7984c6-fcbf-407b-b5dd-896cb5793d7f',
                    years: 2,
                    months: null,
                    weeks: null,
                    days: null,
                    periodOrder: 'years,months,weeks,days',
                    periodLengthType: 'LICENCE_PERIOD',
                    legacyData: null,
                  },
                ],
                sentenceServeType: 'CONSECUTIVE',
                consecutiveToSentenceUuid: '3a0a10d5-1ba0-403b-86d6-8cc75ee88454',
                sentenceType: {
                  sentenceTypeUuid: '0197d1a8-3663-432d-b78d-16933b219ec7',
                  description: 'EDS (Extended Determinate Sentence)',
                  classification: 'EXTENDED',
                  hintText: null,
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
              '{"courtCaseUuid": "83517113-5c14-4628-9133-1e3cb12e31fa", "appearanceUuid": "3fa85f64-5717-4562-b3fc-2c963f66afa6", "outcomeUuid": "6da892fa-d85e-44de-95d4-a7f06c3a2dcb", "warrantType": "REMAND", "courtCode": "STHHPM", "courtCaseReference": "T12345678", "appearanceDate": "2023-12-15", "prisonId": "MDI", "nextCourtAppearance": {"appearanceDate": "2024-12-15", "courtCode": "STHHPM", "appearanceTypeUuid": "63e8fce0-033c-46ad-9edf-391b802d547a", "prisonId": "MDI"}, "charges": [{"chargeUuid": "71bb9f7e-971c-4c34-9a33-43478baee74f", "offenceCode": "PS90037", "offenceStartDate": "2023-12-15", "outcomeUuid": "85ffc6bf-6a2c-4f2b-8db8-5b466b602537", "prisonId": "MDI"}]}',
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
        prisonId: 'MDI',
        nextCourtAppearance: {
          appearanceDate: '2024-12-15',
          courtCode: 'STHHPM',
          appearanceTypeUuid: '63e8fce0-033c-46ad-9edf-391b802d547a',
          prisonId: 'MDI',
        },
        charges: [
          {
            chargeUuid: '71bb9f7e-971c-4c34-9a33-43478baee74f',
            offenceCode: 'PS90037',
            offenceStartDate: '2023-12-15',
            outcomeUuid: '85ffc6bf-6a2c-4f2b-8db8-5b466b602537',
            prisonId: 'MDI',
          },
        ],
      },
    })
  },

  stubUpdateSentenceCourtAppearance: (): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'PUT',
        urlPattern: '/remand-and-sentencing-api/court-appearance/3fa85f64-5717-4562-b3fc-2c963f66afa6',
        bodyPatterns: [
          {
            equalToJson:
              '{"courtCaseUuid": "83517113-5c14-4628-9133-1e3cb12e31fa", "appearanceUuid": "3fa85f64-5717-4562-b3fc-2c963f66afa6", "outcomeUuid": "4b2a225e-5bb1-4bf7-8719-6ff9f3ee0d10", "courtCode": "STHHPM", "courtCaseReference": "C894623", "appearanceDate": "2023-12-15", "charges": [{"offenceCode": "PS90037", "offenceStartDate": "2023-12-15", "outcomeUuid": "85ffc6bf-6a2c-4f2b-8db8-5b466b602537", "prisonId": "MDI", "chargeUuid": "a6d6dbaf-9dc8-443d-acb4-5b52dd919f11", "sentence": {"chargeNumber": "3", "periodLengths": [{"years": 2, "periodOrder": "years,months,weeks,days", "type": "CUSTODIAL_TERM", "periodLengthUuid": "2b8002ad-f2d4-45a6-a186-df2326e37159", "prisonId": "MDI", "legacyData": null}, {"years": 2, "periodOrder": "years,months,weeks,days", "type": "LICENCE_PERIOD", "periodLengthUuid": "ef7984c6-fcbf-407b-b5dd-896cb5793d7f", "prisonId": "MDI", "legacyData": null}], "sentenceServeType": "CONSECUTIVE", "sentenceTypeId": "0197d1a8-3663-432d-b78d-16933b219ec7", "prisonId": "MDI", "sentenceReference": "0", "consecutiveToSentenceReference": "1", "sentenceUuid": "b0f83d31-efbe-462c-970d-5293975acb17"}}, {"offenceCode": "PS90037", "offenceStartDate": "2023-12-15", "outcomeUuid": "85ffc6bf-6a2c-4f2b-8db8-5b466b602537", "prisonId": "MDI", "chargeUuid": "71bb9f7e-971c-4c34-9a33-43478baee74f", "sentence": {"chargeNumber": "1", "periodLengths": [{"years": 4, "periodOrder": "years,months,weeks,days", "type": "SENTENCE_LENGTH", "periodLengthUuid": "bf6e75e4-2137-48ee-84fe-df0a18e65047", "prisonId": "MDI"}], "sentenceServeType": "FORTHWITH", "sentenceTypeId": "467e2fa8-fce1-41a4-8110-b378c727eed3", "prisonId": "MDI", "sentenceReference": "1", "sentenceUuid": "3a0a10d5-1ba0-403b-86d6-8cc75ee88454"}}, {"offenceCode": "PS90037", "offenceStartDate": "2023-12-14", "outcomeUuid": "85ffc6bf-6a2c-4f2b-8db8-5b466b602537", "prisonId": "MDI", "chargeUuid": "a94b4ba8-d6b4-443e-bf69-7f1dab98a6bf", "sentence": {"chargeNumber": "2", "periodLengths": [{"months": 2, "years": 1, "periodOrder": "years,months,weeks,days", "type": "SENTENCE_LENGTH", "periodLengthUuid": "f15d1f04-f124-4662-b076-f9be92727304", "prisonId": "MDI"}], "sentenceServeType": "CONSECUTIVE", "prisonId": "MDI", "sentenceReference": "2", "consecutiveToSentenceReference": "0", "sentenceUuid": "10a45197-642a-4b20-b9d8-1ae89edf77cc"}}, {"offenceCode": "PS90037", "offenceStartDate": "2023-12-10", "outcomeUuid": "85ffc6bf-6a2c-4f2b-8db8-5b466b602537", "prisonId": "MDI", "chargeUuid": "8cb559d1-b9e9-4c60-8ef7-f40abf368196", "sentence": {"chargeNumber": "4", "periodLengths": [{"years": 1, "periodOrder": "years,months,weeks,days", "type": "TERM_LENGTH", "periodLengthUuid": "64953986-1bf2-4bcb-a981-c391621cc863", "prisonId": "MDI", "legacyData": null}], "sentenceServeType": "CONCURRENT", "sentenceTypeId": "c71ceefe-932b-4a69-b87c-7c1294e37cf7", "prisonId": "MDI", "sentenceReference": "3", "convictionDate": "2024-09-12", "fineAmount": {"fineAmount": 50}, "sentenceUuid": "d70e57ae-09c3-40c0-a513-132f040b09a5"}}], "warrantType": "SENTENCING", "prisonId": "MDI", "overallSentenceLength": {"years": 4, "periodOrder": "years", "type": "OVERALL_SENTENCE_LENGTH", "prisonId": "MDI"}, "overallConvictionDate": "2024-09-12"}',
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

  verifyUpdateSentenceCourtAppearanceRequest: (): Promise<number> => {
    return verifyRequest({
      requestUrlPattern: '/remand-and-sentencing-api/court-appearance/3fa85f64-5717-4562-b3fc-2c963f66afa6',
      method: 'PUT',
      body: {
        courtCaseUuid: '83517113-5c14-4628-9133-1e3cb12e31fa',
        appearanceUuid: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
        outcomeUuid: '4b2a225e-5bb1-4bf7-8719-6ff9f3ee0d10',
        courtCode: 'STHHPM',
        courtCaseReference: 'C894623',
        appearanceDate: '2023-12-15',
        charges: [
          {
            offenceCode: 'PS90037',
            offenceStartDate: '2023-12-15',
            outcomeUuid: '85ffc6bf-6a2c-4f2b-8db8-5b466b602537',
            prisonId: 'MDI',
            chargeUuid: 'a6d6dbaf-9dc8-443d-acb4-5b52dd919f11',
            sentence: {
              chargeNumber: '3',
              periodLengths: [
                {
                  years: 2,
                  periodOrder: 'years,months,weeks,days',
                  type: 'CUSTODIAL_TERM',
                  periodLengthUuid: '2b8002ad-f2d4-45a6-a186-df2326e37159',
                  prisonId: 'MDI',
                  legacyData: null,
                },
                {
                  years: 2,
                  periodOrder: 'years,months,weeks,days',
                  type: 'LICENCE_PERIOD',
                  periodLengthUuid: 'ef7984c6-fcbf-407b-b5dd-896cb5793d7f',
                  prisonId: 'MDI',
                  legacyData: null,
                },
              ],
              sentenceServeType: 'CONSECUTIVE',
              sentenceTypeId: '0197d1a8-3663-432d-b78d-16933b219ec7',
              prisonId: 'MDI',
              sentenceReference: '0',
              consecutiveToSentenceReference: '1',
              sentenceUuid: 'b0f83d31-efbe-462c-970d-5293975acb17',
            },
          },
          {
            offenceCode: 'PS90037',
            offenceStartDate: '2023-12-15',
            outcomeUuid: '85ffc6bf-6a2c-4f2b-8db8-5b466b602537',
            prisonId: 'MDI',
            chargeUuid: '71bb9f7e-971c-4c34-9a33-43478baee74f',
            sentence: {
              chargeNumber: '1',
              periodLengths: [
                {
                  years: 4,
                  periodOrder: 'years,months,weeks,days',
                  type: 'SENTENCE_LENGTH',
                  periodLengthUuid: 'bf6e75e4-2137-48ee-84fe-df0a18e65047',
                  prisonId: 'MDI',
                },
              ],
              sentenceServeType: 'FORTHWITH',
              sentenceTypeId: '467e2fa8-fce1-41a4-8110-b378c727eed3',
              prisonId: 'MDI',
              sentenceReference: '1',
              sentenceUuid: '3a0a10d5-1ba0-403b-86d6-8cc75ee88454',
            },
          },
          {
            offenceCode: 'PS90037',
            offenceStartDate: '2023-12-14',
            outcomeUuid: '85ffc6bf-6a2c-4f2b-8db8-5b466b602537',
            prisonId: 'MDI',
            chargeUuid: 'a94b4ba8-d6b4-443e-bf69-7f1dab98a6bf',
            sentence: {
              chargeNumber: '2',
              periodLengths: [
                {
                  months: 2,
                  years: 1,
                  periodOrder: 'years,months,weeks,days',
                  type: 'SENTENCE_LENGTH',
                  periodLengthUuid: 'f15d1f04-f124-4662-b076-f9be92727304',
                  prisonId: 'MDI',
                },
              ],
              sentenceServeType: 'CONSECUTIVE',
              prisonId: 'MDI',
              sentenceReference: '2',
              consecutiveToSentenceReference: '0',
              sentenceUuid: '10a45197-642a-4b20-b9d8-1ae89edf77cc',
            },
          },
          {
            offenceCode: 'PS90037',
            offenceStartDate: '2023-12-10',
            outcomeUuid: '85ffc6bf-6a2c-4f2b-8db8-5b466b602537',
            prisonId: 'MDI',
            chargeUuid: '8cb559d1-b9e9-4c60-8ef7-f40abf368196',
            sentence: {
              chargeNumber: '4',
              periodLengths: [
                {
                  years: 1,
                  periodOrder: 'years,months,weeks,days',
                  type: 'TERM_LENGTH',
                  periodLengthUuid: '64953986-1bf2-4bcb-a981-c391621cc863',
                  prisonId: 'MDI',
                  legacyData: null,
                },
              ],
              sentenceServeType: 'CONCURRENT',
              sentenceTypeId: 'c71ceefe-932b-4a69-b87c-7c1294e37cf7',
              prisonId: 'MDI',
              sentenceReference: '3',
              convictionDate: '2024-09-12',
              fineAmount: {
                fineAmount: 50,
              },
              sentenceUuid: 'd70e57ae-09c3-40c0-a513-132f040b09a5',
            },
          },
        ],
        warrantType: 'SENTENCING',
        prisonId: 'MDI',
        overallSentenceLength: {
          years: 4,
          periodOrder: 'years',
          type: 'OVERALL_SENTENCE_LENGTH',
          prisonId: 'MDI',
        },
        overallConvictionDate: '2024-09-12',
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
            warrantType: 'REMAND',
            nextCourtAppearance: {
              appearanceDate: '2024-12-15',
              courtCode: 'ACCRYC',
              appearanceType: {
                appearanceTypeUuid: '63e8fce0-033c-46ad-9edf-391b802d547a',
                description: 'Court appearance',
                displayOrder: 10,
              },
            },
            charges: [
              {
                chargeUuid: '71bb9f7e-971c-4c34-9a33-43478baee74f',
                offenceCode: 'PS90037',
                offenceStartDate: '2025-12-15',
                outcome: {
                  outcomeUuid: '85ffc6bf-6a2c-4f2b-8db8-5b466b602537',
                  outcomeName: 'Remanded in custody',
                  nomisCode: '3452',
                  outcomeType: 'REMAND',
                  displayOrder: 10,
                  dispositionCode: 'INTERIM',
                },
              },
              {
                chargeUuid: '9b622879-8191-4a7f-9fe8-71b680417220',
                offenceCode: 'PS90037',
                outcome: {
                  outcomeUuid: '92e69bb5-9769-478b-9ee6-77c91808d9af',
                  outcomeName: 'Commit to Crown Court for trial in custody',
                  nomisCode: '7869',
                  outcomeType: 'REMAND',
                  displayOrder: 20,
                  dispositionCode: 'INTERIM',
                },
              },
            ],
          },
          appearances: [
            {
              appearanceUuid: '5b4cbea0-edd3-4bac-9485-b3e3cd46ad77',
              outcome: {
                outcomeUuid: '7fd9efee-200e-4579-a766-e6bf9a499096',
                outcomeName: 'Lie on file',
                nomisCode: '7863',
                outcomeType: 'REMAND',
                displayOrder: 20,
              },
              courtCode: 'BCC',
              courtCaseReference: 'F23325',
              appearanceDate: '2022-10-15',
              warrantType: 'REMAND',
              nextCourtAppearance: {
                appearanceDate: '2023-12-15',
                courtCode: 'BCC',
                appearanceType: {
                  appearanceTypeUuid: '63e8fce0-033c-46ad-9edf-391b802d547a',
                  description: 'Court appearance',
                  displayOrder: 10,
                },
              },
              charges: [
                {
                  chargeUuid: '9056c1f3-b090-4d1e-bc6e-4f66ebed2ed5',
                  offenceCode: 'PS90037',
                  offenceStartDate: '2025-12-15',
                  legacyData: {
                    offenderChargeId: '1',
                    bookingId: '1',
                    postedDate: '1-1-2010',
                    nomisOutcomeCode: '678324',
                    outcomeDescription: 'A Nomis Outcome',
                    outcomeDispositionCode: 'I',
                  },
                  mergedFromCase: {
                    caseReference: 'NOMIS123',
                    courtCode: 'ACCRYC',
                    warrantDate: '2025-06-05',
                    mergedFromDate: '2019-06-05',
                  },
                },
              ],
            },
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
              warrantType: 'REMAND',
              nextCourtAppearance: {
                appearanceDate: '2024-12-15',
                courtCode: 'ACCRYC',
                appearanceType: {
                  appearanceTypeUuid: '63e8fce0-033c-46ad-9edf-391b802d547a',
                  description: 'Court appearance',
                  displayOrder: 10,
                },
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
                    dispositionCode: 'INTERIM',
                  },
                },
                {
                  chargeUuid: '9b622879-8191-4a7f-9fe8-71b680417220',
                  offenceCode: 'PS90037',
                  outcome: {
                    outcomeUuid: '92e69bb5-9769-478b-9ee6-77c91808d9af',
                    outcomeName: 'Commit to Crown Court for trial in custody',
                    nomisCode: '7869',
                    outcomeType: 'REMAND',
                    displayOrder: 20,
                    dispositionCode: 'INTERIM',
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
                outcome: {
                  outcomeUuid: '4b2a225e-5bb1-4bf7-8719-6ff9f3ee0d10',
                  outcomeName: 'Imprisonment',
                  nomisCode: '09753',
                  outcomeType: 'SENTENCING',
                  displayOrder: 10,
                  dispositionCode: 'FINAL',
                },
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
              {
                chargeUuid: 'a94b4ba8-d6b4-443e-bf69-7f1dab98a6bf',
                offenceCode: 'PS90037',
                offenceStartDate: '2023-12-15',
                outcome: {
                  outcomeUuid: '4b2a225e-5bb1-4bf7-8719-6ff9f3ee0d10',
                  outcomeName: 'Imprisonment',
                  nomisCode: '09753',
                  outcomeType: 'SENTENCING',
                  displayOrder: 10,
                  dispositionCode: 'FINAL',
                },
                sentence: {
                  chargeNumber: '2',
                  periodLengths: [
                    {
                      months: 2,
                      years: 1,
                      periodOrder: 'years,months',
                      periodLengthType: 'SENTENCE_LENGTH',
                    },
                  ],
                  sentenceServeType: 'UNKNOWN',
                  sentenceType: null,
                  legacyData: {
                    sentenceCalcType: '1',
                    sentenceCategory: '1',
                    sentenceTypeDesc: 'A Nomis sentence type',
                    postedDate: '10-10-2024',
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
                  outcome: {
                    outcomeUuid: '4b2a225e-5bb1-4bf7-8719-6ff9f3ee0d10',
                    outcomeName: 'Imprisonment',
                    nomisCode: '09753',
                    outcomeType: 'SENTENCING',
                    displayOrder: 10,
                    dispositionCode: 'FINAL',
                  },
                  sentence: {
                    sentenceUuid: '29fa8c7f-7ba1-4033-ac4d-83ff0c125a45',
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
                {
                  chargeUuid: 'a94b4ba8-d6b4-443e-bf69-7f1dab98a6bf',
                  offenceCode: 'PS90037',
                  offenceStartDate: '2023-12-16',
                  outcome: {
                    outcomeUuid: '4b2a225e-5bb1-4bf7-8719-6ff9f3ee0d10',
                    outcomeName: 'Imprisonment',
                    nomisCode: '09753',
                    outcomeType: 'SENTENCING',
                    displayOrder: 10,
                    dispositionCode: 'FINAL',
                  },
                  sentence: {
                    sentenceUuid: '88d332ae-903d-47a9-8dda-1fafa5c60157',
                    chargeNumber: '2',
                    periodLengths: [
                      {
                        months: 2,
                        years: 1,
                        periodOrder: 'years,months',
                        periodLengthType: 'SENTENCE_LENGTH',
                      },
                    ],
                    sentenceServeType: 'UNKNOWN',
                    sentenceType: null,
                    legacyData: {
                      sentenceCalcType: '1',
                      sentenceCategory: '1',
                      sentenceTypeDesc: 'A Nomis sentence type',
                      postedDate: '10-10-2024',
                    },
                    hasRecall: true,
                  },
                },
                {
                  chargeUuid: 'cd0ea79d-7604-4d1d-93e0-993e08689111',
                  offenceCode: 'PS90037',
                  offenceStartDate: '2023-06-03',
                  outcome: {
                    outcomeUuid: '4b2a225e-5bb1-4bf7-8719-6ff9f3ee0d10',
                    outcomeName: 'Imprisonment',
                    nomisCode: '09753',
                    outcomeType: 'SENTENCING',
                    displayOrder: 10,
                    dispositionCode: 'FINAL',
                  },
                  sentence: {
                    sentenceUuid: '17890cf5-042b-4794-84f8-3fd283c240c0',
                    chargeNumber: '3',
                    periodLengths: [
                      {
                        months: 5,
                        years: 4,
                        periodOrder: 'years,months',
                        periodLengthType: 'SENTENCE_LENGTH',
                      },
                    ],
                    sentenceServeType: 'CONSECUTIVE',
                    consecutiveToSentenceUuid: '8e33074a-3240-4073-923a-b69b642e037c',
                    sentenceType: {
                      sentenceTypeUuid: '467e2fa8-fce1-41a4-8110-b378c727eed3',
                      description: 'SDS (Standard Determinate Sentence)',
                      classification: 'STANDARD',
                    },
                  },
                },
                {
                  chargeUuid: '7042e101-c9fa-4ad5-b2dd-904ddb75a909',
                  offenceCode: 'PS90037',
                  offenceStartDate: '2024-02-15',
                  outcome: {
                    outcomeUuid: '4b2a225e-5bb1-4bf7-8719-6ff9f3ee0d10',
                    outcomeName: 'Imprisonment',
                    nomisCode: '09753',
                    outcomeType: 'SENTENCING',
                    displayOrder: 10,
                    dispositionCode: 'FINAL',
                  },
                  sentence: {
                    sentenceUuid: '1b04face-354d-43f3-8191-ee9f1f055666',
                    chargeNumber: '4',
                    periodLengths: [
                      {
                        months: 5,
                        years: 4,
                        periodOrder: 'years,months',
                        periodLengthType: 'SENTENCE_LENGTH',
                      },
                    ],
                    sentenceServeType: 'CONSECUTIVE',
                    consecutiveToSentenceUuid: '29fa8c7f-7ba1-4033-ac4d-83ff0c125a45',
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
                appearanceType: {
                  appearanceTypeUuid: '63e8fce0-033c-46ad-9edf-391b802d547a',
                  description: 'Court appearance',
                  displayOrder: 10,
                },
              },
              charges: [
                {
                  chargeUuid: '9056c1f3-b090-4d1e-bc6e-4f66ebed2ed5',
                  offenceCode: 'PS90037',
                  offenceStartDate: '2023-12-15',
                  outcome: {
                    outcomeUuid: '85ffc6bf-6a2c-4f2b-8db8-5b466b602537',
                    outcomeName: 'Remanded in custody',
                    nomisCode: '3452',
                    outcomeType: 'REMAND',
                    displayOrder: 10,
                    dispositionCode: 'INTERIM',
                  },
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
  stubSearchSentenceTypes: ({
    convictionDate = '2023-05-12',
    offenceDate = '2023-05-10',
    age = '58',
  }: {
    convictionDate: string
    offenceDate: string
    age: string
  }): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'GET',
        urlPath: '/remand-and-sentencing-api/sentence-type/search',
        queryParameters: {
          age: {
            equalTo: age,
          },
          convictionDate: {
            equalTo: convictionDate,
          },
          statuses: {
            equalTo: 'ACTIVE',
          },
          offenceDate: {
            equalTo: offenceDate,
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
            displayOrder: 100,
          },
          {
            sentenceTypeUuid: 'bc929dc9-019c-4acc-8fd9-9f9682ebbd72',
            description: 'EDS (Extended Determinate Sentence)',
            classification: 'EXTENDED',
            displayOrder: 50,
          },
          {
            sentenceTypeUuid: 'c71ceefe-932b-4a69-b87c-7c1294e37cf7',
            description: 'Imprisonment in Default of Fine',
            classification: 'FINE',
            displayOrder: 200,
          },
        ],
      },
    })
  },
  stubGetSentenceTypeById: ({
    sentenceTypeUuid = '467e2fa8-fce1-41a4-8110-b378c727eed3',
    description = 'SDS (Standard Determinate Sentence)',
    classification = 'STANDARD',
  }: {
    sentenceTypeUuid: string
    description: string
    classification: string
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
          classification,
        },
      },
    })
  },
  stubGetSentenceTypesByIds: (
    sentenceTypes: [
      {
        sentenceTypeUuid: string
        description: string
        classification: string
      },
    ],
  ): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'GET',
        urlPath: '/remand-and-sentencing-api/sentence-type/uuid/multiple',
        queryParameters: {
          uuids: {
            equalTo: sentenceTypes.map(sentenceType => sentenceType.sentenceTypeUuid).join(','),
          },
        },
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: sentenceTypes,
      },
    })
  },

  stubGetAllAppearanceOutcomes: (): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'GET',
        urlPath: '/remand-and-sentencing-api/appearance-outcome/status',
        queryParameters: {
          statuses: {
            equalTo: 'ACTIVE',
          },
        },
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
          },
          {
            outcomeUuid: '6da892fa-d85e-44de-95d4-a7f06c3a2dcc',
            outcomeName: 'Another option',
            nomisCode: '3454',
            outcomeType: 'REMAND',
            displayOrder: 10,
            relatedChargeOutcomeUuid: '85ffc6bf-6a2c-4f2b-8db8-5b466b602537',
          },
          {
            outcomeUuid: '7fd9efee-200e-4579-a766-e6bf9a499096',
            outcomeName: 'Lie on file',
            nomisCode: '7863',
            outcomeType: 'NON_CUSTODIAL',
            displayOrder: 20,
            relatedChargeOutcomeUuid: '66032e17-977a-40f9-b634-1bc2b45e874d',
          },
          {
            outcomeUuid: '62412083-9892-48c9-bf01-7864af4a8b3c',
            outcomeName: 'Imprisonment',
            nomisCode: '1002',
            outcomeType: 'SENTENCING',
            displayOrder: 10,
            relatedChargeOutcomeUuid: 'f17328cf-ceaa-43c2-930a-26cf74480e18',
          },
          {
            outcomeUuid: '4b2a225e-5bb1-4bf7-8719-6ff9f3ee0d11',
            outcomeName: 'Another option',
            nomisCode: '09753',
            outcomeType: 'SENTENCING',
            displayOrder: 20,
            relatedChargeOutcomeUuid: '63920fee-e43a-45ff-a92d-4679f1af2527',
          },
        ],
      },
    })
  },
  stubGetAllAppearanceOutcomesWithSingleResults: (): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'GET',
        urlPath: '/remand-and-sentencing-api/appearance-outcome/status',
        queryParameters: {
          statuses: {
            equalTo: 'ACTIVE',
          },
        },
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
          },
          {
            outcomeUuid: '7fd9efee-200e-4579-a766-e6bf9a499096',
            outcomeName: 'Lie on file',
            nomisCode: '7863',
            outcomeType: 'REMAND',
            displayOrder: 20,
            relatedChargeOutcomeUuid: '66032e17-977a-40f9-b634-1bc2b45e874d',
          },
          {
            outcomeUuid: '4b2a225e-5bb1-4bf7-8719-6ff9f3ee0d10',
            outcomeName: 'Imprisonment',
            nomisCode: '1002',
            outcomeType: 'SENTENCING',
            displayOrder: 10,
            relatedChargeOutcomeUuid: 'f17328cf-ceaa-43c2-930a-26cf74480e18',
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
    const nomisCode = outcomeType === 'REMAND' ? '3452' : '1002'
    const relatedChargeOutcomeUuid =
      outcomeType === 'REMAND' ? '85ffc6bf-6a2c-4f2b-8db8-5b466b602537' : 'f17328cf-ceaa-43c2-930a-26cf74480e18'

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
          nomisCode,
          outcomeType,
          displayOrder: 10,
          relatedChargeOutcomeUuid,
        },
      },
    })
  },

  stubGetAllChargeOutcomes: (): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'GET',
        urlPath: '/remand-and-sentencing-api/charge-outcome/status',
        queryParameters: {
          statuses: {
            equalTo: 'ACTIVE',
          },
        },
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
          },
          {
            outcomeUuid: '66032e17-977a-40f9-b634-1bc2b45e874d',
            outcomeName: 'Lie on file',
            nomisCode: '7863',
            outcomeType: 'NON_CUSTODIAL',
            displayOrder: 20,
          },
          {
            outcomeUuid: '63920fee-e43a-45ff-a92d-4679f1af2527',
            outcomeName: 'Imprisonment',
            nomisCode: '09753',
            outcomeType: 'SENTENCING',
            displayOrder: 10,
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
    const nomisCode = outcomeType === 'REMAND' ? '3452' : '1002'
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
          nomisCode,
          outcomeType,
          displayOrder: 10,
        },
      },
    })
  },
  stubGetChargeOutcomesByIds: (
    outcomes: Array<{
      outcomeUuid: string
      outcomeName: string
      outcomeType: string
    }>,
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
        jsonBody: outcomes.map(outcome => ({
          nomisCode: outcome.outcomeType === 'REMAND' ? '3452' : '09753',
          displayOrder: 10,
          ...outcome,
        })),
      },
    })
  },

  stubGetAllAppearanceTypes: (): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'GET',
        urlPath: '/remand-and-sentencing-api/appearance-type/status',
        queryParameters: {
          statuses: {
            equalTo: 'ACTIVE',
          },
        },
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: [
          {
            appearanceTypeUuid: '1da09b6e-55cb-4838-a157-ee6944f2094c',
            description: 'Video link',
            displayOrder: 20,
          },
          {
            appearanceTypeUuid: '63e8fce0-033c-46ad-9edf-391b802d547a',
            description: 'Court appearance',
            displayOrder: 10,
          },
        ],
      },
    })
  },

  stubGetAppearanceTypeByUuid: (): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'GET',
        urlPath: '/remand-and-sentencing-api/appearance-type/63e8fce0-033c-46ad-9edf-391b802d547a',
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: {
          appearanceTypeUuid: '63e8fce0-033c-46ad-9edf-391b802d547a',
          description: 'Court appearance',
          displayOrder: 10,
        },
      },
    })
  },

  stubGetAppearanceByUuid: ({ appearanceUuid = 'a6400fd8-aef4-4567-b18c-d1f452651933' } = {}): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'GET',
        urlPath: `/remand-and-sentencing-api/court-appearance/${appearanceUuid}`,
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: {
          appearanceUuid,
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
          warrantId: 'W12345',
          warrantType: 'REMAND',
          nextCourtAppearance: {
            appearanceDate: '2024-12-15',
            courtCode: 'ACCRYC',
            appearanceType: {
              appearanceTypeUuid: '63e8fce0-033c-46ad-9edf-391b802d547a',
              description: 'Court appearance',
              displayOrder: 10,
            },
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
                dispositionCode: 'INTERIM',
              },
            },
          ],
          overallSentenceLength: {
            years: 4,
            months: 5,
            periodOrder: 'years,months',
            type: 'OVERALL_SENTENCE_LENGTH',
            prisonId: 'MDI',
          },
          overallConvictionDate: '2024-09-12',
          legacyData: {
            eventId: '1',
            caseId: '1',
            postedDate: '10-10-2015',
            nomisOutcomeCode: '3567',
            outcomeDescription: 'A Nomis Outcome',
          },
          documents: [
            {
              documentUUID: 'doc-uuid-1',
              fileName: 'court-document.pdf',
              uploadedAt: '2024-06-01T10:00:00Z',
              uploadedBy: 'user1',
            },
          ],
        },
      },
    })
  },

  stubDeleteAppearanceByUuid: (): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'DELETE',
        urlPath: `/remand-and-sentencing-api/court-appearance/a6400fd8-aef4-4567-b18c-d1f452651933`,
      },
      response: {
        status: 204,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
      },
    })
  },

  stubGetHasSentenceToChainTo: ({
    beforeOrOnAppearanceDate = '2023-05-12',
    bookingId = '1234',
  }: {
    beforeOrOnAppearanceDate: string
    bookingId: string
  }): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'GET',
        urlPath: '/remand-and-sentencing-api/person/A1234AB/has-sentence-to-chain-to',
        queryParameters: {
          beforeOrOnAppearanceDate: {
            equalTo: beforeOrOnAppearanceDate,
          },
          bookingId: {
            equalTo: bookingId,
          },
        },
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: {
          hasSentenceToChainTo: true,
        },
      },
    })
  },

  stubGetSentencesToChainTo: ({
    beforeOrOnAppearanceDate = '2023-05-12',
    bookingId = '1234',
  }: {
    beforeOrOnAppearanceDate: string
    bookingId: string
  }): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'GET',
        urlPath: '/remand-and-sentencing-api/person/A1234AB/sentences-to-chain-to',
        queryParameters: {
          beforeOrOnAppearanceDate: {
            equalTo: beforeOrOnAppearanceDate,
          },
          bookingId: {
            equalTo: bookingId,
          },
        },
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: {
          appearances: [
            {
              courtCode: 'STHHPM',
              courtCaseReference: 'X34345',
              appearanceDate: '2023-02-23',
              sentences: [
                {
                  offenceCode: 'PS90037',
                  offenceStartDate: '2023-01-17',
                  sentenceUuid: '328fa693-3f99-46bf-9a94-d8578dc399af',
                  countNumber: '1',
                },
                {
                  offenceCode: 'PS90037',
                  offenceStartDate: '2023-01-05',
                  sentenceUuid: '10ea37b9-4dc6-4d5a-86ea-2dafc590d12e',
                  countNumber: '2',
                },
              ],
            },
            {
              courtCode: 'BCC',
              courtCaseReference: 'B34345',
              appearanceDate: '2022-06-13',
              sentences: [
                {
                  offenceCode: 'PS90037',
                  offenceStartDate: '2022-01-25',
                  sentenceUuid: 'b2d12149-8497-481c-beaa-4413c4f37a2f',
                  countNumber: '6',
                },
                {
                  offenceCode: 'PS90037',
                  sentenceUuid: '223d297b-3052-4b6b-a321-02f8413d9043',
                },
                {
                  offenceCode: 'PS90037',
                  offenceStartDate: '2022-02-17',
                  sentenceUuid: '1d59ec87-b732-463d-b17e-4c489a52f233',
                  countNumber: '1',
                },
              ],
            },
          ],
        },
      },
    })
  },

  stubGetEmptySentencesToChainTo: (): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'GET',
        urlPath: '/remand-and-sentencing-api/person/A1234AB/sentences-to-chain-to',
        queryParameters: {
          beforeOrOnAppearanceDate: {
            equalTo: '2023-05-13',
          },
          bookingId: {
            equalTo: '1234',
          },
        },
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: {
          appearances: [],
        },
      },
    })
  },

  stubGetConsecutiveToDetails: ({
    sentenceUuids = ['8e33074a-3240-4073-923a-b69b642e037c', '29fa8c7f-7ba1-4033-ac4d-83ff0c125a45'],
  }: {
    sentenceUuids: string[]
  }): SuperAgentRequest => {
    const consecutiveToDetails = {
      '8e33074a-3240-4073-923a-b69b642e037c': {
        courtCode: 'STHHPM',
        courtCaseReference: 'X34345',
        appearanceDate: '2023-02-23',
        offenceCode: 'PS90037',
        offenceStartDate: '2023-01-17',
        sentenceUuid: '8e33074a-3240-4073-923a-b69b642e037c',
        countNumber: '1',
      },
      '29fa8c7f-7ba1-4033-ac4d-83ff0c125a45': {
        courtCode: 'ACCRYC',
        courtCaseReference: 'XX1234',
        appearanceDate: '2024-01-23',
        offenceCode: 'PS90037',
        offenceStartDate: '2023-10-11',
        sentenceUuid: '29fa8c7f-7ba1-4033-ac4d-83ff0c125a45',
        countNumber: '1',
      },
      DEFAULT: {
        courtCode: 'STHHPM',
        courtCaseReference: 'X34345',
        appearanceDate: '2023-02-23',
        offenceCode: 'PS90037',
        offenceStartDate: '2023-01-17',
        countNumber: '1',
      },
    }
    return stubFor({
      request: {
        method: 'GET',
        urlPath: '/remand-and-sentencing-api/sentence/consecutive-to-details',
        queryParameters: {
          sentenceUuids: {
            equalTo: sentenceUuids.join(','),
          },
        },
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: {
          sentences: sentenceUuids.map(sentenceUuid => {
            return {
              ...(consecutiveToDetails[sentenceUuid] ?? { ...consecutiveToDetails.DEFAULT, sentenceUuid }),
              sentenceUuid,
            }
          }),
        },
      },
    })
  },

  stubGetCountNumbersForCourtCase({
    courtCaseUuid = '3fa85f64-5717-4562-b3fc-2c963f66afa6',
    countNumbers = [],
  }: {
    courtCaseUuid: string
    countNumbers: string[]
  }) {
    const countNumbersResponse = countNumbers.map(countNumber => {
      return {
        countNumber,
      }
    })
    return stubFor({
      request: {
        method: 'GET',
        urlPath: `/remand-and-sentencing-api/court-case/${courtCaseUuid}/count-numbers`,
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: {
          countNumbers: countNumbersResponse,
        },
      },
    })
  },

  stubIsSentenceTypeStillValid({
    sentenceTypeUuid = '467e2fa8-fce1-41a4-8110-b378c727eed3',
    isStillValid = true,
  }: {
    sentenceTypeUuid: string
    isStillValid: boolean
  }) {
    return stubFor({
      request: {
        method: 'GET',
        urlPath: `/remand-and-sentencing-api/sentence-type/${sentenceTypeUuid}/is-still-valid`,
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: {
          isStillValid,
        },
      },
    })
  },

  stubGetLatestOffenceDate({
    courtCaseUuid = '3fa85f64-5717-4562-b3fc-2c963f66afa6',
    latestOffenceDate = '2000-01-01',
  }: {
    courtCaseUuid?: string
    latestOffenceDate?: string
  }) {
    return stubFor({
      request: {
        method: 'GET',
        url: `/remand-and-sentencing-api/court-case/${courtCaseUuid}/latest-offence-date`,
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: latestOffenceDate,
      },
    })
  },

  stubGetLatestOffenceDateExcludeAppearance({
    courtCaseUuid = '3fa85f64-5717-4562-b3fc-2c963f66afa6',
    appearanceUuidToExclude = 'a6400fd8-aef4-4567-b18c-d1f452651933',
    latestOffenceDate = '2000-01-01',
  }: {
    courtCaseUuid?: string
    appearanceUuidToExclude?: string
    latestOffenceDate?: string
  }) {
    return stubFor({
      request: {
        method: 'GET',
        url: `/remand-and-sentencing-api/court-case/${courtCaseUuid}/latest-offence-date?appearanceUuidToExclude=${appearanceUuidToExclude}`,
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: latestOffenceDate,
      },
    })
  },

  stubUploadDocument: (): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'POST',
        urlPath: '/remand-and-sentencing-api/uploaded-documents',
        bodyPatterns: [
          {
            matchesJsonPath: '$.documents[*].documentUUID',
          },
        ],
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        // No jsonBody, as the endpoint returns void
      },
    })
  },

  stubHasSentencesAfterOnOtherCourtAppearance: ({
    sentenceUuid = 'b0f83d31-efbe-462c-970d-5293975acb17',
    hasSentenceAfterOnOtherCourtAppearance = false,
  }: {
    sentenceUuid: string
    hasSentenceAfterOnOtherCourtAppearance: boolean
  }): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'GET',
        urlPath: `/remand-and-sentencing-api/sentence/${sentenceUuid}/has-sentences-after-on-other-court-appearance`,
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: {
          hasSentenceAfterOnOtherCourtAppearance,
        },
      },
    })
  },

  stubSentencesAfterOnOtherCourtAppearanceDetails: ({
    sentenceUuid = 'b0f83d31-efbe-462c-970d-5293975acb17',
  }: {
    sentenceUuid: string
  }): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'GET',
        urlPath: `/remand-and-sentencing-api/sentence/${sentenceUuid}/sentences-after-on-other-court-appearance-details`,
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: {
          appearances: [
            {
              appearanceUuid: '3e46419c-aa43-48dd-b944-21b36d1e819c',
              caseReference: 'CASE123',
              appearanceDate: '2002-05-17',
              courtCode: 'ACCRYC',
            },
            {
              appearanceUuid: 'c2703fdc-6446-48b2-bbec-64617bfca5f0',
              appearanceDate: '2010-01-28',
              courtCode: 'STHHPM',
            },
          ],
        },
      },
    })
  },

  stubRemandAndSentencingPing: (httpStatus = 200): SuperAgentRequest =>
    stubFor({
      request: {
        method: 'GET',
        urlPattern: '/remand-and-sentencing-api/health/ping',
      },
      response: {
        status: httpStatus,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: { status: httpStatus === 200 ? 'UP' : 'DOWN' },
      },
    }),
}
