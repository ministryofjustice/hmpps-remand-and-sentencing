import type { Express } from 'express'
import * as cheerio from 'cheerio'
import request from 'supertest'
import { appWithAllRoutes, defaultServices } from '../testutils/appSetup'

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
          appearanceUuid: '836',
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
              createdAt: '2025-03-11T14:30:00.000Z',
            },
            {
              chargeUuid: '789',
              offenceCode: 'PS90037',
              outcome: {
                outcomeUuid: '92e69bb5-9769-478b-9ee6-77c91808d9af',
                outcomeName: 'Commit to Crown Court for trial in custody',
              },
              createdAt: '2025-03-11T14:31:00.000Z',
            },
          ],
        },
        firstDayInCustody: '',
        mergedFromCases: [],
        allAppearancesHaveRecall: false,
        firstDayInCustodyWarrantType: 'NON_SENTENCING',
        canAppeal: false,
        canBreach: false,
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
    prisonerCourtCaseTotal: 1,
  })
  defaultServices.courtCasesReleaseDatesService.getServiceDefinitions.mockResolvedValue({
    services: {
      overview: {
        href: 'http://localhost:8000/prisoner/AB1234AB/overview',
        text: 'Overview',
        thingsToDo: {
          count: 0,
          things: [],
        },
        maintenanceAlert: {
          enabled: false,
          message: 'placeholder',
        },
      },
      courtCases: {
        href: 'http://localhost:3007/person/AB1234AB',
        text: 'Court cases',
        thingsToDo: {
          count: 0,
          things: [],
        },
        maintenanceAlert: {
          enabled: false,
          message: 'placeholder',
        },
      },
    },
    maintenanceAlert: {
      enabled: false,
      message: 'placeholder',
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
  defaultServices.remandAndSentencingService.getBookingCourtCaseCount.mockResolvedValue({
    suppliedBookingCount: 1,
    otherBookingCount: 1,
  })
  defaultServices.prisonerService.getBookingDetails.mockResolvedValue({
    activeFlag: true,
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
    expect($('label.govuk-checkboxes__label').text().trim()).toContain(
      'Include cases from previous periods of custody (1)',
    )
  })

  it('should render error when appearance from date is invalid', async () => {
    setupCourtCase()
    const res = await request(app)
      .get('/person/A1234AB')
      .query({ appearanceDateFrom: 'NotValidDate' })
      .expect('Content-Type', /html/)
    const $ = cheerio.load(res.text)
    const errorSummary = $('.govuk-error-summary').text()
    expect(errorSummary).toContain('There is a problem')
    expect(errorSummary).toContain('This date does not exist.')
  })

  it('should render error when appearance to date is invalid', async () => {
    setupCourtCase()
    const res = await request(app)
      .get('/person/A1234AB')
      .query({ appearanceDateTo: 'NotValidDate' })
      .expect('Content-Type', /html/)
    const $ = cheerio.load(res.text)
    const errorSummary = $('.govuk-error-summary').text()
    expect(errorSummary).toContain('There is a problem')
    expect(errorSummary).toContain('This date does not exist.')
  })

  it('should render error when appearance from date is after appearance to date', async () => {
    setupCourtCase()
    const res = await request(app)
      .get('/person/A1234AB')
      .query({ appearanceDateFrom: '12/2/2026', appearanceDateTo: '12/1/2026' })
      .expect('Content-Type', /html/)
    const $ = cheerio.load(res.text)
    const errorSummary = $('.govuk-error-summary').text()
    expect(errorSummary).toContain('There is a problem')
    expect(errorSummary).toContain('The latest hearing to date must be after the latest hearding from date')
  })

  it('should render page correctly when valid date supplied', async () => {
    setupCourtCase()
    const res = await request(app)
      .get('/person/A1234AB')
      .query({ appearanceDateFrom: '1/1/2026', appearanceDateTo: '12/12/2026' })
      .expect('Content-Type', /html/)
    const $ = cheerio.load(res.text)
    const errorSummary = $('.govuk-error-summary')
    expect(errorSummary.length).toBe(0)
  })

  it('should auto check previous periods of custody when the booking is inactive', async () => {
    setupCourtCase()
    defaultServices.remandAndSentencingService.searchCourtCases.mockResolvedValue({
      totalPages: 0,
      totalElements: 0,
      size: 20,
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
      last: true,
      first: true,
      empty: true,
      prisonerCourtCaseTotal: 1,
    })
    defaultServices.remandAndSentencingService.getBookingCourtCaseCount.mockResolvedValue({
      suppliedBookingCount: 1,
      otherBookingCount: 1,
    })
    defaultServices.prisonerService.getBookingDetails.mockResolvedValue({
      activeFlag: false,
    })
    const res = await request(app)
      .get('/person/A1234AB')
      .query({ appearanceDateFrom: '1/1/2026', appearanceDateTo: '12/12/2026' })
      .expect('Content-Type', /html/)
    const $ = cheerio.load(res.text)
    const checkboxChecked = $('.govuk-checkboxes__input').prop('checked')
    expect(checkboxChecked).toBe(true)
    const checkboxDisabled = $('.govuk-checkboxes__input').prop('disabled')
    expect(checkboxDisabled).toBe(true)
  })

  it('display correct empty state content for when booking is active, has no court cases but there are court cases on other bookings', async () => {
    setupCourtCase()
    defaultServices.remandAndSentencingService.searchCourtCases.mockResolvedValue({
      totalPages: 0,
      totalElements: 0,
      size: 20,
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
      last: true,
      first: true,
      empty: true,
      prisonerCourtCaseTotal: 1,
    })
    defaultServices.remandAndSentencingService.getBookingCourtCaseCount.mockResolvedValue({
      suppliedBookingCount: 0,
      otherBookingCount: 1,
    })
    defaultServices.prisonerService.getBookingDetails.mockResolvedValue({
      activeFlag: true,
    })
    const res = await request(app)
      .get('/person/A1234AB')
      .query({ appearanceDateFrom: '1/1/2026', appearanceDateTo: '12/12/2026' })
      .expect('Content-Type', /html/)
    const $ = cheerio.load(res.text)
    const bodyText = $('.govuk-body').text()
    expect(bodyText).toContain('There are no court cases recorded for this period of custody')
    expect(bodyText).toContain('You can use the filters to show court cases from previous periods of custody.')
  })

  it('renders the new-warrant things-to-do banner once, inside the two-thirds column and below the no court cases line', async () => {
    setupCourtCase()
    defaultServices.remandAndSentencingService.searchCourtCases.mockResolvedValue({
      totalPages: 0,
      totalElements: 0,
      size: 20,
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
      last: true,
      first: true,
      empty: true,
      prisonerCourtCaseTotal: 0,
    })
    defaultServices.remandAndSentencingService.getBookingCourtCaseCount.mockResolvedValue({
      suppliedBookingCount: 0,
      otherBookingCount: 0,
    })
    defaultServices.prisonerService.getBookingDetails.mockResolvedValue({
      activeFlag: true,
    })
    defaultServices.courtCasesReleaseDatesService.getServiceDefinitions.mockResolvedValue({
      services: {
        courtCases: {
          href: 'http://localhost:3007/person/A1234AB',
          text: 'Court cases',
          thingsToDo: {
            count: 1,
            severity: 'REQUIRED_BEFORE_CALCULATION',
            things: [
              {
                title: 'Enter information from a new remand warrant',
                message: 'A new remand warrant for TR1345678BR has been added from Common Platform.',
                buttonText: 'Review remand warrant',
                buttonHref: 'http://localhost:3007/person/A1234AB/review',
                type: 'HMCTS_API_DOCUMENT_RECEIVED',
              },
            ],
          },
          maintenanceAlert: { enabled: false, message: 'placeholder' },
        },
      },
      maintenanceAlert: { enabled: false, message: 'placeholder' },
    })

    const res = await request(app).get('/person/A1234AB').expect('Content-Type', /html/)
    const $ = cheerio.load(res.text)

    // Renders exactly once (guards against the has-cases and no-cases placements both firing)
    expect($('.moj-ticket-panel__content').length).toBe(1)

    // Sits inside the two-thirds column, so it stops at the Actions box rather than spanning full width
    const bannerInColumn = $('.govuk-grid-column-two-thirds .moj-ticket-panel__content')
    expect(bannerInColumn.length).toBe(1)
    expect(bannerInColumn.text()).toContain('Enter information from a new remand warrant')

    // Sits below the no court cases line in source order
    const noCasesIndex = res.text.indexOf('There are no court cases recorded for')
    const bannerIndex = res.text.indexOf('moj-ticket-panel__content')
    expect(noCasesIndex).toBeGreaterThan(-1)
    expect(bannerIndex).toBeGreaterThan(noCasesIndex)
  })

  it('renders the new-warrant things-to-do banner once, inside the two-thirds column and below the no court cases line', async () => {
    setupCourtCase()
    defaultServices.remandAndSentencingService.searchCourtCases.mockResolvedValue({
      totalPages: 0,
      totalElements: 0,
      size: 20,
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
      last: true,
      first: true,
      empty: true,
      prisonerCourtCaseTotal: 0,
    })
    defaultServices.remandAndSentencingService.getBookingCourtCaseCount.mockResolvedValue({
      suppliedBookingCount: 0,
      otherBookingCount: 0,
    })
    defaultServices.prisonerService.getBookingDetails.mockResolvedValue({
      activeFlag: true,
    })
    defaultServices.courtCasesReleaseDatesService.getServiceDefinitions.mockResolvedValue({
      services: {
        courtCases: {
          href: 'http://localhost:3007/person/A1234AB',
          text: 'Court cases',
          thingsToDo: {
            count: 1,
            severity: 'REQUIRED_BEFORE_CALCULATION',
            things: [
              {
                title: 'Enter information from a new remand warrant',
                message: 'A new remand warrant for TR1345678BR has been added from Common Platform.',
                buttonText: 'Review remand warrant',
                buttonHref: 'http://localhost:3007/person/A1234AB/review',
                type: 'HMCTS_API_DOCUMENT_RECEIVED',
              },
            ],
          },
          maintenanceAlert: { enabled: false, message: 'placeholder' },
        },
      },
      maintenanceAlert: { enabled: false, message: 'placeholder' },
    })

    const res = await request(app).get('/person/A1234AB').expect('Content-Type', /html/)
    const $ = cheerio.load(res.text)

    // Renders exactly once (guards against the has-cases and no-cases placements both firing)
    expect($('.moj-ticket-panel__content').length).toBe(1)

    // Sits inside the two-thirds column, so it stops at the Actions box rather than spanning full width
    const bannerInColumn = $('.govuk-grid-column-two-thirds .moj-ticket-panel__content')
    expect(bannerInColumn.length).toBe(1)
    expect(bannerInColumn.text()).toContain('Enter information from a new remand warrant')

    // Sits below the no court cases line in source order
    const noCasesIndex = res.text.indexOf('There are no court cases recorded for')
    const bannerIndex = res.text.indexOf('moj-ticket-panel__content')
    expect(noCasesIndex).toBeGreaterThan(-1)
    expect(bannerIndex).toBeGreaterThan(noCasesIndex)
  })

  it('still renders the things-to-do banner once, inside the two-thirds column, when the prisoner has court cases', async () => {
    setupCourtCase()
    defaultServices.courtCasesReleaseDatesService.getServiceDefinitions.mockResolvedValue({
      services: {
        courtCases: {
          href: 'http://localhost:3007/person/A1234AB',
          text: 'Court cases',
          thingsToDo: {
            count: 1,
            severity: 'REQUIRED_BEFORE_CALCULATION',
            things: [
              {
                title: 'Enter information from a new remand warrant',
                message: 'A new remand warrant for TR1345678BR has been added from Common Platform.',
                buttonText: 'Review remand warrant',
                buttonHref: 'http://localhost:3007/person/A1234AB/review',
                type: 'HMCTS_API_DOCUMENT_RECEIVED',
              },
            ],
          },
          maintenanceAlert: { enabled: false, message: 'placeholder' },
        },
      },
      maintenanceAlert: { enabled: false, message: 'placeholder' },
    })

    const res = await request(app).get('/person/A1234AB').expect('Content-Type', /html/)
    const $ = cheerio.load(res.text)

    expect($('.moj-ticket-panel__content').length).toBe(1)
    const bannerInColumn = $('.govuk-grid-column-two-thirds .moj-ticket-panel__content')
    expect(bannerInColumn.length).toBe(1)
    expect(bannerInColumn.text()).toContain('Enter information from a new remand warrant')
  })

  it('renders the new-warrant things-to-do banner once, inside the two-thirds column and below the no court cases line', async () => {
    setupCourtCase()
    defaultServices.remandAndSentencingService.searchCourtCases.mockResolvedValue({
      totalPages: 0,
      totalElements: 0,
      size: 20,
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
      last: true,
      first: true,
      empty: true,
      prisonerCourtCaseTotal: 0,
    })
    defaultServices.remandAndSentencingService.getBookingCourtCaseCount.mockResolvedValue({
      suppliedBookingCount: 0,
      otherBookingCount: 0,
    })
    defaultServices.prisonerService.getBookingDetails.mockResolvedValue({
      activeFlag: true,
    })
    defaultServices.courtCasesReleaseDatesService.getServiceDefinitions.mockResolvedValue({
      services: {
        courtCases: {
          href: 'http://localhost:3007/person/A1234AB',
          text: 'Court cases',
          thingsToDo: {
            count: 1,
            severity: 'REQUIRED_BEFORE_CALCULATION',
            things: [
              {
                title: 'Enter information from a new remand warrant',
                message: 'A new remand warrant for TR1345678BR has been added from Common Platform.',
                buttonText: 'Review remand warrant',
                buttonHref: 'http://localhost:3007/person/A1234AB/review',
                type: 'HMCTS_API_DOCUMENT_RECEIVED',
              },
            ],
          },
          maintenanceAlert: { enabled: false, message: 'placeholder' },
        },
      },
      maintenanceAlert: { enabled: false, message: 'placeholder' },
    })

    const res = await request(app).get('/person/A1234AB').expect('Content-Type', /html/)
    const $ = cheerio.load(res.text)

    // Renders exactly once (guards against the has-cases and no-cases placements both firing)
    expect($('.moj-ticket-panel__content').length).toBe(1)

    // Sits inside the two-thirds column, so it stops at the Actions box rather than spanning full width
    const bannerInColumn = $('.govuk-grid-column-two-thirds .moj-ticket-panel__content')
    expect(bannerInColumn.length).toBe(1)
    expect(bannerInColumn.text()).toContain('Enter information from a new remand warrant')

    // Sits below the no court cases line in source order
    const noCasesIndex = res.text.indexOf('There are no court cases recorded for')
    const bannerIndex = res.text.indexOf('moj-ticket-panel__content')
    expect(noCasesIndex).toBeGreaterThan(-1)
    expect(bannerIndex).toBeGreaterThan(noCasesIndex)
  })

  it('still renders the things-to-do banner once, inside the two-thirds column, when the prisoner has court cases', async () => {
    setupCourtCase()
    defaultServices.courtCasesReleaseDatesService.getServiceDefinitions.mockResolvedValue({
      services: {
        courtCases: {
          href: 'http://localhost:3007/person/A1234AB',
          text: 'Court cases',
          thingsToDo: {
            count: 1,
            severity: 'REQUIRED_BEFORE_CALCULATION',
            things: [
              {
                title: 'Enter information from a new remand warrant',
                message: 'A new remand warrant for TR1345678BR has been added from Common Platform.',
                buttonText: 'Review remand warrant',
                buttonHref: 'http://localhost:3007/person/A1234AB/review',
                type: 'HMCTS_API_DOCUMENT_RECEIVED',
              },
            ],
          },
          maintenanceAlert: { enabled: false, message: 'placeholder' },
        },
      },
      maintenanceAlert: { enabled: false, message: 'placeholder' },
    })

    const res = await request(app).get('/person/A1234AB').expect('Content-Type', /html/)
    const $ = cheerio.load(res.text)

    expect($('.moj-ticket-panel__content').length).toBe(1)
    const bannerInColumn = $('.govuk-grid-column-two-thirds .moj-ticket-panel__content')
    expect(bannerInColumn.length).toBe(1)
    expect(bannerInColumn.text()).toContain('Enter information from a new remand warrant')
  })

  it('renders the things-to-do banner inside the two-thirds column in the empty state', async () => {
    setupCourtCase()
    defaultServices.remandAndSentencingService.searchCourtCases.mockResolvedValue({
      totalPages: 0,
      totalElements: 0,
      size: 20,
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
      last: true,
      first: true,
      empty: true,
      prisonerCourtCaseTotal: 0,
    })
    defaultServices.remandAndSentencingService.getBookingCourtCaseCount.mockResolvedValue({
      suppliedBookingCount: 0,
      otherBookingCount: 0,
    })
    defaultServices.prisonerService.getBookingDetails.mockResolvedValue({
      activeFlag: true,
    })
    defaultServices.courtCasesReleaseDatesService.getServiceDefinitions.mockResolvedValue({
      services: {
        courtCases: {
          href: 'http://localhost:3007/person/A1234AB',
          text: 'Court cases',
          thingsToDo: {
            count: 1,
            severity: 'REQUIRED_BEFORE_CALCULATION',
            things: [
              {
                title: 'Enter information from a new remand warrant',
                message: 'A new remand warrant for TR1345678BR has been added from Common Platform.',
                buttonText: 'Review remand warrant',
                buttonHref: 'http://localhost:3007/person/A1234AB/review',
                type: 'HMCTS_API_DOCUMENT_RECEIVED',
              },
            ],
          },
          maintenanceAlert: { enabled: false, message: 'placeholder' },
        },
      },
      maintenanceAlert: { enabled: false, message: 'placeholder' },
    })

    const res = await request(app).get('/person/A1234AB').expect('Content-Type', /html/)
    const $ = cheerio.load(res.text)

    // Renders exactly once (guards against the has-cases and no-cases placements both firing)
    expect($('.moj-ticket-panel__content').length).toBe(1)

    // Sits inside the two-thirds column, so it stops at the Actions box rather than spanning full width
    const bannerInColumn = $('.govuk-grid-column-two-thirds .moj-ticket-panel__content')
    expect(bannerInColumn.length).toBe(1)
    expect(bannerInColumn.text()).toContain('Enter information from a new remand warrant')
  })

  it('still renders the things-to-do banner once, inside the two-thirds column, when the prisoner has court cases', async () => {
    setupCourtCase()
    defaultServices.courtCasesReleaseDatesService.getServiceDefinitions.mockResolvedValue({
      services: {
        courtCases: {
          href: 'http://localhost:3007/person/A1234AB',
          text: 'Court cases',
          thingsToDo: {
            count: 1,
            severity: 'REQUIRED_BEFORE_CALCULATION',
            things: [
              {
                title: 'Enter information from a new remand warrant',
                message: 'A new remand warrant for TR1345678BR has been added from Common Platform.',
                buttonText: 'Review remand warrant',
                buttonHref: 'http://localhost:3007/person/A1234AB/review',
                type: 'HMCTS_API_DOCUMENT_RECEIVED',
              },
            ],
          },
          maintenanceAlert: { enabled: false, message: 'placeholder' },
        },
      },
      maintenanceAlert: { enabled: false, message: 'placeholder' },
    })

    const res = await request(app).get('/person/A1234AB').expect('Content-Type', /html/)
    const $ = cheerio.load(res.text)

    expect($('.moj-ticket-panel__content').length).toBe(1)
    const bannerInColumn = $('.govuk-grid-column-two-thirds .moj-ticket-panel__content')
    expect(bannerInColumn.length).toBe(1)
    expect(bannerInColumn.text()).toContain('Enter information from a new remand warrant')
  })
})
