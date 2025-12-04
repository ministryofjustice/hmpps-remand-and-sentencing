import type { Express } from 'express'
import * as cheerio from 'cheerio'
import request from 'supertest'
import { appWithAllRoutes, defaultServices } from '../testutils/appSetup'
import config from '../../config'

let app: Express

beforeEach(() => {
  app = appWithAllRoutes({})
})

afterEach(() => {
  jest.resetAllMocks()
})

const setupCourtCase = () => {
  defaultServices.remandAndSentencingService.searchCourtCases.mockResolvedValue({
    totalPages: 0,
    totalElements: 1,
    size: 20,
    content: [
      {
        prisonerId: 'A1234AB',
        courtCaseUuid: '123',
        courtCaseStatus: 'ACTIVE',
        appearanceCount: 2,
        caseReferences: ['C123'],
        latestCourtAppearance: {
          caseReference: 'C123',
          courtCode: 'ACCRYC',
          warrantDate: '2023-12-15',
          warrantType: 'NON_SENTENCING',
          outcome: 'Remanded in custody',
          nextCourtAppearance: {
            appearanceDate: '2024-12-15',
            appearanceTime: '10:30:00.000000000',
            courtCode: 'BCC',
            appearanceTypeDescription: 'Court appearance',
            futureSkeletonAppearanceUuid: '456',
          },
          charges: [
            {
              chargeUuid: '456',
              offenceCode: 'PS90037',
              offenceStartDate: '2023-12-15',
              outcome: {
                outcomeUuid: '85ffc6bf-6a2c-4f2b-8db8-5b466b602537',
                outcomeName: 'Remanded in custody',
              },
            },
            {
              chargeUuid: '789',
              offenceCode: 'PS90037',
              outcome: {
                outcomeUuid: '92e69bb5-9769-478b-9ee6-77c91808d9af',
                outcomeName: 'Commit to Crown Court for trial in custody',
              },
            },
          ],
        },
        firstDayInCustody: '',
        mergedFromCases: [],
        allAppearancesHaveRecall: false,
        firstDayInCustodyWarrantType: 'NON_SENTENCING',
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
  })
  defaultServices.courtCasesReleaseDatesService.getServiceDefinitions.mockResolvedValue({
    services: {
      overview: {
        href: 'http://localhost:8000/prisoner/AB1234AB/overview',
        text: 'Overview',
        thingsToDo: {
          count: 0,
        },
      },
      courtCases: {
        href: 'http://localhost:3007/person/AB1234AB',
        text: 'Court cases',
        thingsToDo: {
          count: 0,
        },
      },
    },
  })
  defaultServices.remandAndSentencingService.getConsecutiveToDetails.mockResolvedValue({
    sentences: [],
  })
  defaultServices.manageOffencesService.getOffenceMap.mockResolvedValue({
    PS90037: 'An offence description',
  })
  defaultServices.courtRegisterService.getCourtMap.mockResolvedValue({
    ACCRYC: 'A court description',
    BCC: 'Another court description',
  })
}

describe('GET Start', () => {
  it('should render page', async () => {
    setupCourtCase()
    const res = await request(app).get('/person/A1234AB').expect('Content-Type', /html/)
    const $ = cheerio.load(res.text)
    const prisonerBanner = $('.mini-profile').text()
    expect(prisonerBanner).toContain('Meza, Cormac')
    expect(prisonerBanner).toContain('A1234AB')
    expect(prisonerBanner).toContain('EstablishmentHMP Bedford')
    expect(prisonerBanner).toContain('Cell numberCELL-1')
    const actionsList = $('.actions-list')
    expect(actionsList.length).toEqual(1)
    const newJourneyLinks = $('a[href*="new-journey"]')
    expect(newJourneyLinks.length).toEqual(2)
  })

  it('should not show journey links or action menu when in view only', async () => {
    setupCourtCase()
    config.featureToggles.viewOnlyEnabled = true
    const res = await request(app).get('/person/A1234AB').expect('Content-Type', /html/)
    const $ = cheerio.load(res.text)
    const actionsList = $('.actions-list')
    expect(actionsList.length).toEqual(0)
    const newJourneyLinks = $('a[href*="new-journey"]')
    expect(newJourneyLinks.length).toEqual(0)
  })
})
