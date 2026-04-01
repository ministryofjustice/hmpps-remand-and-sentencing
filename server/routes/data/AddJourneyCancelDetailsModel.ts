import { CourtDto } from '../../@types/courtRegisterApi/types'
import CancelDetailsModel from './CancelDetailsModel'

export default class AddJourneyCancelDetailsModel extends CancelDetailsModel {
  constructor(courtDetails: CourtDto | undefined, warrantDate: Date | undefined) {
    super(courtDetails, warrantDate)
  }

  getHeader(): string {
    return 'Are you sure you want to cancel adding a court case?'
  }

  getDescription(): string {
    return `You have not finished adding the information for the court case${this.getForCourtCaseDescription()}. Any information you have entered will be lost.`
  }

  getPositiveRadioText(): string {
    return 'Yes, cancel adding a court case'
  }

  getNegativeRadioText(): string {
    return 'No, go back to the court case'
  }
}
