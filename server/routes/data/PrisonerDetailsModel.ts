import dayjs from 'dayjs'
import { RemandAndSentencingPerson } from '../../@types/remandAndSentencingApi/remandAndSentencingClientTypes'

export default class PrisonerDetailsModel {
  offenderNo: string

  firstName: string

  lastName: string

  establishment: string

  cellNumber: string

  dateOfBirth: string

  pncNumber: string

  status: string

  constructor(remandAndSentencingPerson: RemandAndSentencingPerson) {
    this.offenderNo = remandAndSentencingPerson.personId
    this.firstName = remandAndSentencingPerson.firstName
    this.lastName = remandAndSentencingPerson.lastName
    this.establishment = remandAndSentencingPerson.establishment
    this.cellNumber = remandAndSentencingPerson.cellNumber
    this.dateOfBirth = dayjs(remandAndSentencingPerson.dateOfBirth).format('DD/MM/YYYY')
    this.pncNumber = remandAndSentencingPerson.pncNumber ?? 'No number'
    this.status = remandAndSentencingPerson.status ?? 'No status'
  }
}
