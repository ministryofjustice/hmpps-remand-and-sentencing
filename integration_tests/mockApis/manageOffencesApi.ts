import { SuperAgentRequest } from 'superagent'
import dayjs from 'dayjs'
import { stubFor } from './wiremock'
import { Schedule } from '../../server/@types/manageOffencesApi/manageOffencesClientTypes'

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

  stubGetScheduleById: ({
    scheduleId = 5,
  }: {
    scheduleId?: number
    offenceCode?: string
    partNumber?: number
  }): SuperAgentRequest => {
    const schedule: Schedule = {
      id: scheduleId,
      act: 'Some Act',
      code: 'SCHEDULE_CODE',
      url: '/manage-offences-api/schedule/by-id/5',
      scheduleParts: [
        {
          id: 1,
          partNumber: 9,
          offences: [
            {
              id: 61002,
              code: 'OF61129',
              description:
                'Send / deliver noxious thing with intent to burn / maim / disfigure / disable / do grievous bodily harm',
              offenceType: 'CI',
              revisionId: 587881,
              startDate: '1997-11-24',
              endDate: null,
              homeOfficeStatsCode: '005/07',
              changedDate: '2023-04-25T19:57:02',
              loadDate: '2024-01-23T15:40:47.106577',
              schedules: [],
              isChild: false,
              parentOffenceId: null,
              childOffences: null,
              legislation: null,
              maxPeriodIsLife: true,
              maxPeriodOfIndictmentYears: null,
              lineReference: null,
              legislationText: null,
              paragraphTitle: null,
              paragraphNumber: null,
            },
          ],
        },
        {
          id: 10,
          partNumber: 2,
          offences: [],
        },
        {
          id: 11,
          partNumber: 3,
          offences: [
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
      ],
    }

    return stubFor({
      request: {
        method: 'GET',
        urlPattern: `/manage-offences-api/schedule/by-id/${scheduleId}`,
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: schedule,
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
