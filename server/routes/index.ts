import { type RequestHandler, Router } from 'express'
import asyncMiddleware from '../middleware/asyncMiddleware'
import CourtCaseRoutes from './courtCaseRoutes'
import ApiRoutes from './apiRoutes'
import OffenceRoutes from './offenceRoutes'
import type { Services } from '../services'
import { Page } from '../services/auditService'
import sentenceTypeRoutes from './sentenceTypesRoutes'
import OverallSentencingRoutes from './overallSentencingRoutes'
import SentencingRoutes from './sentencingRoutes'
import RemandRoutes from './remandRoutes'

export default function routes(services: Services): Router {
  const router = Router()

  const get = (path: string | string[], handler: RequestHandler) => router.get(path, asyncMiddleware(handler))

  const post = (path: string | string[], handler: RequestHandler) => router.post(path, asyncMiddleware(handler))

  const postWithFileUpload = (path: string | string[], handler: RequestHandler) =>
    router.post(path, asyncMiddleware(handler))

  router.use('/sentence-types', sentenceTypeRoutes(services))

  const courtCaseRoutes = new CourtCaseRoutes(
    services.courtAppearanceService,
    services.remandAndSentencingService,
    services.manageOffencesService,
    services.documentManagementService,
    services.courtRegisterService,
    services.appearanceOutcomeService,
    services.courtCasesReleaseDatesService,
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
    services.courtRegisterService,
  )

  const overallSentencingRoutes = new OverallSentencingRoutes(
    services.courtAppearanceService,
    services.offenceService,
    services.remandAndSentencingService,
    services.appearanceOutcomeService,
  )

  const sentencingRoutes = new SentencingRoutes(
    services.courtAppearanceService,
    services.offenceService,
    services.remandAndSentencingService,
    services.manageOffencesService,
    services.appearanceOutcomeService,
    services.courtRegisterService,
    services.calculateReleaseDatesService,
    services.offenceOutcomeService,
  )

  const remandRoutes = new RemandRoutes(
    services.courtAppearanceService,
    services.offenceService,
    services.remandAndSentencingService,
    services.manageOffencesService,
    services.appearanceOutcomeService,
    services.courtRegisterService,
    services.offenceOutcomeService,
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
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/appearance-updated-confirmation',
    courtCaseRoutes.getAppearanceUpdatedConfirmation,
  )

  get(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/sentencing/load-appearance-details',
    sentencingRoutes.loadAppearanceDetails,
  )

  get(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/sentencing/appearance-details',
    sentencingRoutes.getAppearanceDetails,
  )

  post(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/sentencing/submit-details-edit',
    sentencingRoutes.submitAppearanceDetailsEdit,
  )

  get(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/sentencing/offences/:offenceReference/check-delete-offence',
    sentencingRoutes.checkDeleteOffence,
  )

  get(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/sentencing/offences/:offenceReference/cannot-delete-offence',
    sentencingRoutes.getCannotDeleteOffence,
  )

  get(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/sentencing/sentence-length-mismatch',
    sentencingRoutes.getSentenceLengthMismatch,
  )

  get(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/sentencing/continue-sentence-length-mismatch',
    sentencingRoutes.continueSentenceLengthMismatch,
  )

  get(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/remand/load-appearance-details',
    remandRoutes.loadAppearanceDetails,
  )

  get(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/remand/appearance-details',
    remandRoutes.getAppearanceDetails,
  )

  post(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/remand/submit-details-edit',
    remandRoutes.submitAppearanceDetailsEdit,
  )

  get(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/remand/offences/:offenceReference/check-delete-offence',
    remandRoutes.checkDeleteOffence,
  )

  get(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/remand/offences/:offenceReference/cannot-delete-offence',
    remandRoutes.getCannotDeleteOffence,
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
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/resume-draft',
    courtCaseRoutes.getDraftAppearance,
  )

  get(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/task-list',
    courtCaseRoutes.getTaskList,
  )

  post(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/submit-task-list',
    courtCaseRoutes.submitTaskList,
  )

  post(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/submit-draft',
    courtCaseRoutes.submitTaskListAsDraft,
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
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/update-offence-outcomes',
    offenceRoutes.getUpdateOffenceOutcomes,
  )

  post(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/submit-update-offence-outcomes',
    offenceRoutes.submitUpdateOffenceOutcomes,
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
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/offences/:offenceReference/update-offence-outcome',
    offenceRoutes.getUpdateOffenceOutcome,
  )

  post(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/offences/:offenceReference/submit-update-offence-outcome',
    offenceRoutes.submitUpdateOffenceOutcome,
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
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/offences/:offenceReference/inactive-offence',
    offenceRoutes.getInactiveOffenceCode,
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
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/offences/:offenceReference/alternative-period-length',
    offenceRoutes.getAlternativePeriodLength,
  )

  post(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/offences/:offenceReference/submit-alternative-period-length',
    offenceRoutes.submitAlternativePeriodLength,
  )

  get(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/offences/:offenceReference/fine-amount',
    offenceRoutes.getFineAmount,
  )

  post(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/offences/:offenceReference/fine-amount',
    offenceRoutes.submitFineAmount,
  )

  get(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/offences/:offenceReference/select-consecutive-concurrent',
    offenceRoutes.getSelectConsecutiveConcurrent,
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
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/sentencing/offences/:offenceReference/is-sentence-consecutive-to',
    sentencingRoutes.getIsSentenceConsecutiveTo,
  )

  post(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/sentencing/offences/:offenceReference/submit-is-sentence-consecutive-to',
    sentencingRoutes.submitIsSentenceConsecutiveTo,
  )

  get(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/sentencing/offences/:offenceReference/first-sentence-consecutive-to',
    sentencingRoutes.getFirstSentenceConsecutiveTo,
  )

  post(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/sentencing/offences/:offenceReference/submit-first-sentence-consecutive-to',
    sentencingRoutes.submitFirstSentenceConsecutiveTo,
  )

  get(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/sentencing/offences/:offenceReference/first-sentence-consecutive-to',
    sentencingRoutes.getFirstSentenceConsecutiveTo,
  )

  post(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/sentencing/offences/:offenceReference/submit-first-sentence-consecutive-to',
    sentencingRoutes.submitFirstSentenceConsecutiveTo,
  )

  get(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/sentencing/offences/:offenceReference/sentence-consecutive-to',
    sentencingRoutes.getSentenceConsecutiveTo,
  )

  post(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/sentencing/offences/:offenceReference/submit-sentence-consecutive-to',
    sentencingRoutes.submitSentenceConsecutiveTo,
  )

  get(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/sentencing/offences/:offenceReference/making-sentence-concurrent',
    sentencingRoutes.getMakingSentenceConcurrent,
  )

  get(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/sentencing/offences/:offenceReference/continue-making-sentence-concurrent',
    sentencingRoutes.continueMakingSentenceConcurrent,
  )

  get(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/sentencing/offences/:offenceReference/making-sentence-forthwith',
    sentencingRoutes.getMakingSentenceForthwith,
  )

  get(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/sentencing/offences/:offenceReference/continue-making-sentence-forthwith',
    sentencingRoutes.continueMakingSentenceForthwith,
  )

  get(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/sentencing/offences/:offenceReference/making-sentence-consecutive',
    sentencingRoutes.getMakingSentenceConsecutive,
  )

  get(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/sentencing/offences/:offenceReference/continue-making-sentence-consecutive',
    sentencingRoutes.continueMakingSentenceConsecutive,
  )

  get(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/sentencing/offences/:offenceReference/making-sentence-concurrent',
    sentencingRoutes.getMakingSentenceConcurrent,
  )

  get(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/sentencing/offences/:offenceReference/continue-making-sentence-concurrent',
    sentencingRoutes.continueMakingSentenceConcurrent,
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

  get(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/offences/continue-sentence-length-mismatch',
    offenceRoutes.continueSentenceLengthMismatch,
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
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/sentencing/offences/:offenceReference/delete-sentence-in-chain',
    sentencingRoutes.getDeleteSentenceInChain,
  )

  get(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/sentencing/offences/:offenceReference/continue-delete-sentence-in-chain',
    sentencingRoutes.continueDeleteSentenceInChain,
  )

  get(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/offences/:offenceReference/load-edit-offence',
    offenceRoutes.loadEditOffence,
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
    courtCaseRoutes.submitCheckNextHearingAnswers,
  )

  get(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/confirmation',
    courtCaseRoutes.getConfirmationPage,
  )

  get(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/sentencing/confirmation',
    sentencingRoutes.getConfirmationPage,
  )

  get(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/save-court-case',
    courtCaseRoutes.getDraftConfirmationPage,
  )

  get(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/sentencing/overall-sentence-length',
    overallSentencingRoutes.getOverallSentenceLength,
  )

  post(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/sentencing/submit-overall-sentence-length',
    overallSentencingRoutes.submitOverallSentenceLength,
  )

  get(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/sentencing/overall-conviction-date',
    overallSentencingRoutes.getOverallConvictionDate,
  )

  post(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/sentencing/submit-overall-conviction-date',
    overallSentencingRoutes.submitOverallConvictionDate,
  )

  get(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/sentencing/overall-case-outcome',
    overallSentencingRoutes.getOverallCaseOutcome,
  )

  post(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/sentencing/submit-overall-case-outcome',
    overallSentencingRoutes.submitOverallCaseOutcome,
  )

  get(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/sentencing/case-outcome-applied-all',
    overallSentencingRoutes.getCaseOutcomeAppliedAll,
  )

  post(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/sentencing/submit-case-outcome-applied-all',
    overallSentencingRoutes.submitCaseOutcomeAppliedAll,
  )

  get(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/sentencing/check-overall-answers',
    overallSentencingRoutes.getCheckOverallAnswers,
  )

  post(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/sentencing/submit-check-overall-answers',
    overallSentencingRoutes.submitCheckOverallAnswers,
  )

  get(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/sentencing/alternative-overall-sentence-length',
    overallSentencingRoutes.getAlternativeSentenceLength,
  )

  post(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/sentencing/submit-overall-alternative-sentence-length',
    overallSentencingRoutes.submitAlternativeSentenceLength,
  )

  get(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/upload-court-documents',
    courtCaseRoutes.getCourtDocumentsPage,
  )

  get(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/sentencing/upload-court-documents',
    sentencingRoutes.getCourtDocumentsPage,
  )

  get(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/:documentType/upload-documents',
    courtCaseRoutes.getUploadCourtDocuments,
  )

  get(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/:documentId/delete-document',
    courtCaseRoutes.confirmDeleteUploadedDocument,
  )

  get(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/:documentId/download-document',
    courtCaseRoutes.downloadUploadedDocument,
  )

  post(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/:documentId/submit-delete-document',
    courtCaseRoutes.submitConfirmDeleteUploadedDocument,
  )

  post(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/sentencing/submit-upload-court-documents',
    sentencingRoutes.submitCourtDocuments,
  )

  post(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/submit-upload-court-documents',
    courtCaseRoutes.submitCourtDocuments,
  )

  postWithFileUpload(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/:documentType/submit-upload-documents',
    courtCaseRoutes.submitUploadDocuments,
  )

  return router
}
