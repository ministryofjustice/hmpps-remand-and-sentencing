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

describe('GET /confirm-mark-court-case-as-inactive', () => {
  it('renders the confirm page with the inactive wording', async () => {
    const res = await request(app)
      .get('/person/A1234AB/edit-court-case/1/confirm-mark-court-case-as-inactive')
      .expect('Content-Type', /html/)
      .expect(200)
    const $ = cheerio.load(res.text)
    expect($('[data-qa="confirm-mark-court-case-status-heading"]').text().trim()).toEqual(
      'Are you sure you want to mark this court case as inactive?',
    )
    expect($('[data-qa="back-link"]').attr('href')).toEqual('/person/A1234AB/edit-court-case/1/details')
  })
})

describe('GET /confirm-mark-court-case-as-active', () => {
  it('renders the confirm page with the active wording', async () => {
    const res = await request(app)
      .get('/person/A1234AB/edit-court-case/1/confirm-mark-court-case-as-active')
      .expect('Content-Type', /html/)
      .expect(200)
    const $ = cheerio.load(res.text)
    expect($('[data-qa="confirm-mark-court-case-status-heading"]').text().trim()).toEqual(
      'Are you sure you want to mark this court case as active?',
    )
  })
})

describe('GET /confirm-mark-court-case-as-:targetStatus with an invalid status', () => {
  it('redirects back to the court case details page', async () => {
    await request(app)
      .get('/person/A1234AB/edit-court-case/1/confirm-mark-court-case-as-banana')
      .expect(302)
      .expect('Location', '/person/A1234AB/edit-court-case/1/details')
  })
})

describe('GET /cannot-mark-court-case-as-inactive-active-sentences', () => {
  it('renders the blocking page content', async () => {
    const res = await request(app)
      .get('/person/A1234AB/edit-court-case/1/cannot-mark-court-case-as-inactive-active-sentences')
      .expect('Content-Type', /html/)
      .expect(200)
    const $ = cheerio.load(res.text)
    expect($('[data-qa="cannot-mark-court-case-as-inactive-heading"]').text().trim()).toEqual(
      'You cannot mark a case with active sentences as inactive',
    )
    const bodyText = $('.govuk-grid-column-two-thirds').text()
    expect(bodyText).toContain('A case with active sentences cannot be marked as inactive.')
    expect(bodyText).toContain(
      'You need to inactivate all sentences in this case in order to mark the case as inactive.',
    )
    expect(bodyText).toContain('What to do next')
    expect(bodyText).toContain(
      'Edit the sentences on the latest court hearing to make them inactive. Then come back and try again.',
    )
  })

  it('links the "Cancel and go back" button and the "Back" link to the page of entry', async () => {
    const res = await request(app)
      .get('/person/A1234AB/edit-court-case/1/cannot-mark-court-case-as-inactive-active-sentences')
      .expect(200)
    const $ = cheerio.load(res.text)
    expect($('[data-qa="cancel-and-go-back-button"]').attr('href')).toEqual('/person/A1234AB/edit-court-case/1/details')
    expect($('[data-qa="back-link"]').attr('href')).toEqual('/person/A1234AB/edit-court-case/1/details')
  })
})
