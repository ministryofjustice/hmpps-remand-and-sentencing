/* eslint-disable no-param-reassign */
import path from 'path'
import nunjucks from 'nunjucks'
import express from 'express'
import {
  personProfileName,
  personDateOfBirth,
  personStatus,
  firstNameSpaceLastName,
  formatLengths,
  consecutiveToDetailsToDescription,
  formatMergedFromCase,
  formatCountNumber,
} from '@ministryofjustice/hmpps-court-cases-release-dates-design/hmpps/utils/utils'
import type { Offence, SentenceLength } from 'models'
import dayjs from 'dayjs'
import { ConsecutiveToDetails } from '@ministryofjustice/hmpps-court-cases-release-dates-design/hmpps/@types'
import {
  formatDate,
  formatDateTime,
  formatLengthsWithoutPeriodOrder,
  initialiseName,
  outcomeValueOrLegacy,
  periodLengthValueOrLegacy,
  pluraliseName,
  sentenceTypeValueOrLegacy,
  sortByDateDesc,
} from './utils'
import { ApplicationInfo } from '../applicationInfo'
import config from '../config'
import { periodLengthsToSentenceLengths } from './mappingUtils'
import type {
  AppearanceOutcome,
  AppearanceToChainTo,
  NextCourtAppearance,
  OffenceOutcome,
  PagedMergedFromCase,
  SentenceToChainTo,
} from '../@types/remandAndSentencingApi/remandAndSentencingClientTypes'

const production = process.env.NODE_ENV === 'production'

type Error = {
  href: string
  text: string
  html: string
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
      'node_modules/@ministryofjustice/hmpps-court-cases-release-dates-design/',
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
        html: item.html,
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

  njkEnv.addFilter('findPeriodLengthByType', (periodLengths: SentenceLength[], type: string) => {
    if (periodLengths) {
      return periodLengths.find(periodLength => periodLength.periodLengthType === type)
    }
    return null
  })

  njkEnv.addFilter(
    'appearanceOutcomeOrLegacy',
    (appearanceOutcome: AppearanceOutcome, legacyData: Record<string, never>) => {
      if (appearanceOutcome) {
        return appearanceOutcome.outcomeName
      }
      if (legacyData?.outcomeDescription) {
        return legacyData.outcomeDescription
      }
      return 'Not entered'
    },
  )

  njkEnv.addFilter('chargeOutcomeOrLegacy', (offenceOutcome: OffenceOutcome, legacyData: Record<string, never>) => {
    if (offenceOutcome) {
      return offenceOutcome.outcomeName
    }
    if (legacyData?.outcomeDescription) {
      return legacyData.outcomeDescription
    }
    return 'Not entered'
  })

  njkEnv.addFilter(
    'formatNextHearing',
    (nextCourtAppearance: NextCourtAppearance, courtNameMap: Map<string, string>) => {
      if (nextCourtAppearance) {
        const hearingDate = dayjs(
          `${nextCourtAppearance.appearanceDate}${nextCourtAppearance.appearanceTime ? `T${nextCourtAppearance.appearanceTime}` : ''}`,
        )
        return `${hearingDate.format(nextCourtAppearance.appearanceTime ? config.dateTimeFormat : config.dateFormat)} at ${courtNameMap[nextCourtAppearance.courtCode]}`
      }
      return 'Not entered'
    },
  )

  njkEnv.addFilter('sortByAppearanceDate', (appearances: AppearanceToChainTo[]) => {
    return appearances.sort((a, b) => {
      const aAppearanceDate = dayjs(a.appearanceDate)
      const bAppearanceDate = dayjs(b.appearanceDate)
      if (aAppearanceDate.isSame(bAppearanceDate)) {
        return 0
      }

      return aAppearanceDate.isBefore(bAppearanceDate) ? 1 : -1
    })
  })

  njkEnv.addFilter('sortByCountNumber', (sentences: SentenceToChainTo[]) => {
    return sentences.sort((a, b) => {
      const aCountNumber = a.countNumber
      const bCountNumber = b.countNumber
      if (aCountNumber === bCountNumber) {
        return sortByDateDesc(a.offenceStartDate, b.offenceStartDate)
      }
      if (!aCountNumber || aCountNumber === '-1') {
        return 1
      }
      if (!bCountNumber || bCountNumber === '-1') {
        return -1
      }
      return aCountNumber < bCountNumber ? -1 : 1
    })
  })

  njkEnv.addFilter('periodLengthValueOrLegacy', periodLengthValueOrLegacy)

  njkEnv.addFilter('outcomeValueOrLegacy', outcomeValueOrLegacy)
  njkEnv.addFilter('sentenceTypeValueOrLegacy', sentenceTypeValueOrLegacy)

  njkEnv.addFilter('personProfileName', personProfileName)
  njkEnv.addFilter('personDateOfBirth', personDateOfBirth)
  njkEnv.addFilter('personStatus', personStatus)
  njkEnv.addFilter('firstNameSpaceLastName', firstNameSpaceLastName)
  njkEnv.addFilter('pluraliseName', pluraliseName)

  njkEnv.addFilter('formatLengths', formatLengths)
  njkEnv.addFilter('formatLengthsWithoutPeriodOrder', formatLengthsWithoutPeriodOrder)

  njkEnv.addFilter('periodLengthsToSentenceLengths', periodLengthsToSentenceLengths)
  njkEnv.addFilter('consecutiveToDetailsToDescription', consecutiveToDetailsToDescription)
  njkEnv.addFilter('formatMergedFromCase', formatMergedFromCase)
  njkEnv.addFilter('formatCountNumber', formatCountNumber)
  njkEnv.addFilter(
    'formatOverallMergedFromCase',
    (mergedFromCase: PagedMergedFromCase, courtDetails: { [key: string]: string }) => {
      let description = `The case at ${courtDetails[mergedFromCase.courtCode]} on ${formatDate(mergedFromCase.warrantDate)} was merged with this case on ${formatDate(mergedFromCase.mergedFromDate)}.`
      if (mergedFromCase.caseReference) {
        description = `${mergedFromCase.caseReference} was merged with this case on ${formatDate(mergedFromCase.mergedFromDate)}.`
      }
      return description
    },
  )
  njkEnv.addFilter(
    'checkConsecutiveToSameCase',
    (consecutiveToDetails: ConsecutiveToDetails, offences: Offence[], consecutiveToSentenceUuid: string) => {
      let consecutiveToDetailsResponse = consecutiveToDetails
      if (
        consecutiveToSentenceUuid &&
        offences.find(offence => offence.sentence?.sentenceUuid === consecutiveToSentenceUuid) &&
        consecutiveToDetails
      ) {
        consecutiveToDetailsResponse = {
          countNumber: consecutiveToDetails.countNumber,
          offenceCode: consecutiveToDetails.offenceCode,
          offenceDescription: consecutiveToDetails.offenceDescription,
        }
      }
      return consecutiveToDetailsResponse
    },
  )

  njkEnv.addGlobal('featureToggles', config.featureToggles)
}
