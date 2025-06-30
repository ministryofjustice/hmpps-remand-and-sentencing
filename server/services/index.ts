import { dataAccess } from '../data'
import PrisonerService from './prisonerService'
import OffenceService from './offenceService'
import ManageOffencesService from './manageOffencesService'
import FeComponentsService from './feComponentsService'
import RemandAndSentencingService from './remandAndSentencingService'
import CourtAppearanceService from './courtAppearanceService'
import DocumentManagementService from './documentManagementService'
import PrisonerSearchService from './prisonerSearchService'
import AuditService from './auditService'
import UserService from './userService'
import CourtRegisterService from './courtRegisterService'
import AppearanceOutcomeService from './appearanceOutcomeService'
import OffenceOutcomeService from './offenceOutcomeService'
import CalculateReleaseDatesService from './calculateReleaseDatesService'
import CourtCasesReleaseDatesService from './courtCasesReleaseDatesService'

export const services = () => {
  const { applicationInfo, feComponentsClient, hmppsAuthClient, hmppsAuditClient } = dataAccess()

  const prisonerService = new PrisonerService()

  const userService = new UserService(prisonerService)

  const manageOffencesService = new ManageOffencesService()

  const feComponentsService = new FeComponentsService(feComponentsClient)

  const remandAndSentencingService = new RemandAndSentencingService(hmppsAuthClient)

  const documentManagementService = new DocumentManagementService(hmppsAuthClient)

  const calculateReleaseDatesService = new CalculateReleaseDatesService(hmppsAuthClient)

  const prisonerSearchService = new PrisonerSearchService(hmppsAuthClient)
  const auditService = new AuditService(hmppsAuditClient)
  const courtRegisterService = new CourtRegisterService(hmppsAuthClient)
  const appearanceOutcomeService = new AppearanceOutcomeService(hmppsAuthClient)
  const offenceOutcomeService = new OffenceOutcomeService(hmppsAuthClient)
  const courtAppearanceService = new CourtAppearanceService(remandAndSentencingService, documentManagementService)
  const courtCasesReleaseDatesService = new CourtCasesReleaseDatesService()
  const offenceService = new OffenceService(manageOffencesService, offenceOutcomeService, remandAndSentencingService)

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
    prisonerSearchService,
    auditService,
    courtRegisterService,
    appearanceOutcomeService,
    offenceOutcomeService,
    calculateReleaseDatesService,
    courtCasesReleaseDatesService,
  }
}

export type Services = ReturnType<typeof services>
