import { dataAccess } from '../data'
import UserService from './userService'
import PrisonerService from './prisonerService'
import OffenceService from './offenceService'
import ManageOffencesService from './manageOffencesService'
import FeComponentsService from './feComponentsService'
import RemandAndSentencingService from './remandAndSentencingService'
import CourtAppearanceService from './courtAppearanceService'
import DocumentManagementService from './documentManagementService'
import CaseOutcomeService from './caseOutcomeService'
import PrisonerSearchService from './prisonerSearchService'

export const services = () => {
  const { applicationInfo, manageUsersApiClient, feComponentsClient, hmppsAuthClient } = dataAccess()

  const userService = new UserService(manageUsersApiClient)

  const prisonerService = new PrisonerService()

  const manageOffencesService = new ManageOffencesService()

  const offenceService = new OffenceService(manageOffencesService)

  const feComponentsService = new FeComponentsService(feComponentsClient)

  const remandAndSentencingService = new RemandAndSentencingService()

  const courtAppearanceService = new CourtAppearanceService()

  const documentManagementService = new DocumentManagementService(hmppsAuthClient)

  const caseOutcomeService = new CaseOutcomeService()

  const prisonerSearchService = new PrisonerSearchService(hmppsAuthClient)

  return {
    applicationInfo,
    userService,
    prisonerService,
    offenceService,
    manageOffencesService,
    feComponentsService,
    remandAndSentencingService,
    courtAppearanceService,
    documentManagementService,
    caseOutcomeService,
    prisonerSearchService,
  }
}

export type Services = ReturnType<typeof services>

export { UserService }
