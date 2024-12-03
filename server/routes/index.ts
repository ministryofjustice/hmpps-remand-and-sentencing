import { type RequestHandler, Router } from 'express'
import multer from 'multer'

import asyncMiddleware from '../middleware/asyncMiddleware'
import CourtCaseRoutes from './courtCaseRoutes'
import ApiRoutes from './apiRoutes'
import OffenceRoutes from './offenceRoutes'
import type { Services } from '../services'
import { Page } from '../services/auditService'

const upload = multer({ dest: 'uploads/' })
export default function routes(services: Services): Router {
  const router = Router()

  const get = (path: string | string[], handler: RequestHandler) => router.get(path, asyncMiddleware(handler))

  const post = (path: string | string[], handler: RequestHandler) => router.post(path, asyncMiddleware(handler))

  const postWithFileUpload = (path: string | string[], handler: RequestHandler) =>
    router.post(path, upload.single('warrantUpload'), asyncMiddleware(handler))

  const courtCaseRoutes = new CourtCaseRoutes(
    services.courtAppearanceService,
    services.remandAndSentencingService,
    services.manageOffencesService,
    services.documentManagementService,
    services.courtRegisterService,
    services.appearanceOutcomeService,
    services.offenceOutcomeService,
    services.prisonerSearchService,
  )
  const apiRoutes = new ApiRoutes(
    services.prisonerService,
    services.manageOffencesService,
    services.courtRegisterService,
  )
  const offenceRoutes = new OffenceRoutes(
    services.offenceService,
    services.manageOffencesService,
    services.courtAppearanceService,
    services.remandAndSentencingService,
    services.offenceOutcomeService,
    services.calculateReleaseDatesService,
  )

  get('/', async (req, res, next) => {
    await services.auditService.logPageView(Page.EXAMPLE_PAGE, { who: res.locals.user.username, correlationId: req.id })
    res.render('pages/index')
  })
  get('/api/person/:nomsId/image', apiRoutes.personImage)

  get('/api/search-offence', apiRoutes.searchOffence)
  get('/api/search-court', apiRoutes.searchCourts)

  get('/person/:nomsId', courtCaseRoutes.start)

  get('/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/details', courtCaseRoutes.getCourtCaseDetails)

  get(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/details',
    courtCaseRoutes.getAppearanceDetails,
  )

  post(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/submit-details-edit',
    courtCaseRoutes.submitAppearanceDetailsEdit,
  )

  get(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/new-journey',
    courtCaseRoutes.newJourney,
  )

  get(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/warrant-type',
    courtCaseRoutes.getWarrantType,
  )

  post(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/submit-warrant-type',
    courtCaseRoutes.submitWarrantType,
  )

  get(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/task-list',
    courtCaseRoutes.getTaskList,
  )

  post(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/submit-task-list',
    courtCaseRoutes.submitTaskList,
  )

  get(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/reference',
    courtCaseRoutes.getReference,
  )

  post(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/submit-reference',
    courtCaseRoutes.submitReference,
  )

  get(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/select-reference',
    courtCaseRoutes.getSelectReference,
  )

  post(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/submit-select-reference',
    courtCaseRoutes.submitSelectReference,
  )

  get(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/warrant-date',
    courtCaseRoutes.getWarrantDate,
  )

  post(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/submit-warrant-date',
    courtCaseRoutes.submitWarrantDate,
  )

  get(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/select-court-name',
    courtCaseRoutes.getSelectCourtName,
  )

  post(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/submit-select-court-name',
    courtCaseRoutes.submitSelectCourtName,
  )

  get(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/court-name',
    courtCaseRoutes.getCourtName,
  )

  post(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/submit-court-name',
    courtCaseRoutes.submitCourtName,
  )

  get(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/warrant-upload',
    courtCaseRoutes.getWarrantUpload,
  )

  postWithFileUpload(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/submit-warrant-upload',
    courtCaseRoutes.submitWarrantUpload,
  )

  get(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/overall-case-outcome',
    courtCaseRoutes.getOverallCaseOutcome,
  )

  post(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/submit-overall-case-outcome',
    courtCaseRoutes.submitOverallCaseOutcome,
  )

  get(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/case-outcome-applied-all',
    courtCaseRoutes.getCaseOutcomeAppliedAll,
  )

  post(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/submit-case-outcome-applied-all',
    courtCaseRoutes.submitCaseOutcomeAppliedAll,
  )

  get(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/tagged-bail',
    courtCaseRoutes.getTaggedBail,
  )

  post(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/submit-tagged-bail',
    courtCaseRoutes.submitTaggedBail,
  )

  get(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/overall-sentence-length',
    courtCaseRoutes.getOverallSentenceLength,
  )

  post(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/submit-overall-sentence-length',
    courtCaseRoutes.submitOverallSentenceLength,
  )

  get(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/alternative-overall-sentence-length',
    courtCaseRoutes.getAlternativeSentenceLength,
  )

  post(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/submit-overall-alternative-sentence-length',
    courtCaseRoutes.submitAlternativeSentenceLength,
  )

  get(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/overall-conviction-date',
    courtCaseRoutes.getOverallConvictionDate,
  )

  post(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/submit-overall-conviction-date',
    courtCaseRoutes.submitOverallConvictionDate,
  )

  get(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/overall-conviction-date-applied-all',
    courtCaseRoutes.getOverallConvictionDateAppliedAll,
  )

  post(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/submit-overall-conviction-date-applied-all',
    courtCaseRoutes.submitOverallConvictionDateAppliedAll,
  )

  get(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/check-answers',
    courtCaseRoutes.getCheckAnswers,
  )

  post(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/submit-check-answers',
    courtCaseRoutes.submitCheckAnswers,
  )

  get(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/review-offences',
    offenceRoutes.getReviewOffences,
  )

  post(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/submit-review-offences',
    offenceRoutes.submitReviewOffences,
  )

  get(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/offences/:offenceReference/conviction-date',
    offenceRoutes.getConvictionDate,
  )

  post(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/offences/:offenceReference/submit-conviction-date',
    offenceRoutes.submitConvictionDate,
  )

  get(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/offences/:offenceReference/offence-date',
    offenceRoutes.getOffenceDate,
  )

  post(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/offences/:offenceReference/submit-offence-date',
    offenceRoutes.submitOffenceDate,
  )

  get(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/offences/:offenceReference/offence-outcome',
    offenceRoutes.getOffenceOutcome,
  )

  post(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/offences/:offenceReference/submit-offence-outcome',
    offenceRoutes.submitOffenceOutcome,
  )

  get(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/offences/:offenceReference/count-number',
    offenceRoutes.getCountNumber,
  )

  post(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/offences/:offenceReference/submit-count-number',
    offenceRoutes.submitCountNumber,
  )

  get(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/offences/:offenceReference/offence-code',
    offenceRoutes.getOffenceCode,
  )

  post(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/offences/:offenceReference/submit-offence-code',
    offenceRoutes.submitOffenceCode,
  )

  get(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/offences/:offenceReference/offence-name',
    offenceRoutes.getOffenceName,
  )

  post(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/offences/:offenceReference/submit-offence-name',
    offenceRoutes.submitOffenceName,
  )

  get(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/offences/:offenceReference/confirm-offence-code',
    offenceRoutes.getConfirmOffenceCode,
  )

  post(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/offences/:offenceReference/submit-confirm-offence',
    offenceRoutes.submitConfirmOffenceCode,
  )

  get(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/offences/:offenceReference/terror-related',
    offenceRoutes.getTerrorRelated,
  )

  post(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/offences/:offenceReference/submit-terror-related',
    offenceRoutes.submitTerrorRelated,
  )

  get(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/offences/:offenceReference/sentence-type',
    offenceRoutes.getSentenceType,
  )

  post(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/offences/:offenceReference/submit-sentence-type',
    offenceRoutes.submitSentenceType,
  )

  get(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/offences/:offenceReference/period-length',
    offenceRoutes.getPeriodLength,
  )

  post(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/offences/:offenceReference/submit-period-length',
    offenceRoutes.submitPeriodLength,
  )

  get(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/offences/:offenceReference/alternative-sentence-length',
    offenceRoutes.getAlternativeSentenceLength,
  )

  post(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/offences/:offenceReference/submit-alternative-sentence-length',
    offenceRoutes.submitAlternativeSentenceLength,
  )

  get(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/offences/:offenceReference/sentence-serve-type',
    offenceRoutes.getSentenceServeType,
  )

  post(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/offences/:offenceReference/submit-sentence-serve-type',
    offenceRoutes.submitSentenceServeType,
  )

  get(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/offences/:offenceReference/consecutive-to',
    offenceRoutes.getConsecutiveTo,
  )

  post(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/offences/:offenceReference/submit-consecutive-to',
    offenceRoutes.submitConsecutiveTo,
  )

  get(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/offences/check-offence-answers',
    offenceRoutes.getCheckOffenceAnswers,
  )

  post(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/submit-check-offence-answers',
    offenceRoutes.submitCheckOffenceAnswers,
  )

  get(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/offences/sentence-length-mismatch',
    offenceRoutes.getSentenceLengthMismatch,
  )

  post(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/offences/submit-sentence-length-mismatch',
    offenceRoutes.submitSentenceLengthMismatch,
  )

  get(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/offences/:offenceReference/add-another-offence',
    offenceRoutes.addAnotherOffence,
  )

  get(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/offences/:offenceReference/delete-offence',
    offenceRoutes.getDeleteOffence,
  )

  post(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/offences/:offenceReference/submit-delete-offence',
    offenceRoutes.submitDeleteOffence,
  )

  get(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/offences/:offenceReference/edit-offence',
    offenceRoutes.getEditOffence,
  )

  post(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/offences/:offenceReference/submit-edit-offence',
    offenceRoutes.submitEditOffence,
  )

  get(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/next-hearing-select',
    courtCaseRoutes.getNextHearingSelect,
  )

  post(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/submit-next-hearing-select',
    courtCaseRoutes.submitNextHearingSelect,
  )

  get(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/next-hearing-type',
    courtCaseRoutes.getNextHearingType,
  )

  post(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/submit-next-hearing-type',
    courtCaseRoutes.submitNextHearingType,
  )

  get(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/next-hearing-date',
    courtCaseRoutes.getNextHearingDate,
  )

  post(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/submit-next-hearing-date',
    courtCaseRoutes.submitNextHearingDate,
  )

  get(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/next-hearing-court-select',
    courtCaseRoutes.getNextHearingCourtSelect,
  )

  post(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/submit-next-hearing-court-select',
    courtCaseRoutes.submitNextHearingCourtSelect,
  )

  get(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/next-hearing-court-name',
    courtCaseRoutes.getNextHearingCourtName,
  )

  post(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/submit-next-hearing-court-name',
    courtCaseRoutes.submitNextHearingCourtName,
  )

  get(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/check-next-hearing-answers',
    courtCaseRoutes.getCheckNextHearingAnswers,
  )

  post(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/submit-check-next-hearing-answers',
    courtCaseRoutes.submiCheckNextHearingAnswers,
  )

  get(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/confirmation',
    courtCaseRoutes.getConfirmationPage,
  )

  return router
}
