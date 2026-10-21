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

const setupDefaultMocks = (eligible = true) => {
  defaultServices.remandAndSentencingService.getF986EligibleAppearances.mockResolvedValue(
    eligible
      ? ([
          {
            appearanceUuid: '1',
            warrantDate: '2025-07-25',
            courtCode: 'ACCRYC',
            caseReference: 'A123',
            offenceCodes: ['OFF123'],
          },
        ] as never)
      : [],
  )
  defaultServices.manageOffencesService.getOffenceMap.mockResolvedValue({ OFF123: 'Offence code description' })
  defaultServices.courtRegisterService.getCourtMap.mockResolvedValue({ ACCRYC: 'Court description' })
}

describe('GET view-generated-documents/type/f986', () => {
  it('should list eligible court appearances as radios pointing at the F986 download', async () => {
    setupDefaultMocks()

    const res = await request(app).get('/person/A1234AB/view-generated-documents/type/f986')
    const $ = cheerio.load(res.text)

    expect($('[data-qa="no-f986-appearances"]').length).toEqual(0)
    const radio = $('input[name="documentSelected"]')
    expect(radio.length).toEqual(1)
    expect(radio.attr('value')).toEqual('/api/persons/A1234AB/court-appearances/1/documents/f986')
    const radioLabel = $(`label[for="${radio.attr('id')}"]`)
    expect(radioLabel.text()).toContain('A123 at Court description')
    expect(radioLabel.find('.govuk-hint').text()).toContain('Offence code description')
    expect(radioLabel.find('.govuk-hint').text()).toContain('committed on 25/07/2025')
  })

  it('should show a message when there are no eligible court appearances', async () => {
    setupDefaultMocks(false)

    const res = await request(app).get('/person/A1234AB/view-generated-documents/type/f986')
    const $ = cheerio.load(res.text)

    expect($('[data-qa="no-f986-appearances"]').length).toEqual(1)
    expect($('input[name="documentSelected"]').length).toEqual(0)
  })
})
