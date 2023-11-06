import { SuperAgentRequest } from 'superagent'
import { stubFor } from './wiremock'

export default {
  stubGetPersonDetails: (): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'GET',
        urlPattern: '/person/A1234AB',
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
}
