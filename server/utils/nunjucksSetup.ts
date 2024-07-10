/* eslint-disable no-param-reassign */
import path from 'path'
import nunjucks from 'nunjucks'
import express from 'express'
import {
  personProfileName,
  personDateOfBirth,
  personStatus,
  firstNameSpaceLastName,
} from 'hmpps-court-cases-release-dates-design/hmpps/utils/utils'
import { formatDate, formatDateTime, formatLengths, initialiseName, pluraliseName } from './utils'
import { ApplicationInfo } from '../applicationInfo'
import config from '../config'

const production = process.env.NODE_ENV === 'production'

type Error = {
  href: string
  text: string
}

export default function nunjucksSetup(app: express.Express, applicationInfo: ApplicationInfo): void {
  app.set('view engine', 'njk')

  app.locals.asset_path = '/assets/'
  app.locals.applicationName = 'Hmpps Remand And Sentencing'
  app.locals.environmentName = config.environmentName
  app.locals.environmentNameColour = config.environmentName === 'PRE-PRODUCTION' ? 'govuk-tag--green' : ''
  app.locals.digitalPrisonServicesUrl = config.digitalPrisonServices.ui_url
  app.locals.appInsightsConnectionString = config.appInsightsConnectionString
  app.locals.appInsightsApplicationName = applicationInfo.applicationName
  app.locals.buildNumber = config.buildNumber
  app.locals.adjustmentServiceUrl = config.adjustmentService.ui_url

  if (config.environmentName === 'LOCAL') {
    app.locals.environment = 'local'
  } else if (config.environmentName === 'DEV') {
    app.locals.environment = 'dev'
  } else if (config.environmentName === 'PRE-PRODUCTION') {
    app.locals.environment = 'pre'
  } else {
    app.locals.environment = 'prod'
  }

  // Cachebusting version string
  if (production) {
    // Version only changes with new commits
    app.locals.version = applicationInfo.gitShortHash
  } else {
    // Version changes every request
    app.use((req, res, next) => {
      res.locals.version = Date.now().toString()
      return next()
    })
  }

  const njkEnv = nunjucks.configure(
    [
      path.join(__dirname, '../../server/views'),
      'node_modules/govuk-frontend/dist/',
      'node_modules/@ministryofjustice/frontend/',
      'node_modules/hmpps-court-cases-release-dates-design/',
    ],
    {
      autoescape: true,
      express: app,
    },
  )

  njkEnv.addFilter('initialiseName', initialiseName)
  njkEnv.addFilter('formatDate', formatDate)

  njkEnv.addFilter('formatDateTime', formatDateTime)

  njkEnv.addFilter('findError', (array: Error[], formFieldId: string) => {
    const item = array.find(error => error.href === `#${formFieldId}`)
    if (item) {
      return {
        text: item.text,
      }
    }
    return null
  })

  njkEnv.addFilter('findErrorsBeginningWith', (array: Error[], beginsWith: string) => {
    const allMessages = array
      .filter(error => error.href.startsWith(`#${beginsWith}`))
      .map(error => error.text)
      .join(', ')
    if (allMessages) {
      return {
        text: allMessages,
      }
    }
    return null
  })

  njkEnv.addFilter('personProfileName', personProfileName)
  njkEnv.addFilter('personDateOfBirth', personDateOfBirth)
  njkEnv.addFilter('personStatus', personStatus)
  njkEnv.addFilter('firstNameSpaceLastName', firstNameSpaceLastName)
  njkEnv.addFilter('pluraliseName', pluraliseName)

  njkEnv.addFilter('formatLengths', formatLengths)
}
