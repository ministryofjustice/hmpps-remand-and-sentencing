import { SuperAgentRequest } from 'superagent'
import { stubFor } from './wiremock'

export default {
  stubGetOffenceByCode: (): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'GET',
        urlPattern: '/manage-offences-api/offences/code/unique/CC12345',
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: {
          id: 548265,
          code: 'CC12345',
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
      },
    })
  },
}
