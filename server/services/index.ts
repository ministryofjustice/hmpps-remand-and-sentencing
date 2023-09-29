import { dataAccess } from '../data'
import UserService from './userService'
import PrisonerService from './prisonerService'
import CourtCaseService from './courtCaseService'
import OffenceService from './offenceService'

export const services = () => {
  const { hmppsAuthClient, applicationInfo } = dataAccess()

  const userService = new UserService(hmppsAuthClient)

  const prisonerService = new PrisonerService()

  const courtCaseService = new CourtCaseService()

  const offenceService = new OffenceService()

  return {
    applicationInfo,
    userService,
    prisonerService,
    courtCaseService,
    offenceService,
  }
}

export type Services = ReturnType<typeof services>

export { UserService }
