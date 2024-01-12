import { type RequestHandler, Router } from 'express'
import multer from 'multer'

import asyncMiddleware from '../middleware/asyncMiddleware'
import CourtCaseRoutes from './courtCaseRoutes'
import { Services } from '../services'
import ApiRoutes from './apiRoutes'
import OffenceRoutes from './offenceRoutes'

const upload = multer({ dest: 'uploads/' })
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function routes(services: Services): Router {
  const router = Router()

  const get = (path: string | string[], handler: RequestHandler) => router.get(path, asyncMiddleware(handler))

  const post = (path: string | string[], handler: RequestHandler) => router.post(path, asyncMiddleware(handler))

  const postWithFileUpload = (path: string | string[], handler: RequestHandler) =>
    router.post(path, upload.single('warrantUpload'), asyncMiddleware(handler))

  const courtCaseRoutes = new CourtCaseRoutes(
    services.courtCaseService,
    services.courtAppearanceService,
    services.remandAndSentencingService,
    services.manageOffencesService,
    services.documentManagementService,
  )
  const apiRoutes = new ApiRoutes(services.prisonerService, services.manageOffencesService)
  const offenceRoutes = new OffenceRoutes(
    services.offenceService,
    services.manageOffencesService,
    services.courtAppearanceService,
    services.courtCaseService,
  )

  get('/', (req, res, next) => {
    res.render('pages/index')
  })
  get('/api/person/:nomsId/image', apiRoutes.personImage)

  get('/api/search-offence', apiRoutes.searchOffence)

  get('/person/:nomsId', courtCaseRoutes.start)

  get(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/appearance/:appearanceReference/reference',
    courtCaseRoutes.getReference,
  )

  post(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/appearance/:appearanceReference/submit-reference',
    courtCaseRoutes.submitReference,
  )

  get(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/appearance/:appearanceReference/select-reference',
    courtCaseRoutes.getSelectReference,
  )

  post(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/appearance/:appearanceReference/submit-select-reference',
    courtCaseRoutes.submitSelectReference,
  )

  get(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/appearance/:appearanceReference/warrant-date',
    courtCaseRoutes.getWarrantDate,
  )

  post(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/appearance/:appearanceReference/submit-warrant-date',
    courtCaseRoutes.submitWarrantDate,
  )

  get(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/appearance/:appearanceReference/select-court-name',
    courtCaseRoutes.getSelectCourtName,
  )

  post(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/appearance/:appearanceReference/submit-select-court-name',
    courtCaseRoutes.submitSelectCourtName,
  )

  get(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/appearance/:appearanceReference/court-name',
    courtCaseRoutes.getCourtName,
  )

  post(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/appearance/:appearanceReference/submit-court-name',
    courtCaseRoutes.submitCourtName,
  )

  get(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/appearance/:appearanceReference/warrant-type',
    courtCaseRoutes.getWarrantType,
  )

  post(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/appearance/:appearanceReference/submit-warrant-type',
    courtCaseRoutes.submitWarrantType,
  )

  get(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/appearance/:appearanceReference/warrant-upload',
    courtCaseRoutes.getWarrantUpload,
  )

  postWithFileUpload(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/appearance/:appearanceReference/submit-warrant-upload',
    courtCaseRoutes.submitWarrantUpload,
  )

  get(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/appearance/:appearanceReference/overall-case-outcome',
    courtCaseRoutes.getOverallCaseOutcome,
  )

  post(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/appearance/:appearanceReference/submit-overall-case-outcome',
    courtCaseRoutes.submitOverallCaseOutcome,
  )

  get(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/appearance/:appearanceReference/lookup-case-outcome',
    courtCaseRoutes.getLookupCaseOutcome,
  )

  post(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/appearance/:appearanceReference/submit-lookup-case-outcome',
    courtCaseRoutes.submitLookupCaseOutcome,
  )

  get(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/appearance/:appearanceReference/case-outcome-applied-all',
    courtCaseRoutes.getCaseOutcomeAppliedAll,
  )

  post(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/appearance/:appearanceReference/submit-case-outcome-applied-all',
    courtCaseRoutes.submitCaseOutcomeAppliedAll,
  )

  get(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/appearance/:appearanceReference/check-answers',
    courtCaseRoutes.getCheckAnswers,
  )

  post(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/appearance/:appearanceReference/submit-check-answers',
    courtCaseRoutes.submitCheckAnswers,
  )

  get(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/appearance/:appearanceReference/review-offences',
    offenceRoutes.getReviewOffences,
  )

  post(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/appearance/:appearanceReference/submit-review-offences',
    offenceRoutes.submitReviewOffences,
  )

  get(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/appearance/:appearanceReference/offences/:offenceReference/offence-date',
    offenceRoutes.getOffenceDate,
  )

  post(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/appearance/:appearanceReference/offences/:offenceReference/submit-offence-date',
    offenceRoutes.submitOffenceDate,
  )

  get(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/appearance/:appearanceReference/offences/:offenceReference/offence-outcome',
    offenceRoutes.getOffenceOutcome,
  )

  post(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/appearance/:appearanceReference/offences/:offenceReference/submit-offence-outcome',
    offenceRoutes.submitOffenceOutcome,
  )

  get(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/appearance/:appearanceReference/offences/:offenceReference/lookup-offence-outcome',
    offenceRoutes.getLookupOffenceOutcome,
  )

  post(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/appearance/:appearanceReference/offences/:offenceReference/submit-lookup-offence-outcome',
    offenceRoutes.submitLookupOffenceOutcome,
  )

  get(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/appearance/:appearanceReference/offences/:offenceReference/offence-code',
    offenceRoutes.getOffenceCode,
  )

  post(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/appearance/:appearanceReference/offences/:offenceReference/submit-offence-code',
    offenceRoutes.submitOffenceCode,
  )

  get(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/appearance/:appearanceReference/offences/:offenceReference/offence-name',
    offenceRoutes.getOffenceName,
  )

  post(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/appearance/:appearanceReference/offences/:offenceReference/submit-offence-name',
    offenceRoutes.submitOffenceName,
  )

  get(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/appearance/:appearanceReference/offences/:offenceReference/confirm-offence-code',
    offenceRoutes.getConfirmOffenceCode,
  )

  post(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/appearance/:appearanceReference/offences/:offenceReference/submit-confirm-offence',
    offenceRoutes.submitConfirmOffenceCode,
  )

  get(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/appearance/:appearanceReference/offences/check-offence-answers',
    offenceRoutes.getCheckOffenceAnswers,
  )

  get(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/appearance/:appearanceReference/offences/:offenceReference/add-another-offence',
    offenceRoutes.addAnotherOffence,
  )

  get(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/appearance/:appearanceReference/offences/:offenceReference/delete-offence',
    offenceRoutes.getDeleteOffence,
  )

  post(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/appearance/:appearanceReference/offences/:offenceReference/submit-delete-offence',
    offenceRoutes.submitDeleteOffence,
  )

  get(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/appearance/:appearanceReference/next-hearing-select',
    courtCaseRoutes.getNextHearingSelect,
  )

  post(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/appearance/:appearanceReference/submit-next-hearing-select',
    courtCaseRoutes.submitNextHearingSelect,
  )

  get(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/appearance/:appearanceReference/next-hearing-type',
    courtCaseRoutes.getNextHearingType,
  )

  post(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/appearance/:appearanceReference/submit-next-hearing-type',
    courtCaseRoutes.submitNextHearingType,
  )

  get(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/appearance/:appearanceReference/next-hearing-date',
    courtCaseRoutes.getNextHearingDate,
  )

  post(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/appearance/:appearanceReference/submit-next-hearing-date',
    courtCaseRoutes.submitNextHearingDate,
  )

  get(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/appearance/:appearanceReference/next-hearing-court-select',
    courtCaseRoutes.getNextHearingCourtSelect,
  )

  post(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/appearance/:appearanceReference/submit-next-hearing-court-select',
    courtCaseRoutes.submitNextHearingCourtSelect,
  )

  get(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/appearance/:appearanceReference/next-hearing-court-name',
    courtCaseRoutes.getNextHearingCourtName,
  )

  post(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/appearance/:appearanceReference/submit-next-hearing-court-name',
    courtCaseRoutes.submitNextHearingCourtName,
  )

  get(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/appearance/:appearanceReference/check-next-hearing-answers',
    courtCaseRoutes.getCheckNextHearingAnswers,
  )

  post(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/appearance/:appearanceReference/submit-check-next-hearing-answers',
    courtCaseRoutes.submiCheckNextHearingAnswers,
  )

  return router
}
