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

describe('GET /sentencing/select-sentences-to-mark-as-inactive', () => {
  beforeEach(() => {
    defaultServices.courtAppearanceService.getSessionCourtAppearance.mockReturnValue({
      appearanceUuid: 'appearance-uuid',
      offences: [
        {
          chargeUuid: '2',
          offenceCode: 'CC12345',
          outcomeUuid: '123',
          sentence: {
            sentenceUuid: '3',
            countNumber: '1',
            sentenceServeType: 'CONSECUTIVE',
            sentenceTypeClassification: 'STANDARD',
            consecutiveToSentenceUuid: '4',
            status: 'ACTIVE',
          },
        },
        {
          chargeUuid: '5',
          offenceCode: 'AB6789',
          outcomeUuid: '123',
          sentence: {
            sentenceUuid: '4',
            countNumber: '2',
            sentenceServeType: 'CONCURRENT',
            sentenceTypeClassification: 'STANDARD',
            status: 'ACTIVE',
          },
        },
        {
          chargeUuid: '6',
          offenceCode: 'AB6789',
          outcomeUuid: '123',
          sentence: {
            sentenceUuid: '7',
            countNumber: '3',
            sentenceServeType: 'CONCURRENT',
            sentenceTypeClassification: 'STANDARD',
            status: 'INACTIVE',
          },
        },
      ],
    })
    defaultServices.manageOffencesService.getOffenceMap.mockResolvedValue({
      CC12345: 'Some offence description',
      AB6789: 'Another offence description',
    })
    defaultServices.offenceService.getSentencesToMarkAsInactiveSentenceUuids.mockReturnValue([])
  })

  it('renders the select sentences to mark as inactive page', async () => {
    await request(app)
      .get('/person/A1234AB/add-court-case/0/add-court-appearance/0/sentencing/select-sentences-to-mark-as-inactive')
      .expect('Content-Type', /html/)
      .expect(200)
      .expect(res => {
        const $ = cheerio.load(res.text)
        expect($('h1').text().trim()).toEqual('Select the sentences to mark as inactive')
      })
  })

  it('only shows sentences with an ACTIVE status', async () => {
    await request(app)
      .get('/person/A1234AB/add-court-case/0/add-court-appearance/0/sentencing/select-sentences-to-mark-as-inactive')
      .expect(200)
      .expect(res => {
        const $ = cheerio.load(res.text)
        expect($('[data-qa="markAsInactiveOptions"] input[type="checkbox"]')).toHaveLength(2)
      })
  })

  it('prepopulates previously selected sentences from the session', async () => {
    defaultServices.offenceService.getSentencesToMarkAsInactiveSentenceUuids.mockReturnValue(['3'])

    await request(app)
      .get('/person/A1234AB/add-court-case/0/add-court-appearance/0/sentencing/select-sentences-to-mark-as-inactive')
      .expect(200)
      .expect(res => {
        const $ = cheerio.load(res.text)
        expect($('input[value="3"]').prop('checked')).toEqual(true)
        expect($('input[value="4"]').prop('checked')).toEqual(false)
      })
  })
})

describe('POST /sentencing/select-sentences-to-mark-as-inactive', () => {
  it('redirects back to the select sentences page when validation fails', async () => {
    defaultServices.offenceService.setSentencesToMarkAsInactiveSentenceUuids.mockReturnValue([
      { text: 'Mark at least one sentence as inactive', href: '#sentenceUuids' },
    ])

    await request(app)
      .post('/person/A1234AB/add-court-case/0/add-court-appearance/0/sentencing/select-sentences-to-mark-as-inactive')
      .send({})
      .expect(302)
      .expect(
        'Location',
        '/person/A1234AB/add-court-case/0/add-court-appearance/0/sentencing/select-sentences-to-mark-as-inactive?hasErrors=true',
      )

    expect(defaultServices.remandAndSentencingService.getSentenceUuidsWithActiveSentencesAfter).not.toHaveBeenCalled()
  })

  it('redirects to the cannot mark as inactive page when a selected sentence has an active sentence consecutive to it outside the selection', async () => {
    defaultServices.offenceService.setSentencesToMarkAsInactiveSentenceUuids.mockReturnValue([])
    defaultServices.remandAndSentencingService.getSentenceUuidsWithActiveSentencesAfter.mockResolvedValue({
      sentenceUuidsWithActiveSentencesAfter: ['3'],
    })

    await request(app)
      .post('/person/A1234AB/add-court-case/0/add-court-appearance/0/sentencing/select-sentences-to-mark-as-inactive')
      .send({ sentenceUuids: '3' })
      .expect(302)
      .expect(
        'Location',
        '/person/A1234AB/add-court-case/0/add-court-appearance/0/sentencing/cannot-mark-sentences-as-inactive',
      )

    expect(defaultServices.remandAndSentencingService.getSentenceUuidsWithActiveSentencesAfter).toHaveBeenCalledWith(
      ['3'],
      'user1',
    )
    expect(defaultServices.offenceService.setSentenceUuidsWithActiveSentencesAfter).toHaveBeenCalledWith(
      expect.anything(),
      ['3'],
    )
  })

  it('redirects to the provide a reason page when none of the selected sentences have an active sentence consecutive to them outside the selection', async () => {
    defaultServices.offenceService.setSentencesToMarkAsInactiveSentenceUuids.mockReturnValue([])
    defaultServices.remandAndSentencingService.getSentenceUuidsWithActiveSentencesAfter.mockResolvedValue({
      sentenceUuidsWithActiveSentencesAfter: [],
    })

    await request(app)
      .post('/person/A1234AB/add-court-case/0/add-court-appearance/0/sentencing/select-sentences-to-mark-as-inactive')
      .send({ sentenceUuids: '3' })
      .expect(302)
      .expect(
        'Location',
        '/person/A1234AB/add-court-case/0/add-court-appearance/0/sentencing/provide-reason-for-marking-sentences-as-inactive',
      )
  })
})

