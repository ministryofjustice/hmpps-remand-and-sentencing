import express from 'express'
import createError from 'http-errors'
import multer from 'multer' // Import multer

import nunjucksSetup from './utils/nunjucksSetup'
import errorHandler from './errorHandler'
import { appInsightsMiddleware } from './utils/azureAppInsights'
import authorisationMiddleware from './middleware/authorisationMiddleware'

import setUpAuthentication from './middleware/setUpAuthentication'
import setUpCsrf from './middleware/setUpCsrf' // This applies the CSRF protection globally
import setUpCurrentUser from './middleware/setUpCurrentUser'
import setUpHealthChecks from './middleware/setUpHealthChecks'
import setUpStaticResources from './middleware/setUpStaticResources'
import setUpWebRequestParsing from './middleware/setupRequestParsing' // Handles urlencoded and json
import setUpWebSecurity from './middleware/setUpWebSecurity'
import setUpWebSession from './middleware/setUpWebSession'
import getFrontendComponents from './middleware/getFeComponents'

import routes from './routes'
import type { Services } from './services'
import populateCurrentPrisoner from './middleware/populateCurrentPrisoner'
import setupCurrentCourtAppearance from './middleware/setUpCurrentCourtAppearance'
import setupCurrentCourtCase from './middleware/setUpCurrentCourtCase'
import setupCurrentOffence from './middleware/setupCurrentOffence'

// Initialize Multer globally.
// This instance will handle parsing of 'multipart/form-data' requests for ALL routes.
// `multer()` without `dest` or `storage` options means files are stored in memory (as buffers).
const upload = multer({ dest: 'uploads/' })

export default function createApp(services: Services): express.Application {
  const app = express()

  app.set('json spaces', 2)
  app.set('trust proxy', true)
  app.set('port', process.env.PORT || 3000)

  app.use(appInsightsMiddleware())
  app.use(setUpHealthChecks(services.applicationInfo))
  app.use(setUpWebSecurity())
  app.use(setUpWebSession())

  // --- Static resources FIRST (so CSS, JS, images are served directly) ---
  app.use(setUpStaticResources())

  // --- Body Parsers (order matters!) ---
  // 1. Standard URL-encoded and JSON body parsing
  app.use(setUpWebRequestParsing()) // Handles application/x-www-form-urlencoded and application/json

  // 2. Multipart form data parsing (for file uploads).
  //    This MUST come AFTER other body parsers (if any) and BEFORE CSRF,
  //    so req.body is populated with _csrf from multipart forms.
  //    `upload.any()` will parse all fields and files in a multipart request.
  app.use(upload.any())

  // --- Nunjucks view engine setup (usually before routes) ---
  nunjucksSetup(app, services.applicationInfo)

  // --- Authentication & Authorization ---
  app.use(setUpAuthentication())
  app.use(authorisationMiddleware(['ROLE_REMAND_AND_SENTENCING', 'ROLE_RELEASE_DATES_CALCULATOR']))

  // --- CSRF Protection ---
  // This now runs AFTER all body parsers (setUpWebRequestParsing and multer.any())
  // so that req.body._csrf is correctly populated when csrf-sync looks for it.
  app.use(setUpCsrf())

  // --- Current User and other context-setting middlewares ---
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

  // --- Main application routes ---
  app.use(routes(services))

  // --- Error handling ---
  app.use((req, res, next) => next(createError(404, 'Not found')))
  app.use(errorHandler(process.env.NODE_ENV === 'production'))

  return app
}
