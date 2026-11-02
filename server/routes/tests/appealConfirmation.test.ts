import type { Express } from 'express'
import * as cheerio from 'cheerio'
import request from 'supertest'
import { appWithAllRoutes, defaultServices } from '../testutils/appSetup'
import REPLACEMENT_OUTCOME_UUID from '../../utils/constants'
import { PageCourtCaseAppearance } from '../../@types/remandAndSentencingApi/remandAndSentencingClientTypes'

let app: Express

beforeEach(() => {
  app = appWithAllRoutes({})
})

afterEach(() => {
  jest.resetAllMocks()
})

const getAppearance = (): PageCourtCaseAppearance => {
  return {
    appearanceUuid: '1',
    appearanceDate: '2025-07-25',
    courtCode: 'ACCRYC',
    warrantType: 'NON_SENTENCING',
    courtCaseReference: 'A123',
    outcome: { outcomeUuid: '1', outcomeName: 'Appeal outcome' },
    charges: [
      {
        chargeUuid: '1',
        offenceCode: 'OFF123',
        offenceStartDate: '2025-01-01',
        outcome: { outcomeUuid: REPLACEMENT_OUTCOME_UUID, outcomeName: 'Replaced Offence outcome' },
      },
    ],
    source: 'DPS',
    nextCourtAppearance: {
      appearanceDate: '2025-07-28',
      courtCode: 'ACCRYC',
      appearanceType: {
        appearanceTypeUuid: '63e8fce0-033c-46ad-9edf-391b802d547a',
        description: 'A appearance type',
        displayOrder: 1,
      },
    },
  } as PageCourtCaseAppearance
}

describe('GET Appeal confirmation', () => {
  it('should render go back to when there is a replaced with another offence', async () => {
    defaultServices.remandAndSentencingService.getCourtAppearanceByAppearanceUuid.mockResolvedValue(getAppearance())
    defaultServices.courtRegisterService.findCourtById.mockResolvedValue({
      courtId: 'ACCRYC',
      active: true,
      courtName: 'A court name',
      buildings: [],
      type: {
        courtName: 'A Court type',
        courtType: 'A court type',
      },
    })

    const res = await request(app)
      .get('/person/A1234AB/edit-court-case/0/add-court-appearance/0/appeals/confirmation')
      .expect('Content-Type', /html/)
    const $ = cheerio.load(res.text)
    const goBackToCourtCaseLink = $('[data-qa="goBackToCourtCaseLink"]').text()
    expect(goBackToCourtCaseLink).toContain('Go back to court case A123 at A court name')
  })
})
