import { dataAccess } from '../data'
import UserService from './userService'
import PrisonerService from './prisonerService'
import CourtCaseService from './courtCaseService'
import OffenceService from './offenceService'
import ManageOffencesService from './manageOffencesService'
import FeComponentsService from './feComponentsService'
import RemandAndSentencingService from './remandAndSentencingService'
import CourtAppearanceService from './courtAppearanceService'
import DocumentManagementService from './documentManagementService'
import CaseOutcomeService from './caseOutcomeService'

export const services = () => {
  const { applicationInfo, manageUsersApiClient, feComponentsClient, hmppsAuthClient } = dataAccess()

  const userService = new UserService(manageUsersApiClient)

  const prisonerService = new PrisonerService()

  const courtCaseService = new CourtCaseService()

  const offenceService = new OffenceService()

  const manageOffencesService = new ManageOffencesService()

  const feComponentsService = new FeComponentsService(feComponentsClient)

  const remandAndSentencingService = new RemandAndSentencingService()

  const courtAppearanceService = new CourtAppearanceService(courtCaseService)

  const documentManagementService = new DocumentManagementService(hmppsAuthClient)

  const caseOutcomeService = new CaseOutcomeService()

  return {
    applicationInfo,
    userService,
    prisonerService,
    courtCaseService,
    offenceService,
    manageOffencesService,
    feComponentsService,
    remandAndSentencingService,
    courtAppearanceService,
    documentManagementService,
    caseOutcomeService,
  }
}

export type Services = ReturnType<typeof services>

export { UserService }
