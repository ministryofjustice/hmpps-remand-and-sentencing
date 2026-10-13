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

const createCourtCasesPage = (outcome?: string) =>
  ({
    content: [
      {
        courtCaseUuid: '1',
        latestCourtAppearance: {
          appearanceUuid: '1',
          warrantDate: '2025-07-25',
          courtCode: 'ACCRYC',
          caseReference: 'A123',
          outcome,
          charges: [{ offenceCode: 'OFF123' }],
        },
      },
    ],
  }) as never

const setupDefaultMocks = (outcome?: string) => {
  defaultServices.remandAndSentencingService.searchCourtCases.mockResolvedValue(createCourtCasesPage(outcome))
  defaultServices.manageOffencesService.getOffenceMap.mockResolvedValue({ OFF123: 'Offence code description' })
  defaultServices.courtRegisterService.getCourtMap.mockResolvedValue({ ACCRYC: 'Court description' })
}

describe('GET view-generated-documents/type/f986', () => {
  it('should list eligible court appearances as radios pointing at the F986 download', async () => {
    setupDefaultMocks('Imprisonment in default of a fine')

    const res = await request(app).get('/person/A1234AB/view-generated-documents/type/f986')
    const $ = cheerio.load(res.text)

    expect($('[data-qa="no-f986-appearances"]').length).toEqual(0)
    const radio = $('input[name="documentSelected"]')
    expect(radio.length).toEqual(1)
    expect(radio.attr('value')).toEqual('/api/persons/A1234AB/court-appearances/1/documents/f986')
    expect(res.text).toContain('A123 at Court description')
    expect(res.text).toContain('Offence code description')
  })

  it('should show a message when there are no eligible court appearances', async () => {
    setupDefaultMocks('Some other outcome')

    const res = await request(app).get('/person/A1234AB/view-generated-documents/type/f986')
    const $ = cheerio.load(res.text)

    expect($('[data-qa="no-f986-appearances"]').length).toEqual(1)
    expect($('input[name="documentSelected"]').length).toEqual(0)
  })
})
