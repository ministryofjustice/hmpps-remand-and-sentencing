import { SuperAgentRequest } from 'superagent'
import { stubFor } from './wiremock'

export default {
  stubSearchCourt: (): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'GET',
        urlPath: '/court-register-api/courts/paged',
        queryParameters: {
          page: {
            equalTo: '0',
          },
          size: {
            equalTo: '50',
          },
          sort: {
            equalTo: 'courtName',
          },
          textSearch: {
            matches: '.*',
          },
        },
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: {
          content: [
            {
              courtId: 'ACCRYC',
              courtName: 'Accrington Youth Court',
              courtDescription: 'Accrington Youth Court',
              type: {
                courtType: 'COU',
                courtName: 'County Court/County Divorce Ct',
              },
              active: true,
              buildings: [
                {
                  id: 10000,
                  courtId: 'ACCRYC',
                  subCode: 'AAABBB',
                  addressLine1: 'Crown House',
                  addressLine2: '452 West Street',
                  addressLine3: 'Swansea',
                  addressLine4: 'West Cross',
                  addressLine5: 'South Glamorgan',
                  postcode: 'SA3 4HT',
                  contacts: [
                    {
                      id: 10000,
                      courtId: 'ACCRYC',
                      buildingId: 12312,
                      type: 'TEL',
                      detail: '555 55555',
                    },
                  ],
                  active: true,
                },
              ],
            },
          ],
          pageable: {
            offset: 0,
            sort: [
              {
                direction: 'string',
                nullHandling: 'string',
                ascending: true,
                property: 'string',
                ignoreCase: true,
              },
            ],
            pageSize: 0,
            pageNumber: 0,
            paged: true,
            unpaged: true,
          },
          last: true,
          totalPages: 0,
          totalElements: 0,
          first: true,
          size: 0,
          number: 0,
          sort: [
            {
              direction: 'string',
              nullHandling: 'string',
              ascending: true,
              property: 'string',
              ignoreCase: true,
            },
          ],
          numberOfElements: 0,
          empty: true,
        },
      },
    })
  },

  stubGetCourtById: ({
    courtId = 'ACCRYC',
    courtName = 'Accrington Youth Court',
  }: {
    courtId: string
    courtName: string
  }): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'GET',
        urlPath: `/court-register-api/courts/id/${courtId}`,
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: {
          courtId,
          courtName,
          courtDescription: 'Accrington Youth Court',
          type: {
            courtType: 'COU',
            courtName: 'County Court/County Divorce Ct',
          },
          active: true,
          buildings: [
            {
              id: 10000,
              courtId: 'ACCRYC',
              subCode: 'AAABBB',
              addressLine1: 'Crown House',
              addressLine2: '452 West Street',
              addressLine3: 'Swansea',
              addressLine4: 'West Cross',
              addressLine5: 'South Glamorgan',
              postcode: 'SA3 4HT',
              contacts: [
                {
                  id: 10000,
                  courtId: 'ACCRYC',
                  buildingId: 12312,
                  type: 'TEL',
                  detail: '555 55555',
                },
              ],
              active: true,
            },
          ],
        },
      },
    })
  },

  stubGetCourtsByIds: (): SuperAgentRequest => {
    return stubFor({
      request: {
        method: 'GET',
        urlPath: '/court-register-api/courts/id/multiple',
        queryParameters: {
          courtIds: {
            or: [
              {
                equalTo: 'ACCRYC',
              },
              {
                equalTo: 'Birmingham Crown Court',
              },
              {
                equalTo: 'STHHPM',
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
            courtId: 'ACCRYC',
            courtName: 'Accrington Youth Court',
            courtDescription: 'Accrington Youth Court',
            type: {
              courtType: 'COU',
              courtName: 'County Court/County Divorce Ct',
            },
            active: true,
            buildings: [
              {
                id: 10000,
                courtId: 'ACCRYC',
                subCode: 'AAABBB',
                addressLine1: 'Crown House',
                addressLine2: '452 West Street',
                addressLine3: 'Swansea',
                addressLine4: 'West Cross',
                addressLine5: 'South Glamorgan',
                postcode: 'SA3 4HT',
                contacts: [
                  {
                    id: 10000,
                    courtId: 'ACCRYC',
                    buildingId: 12312,
                    type: 'TEL',
                    detail: '555 55555',
                  },
                ],
                active: true,
              },
            ],
          },
          {
            courtId: 'STHHPM',
            courtName: 'Southampton Magistrate Court',
            courtDescription: 'Southampton Magistrate Court',
            type: {
              courtType: 'MAG',
              courtName: 'Magistrate',
            },
            active: true,
            buildings: [],
          },
        ],
      },
    })
  },
}
