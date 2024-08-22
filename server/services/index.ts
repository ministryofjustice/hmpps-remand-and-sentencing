import { dataAccess } from '../data'
import PrisonerService from './prisonerService'
import OffenceService from './offenceService'
import ManageOffencesService from './manageOffencesService'
import FeComponentsService from './feComponentsService'
import RemandAndSentencingService from './remandAndSentencingService'
import CourtAppearanceService from './courtAppearanceService'
import DocumentManagementService from './documentManagementService'
import CaseOutcomeService from './caseOutcomeService'
import PrisonerSearchService from './prisonerSearchService'
import AuditService from './auditService'
import UserService from './userService'
import CourtRegisterService from './courtRegisterService'

export const services = () => {
  const { applicationInfo, feComponentsClient, hmppsAuthClient, hmppsAuditClient } = dataAccess()

  const prisonerService = new PrisonerService()

  const userService = new UserService(prisonerService)

  const manageOffencesService = new ManageOffencesService()

  const offenceService = new OffenceService(manageOffencesService)

  const feComponentsService = new FeComponentsService(feComponentsClient)

  const remandAndSentencingService = new RemandAndSentencingService()

  const courtAppearanceService = new CourtAppearanceService(remandAndSentencingService)

  const documentManagementService = new DocumentManagementService(hmppsAuthClient)

  const caseOutcomeService = new CaseOutcomeService()

  const prisonerSearchService = new PrisonerSearchService(hmppsAuthClient)
  const auditService = new AuditService(hmppsAuditClient)
  const courtRegisterService = new CourtRegisterService(hmppsAuthClient)

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
    auditService,
    courtRegisterService,
  }
}

export type Services = ReturnType<typeof services>
