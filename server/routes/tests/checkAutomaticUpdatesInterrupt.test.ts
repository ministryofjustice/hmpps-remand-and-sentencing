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
  defaultServices.remandAndSentencingService.getUnconfirmedSentenceFixCourtCases.mockResolvedValue({
    courtCases: [
      {
        courtCaseUuid: '1',
        courtCode: 'ACCRYC',
        sentencingHearingDate: '2024-01-01',
        caseReference: 'CASE1',
        sentences: [
          {
            offenceCode: 'PS90037',
            sentenceServeType: 'CONCURRENT',
            sentenceUuid: '1',
            chargeLegacyOffenceDescription: 'Legacy description',
          },
        ],
      },
    ],
  })
  defaultServices.manageOffencesService.getOffenceMap.mockResolvedValue({
    PS90037: 'An offence description',
  })
  defaultServices.courtRegisterService.getCourtMap.mockResolvedValue({
    ACCRYC: 'A court description',
  })
}

describe('GET Check automatic updates interrupt', () => {
  it('should render page', async () => {
    setupCourtCase()
    const res = await request(app).get('/person/A1234AB/check-automatic-sentence-fix').expect('Content-Type', /html/)
    const $ = cheerio.load(res.text)
    const prisonerBanner = $('.mini-profile').text()
    expect(prisonerBanner).toContain('Meza, Cormac')
    expect(prisonerBanner).toContain('A1234AB')
    expect(prisonerBanner).toContain('EstablishmentHMP Bedford')
    expect(prisonerBanner).toContain('Cell numberCELL-1')
    const continueButton = $('[data-qa=continue-button]').text()
    expect(continueButton).toContain('Continue')
    const sentenceListText = $('[data-qa=sentenceList]').text()
    expect(sentenceListText).toContain('PS90037 An offence description')
    expect(sentenceListText).toContain('Concurrent')
    const courtCaseListText = $('[data-qa=courtCaseList]').text()
    expect(courtCaseListText).toContain('Case CASE1 at A court description on 01/01/2024')
  })
})
