import type { Express } from 'express'
import type { Offence } from 'models'
import * as cheerio from 'cheerio'
import request from 'supertest'
import { appWithAllRoutes, defaultServices } from '../testutils/appSetup'
import config from '../../config'

let app: Express
const originalMultipleOffenceInstances = config.featureToggles.multipleOffenceInstances
const baseUrl = '/person/A1234AB/add-court-case/0/add-court-appearance/0/offences'

const originalOffence = {
  chargeUuid: '2',
  offenceCode: 'PS90037',
  offenceStartDate: new Date('2023-05-10'),
  outcomeUuid: '3',
  sentence: {
    sentenceUuid: '4',
    countNumber: '1',
    hasCountNumber: 'true',
    convictionDate: new Date('2023-05-12'),
    sentenceServeType: 'FORTHWITH',
    periodLengths: [],
  },
} as Offence

const duplicatedOffence = { ...originalOffence, chargeUuid: '5' } as Offence

beforeEach(() => {
  app = appWithAllRoutes({})
  config.featureToggles.multipleOffenceInstances = true
})

afterEach(() => {
  config.featureToggles.multipleOffenceInstances = originalMultipleOffenceInstances
  jest.resetAllMocks()
})

describe('Duplicate offence', () => {
  it('creates a draft copy of the offence and redirects to the duplicate offence page', async () => {
    defaultServices.courtAppearanceService.getOffence.mockReturnValue(originalOffence)

    await request(app)
      .get(`${baseUrl}/2/duplicate-offence`)
      .expect(302)
      .expect('Location', `${baseUrl}/duplicate-offence`)

    expect(defaultServices.offenceService.clearAllOffences).toHaveBeenCalledWith(expect.anything(), 'A1234AB', '0')
    expect(defaultServices.offenceService.setSessionDuplicatedOffence).toHaveBeenCalledWith(
      expect.anything(),
      'A1234AB',
      '0',
      originalOffence,
    )
  })

  it('redirects to the add offences page when the feature flag is off', async () => {
    config.featureToggles.multipleOffenceInstances = false
    defaultServices.courtAppearanceService.getOffence.mockReturnValue(originalOffence)

    await request(app)
      .get(`${baseUrl}/2/duplicate-offence`)
      .expect(302)
      .expect('Location', `${baseUrl}/check-offence-answers`)

    expect(defaultServices.offenceService.setSessionDuplicatedOffence).not.toHaveBeenCalled()
  })

  it('renders the duplicated offence details under the new heading', async () => {
    defaultServices.offenceService.getAllOffences.mockReturnValue([duplicatedOffence])
    defaultServices.offenceService.getSessionOffence.mockReturnValue(duplicatedOffence)
    defaultServices.courtAppearanceService.getSessionCourtAppearance.mockReturnValue({
      appearanceUuid: '0',
      warrantType: 'SENTENCING',
      offences: [originalOffence],
    })
    defaultServices.manageOffencesService.getOffenceMap.mockResolvedValue({ PS90037: 'An offence description' })
    defaultServices.courtRegisterService.getCourtMap.mockResolvedValue({})
    defaultServices.refDataService.getChargeOutcomeById.mockResolvedValue({
      outcomeUuid: '3',
      outcomeName: 'Imprisonment',
      outcomeType: 'SENTENCING',
      displayOrder: 1,
      dispositionCode: 'F',
      nomisCode: '1',
      status: 'ACTIVE',
    })

    const res = await request(app).get(`${baseUrl}/duplicate-offence`).expect(200)
    const $ = cheerio.load(res.text)
    const summary = $('[data-qa="edit-summary-list"]').text()

    expect($('h1').text()).toContain('Add the details for this offence')
    expect($('[data-qa="back-link"]').attr('href')).toBe(`${baseUrl}/check-offence-answers`)
    expect(summary).toContain('Count 1')
    expect(summary).toContain('PS90037 An offence description')
    expect(summary).toContain('10/05/2023')
    expect(summary).toContain('12/05/2023')
    expect(summary).not.toContain('Aggravating factors')

    // Values come from setUpCurrentCourtAppearance middleware, which the test app doesn't run
    expect($('h2:contains("Hearing details")').length).toBe(1)
    expect($('[data-qa="hearingDetails"]').length).toBe(1)
  })

  it.each([
    { description: 'before confirmation', missingDate: true, missingServeType: true, submitted: false },
    { description: 'with only committed on missing', missingDate: true, missingServeType: false, submitted: true },
    {
      description: 'with only consecutive or concurrent missing',
      missingDate: false,
      missingServeType: true,
      submitted: true,
    },
    { description: 'with both fields missing', missingDate: true, missingServeType: true, submitted: true },
    { description: 'with both fields completed', missingDate: false, missingServeType: false, submitted: true },
  ])('highlights only invalid rows $description', async ({ missingDate, missingServeType, submitted }) => {
    const errors = []
    const expectedRows = []
    if (submitted && missingDate) {
      errors.push({ text: 'You must enter a committed on date', href: '#' })
      expectedRows.push('Committed on')
    }
    if (submitted && missingServeType) {
      errors.push({ text: 'You must enter whether this offence is consecutive or concurrent', href: '#' })
      expectedRows.push('Consecutive or concurrent')
    }

    const html = await new Promise<string>((resolve, reject) => {
      app.render(
        'pages/offence/add-duplicated-offence-details',
        {
          nomsId: 'A1234AB',
          courtCaseReference: '0',
          appearanceReference: '0',
          chargeUuid: '5',
          addOrEditCourtCase: 'add-court-case',
          addOrEditCourtAppearance: 'add-court-appearance',
          prisoner: {},
          serviceDefinitions: { services: [] },
          courtAppearance: { warrantType: 'SENTENCING', offences: [] },
          offence: {
            ...duplicatedOffence,
            offenceStartDate: missingDate ? undefined : duplicatedOffence.offenceStartDate,
            sentence: {
              ...duplicatedOffence.sentence,
              sentenceServeType: missingServeType ? undefined : 'CONCURRENT',
            },
          },
          offenceMap: { PS90037: 'An offence description' },
          periodLengths: [],
          errors,
        },
        (error, renderedHtml) => {
          if (error) reject(error)
          else resolve(renderedHtml)
        },
      )
    })
    const $ = cheerio.load(html)
    const highlightedRows = $('[data-qa="edit-summary-list"] .govuk-summary-list__row--error')
      .find('.govuk-summary-list__key')
      .map((_index, key) => $(key).text().trim())
      .get()

    expect(highlightedRows).toEqual(expectedRows)
    expect($('.govuk-error-summary').length).toBe(errors.length ? 1 : 0)
    errors.forEach(error => expect($('.govuk-error-summary').text()).toContain(error.text))
  })

  it('shows an Enter committed on date link when the offence has no committed on date', async () => {
    const noDateOffence = { ...duplicatedOffence, offenceStartDate: undefined } as Offence
    defaultServices.offenceService.getAllOffences.mockReturnValue([noDateOffence])
    defaultServices.offenceService.getSessionOffence.mockReturnValue(noDateOffence)
    defaultServices.courtAppearanceService.getSessionCourtAppearance.mockReturnValue({
      appearanceUuid: '0',
      warrantType: 'SENTENCING',
      offences: [originalOffence],
    })
    defaultServices.manageOffencesService.getOffenceMap.mockResolvedValue({ PS90037: 'An offence description' })
    defaultServices.courtRegisterService.getCourtMap.mockResolvedValue({})
    defaultServices.refDataService.getChargeOutcomeById.mockResolvedValue({
      outcomeUuid: '3',
      outcomeName: 'Imprisonment',
      outcomeType: 'SENTENCING',
      displayOrder: 1,
      dispositionCode: 'F',
      nomisCode: '1',
      status: 'ACTIVE',
    })

    const res = await request(app).get(`${baseUrl}/duplicate-offence`).expect(200)
    const $ = cheerio.load(res.text)

    expect($('[data-qa="edit-offence-date-cta"]').text().trim()).toBe('Enter committed on date')
  })

  it('shows an Enter consecutive or concurrent link when none is entered', async () => {
    const noServeTypeOffence = {
      ...duplicatedOffence,
      sentence: { ...duplicatedOffence.sentence, sentenceServeType: undefined },
    } as Offence
    defaultServices.offenceService.getAllOffences.mockReturnValue([noServeTypeOffence])
    defaultServices.offenceService.getSessionOffence.mockReturnValue(noServeTypeOffence)
    defaultServices.courtAppearanceService.getSessionCourtAppearance.mockReturnValue({
      appearanceUuid: '0',
      warrantType: 'SENTENCING',
      offences: [originalOffence],
    })
    defaultServices.manageOffencesService.getOffenceMap.mockResolvedValue({ PS90037: 'An offence description' })
    defaultServices.courtRegisterService.getCourtMap.mockResolvedValue({})
    defaultServices.refDataService.getChargeOutcomeById.mockResolvedValue({
      outcomeUuid: '3',
      outcomeName: 'Imprisonment',
      outcomeType: 'SENTENCING',
      displayOrder: 1,
      dispositionCode: 'F',
      nomisCode: '1',
      status: 'ACTIVE',
    })

    const res = await request(app).get(`${baseUrl}/duplicate-offence`).expect(200)
    const $ = cheerio.load(res.text)

    expect($('[data-qa="edit-sentence-serve-type-cta"]').text().trim()).toBe('Enter consecutive or concurrent')
    expect($('[data-qa="edit-sentence-serve-type-5"]').length).toBe(0)
  })

  it('does not save and redirects back when required details are missing', async () => {
    defaultServices.offenceService.getAllOffences.mockReturnValue([duplicatedOffence])
    defaultServices.offenceService.validateDuplicatedOffenceMandatoryFields.mockReturnValue([
      { text: 'You must enter whether this offence is consecutive or concurrent', href: '#' },
      { text: 'You must enter a committed on date', href: '#' },
    ])

    await request(app)
      .post(`${baseUrl}/duplicate-offence`)
      .expect(302)
      .expect('Location', `${baseUrl}/duplicate-offence?hasErrors=true`)

    expect(defaultServices.offenceService.validateDuplicatedOffenceMandatoryFields).toHaveBeenCalledWith(
      duplicatedOffence,
    )
    expect(defaultServices.courtAppearanceService.addOffence).not.toHaveBeenCalled()
  })

  it('returns to add offence details after editing a field on a duplicate draft', async () => {
    defaultServices.offenceService.getSessionOffence.mockReturnValue({
      ...duplicatedOffence,
      duplicatedFromUuid: originalOffence.chargeUuid,
    })

    await request(app)
      .get(`${baseUrl}/5/edit-offence?submitToEditOffence=true`)
      .expect(302)
      .expect('Location', `${baseUrl}/duplicate-offence`)
  })

  it.each([
    ['committed on', 'You must enter a committed on date'],
    ['consecutive or concurrent', 'You must enter whether this offence is consecutive or concurrent'],
  ])('cannot bypass duplicate validation through the edit route when %s is missing', async (_field, message) => {
    const draft = { ...duplicatedOffence, duplicatedFromUuid: originalOffence.chargeUuid }
    defaultServices.offenceService.getSessionOffence.mockReturnValue(draft)
    defaultServices.offenceService.getAllOffences.mockReturnValue([draft])
    defaultServices.offenceService.validateDuplicatedOffenceMandatoryFields.mockReturnValue([
      { text: message, href: '#' },
    ])

    await request(app)
      .post(`${baseUrl}/5/edit-offence`)
      .expect(302)
      .expect('Location', `${baseUrl}/duplicate-offence?hasErrors=true`)

    expect(defaultServices.offenceService.validateDuplicatedOffenceMandatoryFields).toHaveBeenCalledWith(draft)
    expect(defaultServices.offenceService.validateOffenceMandatoryFields).not.toHaveBeenCalled()
    expect(defaultServices.courtAppearanceService.addOffence).not.toHaveBeenCalled()
    expect(draft.duplicatedFromUuid).toBe(originalOffence.chargeUuid)
  })

  it('saves the duplicated offence to the appearance and returns to add offences', async () => {
    const draft = { ...duplicatedOffence, duplicatedFromUuid: originalOffence.chargeUuid }
    defaultServices.offenceService.getAllOffences.mockReturnValue([draft])
    defaultServices.offenceService.validateDuplicatedOffenceMandatoryFields.mockReturnValue([])

    await request(app)
      .post(`${baseUrl}/duplicate-offence`)
      .expect(302)
      .expect('Location', `${baseUrl}/check-offence-answers`)

    expect(defaultServices.courtAppearanceService.addOffence).toHaveBeenCalledWith(
      expect.anything(),
      'A1234AB',
      '5',
      duplicatedOffence,
      '0',
    )
    expect(draft.duplicatedFromUuid).toBeUndefined()
  })
})
