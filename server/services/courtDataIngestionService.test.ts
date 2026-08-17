import type { CourtDataLandingForm } from 'forms'
import CourtDataIngestionService from './courtDataIngestionService'
import CourtDataIngestionApiClient from '../data/courtDataIngestionApiClient'

jest.mock('../data/courtDataIngestionApiClient')

describe('courtDataIngestionService', () => {
  let courtDataIngestionApiClient: jest.Mocked<CourtDataIngestionApiClient>
  let service: CourtDataIngestionService

  beforeEach(() => {
    courtDataIngestionApiClient = new CourtDataIngestionApiClient(null) as jest.Mocked<CourtDataIngestionApiClient>
    service = new CourtDataIngestionService(courtDataIngestionApiClient)
  })

  describe('validateLandingForm', () => {
    it('no errors if a choice has been made', () => {
      const courtDataLandingForm = { addToExistingCase: 'true' } as CourtDataLandingForm
      const errors = service.validateLandingForm(courtDataLandingForm)
      expect(errors.length).toBe(0)
    })

    it('the correct error is returned if no choice has been made', () => {
      const courtDataLandingForm = {} as CourtDataLandingForm
      const errors = service.validateLandingForm(courtDataLandingForm)
      expect(errors).toEqual([
        {
          href: '#addToExistingCase',
          text: 'You must choose whether you want to add a new court case or a new hearing.',
        },
      ])
    })
  })
})