describe('GET /sentencing/provide-reason-for-marking-sentences-as-inactive', () => {
  it('renders the provide a reason stub page', async () => {
    await request(app)
      .get(
        '/person/A1234AB/add-court-case/0/add-court-appearance/0/sentencing/provide-reason-for-marking-sentences-as-inactive',
      )
      .expect('Content-Type', /html/)
      .expect(200)
      .expect(res => {
        const $ = cheerio.load(res.text)
        expect($('h1').text().trim()).toEqual('Provide a reason for marking sentences as inactive')
      })
  })
})

describe('GET /sentencing/cannot-mark-sentences-as-inactive', () => {
  beforeEach(() => {
    defaultServices.courtAppearanceService.getSessionCourtAppearance.mockReturnValue({
      appearanceUuid: 'appearance-uuid',
      offences: [
        {
          chargeUuid: '2',
          offenceCode: 'CJ88001',
          outcomeUuid: '123',
          offenceStartDate: new Date('2025-07-21'),
          sentence: {
            sentenceUuid: '10',
            countNumber: '1',
            sentenceServeType: 'FORTHWITH',
            sentenceTypeClassification: 'STANDARD',
            status: 'ACTIVE',
          },
        },
        {
          chargeUuid: '5',
          offenceCode: 'CJ88001',
          outcomeUuid: '123',
          offenceStartDate: new Date('2025-07-21'),
          sentence: {
            sentenceUuid: '11',
            countNumber: '2',
            sentenceServeType: 'CONSECUTIVE',
            sentenceTypeClassification: 'STANDARD',
            consecutiveToSentenceUuid: '10',
            status: 'ACTIVE',
          },
        },
        {
          chargeUuid: '6',
          offenceCode: 'AB6789',
          outcomeUuid: '123',
          sentence: {
            sentenceUuid: '12',
            countNumber: '3',
            sentenceServeType: 'CONSECUTIVE',
            sentenceTypeClassification: 'STANDARD',
            consecutiveToSentenceUuid: '10',
            status: 'INACTIVE',
          },
        },
        {
          chargeUuid: '7',
          offenceCode: 'AB6789',
          outcomeUuid: '123',
          sentence: {
            sentenceUuid: '13',
            countNumber: '4',
            sentenceServeType: 'CONSECUTIVE',
            sentenceTypeClassification: 'STANDARD',
            consecutiveToSentenceUuid: '99',
            status: 'ACTIVE',
          },
        },
        {
          chargeUuid: '8',
          offenceCode: 'AB6789',
          outcomeUuid: '123',
          sentence: {
            sentenceUuid: '14',
            countNumber: '5',
            sentenceServeType: 'CONSECUTIVE',
            sentenceTypeClassification: 'STANDARD',
            consecutiveToSentenceUuid: '15',
            status: 'ACTIVE',
          },
        },
        {
          chargeUuid: '9',
          offenceCode: 'AB6789',
          outcomeUuid: '123',
          sentence: {
            sentenceUuid: '15',
            countNumber: '6',
            sentenceServeType: 'FORTHWITH',
            sentenceTypeClassification: 'STANDARD',
            status: 'ACTIVE',
          },
        },
        {
          chargeUuid: '10',
          offenceCode: 'AB6789',
          outcomeUuid: '123',
          sentence: {
            sentenceUuid: '16',
            countNumber: '7',
            sentenceServeType: 'FORTHWITH',
            sentenceTypeClassification: 'STANDARD',
            status: 'ACTIVE',
          },
        },
      ],
    })
    defaultServices.manageOffencesService.getOffenceMap.mockResolvedValue({
      CJ88001: 'Common assault',
      AB6789: 'Another offence description',
    })
    defaultServices.offenceService.getSentencesToMarkAsInactiveSentenceUuids.mockReturnValue(['10'])
    defaultServices.offenceService.getSentenceUuidsWithActiveSentencesAfter.mockReturnValue(['10'])
  })

  it('renders the cannot mark sentences as inactive page', async () => {
    await request(app)
      .get('/person/A1234AB/add-court-case/0/add-court-appearance/0/sentencing/cannot-mark-sentences-as-inactive')
      .expect('Content-Type', /html/)
      .expect(200)
      .expect(res => {
        const $ = cheerio.load(res.text)
        expect($('h1').text().trim()).toEqual('You cannot mark a sentence inactive with active consecutive sentences')
      })
  })

  it('only shows active sentences that are consecutive to a selected sentence', async () => {
    await request(app)
      .get('/person/A1234AB/add-court-case/0/add-court-appearance/0/sentencing/cannot-mark-sentences-as-inactive')
      .expect(200)
      .expect(res => {
        const $ = cheerio.load(res.text)
        expect($('[data-qa^="activeConsecutiveOffence-"]')).toHaveLength(1)
        expect($('[data-qa="activeConsecutiveOffence-0"]').text()).toContain('CJ88001')
        expect($('[data-qa="activeConsecutiveOffence-0"]').text()).toContain('Common assault')
        expect($('[data-qa="activeConsecutiveOffence-0"]').text()).toContain('Count 2')
        expect($('[data-qa="activeConsecutiveOffence-0"]').text()).toContain('Consecutive to Count 1')
      })
  })

  it('does not show a sentence as a blocker when it is also part of the selected batch', async () => {
    defaultServices.offenceService.getSentencesToMarkAsInactiveSentenceUuids.mockReturnValue(['10', '11'])

    await request(app)
      .get('/person/A1234AB/add-court-case/0/add-court-appearance/0/sentencing/cannot-mark-sentences-as-inactive')
      .expect(200)
      .expect(res => {
        const $ = cheerio.load(res.text)
        expect($('[data-qa^="activeConsecutiveOffence-"]')).toHaveLength(0)
      })
  })

  it('only shows the blocker for the sentence the API flagged, not for other selected sentences that happen to have their own active consecutive sentence', async () => {
    // 4 sentences selected ('10', '13', '15', '16'), but the API only flagged '10' as blocked.
    // '15' also has an active consecutive sentence ('14'), but since '15' wasn't flagged, its
    // blocker must not appear.
    defaultServices.offenceService.getSentencesToMarkAsInactiveSentenceUuids.mockReturnValue(['10', '13', '15', '16'])
    defaultServices.offenceService.getSentenceUuidsWithActiveSentencesAfter.mockReturnValue(['10'])

    await request(app)
      .get('/person/A1234AB/add-court-case/0/add-court-appearance/0/sentencing/cannot-mark-sentences-as-inactive')
      .expect(200)
      .expect(res => {
        const $ = cheerio.load(res.text)
        expect($('[data-qa^="activeConsecutiveOffence-"]')).toHaveLength(1)
        expect($('[data-qa="activeConsecutiveOffence-0"]').text()).toContain('Count 2')
        expect($('[data-qa="activeConsecutiveOffence-0"]').text()).toContain('Consecutive to Count 1')
      })
  })

  it('links the cancel changes button to the edit hearing page', async () => {
    await request(app)
      .get('/person/A1234AB/add-court-case/0/add-court-appearance/0/sentencing/cannot-mark-sentences-as-inactive')
      .expect(200)
      .expect(res => {
        const $ = cheerio.load(res.text)
        expect($('[data-qa="cancel-button"]').attr('href')).toEqual(
          '/person/A1234AB/add-court-case/0/add-court-appearance/0/sentencing/hearing-details',
        )
      })
  })

  it('links "go back to select sentences" and the back link to the select sentences page', async () => {
    await request(app)
      .get('/person/A1234AB/add-court-case/0/add-court-appearance/0/sentencing/cannot-mark-sentences-as-inactive')
      .expect(200)
      .expect(res => {
        const $ = cheerio.load(res.text)
        const selectSentencesUrl =
          '/person/A1234AB/add-court-case/0/add-court-appearance/0/sentencing/select-sentences-to-mark-as-inactive'
        expect($('[data-qa="go-back-to-select-sentences-link"]').attr('href')).toEqual(selectSentencesUrl)
        expect($('[data-qa="back-link"]').attr('href')).toEqual(selectSentencesUrl)
      })
  })
})
