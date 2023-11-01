import { dataAccess } from '../data'
import UserService from './userService'
import PrisonerService from './prisonerService'
import CourtCaseService from './courtCaseService'
import OffenceService from './offenceService'
import ManageOffencesService from './manageOffencesService'
import FeComponentsService from './feComponentsService'

export const services = () => {
  const { applicationInfo, manageUsersApiClient, feComponentsClient } = dataAccess()

  const userService = new UserService(manageUsersApiClient)

  const prisonerService = new PrisonerService()

  const courtCaseService = new CourtCaseService()

  const offenceService = new OffenceService()

  const manageOffencesService = new ManageOffencesService()

  const feComponentsService = new FeComponentsService(feComponentsClient)

  return {
    applicationInfo,
    userService,
    prisonerService,
    courtCaseService,
    offenceService,
    manageOffencesService,
    feComponentsService,
  }
}

export type Services = ReturnType<typeof services>

export { UserService }
