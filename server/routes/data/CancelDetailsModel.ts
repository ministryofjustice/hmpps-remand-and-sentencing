import dayjs from 'dayjs'
import { CourtDto } from '../../@types/courtRegisterApi/types'
import config from '../../config'

export default abstract class CancelDetailsModel {
  courtDetails: CourtDto | undefined

  warrantDate: Date | undefined

  constructor(courtDetails: CourtDto | undefined, warrantDate: Date | undefined) {
    this.courtDetails = courtDetails
    this.warrantDate = warrantDate
  }

  getForCourtCaseDescription(): string {
    if (this.courtDetails && this.warrantDate) {
      return ` at ${this.courtDetails.courtName} on ${dayjs(this.warrantDate).format(config.dateFormat)}`
    }
    return ''
  }

  abstract getHeader(): string

  abstract getDescription(): string

  abstract getPositiveRadioText(): string

  abstract getNegativeRadioText(): string
}
