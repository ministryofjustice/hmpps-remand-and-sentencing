import type { Express } from 'express'
import request from 'supertest'
import { appWithAllRoutes, defaultServices } from '../testutils/appSetup'
import config from '../../config'

let app: Express
const original = config.featureToggles.missedHearing
const url = '/person/A1234AB/edit-court-case/0/add-court-appearance/0/missed-hearing/new-journey'

beforeEach(() => {
  app = appWithAllRoutes({})
})

afterEach(() => {
  jest.resetAllMocks()
  config.featureToggles.missedHearing = original
})

describe('missed hearing new-journey', () => {
  it('should start a clean missed hearing, going to the task list without touching the latest hearing', async () => {
    config.featureToggles.missedHearing = true
    await request(app)
      .get(url)
      .expect(302)
      .expect('Location', '/person/A1234AB/edit-court-case/0/add-court-appearance/0/task-list')
    expect(defaultServices.courtAppearanceService.startMissedHearing).toHaveBeenCalledWith(
      expect.anything(),
      'A1234AB',
      '0',
    )
    expect(defaultServices.remandAndSentencingService.getLatestCourtAppearanceByCourtCaseUuid).not.toHaveBeenCalled()
    expect(defaultServices.courtAppearanceService.addChargesFromPreviousAppearance).not.toHaveBeenCalled()
  })

  it('returns 404 when the flag is off', async () => {
    config.featureToggles.missedHearing = false
    await request(app).get(url).expect(404)
    expect(defaultServices.courtAppearanceService.startMissedHearing).not.toHaveBeenCalled()
  })
})
