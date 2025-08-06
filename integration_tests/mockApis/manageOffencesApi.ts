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
  }: {
    offenceCode: string
    offenceDescription: string
  }): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'GET',
        urlPath: '/manage-offences-api/offences/code/multiple',
        queryParameters: {
          offenceCodes: {
            equalTo: offenceCode,
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
