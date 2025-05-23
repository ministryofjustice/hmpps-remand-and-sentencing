import { SuperAgentRequest } from 'superagent'
import { stubFor, verifyRequest } from './wiremock'

export default {
  stubCreateCourtCase: ({ nextHearingDate = '' }: { nextHearingDate: string }): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'POST',
        urlPattern: '/remand-and-sentencing-api/court-case',
        bodyPatterns: [
          {
            equalToJson: `{"prisonerId": "A1234AB", "prisonId": "MDI", "appearances": [{"outcomeUuid": "6da892fa-d85e-44de-95d4-a7f06c3a2dcb", "courtCode": "ACCRYC", "courtCaseReference": "T12345678", "appearanceDate": "2023-05-12", "prisonId": "MDI", "nextCourtAppearance": {"appearanceDate": "${nextHearingDate}", "courtCode": "ACCRYC", "appearanceTypeUuid": "63e8fce0-033c-46ad-9edf-391b802d547a", "prisonId": "MDI"}, "charges": [{"offenceCode": "PS90037", "offenceStartDate": "2023-05-12", "outcomeUuid": "85ffc6bf-6a2c-4f2b-8db8-5b466b602537", "prisonId": "MDI"}], "warrantType": "REMAND"}]}`,
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
        method: 'POST',
        urlPattern: '/remand-and-sentencing-api/court-case',
        bodyPatterns: [
          {
            equalToJson:
              '{ "prisonerId" : "A1234AB", "appearances" : [ { "outcomeUuid" : "62412083-9892-48c9-bf01-7864af4a8b3c", "courtCode" : "ACCRYC", "courtCaseReference" : "T12345678", "appearanceDate" : "2023-05-12", "charges" : [ { "offenceCode" : "PS90037", "offenceStartDate" : "2023-05-12", "outcomeUuid" : "f17328cf-ceaa-43c2-930a-26cf74480e18", "prisonId" : "MDI", "sentence" : { "chargeNumber" : "1", "periodLengths" : [ { "days" : 4, "weeks" : 3, "months" : 2, "years" : 1, "periodOrder" : "years,months,weeks,days", "type" : "SENTENCE_LENGTH", "prisonId" : "MDI" } ], "sentenceServeType" : "FORTHWITH", "sentenceTypeId" : "467e2fa8-fce1-41a4-8110-b378c727eed3", "prisonId" : "MDI", "sentenceReference" : "0", "convictionDate" : "2023-05-12" } } ], "warrantType" : "SENTENCING", "prisonId" : "MDI", "overallSentenceLength" : { "days" : 2, "weeks" : 3, "months" : 5, "years" : 4, "periodOrder" : "years,months,weeks,days", "type" : "OVERALL_SENTENCE_LENGTH", "prisonId" : "MDI" }, "overallConvictionDate" : "2023-05-12" } ], "prisonId" : "MDI" }',
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
                warrantType: 'REMAND',
                courtCaseReference: 'C894623',
                appearanceDate: '2023-12-15',
                nextCourtAppearance: {
                  appearanceDate: '2024-12-15',
                  appearanceTime: '10:30:00.000000000',
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
                  warrantType: 'REMAND',
                  appearanceDate: '2023-12-15',
                  nextCourtAppearance: {
                    appearanceDate: '2024-12-15',
                    appearanceTime: '10:30:00.000000000',
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
                  warrantType: 'REMAND',
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
                        outcomeUuid: '66032e17-977a-40f9-b634-1bc2b45e874d',
                        outcomeName: 'Lie on file',
                        nomisCode: '7863',
                        outcomeType: 'REMAND',
                        displayOrder: 20,
                        dispositionCode: 'FINAL',
                      },
                    },
                  ],
                },
              ],
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
                warrantType: 'REMAND',
                courtCaseReference: 'C894623',
                appearanceDate: '2023-12-15',
                nextCourtAppearance: {
                  appearanceDate: '2024-12-15',
                  courtCode: 'Birmingham Crown Court',
                  appearanceType: {
                    appearanceTypeUuid: '63e8fce0-033c-46ad-9edf-391b802d547a',
                    description: 'Court appearance',
                    displayOrder: 10,
                  },
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
                      outcomeDispositionCode: 'INTERIM',
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
                  warrantType: 'REMAND',
                  appearanceDate: '2023-12-15',
                  nextCourtAppearance: {
                    appearanceDate: '2024-12-15',
                    courtCode: 'Birmingham Crown Court',
                    appearanceType: {
                      appearanceTypeUuid: '63e8fce0-033c-46ad-9edf-391b802d547a',
                      description: 'Court appearance',
                      displayOrder: 10,
                    },
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
                        outcomeDispositionCode: 'INTERIM',
                      },
                    },
                  ],
                },
              ],
            },
            {
              prisonerId: 'A1234AB',
              courtCaseUuid: '261911e2-6346-42e0-b025-a806048f4d04',
              status: 'ACTIVE',
              latestAppearance: {
                appearanceUuid: 'ff6e0dbf-f38a-4131-9c61-ad529188412f',
                lifetimeUuid: 'a19d8229-3098-4fc1-93a8-c19b4d247541',
                outcome: {
                  outcomeUuid: '6fa97bb8-02f8-40ec-8758-fcb16bf315c6',
                  outcomeName: 'Imprisonment',
                  nomisCode: '1002',
                  outcomeType: 'SENTENCING',
                  displayOrder: 10,
                  relatedChargeOutcomeUuid: 'f4617346-3b8e-467b-acc4-a4fab809ed3b',
                },
                courtCode: 'ACCRYC',
                courtCaseReference: 'XX1234',
                appearanceDate: '2024-01-23',
                warrantId: null,
                warrantType: 'SENTENCING',
                nextCourtAppearance: null,
                charges: [
                  {
                    chargeUuid: 'aeb5ba2e-0bf5-444d-b540-4739012cd7a5',
                    offenceCode: 'PS90037',
                    offenceStartDate: '2023-10-11',
                    offenceEndDate: null,
                    outcome: {
                      outcomeUuid: 'f4617346-3b8e-467b-acc4-a4fab809ed3b',
                      outcomeName: 'Imprisonment',
                      nomisCode: '1002',
                      outcomeType: 'SENTENCING',
                      displayOrder: 10,
                      dispositionCode: 'FINAL',
                    },
                    sentence: {
                      sentenceUuid: '29fa8c7f-7ba1-4033-ac4d-83ff0c125a45',
                      chargeNumber: '1',
                      periodLengths: [
                        {
                          years: 1,
                          months: null,
                          weeks: null,
                          days: null,
                          periodOrder: 'years',
                          periodLengthType: 'TARIFF_LENGTH',
                          legacyData: null,
                        },
                      ],
                      sentenceServeType: 'FORTHWITH',
                      consecutiveToChargeNumber: null,
                      sentenceType: null,
                      convictionDate: '2023-10-12',
                      fineAmount: null,
                      legacyData: {
                        sentenceCalcType: 'A',
                        sentenceCategory: 'B',
                        sentenceTypeDesc: 'A NOMIS Sentence Type',
                      },
                    },
                    legacyData: null,
                  },
                  {
                    chargeUuid: '5073470d-56f4-41b0-9e71-dfe468ed3455',
                    offenceCode: 'PS90037',
                    offenceStartDate: '2024-05-11',
                    offenceEndDate: null,
                    outcome: {
                      outcomeUuid: 'f4617346-3b8e-467b-acc4-a4fab809ed3b',
                      outcomeName: 'Imprisonment',
                      nomisCode: '1002',
                      outcomeType: 'SENTENCING',
                      displayOrder: 10,
                      dispositionCode: 'FINAL',
                    },
                    sentence: {
                      sentenceUuid: '7484fdbc-8e74-4590-b842-b131a004ab61',
                      chargeNumber: '2',
                      periodLengths: [
                        {
                          years: null,
                          months: 6,
                          weeks: null,
                          days: null,
                          periodOrder: 'months',
                          periodLengthType: 'TERM_LENGTH',
                          legacyData: null,
                        },
                      ],
                      sentenceServeType: 'CONCURRENT',
                      consecutiveToChargeNumber: null,
                      sentenceType: null,
                      convictionDate: '2024-05-11',
                      fineAmount: {
                        fineAmount: 10,
                      },
                      legacyData: {
                        sentenceCalcType: 'C',
                        sentenceCategory: 'D',
                        sentenceTypeDesc: 'A NOMIS Fine Sentence Type',
                      },
                    },
                    legacyData: null,
                  },
                  {
                    chargeUuid: '2e528853-b19f-4af9-9014-ff63824d759b',
                    offenceCode: 'PS90037',
                    offenceStartDate: '2023-05-11',
                    offenceEndDate: null,
                    outcome: {
                      outcomeUuid: 'f4617346-3b8e-467b-acc4-a4fab809ed3b',
                      outcomeName: 'Imprisonment',
                      nomisCode: '1002',
                      outcomeType: 'SENTENCING',
                      displayOrder: 10,
                      dispositionCode: 'FINAL',
                    },
                    sentence: {
                      sentenceUuid: 'fda6e6b3-fd5d-480d-b7e6-cf6457e2826b',
                      chargeNumber: '3',
                      periodLengths: [
                        {
                          years: null,
                          months: 2,
                          weeks: null,
                          days: null,
                          periodOrder: 'years,months,weeks,days',
                          periodLengthType: 'TERM_LENGTH',
                          legacyData: null,
                        },
                      ],
                      sentenceServeType: 'CONSECUTIVE',
                      consecutiveToSentenceUuid: '8e33074a-3240-4073-923a-b69b642e037c',
                      sentenceType: null,
                      convictionDate: '2024-05-11',
                      fineAmount: {
                        fineAmount: 10,
                      },
                      legacyData: {
                        sentenceCalcType: 'C',
                        sentenceCategory: 'D',
                        sentenceTypeDesc: 'A NOMIS Fine Sentence Type',
                      },
                    },
                    legacyData: null,
                  },
                  {
                    chargeUuid: '585a194f-1263-42a8-910a-2a11cd156260',
                    offenceCode: 'PS90037',
                    offenceStartDate: '2024-01-07',
                    offenceEndDate: null,
                    outcome: {
                      outcomeUuid: 'f4617346-3b8e-467b-acc4-a4fab809ed3b',
                      outcomeName: 'Imprisonment',
                      nomisCode: '1002',
                      outcomeType: 'SENTENCING',
                      displayOrder: 10,
                      dispositionCode: 'FINAL',
                    },
                    sentence: {
                      sentenceUuid: 'f8fb24e0-aef2-4cab-ab39-23ba9429579d',
                      chargeNumber: '4',
                      periodLengths: [
                        {
                          years: null,
                          months: 3,
                          weeks: null,
                          days: null,
                          periodOrder: 'years,months,weeks,days',
                          periodLengthType: 'TERM_LENGTH',
                          legacyData: null,
                        },
                      ],
                      sentenceServeType: 'CONSECUTIVE',
                      consecutiveToSentenceUuid: '29fa8c7f-7ba1-4033-ac4d-83ff0c125a45',
                      sentenceType: null,
                      convictionDate: '2024-05-11',
                      fineAmount: {
                        fineAmount: 10,
                      },
                      legacyData: {
                        sentenceCalcType: 'C',
                        sentenceCategory: 'D',
                        sentenceTypeDesc: 'A NOMIS Fine Sentence Type',
                      },
                    },
                    legacyData: null,
                  },
                ],
                overallSentenceLength: {
                  years: 1,
                  months: null,
                  weeks: null,
                  days: null,
                  periodOrder: 'years',
                  periodLengthType: 'OVERALL_SENTENCE_LENGTH',
                  legacyData: null,
                },
                overallConvictionDate: '2023-10-23',
                legacyData: null,
              },
              appearances: [
                {
                  appearanceUuid: 'ff6e0dbf-f38a-4131-9c61-ad529188412f',
                  lifetimeUuid: 'a19d8229-3098-4fc1-93a8-c19b4d247541',
                  outcome: {
                    outcomeUuid: '6fa97bb8-02f8-40ec-8758-fcb16bf315c6',
                    outcomeName: 'Imprisonment',
                    nomisCode: '1002',
                    outcomeType: 'SENTENCING',
                    displayOrder: 10,
                    relatedChargeOutcomeUuid: 'f4617346-3b8e-467b-acc4-a4fab809ed3b',
                  },
                  courtCode: 'ACCRYC',
                  courtCaseReference: 'XX1234',
                  appearanceDate: '2024-01-23',
                  warrantId: null,
                  warrantType: 'SENTENCING',
                  nextCourtAppearance: null,
                  charges: [
                    {
                      chargeUuid: 'aeb5ba2e-0bf5-444d-b540-4739012cd7a5',
                      lifetimeUuid: 'bf831234-41af-4ba6-b7d0-bd36b02dd5fa',
                      offenceCode: 'PS90037',
                      offenceStartDate: '2023-10-11',
                      offenceEndDate: null,
                      outcome: {
                        outcomeUuid: 'f4617346-3b8e-467b-acc4-a4fab809ed3b',
                        outcomeName: 'Imprisonment',
                        nomisCode: '1002',
                        outcomeType: 'SENTENCING',
                        displayOrder: 10,
                        dispositionCode: 'FINAL',
                      },
                      sentence: {
                        sentenceUuid: '29fa8c7f-7ba1-4033-ac4d-83ff0c125a45',
                        sentenceLifetimeUuid: '34511c2a-3daf-4d07-a8e2-47046c12967f',
                        chargeNumber: '1',
                        periodLengths: [
                          {
                            years: 1,
                            months: null,
                            weeks: null,
                            days: null,
                            periodOrder: 'years',
                            periodLengthType: 'TARIFF_LENGTH',
                            legacyData: null,
                          },
                        ],
                        sentenceServeType: 'FORTHWITH',
                        consecutiveToChargeNumber: null,
                        sentenceType: null,
                        convictionDate: '2023-10-12',
                        fineAmount: null,
                        legacyData: {
                          sentenceCalcType: 'A',
                          sentenceCategory: 'B',
                          sentenceTypeDesc: 'A NOMIS Sentence Type',
                        },
                      },
                      legacyData: null,
                    },
                  ],
                  overallSentenceLength: {
                    years: 1,
                    months: null,
                    weeks: null,
                    days: null,
                    periodOrder: 'years',
                    periodLengthType: 'OVERALL_SENTENCE_LENGTH',
                    legacyData: null,
                  },
                  overallConvictionDate: '2023-10-23',
                  legacyData: null,
                },
              ],
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
              draftAppearances: [],
            },
            {
              prisonerId: 'A1234AB',
              courtCaseUuid: 'e3ef1929-98b7-4034-bfdf-5c597f51fca7',
              latestAppearance: {
                appearanceUuid: '7693a85c-c70a-4f52-b1ba-ef36d35ff940',
                outcome: {
                  outcomeUuid: '6fa97bb8-02f8-40ec-8758-fcb16bf315c6',
                  outcomeName: 'Imprisonment',
                  nomisCode: '1002',
                  outcomeType: 'SENTENCING',
                  displayOrder: 10,
                  relatedChargeOutcomeUuid: 'f4617346-3b8e-467b-acc4-a4fab809ed3b',
                },
                courtCode: 'ACCRYC',
                courtCaseReference: 'XX1234',
                appearanceDate: '2024-01-23',
                warrantId: null,
                warrantType: 'SENTENCING',
                nextCourtAppearance: null,
                charges: [
                  {
                    chargeUuid: '022569bc-a1fd-4a00-bdf9-f916139ead29',
                    offenceCode: 'PS90037',
                    offenceStartDate: '2025-05-20',
                    outcome: {
                      outcomeUuid: 'f4617346-3b8e-467b-acc4-a4fab809ed3b',
                      outcomeName: 'Imprisonment',
                      nomisCode: '1002',
                      outcomeType: 'SENTENCING',
                      displayOrder: 10,
                      dispositionCode: 'FINAL',
                    },
                    sentence: {
                      sentenceUuid: 'f327bc1d-610f-41ee-b700-410c08a9cefa',
                      chargeNumber: '1',
                      periodLengths: [
                        {
                          years: 1,
                          months: null,
                          weeks: null,
                          days: null,
                          periodOrder: 'years',
                          periodLengthType: 'TARIFF_LENGTH',
                          legacyData: null,
                        },
                      ],
                      sentenceServeType: 'FORTHWITH',
                      consecutiveToChargeNumber: null,
                      sentenceType: null,
                      convictionDate: '2023-10-12',
                      fineAmount: null,
                      legacyData: {
                        sentenceCalcType: 'A',
                        sentenceCategory: 'B',
                        sentenceTypeDesc: 'A NOMIS Sentence Type',
                      },
                      hasRecall: true,
                    },
                  },
                ],
              },
              appearances: [
                {
                  appearanceUuid: '7693a85c-c70a-4f52-b1ba-ef36d35ff940',
                  outcome: {
                    outcomeUuid: '6fa97bb8-02f8-40ec-8758-fcb16bf315c6',
                    outcomeName: 'Imprisonment',
                    nomisCode: '1002',
                    outcomeType: 'SENTENCING',
                    displayOrder: 10,
                    relatedChargeOutcomeUuid: 'f4617346-3b8e-467b-acc4-a4fab809ed3b',
                  },
                  courtCode: 'ACCRYC',
                  courtCaseReference: 'XX1234',
                  appearanceDate: '2024-01-23',
                  warrantId: null,
                  warrantType: 'SENTENCING',
                  nextCourtAppearance: null,
                  charges: [
                    {
                      chargeUuid: '022569bc-a1fd-4a00-bdf9-f916139ead29',
                      offenceCode: 'PS90037',
                      offenceStartDate: '2025-05-20',
                      outcome: {
                        outcomeUuid: 'f4617346-3b8e-467b-acc4-a4fab809ed3b',
                        outcomeName: 'Imprisonment',
                        nomisCode: '1002',
                        outcomeType: 'SENTENCING',
                        displayOrder: 10,
                        dispositionCode: 'FINAL',
                      },
                      sentence: {
                        sentenceUuid: 'f327bc1d-610f-41ee-b700-410c08a9cefa',
                        chargeNumber: '1',
                        periodLengths: [
                          {
                            years: 1,
                            months: null,
                            weeks: null,
                            days: null,
                            periodOrder: 'years',
                            periodLengthType: 'TARIFF_LENGTH',
                            legacyData: null,
                          },
                        ],
                        sentenceServeType: 'FORTHWITH',
                        consecutiveToChargeNumber: null,
                        sentenceType: null,
                        convictionDate: '2023-10-12',
                        fineAmount: null,
                        legacyData: {
                          sentenceCalcType: 'A',
                          sentenceCategory: 'B',
                          sentenceTypeDesc: 'A NOMIS Sentence Type',
                        },
                        hasRecall: true,
                      },
                    },
                  ],
                },
              ],
              status: 'ACTIVE',
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

  stubEmptySearchCourtCases: ({ sortBy = 'desc' }: { sortBy: string }): SuperAgentRequest => {
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

  stubGetLatestCourtAppearanceWithSentencing: (): SuperAgentRequest => {
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
      requestUrlPattern: '/remand-and-sentencing-api/court-case',
      method: 'POST',
      body: {
        prisonerId: 'A1234AB',
        prisonId: 'MDI',
        appearances: [
          {
            outcomeUuid: '6da892fa-d85e-44de-95d4-a7f06c3a2dcb',
            courtCode: 'ACCRYC',
            courtCaseReference: 'T12345678',
            appearanceDate: '2023-05-12',
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
                offenceCode: 'PS90037',
                offenceStartDate: '2023-05-12',
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
      requestUrlPattern: '/remand-and-sentencing-api/court-case',
      method: 'POST',
      body: {
        prisonerId: 'A1234AB',
        appearances: [
          {
            outcomeUuid: '62412083-9892-48c9-bf01-7864af4a8b3c',
            courtCode: 'ACCRYC',
            courtCaseReference: 'T12345678',
            appearanceDate: '2023-05-12',
            charges: [
              {
                offenceCode: 'PS90037',
                offenceStartDate: '2023-05-12',
                outcomeUuid: 'f17328cf-ceaa-43c2-930a-26cf74480e18',
                prisonId: 'MDI',
                sentence: {
                  chargeNumber: '1',
                  periodLengths: [
                    {
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
        method: 'POST',
        urlPattern: '/remand-and-sentencing-api/court-appearance',
        bodyPatterns: [
          {
            equalToJson: `{"courtCaseUuid": "3fa85f64-5717-4562-b3fc-2c963f66afa6", "outcomeUuid": "6da892fa-d85e-44de-95d4-a7f06c3a2dcb", "courtCode": "ACCRYC", "courtCaseReference": "C894623", "appearanceDate": "2023-05-12", "prisonId": "MDI", "charges": [{"offenceCode": "PS90037", "offenceStartDate": "2023-05-12", "outcomeUuid": "85ffc6bf-6a2c-4f2b-8db8-5b466b602537", "prisonId": "MDI", "chargeUuid": "71bb9f7e-971c-4c34-9a33-43478baee74f" }, { "offenceCode": "PS90037", "offenceStartDate": "2023-05-12", "outcomeUuid": "85ffc6bf-6a2c-4f2b-8db8-5b466b602537", "prisonId": "MDI" }], "warrantType": "REMAND", "nextCourtAppearance": {"appearanceDate": "${nextHearingDate}", "courtCode": "ACCRYC", "appearanceTypeUuid": "63e8fce0-033c-46ad-9edf-391b802d547a", "prisonId": "MDI"}}`,
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
      requestUrlPattern: '/remand-and-sentencing-api/court-appearance',
      method: 'POST',
      body: {
        courtCaseUuid: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
        outcomeUuid: '6da892fa-d85e-44de-95d4-a7f06c3a2dcb',
        courtCode: 'ACCRYC',
        courtCaseReference: 'C894623',
        appearanceDate: '2023-05-12',
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
            offenceCode: 'PS90037',
            offenceStartDate: '2023-05-12',
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
        method: 'POST',
        urlPattern: '/remand-and-sentencing-api/court-appearance',
        bodyPatterns: [
          {
            equalToJson:
              '{ "courtCaseUuid" : "3fa85f64-5717-4562-b3fc-2c963f66afa6", "outcomeUuid" : "62412083-9892-48c9-bf01-7864af4a8b3c", "courtCode" : "ACCRYC", "courtCaseReference" : "C894623", "appearanceDate" : "2023-05-12", "charges" : [ { "offenceCode" : "PS90037", "offenceStartDate" : "2023-05-12", "outcomeUuid" : "63920fee-e43a-45ff-a92d-4679f1af2527", "prisonId" : "MDI", "chargeUuid" : "71bb9f7e-971c-4c34-9a33-43478baee74f", "sentence" : { "chargeNumber" : "1", "periodLengths" : [ { "months" : 5, "years" : 4, "periodOrder" : "years,months,weeks,days", "type" : "SENTENCE_LENGTH", "prisonId" : "MDI" } ], "sentenceServeType" : "FORTHWITH", "sentenceTypeId" : "467e2fa8-fce1-41a4-8110-b378c727eed3", "prisonId" : "MDI", "sentenceReference" : "0", "convictionDate" : "2023-05-12" } } ], "warrantType" : "SENTENCING", "prisonId" : "MDI", "overallSentenceLength" : { "months" : 5, "years" : 4, "periodOrder" : "years,months,weeks,days", "type" : "OVERALL_SENTENCE_LENGTH", "prisonId" : "MDI" }, "overallConvictionDate" : "2023-05-12" }',
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
        outcomeUuid: '62412083-9892-48c9-bf01-7864af4a8b3c',
        courtCode: 'ACCRYC',
        courtCaseReference: 'C894623',
        appearanceDate: '2023-05-12',
        charges: [
          {
            offenceCode: 'PS90037',
            offenceStartDate: '2023-05-12',
            outcomeUuid: '63920fee-e43a-45ff-a92d-4679f1af2527',
            prisonId: 'MDI',
            chargeUuid: '71bb9f7e-971c-4c34-9a33-43478baee74f',
            sentence: {
              chargeNumber: '1',
              periodLengths: [
                {
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
              sentenceReference: '0',
              convictionDate: '2023-05-12',
            },
          },
        ],
        warrantType: 'SENTENCING',
        prisonId: 'MDI',
        overallSentenceLength: {
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
                outcomeDispositionCode: 'INTERIM',
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
                dispositionCode: 'INTERIM',
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
                consecutiveToChargeNumber: '1',
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
              '{ "courtCaseUuid" : "83517113-5c14-4628-9133-1e3cb12e31fa", "appearanceUuid" : "3fa85f64-5717-4562-b3fc-2c963f66afa6", "outcomeUuid" : "4b2a225e-5bb1-4bf7-8719-6ff9f3ee0d10", "courtCode" : "STHHPM", "courtCaseReference" : "C894623", "appearanceDate" : "2023-12-15", "charges" : [ { "offenceCode" : "PS90037", "offenceStartDate" : "2023-12-15", "outcomeUuid" : "85ffc6bf-6a2c-4f2b-8db8-5b466b602537", "prisonId" : "MDI", "chargeUuid" : "a6d6dbaf-9dc8-443d-acb4-5b52dd919f11", "sentence" : { "chargeNumber" : "3", "periodLengths" : [ { "years" : 2, "periodOrder" : "years,months,weeks,days", "type" : "CUSTODIAL_TERM", "periodLengthUuid" : "2b8002ad-f2d4-45a6-a186-df2326e37159", "prisonId" : "MDI" }, { "years" : 2, "periodOrder" : "years,months,weeks,days", "type" : "LICENCE_PERIOD", "periodLengthUuid" : "ef7984c6-fcbf-407b-b5dd-896cb5793d7f", "prisonId" : "MDI" } ], "sentenceServeType" : "CONSECUTIVE", "sentenceTypeId" : "0197d1a8-3663-432d-b78d-16933b219ec7", "prisonId" : "MDI", "sentenceReference" : "0", "sentenceUuid" : "b0f83d31-efbe-462c-970d-5293975acb17" } }, { "offenceCode" : "PS90037", "offenceStartDate" : "2023-12-15", "outcomeUuid" : "85ffc6bf-6a2c-4f2b-8db8-5b466b602537", "prisonId" : "MDI", "chargeUuid" : "71bb9f7e-971c-4c34-9a33-43478baee74f", "sentence" : { "chargeNumber" : "1", "periodLengths" : [ { "years" : 4, "periodOrder" : "years,months,weeks,days", "type" : "SENTENCE_LENGTH", "periodLengthUuid" : "bf6e75e4-2137-48ee-84fe-df0a18e65047", "prisonId" : "MDI" } ], "sentenceServeType" : "FORTHWITH", "sentenceTypeId" : "467e2fa8-fce1-41a4-8110-b378c727eed3", "prisonId" : "MDI", "sentenceReference" : "1", "sentenceUuid" : "3a0a10d5-1ba0-403b-86d6-8cc75ee88454" } }, { "offenceCode" : "PS90037", "offenceStartDate" : "2023-12-14", "outcomeUuid" : "85ffc6bf-6a2c-4f2b-8db8-5b466b602537", "prisonId" : "MDI", "chargeUuid" : "a94b4ba8-d6b4-443e-bf69-7f1dab98a6bf", "sentence" : { "chargeNumber" : "2", "periodLengths" : [ { "months" : 2, "years" : 1, "periodOrder" : "years,months,weeks,days", "type" : "SENTENCE_LENGTH", "periodLengthUuid" : "f15d1f04-f124-4662-b076-f9be92727304", "prisonId" : "MDI" } ], "sentenceServeType" : "UNKNOWN", "prisonId" : "MDI", "sentenceReference" : "2" } } ], "warrantType" : "SENTENCING", "prisonId" : "MDI", "overallSentenceLength" : { "years" : 4, "periodOrder" : "years", "type" : "OVERALL_SENTENCE_LENGTH", "prisonId" : "MDI" }, "overallConvictionDate" : "2024-09-12" }',
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
                },
                {
                  years: 2,
                  periodOrder: 'years,months,weeks,days',
                  type: 'LICENCE_PERIOD',
                  periodLengthUuid: 'ef7984c6-fcbf-407b-b5dd-896cb5793d7f',
                  prisonId: 'MDI',
                },
              ],
              sentenceServeType: 'CONSECUTIVE',
              sentenceTypeId: '0197d1a8-3663-432d-b78d-16933b219ec7',
              prisonId: 'MDI',
              sentenceReference: '0',
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
              sentenceServeType: 'UNKNOWN',
              prisonId: 'MDI',
              sentenceReference: '2',
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
                  offenceStartDate: '2023-12-15',
                  legacyData: {
                    offenderChargeId: '1',
                    bookingId: '1',
                    postedDate: '1-1-2010',
                    nomisOutcomeCode: '678324',
                    outcomeDescription: 'A Nomis Outcome',
                    outcomeDispositionCode: 'INTERIM',
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
          statuses: {
            equalTo: 'ACTIVE',
          },
          offenceDate: {
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
            displayOrder: 100,
          },
          {
            sentenceTypeUuid: 'bc929dc9-019c-4acc-8fd9-9f9682ebbd72',
            description: 'EDS (Extended Determinate Sentence)',
            classification: 'EXTENDED',
            displayOrder: 50,
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
            outcomeUuid: '4b2a225e-5bb1-4bf7-8719-6ff9f3ee0d10',
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
            displayOrder: 10,
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

  stubGetHasSentenceToChainTo: (): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'GET',
        urlPath: '/remand-and-sentencing-api/person/A1234AB/has-sentence-to-chain-to',
        queryParameters: {
          beforeOrOnAppearanceDate: {
            equalTo: '2023-05-12',
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

  stubGetSentencesToChainTo: (): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'GET',
        urlPath: '/remand-and-sentencing-api/person/A1234AB/sentences-to-chain-to',
        queryParameters: {
          beforeOrOnAppearanceDate: {
            equalTo: '2023-05-12',
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

  stubGetConsecutiveToDetails: (): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'GET',
        urlPath: '/remand-and-sentencing-api/sentence/consecutive-to-details',
        queryParameters: {
          sentenceUuids: {
            equalTo: '8e33074a-3240-4073-923a-b69b642e037c,29fa8c7f-7ba1-4033-ac4d-83ff0c125a45',
          },
        },
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: {
          sentences: [
            {
              courtCode: 'STHHPM',
              courtCaseReference: 'X34345',
              appearanceDate: '2023-02-23',
              offenceCode: 'PS90037',
              offenceStartDate: '2023-01-17',
              sentenceUuid: '8e33074a-3240-4073-923a-b69b642e037c',
              countNumber: '1',
            },
            {
              courtCode: 'ACCRYC',
              courtCaseReference: 'XX1234',
              appearanceDate: '2024-01-23',
              offenceCode: 'PS90037',
              offenceStartDate: '2023-10-11',
              sentenceUuid: '29fa8c7f-7ba1-4033-ac4d-83ff0c125a45',
              countNumber: '1',
            },
          ],
        },
      },
    })
  },
}
