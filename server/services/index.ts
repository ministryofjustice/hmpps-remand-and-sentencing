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
import RefDataService from './refDataService'
import CalculateReleaseDatesService from './calculateReleaseDatesService'
import CourtCasesReleaseDatesService from './courtCasesReleaseDatesService'

export const services = () => {
  const data = dataAccess()

  const prisonerService = new PrisonerService(data.prisonApiClient)

  const userService = new UserService(prisonerService)

  const manageOffencesService = new ManageOffencesService(data.manageOffencesApiClient)

  const feComponentsService = new FeComponentsService(data.feComponentsClient)

  const remandAndSentencingService = new RemandAndSentencingService(data.remandAndSentencingApiClient)

  const documentManagementService = new DocumentManagementService(data.documentManagementApiClient)

  const calculateReleaseDatesService = new CalculateReleaseDatesService(data.calculateReleaseDatesApiClient)

  const prisonerSearchService = new PrisonerSearchService(data.prisonerSearchApiClient)
  const auditService = new AuditService(data.hmppsAuditClient)
  const courtRegisterService = new CourtRegisterService(data.courtRegisterApiClient)
  const refDataService = new RefDataService(data.remandAndSentencingApiClient)
  const courtAppearanceService = new CourtAppearanceService(remandAndSentencingService, documentManagementService)
  const courtCasesReleaseDatesService = new CourtCasesReleaseDatesService(data.courtCasesReleaseDatesApiClient)
  const offenceService = new OffenceService(manageOffencesService, remandAndSentencingService, refDataService)

  return {
    applicationInfo: data.applicationInfo,
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
    calculateReleaseDatesService,
    courtCasesReleaseDatesService,
    refDataService,
  }
}

export type Services = ReturnType<typeof services>
