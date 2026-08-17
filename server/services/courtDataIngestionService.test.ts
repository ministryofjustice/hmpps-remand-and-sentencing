import type { CourtDataLandingForm } from 'forms'
import CourtDataIngestionService from './courtDataIngestionService'

const courtDataIngestionService = new CourtDataIngestionService(null)

describe('validateLandingForm', () => {
  it('returns no errors when a choice has been made', () => {
    expect(courtDataIngestionService.validateLandingForm({ addToExistingCase: 'true' })).toHaveLength(0)
  })

  it('asks the user to choose between a new court case and a new hearing when nothing is selected', () => {
    expect(courtDataIngestionService.validateLandingForm({} as CourtDataLandingForm)).toStrictEqual([
      {
        text: 'You must choose whether you want to add a new court case or a new hearing.',
        href: '#addToExistingCase',
      },
    ])
  })
})
