import type { Express } from 'express'
import * as cheerio from 'cheerio'
import request from 'supertest'
import { appWithAllRoutes } from '../testutils/appSetup'

let app: Express

beforeEach(() => {
  app = appWithAllRoutes({})
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('POST confirm consecutive to sentence fixes', () => {
  it('should render page on new journey', async () => {
    await request(app)
      .post('/person/A1234AB/confirm-consecutive-to-sentence-fix')
      .send({
        sentenceUuids: ['123'],
      })
      .expect(302)
      .expect('Location', '/person/A1234AB')
  })
})
