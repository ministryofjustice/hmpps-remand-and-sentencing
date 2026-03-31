import { CourtDto } from '../../@types/courtRegisterApi/types'
import CancelDetailsModel from './CancelDetailsModel'

export default class EditJourneyCancelDetailsModel extends CancelDetailsModel {
  constructor(courtDetails: CourtDto | undefined, warrantDate: Date | undefined) {
    super(courtDetails, warrantDate)
  }

  getHeader(): string {
    return 'Are you sure you want to cancel editing the court case?'
  }

  getDescription(): string {
    return `You have not finished editing the information for the court case${this.getForCourtCaseDescription()}. Any information you have entered will be lost.`
  }

  getPositiveRadioText(): string {
    return 'Yes, cancel editing the court case'
  }

  getNegativeRadioText(): string {
    return 'No, go back to the court case'
  }
}
