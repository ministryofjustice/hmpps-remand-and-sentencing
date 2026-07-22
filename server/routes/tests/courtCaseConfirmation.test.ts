import type { Express } from 'express'
import * as cheerio from 'cheerio'
import request from 'supertest'
import { appWithAllRoutes, defaultServices, user } from '../testutils/appSetup'
import { PageCourtCaseAppearance } from '../../@types/remandAndSentencingApi/remandAndSentencingClientTypes'

let app: Express

afterEach(() => {
  jest.resetAllMocks()
})

const getAppearance = (appearanceTypeUuid: string): PageCourtCaseAppearance => {
  return {
    appearanceUuid: '1',
    appearanceDate: '2025-07-25',
    courtCode: 'ACCRYC',
    warrantType: 'NON_SENTENCING',
    courtCaseReference: 'A123',
    outcome: { outcomeUuid: '1', outcomeName: 'Appearance outcome' },
    charges: [
      {
        chargeUuid: '1',
        offenceCode: 'OFF123',
        offenceStartDate: '2025-01-01',
        outcome: { outcomeUuid: '1', outcomeName: 'Offence outcome' },
      },
    ],
    source: 'DPS',
    nextCourtAppearance: {
      appearanceDate: '2025-07-28',
      courtCode: 'ACCRYC',
      appearanceType: {
        appearanceTypeUuid,
        description: 'A appearance type',
        displayOrder: 1,
      },
    },
  } as PageCourtCaseAppearance
}

describe('GET confirmation', () => {
  it('should render book a secure move link', () => {
    const bookASecureMoveUser = { ...user, hasBookASecureMoveAccess: true }
    app = appWithAllRoutes({ userSupplier: () => bookASecureMoveUser })
    defaultServices.remandAndSentencingService.getCourtAppearanceByAppearanceUuid.mockResolvedValue(
      getAppearance('63e8fce0-033c-46ad-9edf-391b802d547a'),
    )
    return request(app)
      .get('/person/A1234AB/add-court-case/0/add-court-appearance/0/confirmation')
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)
        const bookASecureMoveLink = $('[data-qa=bookASecureMoveLink]')
        expect(bookASecureMoveLink.length).toBe(1)
        const text = bookASecureMoveLink.text()
        expect(text).toContain('Book a secure move')
      })
  })

  it('should not render book a secure move link when next appearance is not a court appearance', () => {
    const bookASecureMoveUser = { ...user, hasBookASecureMoveAccess: true }
    app = appWithAllRoutes({ userSupplier: () => bookASecureMoveUser })
    defaultServices.remandAndSentencingService.getCourtAppearanceByAppearanceUuid.mockResolvedValue(
      getAppearance('1da09b6e-55cb-4838-a157-ee6944f2094c'),
    )
    return request(app)
      .get('/person/A1234AB/add-court-case/0/add-court-appearance/0/confirmation')
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)
        const bookASecureMoveLink = $('[data-qa=bookASecureMoveLink]')
        expect(bookASecureMoveLink.length).toBe(0)
      })
  })
})
