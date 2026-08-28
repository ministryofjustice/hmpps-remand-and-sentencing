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
  it('renders the cannot mark sentences as inactive stub page', async () => {
    await request(app)
      .get('/person/A1234AB/add-court-case/0/add-court-appearance/0/sentencing/cannot-mark-sentences-as-inactive')
      .expect('Content-Type', /html/)
      .expect(200)
      .expect(res => {
        const $ = cheerio.load(res.text)
        expect($('h1').text().trim()).toEqual('You cannot mark these sentences as inactive')
      })
  })
})
