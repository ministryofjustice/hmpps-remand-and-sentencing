import { type RequestHandler, Router } from 'express'

import asyncMiddleware from '../middleware/asyncMiddleware'
import CourtCaseRoutes from './courtCaseRoutes'
import { Services } from '../services'
import ApiRoutes from './apiRoutes'
import OffenceRoutes from './offenceRoutes'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function routes(services: Services): Router {
  const router = Router()

  const get = (path: string | string[], handler: RequestHandler) => router.get(path, asyncMiddleware(handler))

  const post = (path: string | string[], handler: RequestHandler) => router.post(path, asyncMiddleware(handler))

  const courtCaseRoutes = new CourtCaseRoutes(services.courtCaseService, services.courtAppearanceService)
  const apiRoutes = new ApiRoutes(services.prisonerService, services.manageOffencesService)
  const offenceRoutes = new OffenceRoutes(
    services.courtCaseService,
    services.offenceService,
    services.manageOffencesService,
    services.courtAppearanceService,
  )

  get('/', (req, res, next) => {
    res.render('pages/index')
  })
  get('/api/person/:nomsId/image', apiRoutes.personImage)

  get('/api/search-offence', apiRoutes.searchOffence)

  get('/person/:nomsId', courtCaseRoutes.start)

  get('/person/:nomsId/court-cases/:courtCaseReference/reference', courtCaseRoutes.getReference)

  post('/person/:nomsId/court-cases/:courtCaseReference/submit-reference', courtCaseRoutes.submitReference)

  get('/person/:nomsId/court-cases/:courtCaseReference/warrant-date', courtCaseRoutes.getWarrantDate)

  post('/person/:nomsId/court-cases/:courtCaseReference/submit-warrant-date', courtCaseRoutes.submitWarrantDate)

  get('/person/:nomsId/court-cases/:courtCaseReference/court-name', courtCaseRoutes.getCourtName)

  post('/person/:nomsId/court-cases/:courtCaseReference/submit-court-name', courtCaseRoutes.submitCourtName)

  get('/person/:nomsId/court-cases/:courtCaseReference/overall-case-outcome', courtCaseRoutes.getOverallCaseOutcome)

  post(
    '/person/:nomsId/court-cases/:courtCaseReference/submit-overall-case-outcome',
    courtCaseRoutes.submitOverallCaseOutcome,
  )

  get('/person/:nomsId/court-cases/:courtCaseReference/lookup-case-outcome', courtCaseRoutes.getLookupCaseOutcome)

  post(
    '/person/:nomsId/court-cases/:courtCaseReference/submit-lookup-case-outcome',
    courtCaseRoutes.submitLookupCaseOutcome,
  )

  get(
    '/person/:nomsId/court-cases/:courtCaseReference/case-outcome-applied-all',
    courtCaseRoutes.getCaseOutcomeAppliedAll,
  )

  post(
    '/person/:nomsId/court-cases/:courtCaseReference/submit-case-outcome-applied-all',
    courtCaseRoutes.submitCaseOutcomeAppliedAll,
  )

  get('/person/:nomsId/court-cases/:courtCaseReference/check-answers', courtCaseRoutes.getCheckAnswers)

  post('/person/:nomsId/court-cases/:courtCaseReference/submit-check-answers', courtCaseRoutes.submitCheckAnswers)

  get(
    '/person/:nomsId/court-cases/:courtCaseReference/offences/:offenceReference/offence-date',
    offenceRoutes.getOffenceDate,
  )

  post(
    '/person/:nomsId/court-cases/:courtCaseReference/offences/:offenceReference/submit-offence-date',
    offenceRoutes.submitOffenceDate,
  )

  get(
    '/person/:nomsId/court-cases/:courtCaseReference/offences/:offenceReference/offence-outcome',
    offenceRoutes.getOffenceOutcome,
  )

  post(
    '/person/:nomsId/court-cases/:courtCaseReference/offences/:offenceReference/submit-offence-outcome',
    offenceRoutes.submitOffenceOutcome,
  )

  get(
    '/person/:nomsId/court-cases/:courtCaseReference/offences/:offenceReference/lookup-offence-outcome',
    offenceRoutes.getLookupOffenceOutcome,
  )

  post(
    '/person/:nomsId/court-cases/:courtCaseReference/offences/:offenceReference/submit-lookup-offence-outcome',
    offenceRoutes.submitLookupOffenceOutcome,
  )

  get(
    '/person/:nomsId/court-cases/:courtCaseReference/offences/:offenceReference/offence-code',
    offenceRoutes.getOffenceCode,
  )

  post(
    '/person/:nomsId/court-cases/:courtCaseReference/offences/:offenceReference/submit-offence-code',
    offenceRoutes.submitOffenceCode,
  )

  get(
    '/person/:nomsId/court-cases/:courtCaseReference/offences/:offenceReference/offence-name',
    offenceRoutes.getOffenceName,
  )

  post(
    '/person/:nomsId/court-cases/:courtCaseReference/offences/:offenceReference/submit-offence-name',
    offenceRoutes.submitOffenceName,
  )

  get(
    '/person/:nomsId/court-cases/:courtCaseReference/offences/:offenceReference/confirm-offence-code',
    offenceRoutes.getConfirmOffenceCode,
  )

  post(
    '/person/:nomsId/court-cases/:courtCaseReference/offences/:offenceReference/submit-confirm-offence',
    offenceRoutes.submitConfirmOffenceCode,
  )

  get(
    '/person/:nomsId/court-cases/:courtCaseReference/offences/check-offence-answers',
    offenceRoutes.getCheckOffenceAnswers,
  )

  get(
    '/person/:nomsId/court-cases/:courtCaseReference/offences/:offenceReference/add-another-offence',
    offenceRoutes.addAnotherOffence,
  )

  get(
    '/person/:nomsId/court-cases/:courtCaseReference/offences/:offenceReference/delete-offence',
    offenceRoutes.getDeleteOffence,
  )

  post(
    '/person/:nomsId/court-cases/:courtCaseReference/offences/:offenceReference/submit-delete-offence',
    offenceRoutes.submitDeleteOffence,
  )

  get('/person/:nomsId/court-cases/:courtCaseReference/next-hearing-select', courtCaseRoutes.getNextHearingSelect)

  post(
    '/person/:nomsId/court-cases/:courtCaseReference/submit-next-hearing-select',
    courtCaseRoutes.submitNextHearingSelect,
  )

  get('/person/:nomsId/court-cases/:courtCaseReference/next-hearing-type', courtCaseRoutes.getNextHearingType)

  post(
    '/person/:nomsId/court-cases/:courtCaseReference/submit-next-hearing-type',
    courtCaseRoutes.submitNextHearingType,
  )

  get('/person/:nomsId/court-cases/:courtCaseReference/next-hearing-date', courtCaseRoutes.getNextHearingDate)

  post(
    '/person/:nomsId/court-cases/:courtCaseReference/submit-next-hearing-date',
    courtCaseRoutes.submitNextHearingDate,
  )

  get(
    '/person/:nomsId/court-cases/:courtCaseReference/next-hearing-court-select',
    courtCaseRoutes.getNextHearingCourtSelect,
  )

  post(
    '/person/:nomsId/court-cases/:courtCaseReference/submit-next-hearing-court-select',
    courtCaseRoutes.submitNextHearingCourtSelect,
  )

  get(
    '/person/:nomsId/court-cases/:courtCaseReference/next-hearing-court-name',
    courtCaseRoutes.getNextHearingCourtName,
  )

  post(
    '/person/:nomsId/court-cases/:courtCaseReference/submit-next-hearing-court-name',
    courtCaseRoutes.submitNextHearingCourtName,
  )

  get(
    '/person/:nomsId/court-cases/:courtCaseReference/check-next-hearing-answers',
    courtCaseRoutes.getCheckNextHearingAnswers,
  )

  post(
    '/person/:nomsId/court-cases/:courtCaseReference/submit-check-next-hearing-answers',
    courtCaseRoutes.submiCheckNextHearingAnswers,
  )

  return router
}
