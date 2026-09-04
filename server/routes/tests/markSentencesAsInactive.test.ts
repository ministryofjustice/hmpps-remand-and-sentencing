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

  it('does not show the hearing details panel', async () => {
    await request(app)
      .get('/person/A1234AB/add-court-case/0/add-court-appearance/0/sentencing/select-sentences-to-mark-as-inactive')
      .expect(200)
      .expect(res => {
        const $ = cheerio.load(res.text)
        expect($('[data-qa="hearingDetails"]')).toHaveLength(0)
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
  const periodLength = (months: string) => ({
    periodLengthType: 'SENTENCE_LENGTH' as const,
    years: '0',
    months,
    weeks: '0',
    days: '0',
    periodOrder: ['years', 'months', 'weeks', 'days'],
    uuid: `pl-${months}`,
    isAlternative: false,
  })

  beforeEach(() => {
    defaultServices.courtAppearanceService.getSessionCourtAppearance.mockReturnValue({
      appearanceUuid: 'appearance-uuid',
      caseReferenceNumber: 'T2025654321',
      warrantType: 'SENTENCING',
      warrantDate: new Date('2025-04-10'),
      offences: [
        {
          chargeUuid: '2',
          offenceCode: 'TP47017',
          outcomeUuid: '123',
          offenceStartDate: new Date('2024-01-09'),
          sentence: {
            sentenceUuid: '3',
            countNumber: '1',
            sentenceServeType: 'CONCURRENT',
            sentenceTypeClassification: 'STANDARD',
            status: 'ACTIVE',
            periodLengths: [periodLength('24')],
          },
        },
        {
          chargeUuid: '5',
          offenceCode: 'CJ94017',
          outcomeUuid: '123',
          offenceStartDate: new Date('2024-01-09'),
          sentence: {
            sentenceUuid: '4',
            countNumber: '2',
            sentenceServeType: 'CONSECUTIVE',
            sentenceTypeClassification: 'STANDARD',
            consecutiveToSentenceUuid: '3',
            status: 'ACTIVE',
            periodLengths: [periodLength('23')],
          },
        },
      ],
    })
    defaultServices.manageOffencesService.getOffenceMap.mockResolvedValue({
      TP47017: 'Accidentally allow a chimney to be on fire',
      CJ94017: 'Aggravated trespass - fail to leave land',
    })
  })

  it('renders the single sentence design with the offence summary and no appearance details panel', async () => {
    defaultServices.offenceService.getSentencesToMarkAsInactiveSentenceUuids.mockReturnValue(['3'])

    await request(app)
      .get(
        '/person/A1234AB/add-court-case/0/add-court-appearance/0/sentencing/provide-reason-for-marking-sentences-as-inactive',
      )
      .expect('Content-Type', /html/)
      .expect(200)
      .expect(res => {
        const $ = cheerio.load(res.text)
        expect($('h1').text().trim()).toEqual('Provide a reason you want to mark this sentence as inactive')
        expect($('[data-qa="single-sentence-offence-summary"]').text()).toContain('TP47017')
        expect($('[data-qa="single-sentence-offence-summary"]').text()).toContain(
          'Accidentally allow a chimney to be on fire',
        )
        expect($('[data-qa="single-sentence-offence-summary"]').text()).toContain('committed on 09/01/2024')
        expect($('[data-qa="hearingDetails"]')).toHaveLength(0)
      })
  })

  it('renders the multiple sentence design with a hearing details panel listing only the selected offences', async () => {
    defaultServices.offenceService.getSentencesToMarkAsInactiveSentenceUuids.mockReturnValue(['3', '4'])

    await request(app)
      .get(
        '/person/A1234AB/add-court-case/0/add-court-appearance/0/sentencing/provide-reason-for-marking-sentences-as-inactive',
      )
      .expect(200)
      .expect(res => {
        const $ = cheerio.load(res.text)
        expect($('h1').text().trim()).toEqual('Provide a reason you want to mark these sentences as inactive')
        expect($('[data-qa="hearingDetails"]')).toHaveLength(1)
        expect($('.offences-summary-card-row')).toHaveLength(2)
        expect($('.offences-summary-card-row').eq(0).text()).toContain('TP47017')
        expect($('.offences-summary-card-row').eq(0).text()).toContain('Count 1')
        expect($('.offences-summary-card-row').eq(0).text()).toContain('Concurrent')
        expect($('.offences-summary-card-row').eq(1).text()).toContain('CJ94017')
        expect($('.offences-summary-card-row').eq(1).text()).toContain('Count 2')
        expect($('.offences-summary-card-row').eq(1).text()).toContain('Consecutive to Count 1')
      })
  })

  it('prepopulates the reason textarea from a reason already stored on the selected sentence', async () => {
    defaultServices.offenceService.getSentencesToMarkAsInactiveSentenceUuids.mockReturnValue(['3'])
    defaultServices.courtAppearanceService.getSessionCourtAppearance.mockReturnValue({
      appearanceUuid: 'appearance-uuid',
      caseReferenceNumber: 'T2025654321',
      warrantType: 'SENTENCING',
      warrantDate: new Date('2025-04-10'),
      offences: [
        {
          chargeUuid: '2',
          offenceCode: 'TP47017',
          outcomeUuid: '123',
          offenceStartDate: new Date('2024-01-09'),
          sentence: {
            sentenceUuid: '3',
            countNumber: '1',
            sentenceServeType: 'CONCURRENT',
            sentenceTypeClassification: 'STANDARD',
            status: 'ACTIVE',
            reason: 'Sentence quashed on appeal',
            periodLengths: [periodLength('24')],
          },
        },
      ],
    })

    await request(app)
      .get(
        '/person/A1234AB/add-court-case/0/add-court-appearance/0/sentencing/provide-reason-for-marking-sentences-as-inactive',
      )
      .expect(200)
      .expect(res => {
        const $ = cheerio.load(res.text)
        expect($('[data-qa="reason-textarea"]').text().trim()).toEqual('Sentence quashed on appeal')
      })
  })
})

describe('POST /sentencing/provide-reason-for-marking-sentences-as-inactive', () => {
  it('redirects back to the same page when the reason fails validation', async () => {
    defaultServices.offenceService.validateMarkSentencesAsInactiveReason.mockReturnValue([
      { text: 'Enter a reason for marking as inactive', href: '#reason' },
    ])

    await request(app)
      .post(
        '/person/A1234AB/add-court-case/0/add-court-appearance/0/sentencing/provide-reason-for-marking-sentences-as-inactive',
      )
      .send({ reason: '' })
      .expect(302)
      .expect(
        'Location',
        '/person/A1234AB/add-court-case/0/add-court-appearance/0/sentencing/provide-reason-for-marking-sentences-as-inactive',
      )

    expect(defaultServices.offenceService.validateMarkSentencesAsInactiveReason).toHaveBeenCalledWith('')
    expect(defaultServices.courtAppearanceService.markSentencesAsInactive).not.toHaveBeenCalled()
    expect(defaultServices.offenceService.clearSentencesToMarkAsInactive).not.toHaveBeenCalled()
  })

  it('marks the sentences as inactive and redirects to the edit hearing page on success', async () => {
    defaultServices.offenceService.validateMarkSentencesAsInactiveReason.mockReturnValue([])
    defaultServices.offenceService.getSentencesToMarkAsInactiveSentenceUuids.mockReturnValue(['3'])

    await request(app)
      .post(
        '/person/A1234AB/add-court-case/0/add-court-appearance/0/sentencing/provide-reason-for-marking-sentences-as-inactive',
      )
      .send({ reason: 'Sentence quashed on appeal' })
      .expect(302)
      .expect('Location', '/person/A1234AB/add-court-case/0/add-court-appearance/0/sentencing/hearing-details')

    expect(defaultServices.courtAppearanceService.markSentencesAsInactive).toHaveBeenCalledWith(
      expect.anything(),
      'A1234AB',
      '0',
      ['3'],
      'Sentence quashed on appeal',
    )
    expect(defaultServices.offenceService.clearSentencesToMarkAsInactive).toHaveBeenCalled()
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
            sentenceUuid: '13',
            countNumber: '4',
            sentenceServeType: 'CONCURRENT',
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

  it('shows exactly the sentences returned by the API, using their own details', async () => {
    await request(app)
      .get('/person/A1234AB/add-court-case/0/add-court-appearance/0/sentencing/cannot-mark-sentences-as-inactive')
      .expect(200)
      .expect(res => {
        const $ = cheerio.load(res.text)
        expect($('[data-qa^="activeConsecutiveOffence-"]')).toHaveLength(1)
        expect($('[data-qa="activeConsecutiveOffence-0"]').text()).toContain('CJ88001')
        expect($('[data-qa="activeConsecutiveOffence-0"]').text()).toContain('Common assault')
        expect($('[data-qa="activeConsecutiveOffence-0"]').text()).toContain('Count 1')
        expect($('[data-qa="activeConsecutiveOffence-0"]').text()).toContain('Forthwith')
      })
  })

  it('shows a sentence with its own "Consecutive to" detail when that is the one returned by the API', async () => {
    defaultServices.offenceService.getSentenceUuidsWithActiveSentencesAfter.mockReturnValue(['11'])

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

  it('shows one row per sentence when the API flags more than one', async () => {
    defaultServices.offenceService.getSentenceUuidsWithActiveSentencesAfter.mockReturnValue(['10', '13'])

    await request(app)
      .get('/person/A1234AB/add-court-case/0/add-court-appearance/0/sentencing/cannot-mark-sentences-as-inactive')
      .expect(200)
      .expect(res => {
        const $ = cheerio.load(res.text)
        expect($('[data-qa^="activeConsecutiveOffence-"]')).toHaveLength(2)
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
