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
    expect(summary).toContain('Count 1')
    expect(summary).toContain('PS90037 An offence description')
    expect(summary).toContain('10/05/2023')
    expect(summary).toContain('12/05/2023')
  })

  it('saves the duplicated offence to the appearance and returns to add offences', async () => {
    defaultServices.offenceService.getAllOffences.mockReturnValue([duplicatedOffence])
    defaultServices.offenceService.validateOffenceMandatoryFields.mockReturnValue([])

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
  })
})
