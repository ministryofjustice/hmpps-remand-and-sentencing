import express from 'express'

import createError from 'http-errors'

import nunjucksSetup from './utils/nunjucksSetup'
import errorHandler from './errorHandler'
import { appInsightsMiddleware } from './utils/azureAppInsights'
import authorisationMiddleware from './middleware/authorisationMiddleware'

import setUpAuthentication from './middleware/setUpAuthentication'
import setUpCsrf from './middleware/setUpCsrf'
import setUpCurrentUser from './middleware/setUpCurrentUser'
import setUpHealthChecks from './middleware/setUpHealthChecks'
import setUpStaticResources from './middleware/setUpStaticResources'
import setUpWebRequestParsing from './middleware/setupRequestParsing'
import setUpWebSecurity from './middleware/setUpWebSecurity'
import setUpWebSession from './middleware/setUpWebSession'
import getFrontendComponents from './middleware/getFeComponents'

import routes from './routes'
import type { Services } from './services'
import populateCurrentPrisoner from './middleware/populateCurrentPrisoner'
import setupCurrentCourtAppearance from './middleware/setUpCurrentCourtAppearance'
import setupCurrentCourtCase from './middleware/setUpCurrentCourtCase'
import setupCurrentOffence from './middleware/setupCurrentOffence'

export default function createApp(services: Services): express.Application {
  const app = express()

  app.set('json spaces', 2)
  app.set('trust proxy', true)
  app.set('port', process.env.PORT || 3000)

  app.use(appInsightsMiddleware())
  app.use(setUpHealthChecks(services.applicationInfo))
  app.use(setUpWebSecurity())
  app.use(setUpWebSession())
  app.use(setUpWebRequestParsing())
  app.use(setUpStaticResources())
  nunjucksSetup(app, services.applicationInfo)
  app.use(setUpAuthentication())
  app.use(authorisationMiddleware(['ROLE_REMAND_AND_SENTENCING', 'ROLE_RELEASE_DATES_CALCULATOR']))
  app.use(setUpCsrf())
  app.use(setUpCurrentUser(services))
  app.use('/person/:nomsId', populateCurrentPrisoner(services.prisonerSearchService))
  app.use('/person/:nomsId/:addOrEditCourtCase/:courtCaseReference', setupCurrentCourtCase())
  app.use(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance',
    setupCurrentCourtAppearance(
      services.courtAppearanceService,
      services.courtRegisterService,
      services.manageOffencesService,
      services.appearanceOutcomeService,
    ),
  )
  app.use(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/offences',
    setupCurrentOffence(services.offenceService),
  )
  app.get('*', getFrontendComponents(services))

  app.use(routes(services))

  app.use((req, res, next) => next(createError(404, 'Not found')))
  app.use(errorHandler(process.env.NODE_ENV === 'production'))

  return app
}
