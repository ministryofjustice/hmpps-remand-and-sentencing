import { dataAccess } from '../data'
import UserService from './userService'
import PrisonerService from './prisonerService'

export const services = () => {
  const { hmppsAuthClient, applicationInfo } = dataAccess()

  const userService = new UserService(hmppsAuthClient)

  const prisonerService = new PrisonerService()

  return {
    applicationInfo,
    userService,
    prisonerService,
  }
}

export type Services = ReturnType<typeof services>

export { UserService }
