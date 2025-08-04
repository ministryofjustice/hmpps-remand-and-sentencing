import express, { Express } from 'express'
import { NotFound } from 'http-errors'

import { randomUUID } from 'crypto'
import routes from '../index'
import nunjucksSetup from '../../utils/nunjucksSetup'
import errorHandler from '../../errorHandler'
import type { Services } from '../../services'
import type { ApplicationInfo } from '../../applicationInfo'
import { PrisonerSearchApiPrisoner } from '../../@types/prisonerSearchApi/prisonerSearchTypes'
import AuditService from '../../services/auditService'
import { HmppsUser } from '../../interfaces/hmppsUser'
import setUpWebSession from '../../middleware/setUpWebSession'
import CourtAppearanceService from '../../services/courtAppearanceService'
import PrisonerService from '../../services/prisonerService'
import UserService from '../../services/userService'
import OffenceService from '../../services/offenceService'
import ManageOffencesService from '../../services/manageOffencesService'
import RemandAndSentencingService from '../../services/remandAndSentencingService'
import FeComponentsService from '../../services/feComponentsService'
import DocumentManagementService from '../../services/documentManagementService'
import PrisonerSearchService from '../../services/prisonerSearchService'
import CourtRegisterService from '../../services/courtRegisterService'
import AppearanceOutcomeService from '../../services/appearanceOutcomeService'
import OffenceOutcomeService from '../../services/offenceOutcomeService'
import CalculateReleaseDatesService from '../../services/calculateReleaseDatesService'
import CourtCasesReleaseDatesService from '../../services/courtCasesReleaseDatesService'

jest.mock('../../services/auditService')
jest.mock('../../services/courtAppearanceService')
jest.mock('../../services/prisonerService')
jest.mock('../../services/userService')
jest.mock('../../services/offenceService')
jest.mock('../../services/manageOffencesService')
jest.mock('../../services/remandAndSentencingService')
jest.mock('../../services/feComponentsService')
jest.mock('../../services/documentManagementService')
jest.mock('../../services/prisonerSearchService')
jest.mock('../../services/courtRegisterService')
jest.mock('../../services/appearanceOutcomeService')
jest.mock('../../services/offenceOutcomeService')
jest.mock('../../services/calculateReleaseDatesService')
jest.mock('../../services/courtCasesReleaseDatesService')

const testAppInfo: ApplicationInfo = {
  applicationName: 'test',
  buildNumber: '1',
  gitRef: 'long ref',
  gitShortHash: 'short ref',
  branchName: 'main',
}

export const defaultServices = {
  applicationInfo: testAppInfo,
  userService: new UserService(null) as jest.Mocked<UserService>,
  prisonerService: new PrisonerService(null) as jest.Mocked<PrisonerService>,
  offenceService: new OffenceService(null, null, null) as jest.Mocked<OffenceService>,
  manageOffencesService: new ManageOffencesService(null) as jest.Mocked<ManageOffencesService>,
  feComponentsService: new FeComponentsService(null) as jest.Mocked<FeComponentsService>,
  remandAndSentencingService: new RemandAndSentencingService(null) as jest.Mocked<RemandAndSentencingService>,
  courtAppearanceService: new CourtAppearanceService(null, null, null) as jest.Mocked<CourtAppearanceService>,
  documentManagementService: new DocumentManagementService(null) as jest.Mocked<DocumentManagementService>,
  prisonerSearchService: new PrisonerSearchService(null) as jest.Mocked<PrisonerSearchService>,
  auditService: new AuditService(null) as jest.Mocked<AuditService>,
  courtRegisterService: new CourtRegisterService(null) as jest.Mocked<CourtRegisterService>,
  appearanceOutcomeService: new AppearanceOutcomeService(null) as jest.Mocked<AppearanceOutcomeService>,
  offenceOutcomeService: new OffenceOutcomeService(null) as jest.Mocked<OffenceOutcomeService>,
  calculateReleaseDatesService: new CalculateReleaseDatesService(null) as jest.Mocked<CalculateReleaseDatesService>,
  courtCasesReleaseDatesService: new CourtCasesReleaseDatesService() as jest.Mocked<CourtCasesReleaseDatesService>,
}

export const user: HmppsUser = {
  name: 'FIRST LAST',
  userId: 'id',
  token: 'token',
  username: 'user1',
  displayName: 'First Last',
  authSource: 'nomis',
  staffId: 1234,
  userRoles: [],
  caseLoads: [
    {
      caseLoadId: 'MDI',
      description: 'mdi prison',
      type: 'INST',
      currentlyActive: true,
    },
  ],
  activeCaseLoadId: 'MDI',
  hasInactiveBookingsAccess: false,
  hasRecallsAccess: false,
}

const defaultPrisoner: PrisonerSearchApiPrisoner = {
  prisonerNumber: 'A1234AB',
  bookingId: '1234',
  firstName: 'Cormac',
  lastName: 'Meza',
  dateOfBirth: '1965-02-03',
  prisonId: 'MDI',
  status: 'REMAND',
  prisonName: 'HMP Bedford',
  cellLocation: 'CELL-1',
  pncNumber: '1231/XX/121',
  imprisonmentStatusDescription: 'Sentenced with a sentence c',
} as PrisonerSearchApiPrisoner

export const flashProvider = jest.fn()
flashProvider.mockReturnValue([])

function appSetup(
  services: Services,
  production: boolean,
  userSupplier: () => HmppsUser,
  prisoner: PrisonerSearchApiPrisoner,
): Express {
  const app = express()

  app.set('view engine', 'njk')

  nunjucksSetup(app)
  app.use(setUpWebSession())
  app.use((req, res, next) => {
    req.user = userSupplier() as Express.User
    req.flash = flashProvider
    res.locals = {
      user: { ...req.user } as HmppsUser,
      prisoner,
    }
    next()
  })
  app.use((req, res, next) => {
    req.id = randomUUID()
    next()
  })
  app.use(express.json())
  app.use(express.urlencoded({ extended: true }))
  app.use(routes(services))
  app.use((req, res, next) => next(new NotFound()))
  app.use(errorHandler(production))

  return app
}

export function appWithAllRoutes({
  production = false,
  services = defaultServices,
  userSupplier = () => user,
  prisoner = defaultPrisoner,
}: {
  production?: boolean
  services?: Partial<Services>
  userSupplier?: () => HmppsUser
  prisoner?: PrisonerSearchApiPrisoner
}): Express {
  return appSetup(services as Services, production, userSupplier)
}
