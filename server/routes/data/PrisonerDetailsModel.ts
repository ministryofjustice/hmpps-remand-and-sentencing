import dayjs from 'dayjs'
import { PrisonApiPrisoner } from '../../@types/prisonApi/prisonClientTypes'

export default class PrisonerDetailsModel {
  offenderNo: string

  firstName: string

  lastName: string

  establishment: string

  cellNumber: string

  dateOfBirth: string

  pncNumber: string

  status: string

  constructor(prisonApiPrisoner: PrisonApiPrisoner) {
    this.offenderNo = prisonApiPrisoner.offenderNo
    this.firstName = prisonApiPrisoner.firstName
    this.lastName = prisonApiPrisoner.lastName
    this.establishment = prisonApiPrisoner.assignedLivingUnit.agencyName
    this.cellNumber = prisonApiPrisoner.assignedLivingUnit.description
    this.dateOfBirth = dayjs(prisonApiPrisoner.dateOfBirth).format('DD/MM/YYYY')
    const prisonerPNCNumber = prisonApiPrisoner.identifiers.find(identifier => identifier.type === 'PNC')
    if (prisonerPNCNumber) {
      this.pncNumber = prisonerPNCNumber.value
    }
    this.status = prisonApiPrisoner.legalStatus
  }
}
