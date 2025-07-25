import express, { Express } from 'express'
import { NotFound } from 'http-errors'
import { v4 as uuidv4 } from 'uuid'

import routes from '../index'
import nunjucksSetup from '../../utils/nunjucksSetup'
import errorHandler from '../../errorHandler'
import * as auth from '../../authentication/auth'
import type { Services } from '../../services'
import type { ApplicationInfo } from '../../applicationInfo'
import { PrisonerSearchApiPrisoner } from '../../@types/prisonerSearchApi/prisonerSearchTypes'
import AuditService from '../../services/auditService'
import { HmppsUser } from '../../interfaces/hmppsUser'
import setUpWebSession from '../../middleware/setUpWebSession'
import CourtAppearanceService from '../../services/courtAppearanceService'

jest.mock('../../services/auditService')
jest.mock('../../services/courtAppearanceService')

const testAppInfo: ApplicationInfo = {
  applicationName: 'test',
  buildNumber: '1',
  gitRef: 'long ref',
  gitShortHash: 'short ref',
  branchName: 'main',
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

  nunjucksSetup(app, testAppInfo)
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
    req.id = uuidv4()
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
  services = {
    auditService: new AuditService(null) as jest.Mocked<AuditService>,
    courtAppearanceService: new CourtAppearanceService(null, null, null) as jest.Mocked<CourtAppearanceService>,
  },
  userSupplier = () => user,
  prisoner = defaultPrisoner,
}: {
  production?: boolean
  services?: Partial<Services>
  userSupplier?: () => HmppsUser
  prisoner?: PrisonerSearchApiPrisoner
}): Express {
  auth.default.authenticationMiddleware = () => (req, res, next) => next()
  return appSetup(services as Services, production, userSupplier, prisoner)
}
