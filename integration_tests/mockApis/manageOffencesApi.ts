import { SuperAgentRequest } from 'superagent'
import dayjs from 'dayjs'
import { stubFor } from './wiremock'

export default {
  stubGetOffenceByCode: ({
    offenceCode = 'PS90037',
    offenceDescription = 'An offence description',
    endDate = dayjs().add(2, 'days').format('YYYY-MM-DD'),
  }: {
    offenceCode: string
    offenceDescription: string
    endDate: string
  }): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'GET',
        urlPattern: `/manage-offences-api/offences/code/unique/${offenceCode}`,
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: {
          id: 548265,
          code: offenceCode,
          description: offenceDescription,
          offenceType: 'CE',
          revisionId: 338258,
          startDate: '2007-06-30',
          endDate,
          homeOfficeStatsCode: '099/96',
          homeOfficeDescription: 'home office offence description',
          changedDate: '2009-07-17T16:06:30',
          loadDate: '2023-06-05T10:01:42.867682',
          schedules: [],
          isChild: false,
          parentOffenceId: null,
          childOffenceIds: [],
          legislation: '',
          maxPeriodIsLife: false,
          maxPeriodOfIndictmentYears: null,
        },
      },
    })
  },

  stubGetTerrorOffenceByCode: ({
    offenceCode = 'OF61003',
    offenceDescription = 'Solicit to commit murder - Offences Against the Person Act 1861',
    endDate = dayjs().add(2, 'days').format('YYYY-MM-DD'),
  }: {
    offenceCode: string
    offenceDescription: string
    endDate: string
  }): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'GET',
        urlPattern: `/manage-offences-api/offences/code/unique/${offenceCode}`,
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: {
          id: 548265,
          code: offenceCode,
          description: offenceDescription,
          offenceType: 'CE',
          revisionId: 338258,
          startDate: '2007-06-30',
          endDate,
          homeOfficeStatsCode: '099/96',
          homeOfficeDescription: 'home office offence description',
          changedDate: '2009-07-17T16:06:30',
          loadDate: '2023-06-05T10:01:42.867682',
          schedules: [
            {
              id: 4,
              act: 'Sentencing Act 2020',
              code: '17A',
              url: 'https://www.legislation.gov.uk/ukpga/2020/17/schedule/17A',
              partNumber: 2,
              paragraphNumber: null,
              paragraphTitle: null,
              lineReference: null,
              legislationText: null,
            },
            {
              id: 6,
              act: 'Sentencing Act 2020',
              code: '1',
              url: 'https://www.legislation.gov.uk/ukpga/2020/17/schedule/1',
              partNumber: 1,
              paragraphNumber: '4',
              paragraphTitle: 'Offences Against the Person Act 1861',
              lineReference: 'a',
              legislationText: 'Contrary to section 4 of the Offences Against the Person Act 1861.',
            },
            {
              id: 2,
              act: 'Criminal Justice Act 2003',
              code: '15',
              url: 'https://www.legislation.gov.uk/ukpga/2003/44/schedule/15',
              partNumber: 1,
              paragraphNumber: '4',
              paragraphTitle:
                'An offence under any of the following sections of the Offences against the Person Act 1861—',
              lineReference: null,
              legislationText: 'Contrary to section 4 of the Offences Against the Person Act 1861.',
            },
            {
              id: 5,
              act: 'Criminal Justice Act 2003',
              code: '19ZA',
              url: 'https://www.legislation.gov.uk/ukpga/2003/44/schedule/19ZA',
              partNumber: 3,
              paragraphNumber: '',
              paragraphTitle: '',
              lineReference: '',
              legislationText: '',
            },
          ],
          isChild: false,
          parentOffenceId: null,
          childOffenceIds: [],
          legislation: '',
          maxPeriodIsLife: false,
          maxPeriodOfIndictmentYears: null,
        },
      },
    })
  },

  stubGetOffenceByCodeNotFound: (): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'GET',
        urlPattern: '/manage-offences-api/offences/code/unique/AB12345',
      },
      response: {
        status: 404,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: {
          status: 404,
          userMessage: 'Not found: No offence exists for the passed in offence code',
          developerMessage: 'No offence exists for the passed in offence code',
        },
      },
    })
  },
  stubSearchOffenceByName: (): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'GET',
        urlPath: '/manage-offences-api/offences/search',
        queryParameters: {
          excludeLegislation: {
            equalTo: 'true',
          },
          searchString: {
            matches: '.*',
          },
        },
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: [
          {
            id: 548265,
            code: 'PS90037',
            description: 'An offence description',
            offenceType: 'CE',
            revisionId: 338258,
            startDate: '2007-06-30',
            endDate: '2007-06-30',
            homeOfficeStatsCode: '099/96',
            homeOfficeDescription: 'home office offence description',
            changedDate: '2009-07-17T16:06:30',
            loadDate: '2023-06-05T10:01:42.867682',
            schedules: [],
            isChild: false,
            parentOffenceId: null,
            childOffenceIds: [],
            legislation: '',
            maxPeriodIsLife: false,
            maxPeriodOfIndictmentYears: null,
          },
        ],
      },
    })
  },
  stubGetOffencesByCodes: ({
    offenceCode = 'PS90037',
    offenceDescription = 'An offence description',
    legacyOffenceCode = 'PS11111',
  }: {
    offenceCode: string
    offenceDescription: string
    legacyOffenceCode: string
  }): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'GET',
        urlPath: '/manage-offences-api/offences/code/multiple',
        queryParameters: {
          offenceCodes: {
            or: [
              {
                equalTo: offenceCode,
              },
              {
                equalTo: `${offenceCode},${legacyOffenceCode}`,
              },
            ],
          },
        },
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: [
          {
            id: 548265,
            code: offenceCode,
            description: offenceDescription,
            offenceType: 'CE',
            revisionId: 338258,
            startDate: '2007-06-30',
            endDate: '2007-06-30',
            homeOfficeStatsCode: '099/96',
            homeOfficeDescription: 'home office offence description',
            changedDate: '2009-07-17T16:06:30',
            loadDate: '2023-06-05T10:01:42.867682',
            schedules: [],
            isChild: false,
            parentOffenceId: null,
            childOffenceIds: [],
            legislation: '',
            maxPeriodIsLife: false,
            maxPeriodOfIndictmentYears: null,
          },
          {
            id: 60869,
            code: 'OF61003B',
            description: 'Aid & abet soliciting to murder',
            offenceType: 'CI',
            revisionId: 294717,
            startDate: '1961-01-01',
            endDate: '2004-12-25',
            homeOfficeStatsCode: '003/02',
            changedDate: '2023-12-03T10:06:35',
            loadDate: '2024-01-23T15:40:45.820185',
            schedules: [],
            isChild: true,
            parentOffenceId: 60867,
            childOffences: null,
            legislation: null,
            maxPeriodIsLife: true,
            maxPeriodOfIndictmentYears: null,
            lineReference: '',
            legislationText: '',
            paragraphTitle: '',
            paragraphNumber: '',
          },
        ],
      },
    })
  },

  stubOffencesForHmctsJourney: (): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'GET',
        urlPath: '/manage-offences-api/offences/code/multiple',
        queryParameters: {
          offenceCodes: {
            equalTo: 'FS13012,PS90037,BC90005',
          },
        },
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: [
          {
            id: 49378,
            code: 'BC90005',
            description: 'Offer to supply a foreign satellite programme',
            offenceType: 'CE',
            revisionId: 402328,
            startDate: '2015-03-12',
            endDate: null,
            homeOfficeStatsCode: '099/99',
            homeOfficeDescription: 'Other triable either way (non motoring) offences',
            changedDate: '2023-04-25T19:57:02',
            loadDate: '2024-01-23T16:09:53.418364',
            schedules: [],
            isChild: false,
            parentOffenceId: null,
            childOffenceIds: [],
            legislation: 'Contrary to section 178(2) and (4) of the Broadcasting Act 1990.',
            maxPeriodIsLife: false,
            maxPeriodOfIndictmentYears: 2,
            maxPeriodOfIndictmentMonths: null,
            maxPeriodOfIndictmentWeeks: null,
            maxPeriodOfIndictmentDays: null,
            custodialIndicator: 'Y',
          },
          {
            id: 55571,
            code: 'FS13012',
            description: 'Keep cooked or reheated food at temperature below 63 Celsius',
            offenceType: 'CE',
            revisionId: 410290,
            startDate: '2015-03-13',
            endDate: null,
            homeOfficeStatsCode: '091/84',
            homeOfficeDescription: 'Triable either way offences under Food Safety and Hygiene Regulations 2013',
            changedDate: '2023-04-25T19:57:02',
            loadDate: '2024-01-23T15:44:09.140118',
            schedules: [],
            isChild: false,
            parentOffenceId: null,
            childOffenceIds: [],
            legislation:
              'Contrary to paragraph 6 of Schedule 4 to, and regulation 19(2) of, the Food Safety and Hygiene (England) Regulations 2013.',
            maxPeriodIsLife: false,
            maxPeriodOfIndictmentYears: 2,
            maxPeriodOfIndictmentMonths: null,
            maxPeriodOfIndictmentWeeks: null,
            maxPeriodOfIndictmentDays: null,
            custodialIndicator: 'Y',
          },
          {
            id: 548265,
            code: 'PS90037',
            description: 'An offence description',
            offenceType: 'CE',
            revisionId: 338258,
            startDate: '2007-06-30',
            endDate: '2007-06-30',
            homeOfficeStatsCode: '099/96',
            homeOfficeDescription: 'home office offence description',
            changedDate: '2009-07-17T16:06:30',
            loadDate: '2023-06-05T10:01:42.867682',
            schedules: [],
            isChild: false,
            parentOffenceId: null,
            childOffenceIds: [],
            legislation: '',
            maxPeriodIsLife: false,
            maxPeriodOfIndictmentYears: null,
          },
        ],
      },
    })
  },

  stubManageOffencesPing: (httpStatus = 200): SuperAgentRequest =>
    stubFor({
      request: {
        method: 'GET',
        urlPattern: '/manage-offences-api/health/ping',
      },
      response: {
        status: httpStatus,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: { status: httpStatus === 200 ? 'UP' : 'DOWN' },
      },
    }),
}
