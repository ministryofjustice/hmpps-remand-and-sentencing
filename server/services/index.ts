import { dataAccess } from '../data'
import UserService from './userService'
import PrisonerService from './prisonerService'
import CourtCaseService from './courtCaseService'

export const services = () => {
  const { hmppsAuthClient, applicationInfo } = dataAccess()

  const userService = new UserService(hmppsAuthClient)

  const prisonerService = new PrisonerService()

  const courtCaseService = new CourtCaseService()

  return {
    applicationInfo,
    userService,
    prisonerService,
    courtCaseService,
  }
}

export type Services = ReturnType<typeof services>

export { UserService }
