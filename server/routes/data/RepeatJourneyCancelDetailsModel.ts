import { CourtDto } from '../../@types/courtRegisterApi/types'
import CancelDetailsModel from './CancelDetailsModel'

export default class RepeatJourneyCancelDetailsModel extends CancelDetailsModel {
  constructor(courtDetails: CourtDto | undefined, warrantDate: Date | undefined) {
    super(courtDetails, warrantDate)
  }

  getHeader(): string {
    return 'Are you sure you want to cancel adding a hearing?'
  }

  getDescription(): string {
    return `You have not finished adding the information for the hearing${this.getForCourtCaseDescription()}. Any information you have entered will be lost.`
  }

  getPositiveRadioText(): string {
    return 'Yes, cancel adding a hearing'
  }

  getNegativeRadioText(): string {
    return 'No, go back to the hearing'
  }
}
