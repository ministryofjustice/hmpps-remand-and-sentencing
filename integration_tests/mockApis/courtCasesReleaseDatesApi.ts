import { SuperAgentRequest } from 'superagent'
import { stubFor } from './wiremock'

export default {
  stubGetServiceDefinitions: (): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'GET',
        urlPattern: '/court-cases-release-dates-api/service-definitions/prisoner/A1234AB',
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: {
          services: {
            overview: {
              href: 'http://localhost:8000/prisoner/AB1234AB/overview',
              text: 'Overview',
              thingsToDo: {
                count: 0,
                things: [],
              },
            },
            courtCases: {
              href: 'http://localhost:3007/person/AB1234AB',
              text: 'Court cases',
              thingsToDo: {
                count: 0,
                things: [],
              },
            },
            adjustments: {
              href: 'http://localhost:8002/AB1234AB',
              text: 'Adjustments',
              thingsToDo: {
                count: 0,
                things: [],
              },
            },
            releaseDates: {
              href: 'http://localhost:8004?prisonId=AB1234AB',
              text: 'Release dates and calculations',
              thingsToDo: {
                count: 1,
                things: [
                  {
                    title: 'Calculation required',
                    message:
                      'Some information has changed. Check that all information is up to date then calculate release dates.',
                    buttonText: 'Calculate release dates',
                    buttonHref:
                      'https://calculate-release-dates-dev.hmpps.service.justice.gov.uk/calculation/A9435DY/reason',
                    type: 'CALCULATION_REQUIRED',
                  },
                ],
              },
            },
          },
        },
      },
    })
  },
}
