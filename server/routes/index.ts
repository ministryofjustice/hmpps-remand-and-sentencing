import { Router } from 'express'
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

  router.use('/sentence-types', sentenceTypeRoutes(services))

  const courtCaseRoutes = new CourtCaseRoutes(
    services.offenceService,
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
    services.courtRegisterService,
    services.manageOffencesService,
    services.appearanceOutcomeService,
    services.offenceOutcomeService,
  )

  router.get('/', async (req, res, next) => {
    await services.auditService.logPageView(Page.EXAMPLE_PAGE, { who: res.locals.user.username, correlationId: req.id })

    res.render('pages/index')
  })
  router.get('/api/person/:nomsId/image', apiRoutes.personImage)

  router.get('/api/search-offence', apiRoutes.searchOffence)
  router.get('/api/search-court', apiRoutes.searchCourts)

  router.get('/person/:nomsId', courtCaseRoutes.start)

  router.get('/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/details', courtCaseRoutes.getCourtCaseDetails)

  router.get(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:appearanceReference/confirm-delete',
    courtCaseRoutes.getDeleteAppearanceConfirmation,
  )

  router.post(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:appearanceReference/submit-delete-appearance',
    courtCaseRoutes.submitDeleteAppearanceConfirmation,
  )

  router.get(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/appearance-updated-confirmation',
    courtCaseRoutes.getAppearanceUpdatedConfirmation,
  )

  router.get(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/sentencing/load-appearance-details',
    sentencingRoutes.loadAppearanceDetails,
  )

  router.get(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/sentencing/appearance-details',
    sentencingRoutes.getAppearanceDetails,
  )

  router.post(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/sentencing/submit-details-edit',
    sentencingRoutes.submitAppearanceDetailsEdit,
  )

  router.get(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/sentencing/offences/:chargeUuid/check-delete-offence',
    sentencingRoutes.checkDeleteOffence,
  )

  router.get(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/sentencing/offences/:chargeUuid/cannot-delete-offence',
    sentencingRoutes.getCannotDeleteOffence,
  )

  router.get(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/sentencing/offences/:chargeUuid/cannot-remove-sentence-outcome',
    sentencingRoutes.getCannotRemoveSentenceOutcome,
  )

  router.get(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/sentencing/sentence-length-mismatch',
    sentencingRoutes.getSentenceLengthMismatch,
  )

  router.get(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/sentencing/continue-sentence-length-mismatch',
    sentencingRoutes.continueSentenceLengthMismatch,
  )

  router.get(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/remand/load-appearance-details',
    remandRoutes.loadAppearanceDetails,
  )

  router.get(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/remand/appearance-details',
    remandRoutes.getAppearanceDetails,
  )

  router.post(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/remand/submit-details-edit',
    remandRoutes.submitAppearanceDetailsEdit,
  )

  router.get(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/remand/offences/:chargeUuid/check-delete-offence',
    remandRoutes.checkDeleteOffence,
  )

  router.get(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/remand/offences/:chargeUuid/cannot-delete-offence',
    remandRoutes.getCannotDeleteOffence,
  )

  router.get(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/new-journey',
    courtCaseRoutes.newJourney,
  )

  router.get(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/warrant-type',
    courtCaseRoutes.getWarrantType,
  )

  router.post(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/submit-warrant-type',
    courtCaseRoutes.submitWarrantType,
  )

  router.get(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/resume-draft',
    courtCaseRoutes.getDraftAppearance,
  )

  router.get(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/task-list',
    courtCaseRoutes.getTaskList,
  )

  router.post(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/submit-task-list',
    courtCaseRoutes.submitTaskList,
  )

  router.post(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/submit-draft',
    courtCaseRoutes.submitTaskListAsDraft,
  )

  router.get(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/reference',
    courtCaseRoutes.getReference,
  )

  router.post(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/submit-reference',
    courtCaseRoutes.submitReference,
  )

  router.get(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/select-reference',
    courtCaseRoutes.getSelectReference,
  )

  router.post(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/submit-select-reference',
    courtCaseRoutes.submitSelectReference,
  )

  router.get(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/warrant-date',
    courtCaseRoutes.getWarrantDate,
  )

  router.post(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/submit-warrant-date',
    courtCaseRoutes.submitWarrantDate,
  )

  router.get(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/select-court-name',
    courtCaseRoutes.getSelectCourtName,
  )

  router.post(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/submit-select-court-name',
    courtCaseRoutes.submitSelectCourtName,
  )

  router.get(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/court-name',
    courtCaseRoutes.getCourtName,
  )

  router.post(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/submit-court-name',
    courtCaseRoutes.submitCourtName,
  )

  router.get(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/warrant-upload',
    courtCaseRoutes.getWarrantUpload,
  )

  router.post(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/submit-warrant-upload',
    courtCaseRoutes.submitWarrantUpload,
  )

  router.get(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/overall-case-outcome',
    courtCaseRoutes.getOverallCaseOutcome,
  )

  router.post(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/submit-overall-case-outcome',
    courtCaseRoutes.submitOverallCaseOutcome,
  )

  router.get(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/case-outcome-applied-all',
    courtCaseRoutes.getCaseOutcomeAppliedAll,
  )

  router.post(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/submit-case-outcome-applied-all',
    courtCaseRoutes.submitCaseOutcomeAppliedAll,
  )

  router.get(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/check-answers',
    courtCaseRoutes.getCheckAnswers,
  )

  router.post(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/submit-check-answers',
    courtCaseRoutes.submitCheckAnswers,
  )

  router.get(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/review-offences',
    offenceRoutes.getReviewOffences,
  )

  router.post(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/submit-review-offences',
    offenceRoutes.submitReviewOffences,
  )

  router.get(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/update-offence-outcomes',
    offenceRoutes.getUpdateOffenceOutcomes,
  )

  router.post(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/submit-update-offence-outcomes',
    offenceRoutes.submitUpdateOffenceOutcomes,
  )

  router.get(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/offences/:chargeUuid/conviction-date',
    offenceRoutes.getConvictionDate,
  )

  router.post(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/offences/:chargeUuid/submit-conviction-date',
    offenceRoutes.submitConvictionDate,
  )

  router.get(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/offences/:chargeUuid/offence-date',
    offenceRoutes.getOffenceDate,
  )

  router.post(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/offences/:chargeUuid/submit-offence-date',
    offenceRoutes.submitOffenceDate,
  )

  router.get(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/offences/:chargeUuid/update-offence-outcome',
    offenceRoutes.getUpdateOffenceOutcome,
  )

  router.post(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/offences/:chargeUuid/submit-update-offence-outcome',
    offenceRoutes.submitUpdateOffenceOutcome,
  )

  router.get(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/offences/:chargeUuid/offence-outcome',
    offenceRoutes.getOffenceOutcome,
  )

  router.post(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/offences/:chargeUuid/submit-offence-outcome',
    offenceRoutes.submitOffenceOutcome,
  )

  router.get(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/offences/:chargeUuid/count-number',
    offenceRoutes.getCountNumber,
  )

  router.post(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/offences/:chargeUuid/submit-count-number',
    offenceRoutes.submitCountNumber,
  )

  router.get(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/offences/:chargeUuid/offence-code',
    offenceRoutes.getOffenceCode,
  )

  router.post(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/offences/:chargeUuid/submit-offence-code',
    offenceRoutes.submitOffenceCode,
  )

  router.get(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/offences/:chargeUuid/offence-name',
    offenceRoutes.getOffenceName,
  )

  router.post(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/offences/:chargeUuid/submit-offence-name',
    offenceRoutes.submitOffenceName,
  )

  router.get(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/offences/:chargeUuid/inactive-offence',
    offenceRoutes.getInactiveOffenceCode,
  )

  router.get(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/offences/:chargeUuid/confirm-offence-code',
    offenceRoutes.getConfirmOffenceCode,
  )

  router.post(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/offences/:chargeUuid/submit-confirm-offence',
    offenceRoutes.submitConfirmOffenceCode,
  )

  router.get(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/offences/:chargeUuid/sentence-type',
    offenceRoutes.getSentenceType,
  )

  router.post(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/offences/:chargeUuid/submit-sentence-type',
    offenceRoutes.submitSentenceType,
  )

  router.get(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/offences/:chargeUuid/period-length',
    offenceRoutes.getPeriodLength,
  )

  router.post(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/offences/:chargeUuid/submit-period-length',
    offenceRoutes.submitPeriodLength,
  )

  router.get(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/offences/:chargeUuid/alternative-period-length',
    offenceRoutes.getAlternativePeriodLength,
  )

  router.post(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/offences/:chargeUuid/submit-alternative-period-length',
    offenceRoutes.submitAlternativePeriodLength,
  )

  router.get(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/offences/:chargeUuid/fine-amount',
    offenceRoutes.getFineAmount,
  )

  router.post(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/offences/:chargeUuid/fine-amount',
    offenceRoutes.submitFineAmount,
  )

  router.get(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/offences/:chargeUuid/select-consecutive-concurrent',
    offenceRoutes.getSelectConsecutiveConcurrent,
  )

  router.get(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/offences/:chargeUuid/sentence-serve-type',
    offenceRoutes.getSentenceServeType,
  )

  router.post(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/offences/:chargeUuid/submit-sentence-serve-type',
    offenceRoutes.submitSentenceServeType,
  )

  router.get(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/sentencing/offences/:chargeUuid/is-sentence-consecutive-to',
    sentencingRoutes.getIsSentenceConsecutiveTo,
  )

  router.post(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/sentencing/offences/:chargeUuid/submit-is-sentence-consecutive-to',
    sentencingRoutes.submitIsSentenceConsecutiveTo,
  )

  router.get(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/sentencing/offences/:chargeUuid/first-sentence-consecutive-to',
    sentencingRoutes.getFirstSentenceConsecutiveTo,
  )

  router.post(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/sentencing/offences/:chargeUuid/submit-first-sentence-consecutive-to',
    sentencingRoutes.submitFirstSentenceConsecutiveTo,
  )

  router.get(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/sentencing/offences/:chargeUuid/sentence-consecutive-to',
    sentencingRoutes.getSentenceConsecutiveTo,
  )

  router.post(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/sentencing/offences/:chargeUuid/submit-sentence-consecutive-to',
    sentencingRoutes.submitSentenceConsecutiveTo,
  )

  router.get(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/sentencing/offences/:chargeUuid/making-sentence-concurrent',
    sentencingRoutes.getMakingSentenceConcurrent,
  )

  router.get(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/sentencing/offences/:chargeUuid/continue-making-sentence-concurrent',
    sentencingRoutes.continueMakingSentenceConcurrent,
  )

  router.get(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/sentencing/offences/:chargeUuid/making-sentence-forthwith',
    sentencingRoutes.getMakingSentenceForthwith,
  )

  router.get(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/sentencing/offences/:chargeUuid/continue-making-sentence-forthwith',
    sentencingRoutes.continueMakingSentenceForthwith,
  )

  router.get(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/sentencing/offences/:chargeUuid/making-sentence-consecutive',
    sentencingRoutes.getMakingSentenceConsecutive,
  )

  router.get(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/sentencing/offences/:chargeUuid/continue-making-sentence-consecutive',
    sentencingRoutes.continueMakingSentenceConsecutive,
  )

  router.get(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/sentencing/offences/:chargeUuid/making-sentence-concurrent',
    sentencingRoutes.getMakingSentenceConcurrent,
  )

  router.get(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/sentencing/offences/:chargeUuid/continue-making-sentence-concurrent',
    sentencingRoutes.continueMakingSentenceConcurrent,
  )

  router.get(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/offences/check-offence-answers',
    offenceRoutes.getCheckOffenceAnswers,
  )

  router.post(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/submit-check-offence-answers',
    offenceRoutes.submitCheckOffenceAnswers,
  )

  router.get(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/offences/sentence-length-mismatch',
    offenceRoutes.getSentenceLengthMismatch,
  )

  router.get(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/offences/continue-sentence-length-mismatch',
    offenceRoutes.continueSentenceLengthMismatch,
  )

  router.get(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/offences/:chargeUuid/add-another-offence',
    offenceRoutes.addAnotherOffence,
  )

  router.get(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/offences/:chargeUuid/delete-offence',
    offenceRoutes.getDeleteOffence,
  )

  router.post(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/offences/:chargeUuid/submit-delete-offence',
    offenceRoutes.submitDeleteOffence,
  )

  router.get(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/sentencing/offences/:chargeUuid/delete-sentence-in-chain',
    sentencingRoutes.getDeleteSentenceInChain,
  )

  router.get(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/sentencing/offences/:chargeUuid/continue-delete-sentence-in-chain',
    sentencingRoutes.continueDeleteSentenceInChain,
  )

  router.get(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/offences/:chargeUuid/load-edit-offence',
    offenceRoutes.loadEditOffence,
  )

  router.get(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/offences/:chargeUuid/edit-offence',
    offenceRoutes.getEditOffence,
  )

  router.post(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/offences/:chargeUuid/submit-edit-offence',
    offenceRoutes.submitEditOffence,
  )

  router.get(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/next-hearing-select',
    courtCaseRoutes.getNextHearingSelect,
  )

  router.post(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/submit-next-hearing-select',
    courtCaseRoutes.submitNextHearingSelect,
  )

  router.get(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/next-hearing-type',
    courtCaseRoutes.getNextHearingType,
  )

  router.post(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/submit-next-hearing-type',
    courtCaseRoutes.submitNextHearingType,
  )

  router.get(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/next-hearing-date',
    courtCaseRoutes.getNextHearingDate,
  )

  router.post(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/submit-next-hearing-date',
    courtCaseRoutes.submitNextHearingDate,
  )

  router.get(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/next-hearing-court-select',
    courtCaseRoutes.getNextHearingCourtSelect,
  )

  router.post(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/submit-next-hearing-court-select',
    courtCaseRoutes.submitNextHearingCourtSelect,
  )

  router.get(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/next-hearing-court-name',
    courtCaseRoutes.getNextHearingCourtName,
  )

  router.post(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/submit-next-hearing-court-name',
    courtCaseRoutes.submitNextHearingCourtName,
  )

  router.get(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/check-next-hearing-answers',
    courtCaseRoutes.getCheckNextHearingAnswers,
  )

  router.post(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/submit-check-next-hearing-answers',
    courtCaseRoutes.submitCheckNextHearingAnswers,
  )

  router.get(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/confirmation',
    courtCaseRoutes.getConfirmationPage,
  )

  router.get(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/sentencing/confirmation',
    sentencingRoutes.getConfirmationPage,
  )

  router.get(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/save-court-case',
    courtCaseRoutes.getDraftConfirmationPage,
  )

  router.get(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/sentencing/overall-sentence-length',
    overallSentencingRoutes.getOverallSentenceLength,
  )

  router.post(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/sentencing/submit-overall-sentence-length',
    overallSentencingRoutes.submitOverallSentenceLength,
  )

  router.get(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/sentencing/overall-conviction-date',
    overallSentencingRoutes.getOverallConvictionDate,
  )

  router.post(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/sentencing/submit-overall-conviction-date',
    overallSentencingRoutes.submitOverallConvictionDate,
  )

  router.get(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/sentencing/overall-case-outcome',
    overallSentencingRoutes.getOverallCaseOutcome,
  )

  router.post(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/sentencing/submit-overall-case-outcome',
    overallSentencingRoutes.submitOverallCaseOutcome,
  )

  router.get(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/sentencing/case-outcome-applied-all',
    overallSentencingRoutes.getCaseOutcomeAppliedAll,
  )

  router.post(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/sentencing/submit-case-outcome-applied-all',
    overallSentencingRoutes.submitCaseOutcomeAppliedAll,
  )

  router.get(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/sentencing/check-overall-answers',
    overallSentencingRoutes.getCheckOverallAnswers,
  )

  router.post(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/sentencing/submit-check-overall-answers',
    overallSentencingRoutes.submitCheckOverallAnswers,
  )

  router.get(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/sentencing/alternative-overall-sentence-length',
    overallSentencingRoutes.getAlternativeSentenceLength,
  )

  router.post(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/sentencing/submit-overall-alternative-sentence-length',
    overallSentencingRoutes.submitAlternativeSentenceLength,
  )

  router.get(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/upload-court-documents',
    courtCaseRoutes.getCourtDocumentsPage,
  )

  router.get(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/sentencing/upload-court-documents',
    sentencingRoutes.getCourtDocumentsPage,
  )

  router.get(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/:documentType/upload-documents',
    courtCaseRoutes.getUploadCourtDocuments,
  )

  router.get(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/:documentId/delete-document',
    courtCaseRoutes.confirmDeleteUploadedDocument,
  )

  router.get(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/:documentId/download-document',
    courtCaseRoutes.downloadUploadedDocument,
  )

  router.post(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/:documentId/submit-delete-document',
    courtCaseRoutes.submitConfirmDeleteUploadedDocument,
  )

  router.post(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/sentencing/submit-upload-court-documents',
    sentencingRoutes.submitCourtDocuments,
  )

  router.post(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/submit-upload-court-documents',
    courtCaseRoutes.submitCourtDocuments,
  )

  router.post(
    '/person/:nomsId/:addOrEditCourtCase/:courtCaseReference/:addOrEditCourtAppearance/:appearanceReference/:documentType/submit-upload-documents',
    courtCaseRoutes.submitUploadDocuments,
  )

  return router
}
