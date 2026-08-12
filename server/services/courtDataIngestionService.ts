import type { CourtDataLandingForm, CourtDataSelectCaseForm } from 'forms'
import { CourtHearing } from '../@types/courtDataIngestionApi/types'
import CourtDataIngestionApiClient from '../data/courtDataIngestionApiClient'
import validate from '../validation/validation'

export default class CourtDataIngestionService {
  constructor(private readonly courtDataIngestionApiClient: CourtDataIngestionApiClient) {}

  async getCourtHearing(courtHearingId: string, prisonerNumber: string, username: string): Promise<CourtHearing> {
    return this.courtDataIngestionApiClient.getCourtHearing(courtHearingId, prisonerNumber, username)
  }

  validateLandingForm(courtDataLandingForm: CourtDataLandingForm) {
    return validate(
      courtDataLandingForm,
      { addToExistingCase: 'required' },
      { 'required.addToExistingCase': 'You must select if this is a new case or not' },
    )
  }

  validateCourtDataSelectCaseForm(courtDataSelectCaseForm: CourtDataSelectCaseForm) {
    return validate(
      courtDataSelectCaseForm,
      { courtCase: 'required' },
      { 'required.courtCase': 'You must select a case' },
    )
  }
}
