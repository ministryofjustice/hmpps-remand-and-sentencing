import { RequestHandler } from 'express'
import { SessionData } from 'express-session'
import type { CourtAppearance, UrlParameters } from 'models'
import type {
  CourtCaseReferenceForm,
  CourtCaseSelectCourtNameForm,
  CourtCaseWarrantDateForm,
  CourtDataLandingForm,
  CourtDataSelectCaseForm,
} from 'forms'
import AuditService from '../services/auditService'
import CourtAppearanceService from '../services/courtAppearanceService'
import ManageOffencesService from '../services/manageOffencesService'
import OffenceService from '../services/offenceService'
import RemandAndSentencingService from '../services/remandAndSentencingService'
import BaseRoutes from './baseRoutes'
import JourneyUrls from './data/JourneyUrls'
import CourtRegisterService from '../services/courtRegisterService'
import { pageCourtCaseAppearanceToCourtAppearance, sentenceLengthToSentenceLengthForm } from '../utils/mappingUtils'
import DocumentManagementService from '../services/documentManagementService'
import documentTypes from '../resources/documentTypes'
import CourtDataIngestionService from '../services/courtDataIngestionService'
import trimForm from '../utils/trim'
import CourtDataJourneyUrls from './data/CourtDataJourneyUrls'
import { NIL_UUID } from '../utils/constants'

export default class CourtDataIngestionRoutes extends BaseRoutes {
  constructor(
    courtAppearanceService: CourtAppearanceService,
    offenceService: OffenceService,
    remandAndSentencingService: RemandAndSentencingService,
    manageOffencesService: ManageOffencesService,
    auditService: AuditService,
    documentManagementService: DocumentManagementService,
    courtRegisterService: CourtRegisterService,
    private readonly courtDataIngestionService: CourtDataIngestionService,
  ) {
    super(
      courtAppearanceService,
      offenceService,
      remandAndSentencingService,
      manageOffencesService,
      auditService,
      documentManagementService,
      courtRegisterService,
    )
  }

  public landing: RequestHandler = async (req, res): Promise<void> => {
    const courtDataLandingForm = (req.flash('courtDataLandingForm')[0] || {}) as CourtDataLandingForm
    const existingCase = !!(req.params.existingCase as string)
    const urlParameters = req.params as unknown as UrlParameters
    const { hmctsHearingId, nomsId } = urlParameters
    const [appearance, hearing] = await Promise.all([
      this.remandAndSentencingService.getHmctsCourtData(hmctsHearingId, nomsId, req.user.username),
      this.courtDataIngestionService.getCourtHearing(hmctsHearingId, nomsId, req.user.username),
    ])
    appearance.documents = appearance.documents.map(it => {
      return {
        ...it,
        documentTypeDescription:
          documentTypes[appearance.warrantType].find(documentType => it.documentType === documentType.type)?.name ||
          'Unknown document type',
      }
    })
    const warrantTypeText = appearance.warrantType === 'SENTENCING' ? 'sentencing' : 'remand'
    return res.render('pages/courtDataIngestion/landing', {
      appearance,
      hearing,
      hmctsHearingId,
      nomsId,
      warrantTypeText,
      existingCase,
      courtDataLandingForm,
      errors: req.flash('errors') || [],
      backLink: JourneyUrls.courtCases(nomsId),
    })
  }

  public submitLanding: RequestHandler = async (req, res): Promise<void> => {
    const existingCase = !!(req.params.existingCase as string)
    const urlParameters = req.params as unknown as UrlParameters
    const { hmctsHearingId, nomsId } = urlParameters

    if (!existingCase) {
      return res.redirect(CourtDataJourneyUrls.courtDataIngestionStart(nomsId, hmctsHearingId))
    }

    const courtDataLandingForm = trimForm<CourtDataLandingForm>(req.body)
    const errors = this.courtDataIngestionService.validateLandingForm(courtDataLandingForm)
    if (errors.length) {
      req.flash('errors', errors)
      req.flash('courtDataLandingForm', { ...courtDataLandingForm })
      return res.redirect(CourtDataJourneyUrls.courtDataIngestionLanding(nomsId, hmctsHearingId, existingCase))
    }

    if (courtDataLandingForm.addToExistingCase === 'true') {
      return res.redirect(CourtDataJourneyUrls.courtDataIngestionSelectCase(nomsId, hmctsHearingId))
    }
    return res.redirect(CourtDataJourneyUrls.courtDataIngestionStart(nomsId, hmctsHearingId))
  }

  public selectCourtCase: RequestHandler = async (req, res): Promise<void> => {
    const courtDataSelectCaseForm = (req.flash('courtDataSelectCaseForm')[0] || {}) as CourtDataSelectCaseForm
    const urlParameters = req.params as unknown as UrlParameters
    const { hmctsHearingId, nomsId } = urlParameters

    // TODO CDIA-295 Replace with endpoint built for in progress cases.
    const cases = await this.remandAndSentencingService.searchCourtCases(
      nomsId,
      req.user.username,
      'STATUS_APPEARANCE_DATE_DESC',
      '',
      '',
      '',
      0,
    )

    const courtCodes = cases.content.map(it => it.latestCourtAppearance.courtCode)
    const courtMap = await this.courtRegisterService.getCourtMap(courtCodes, req.user.username)

    return res.render('pages/courtDataIngestion/select-court-case', {
      cases: cases.content,
      hmctsHearingId,
      nomsId,
      courtMap,
      courtDataSelectCaseForm,
      errors: req.flash('errors') || [],
      backLink: CourtDataJourneyUrls.courtDataIngestionLanding(nomsId, hmctsHearingId, true),
    })
  }

  public submitSelectCourtCase: RequestHandler = async (req, res): Promise<void> => {
    const urlParameters = req.params as unknown as UrlParameters
    const { hmctsHearingId, nomsId } = urlParameters

    const courtDataSelectCaseForm = trimForm<CourtDataSelectCaseForm>(req.body)
    const errors = this.courtDataIngestionService.validateCourtDataSelectCaseForm(courtDataSelectCaseForm)
    if (errors.length) {
      req.flash('errors', errors)
      req.flash('courtDataSelectCaseForm', { ...courtDataSelectCaseForm })
      return res.redirect(CourtDataJourneyUrls.courtDataIngestionSelectCase(nomsId, hmctsHearingId))
    }

    return res.redirect(
      CourtDataJourneyUrls.courtDataIngestionStart(nomsId, hmctsHearingId, courtDataSelectCaseForm.courtCase),
    )
  }

  public start: RequestHandler = async (req, res): Promise<void> => {
    const urlParameters = req.params as unknown as UrlParameters
    const { hmctsHearingId, nomsId } = urlParameters
    const { username } = res.locals.user
    let appearance = await this.remandAndSentencingService.getHmctsCourtData(hmctsHearingId, nomsId, req.user.username)
    const caseId = (req.params.caseId as string) || crypto.randomUUID()
    let courtAppearanceUuid: string = crypto.randomUUID()
    let latestCourtAppearance
    if (req.params.caseId) {
      latestCourtAppearance = await this.remandAndSentencingService.getLatestCourtAppearanceByCourtCaseUuid(
        req.user.username,
        caseId,
      )
      if (latestCourtAppearance.nextCourtAppearance?.futureSkeletonAppearanceUuid) {
        courtAppearanceUuid = latestCourtAppearance.nextCourtAppearance?.futureSkeletonAppearanceUuid
      }
    }

    appearance = {
      ...appearance,
      appearanceUuid: courtAppearanceUuid,
      documents: appearance.documents.map(document => ({ ...document, courtDataIngested: true })),
    }

    this.courtAppearanceService.clearSessionCourtAppearance(req.session, nomsId)
    this.offenceService.clearAllOffences(req.session, nomsId, caseId)
    const sessionAppearance = {
      ...pageCourtCaseAppearanceToCourtAppearance(appearance),
      nextCourtAppearanceAccepted: undefined,
      isCommonPlatformJourney: true,
      overallConvictionDateAppliedAll: 'false',
      courtCode: appearance.courtCode === NIL_UUID ? null : appearance.courtCode,
    } as CourtAppearance
    this.courtAppearanceService.setSessionCourtAppearance(req.session, nomsId, sessionAppearance)
    if (req.params.caseId) {
      this.courtAppearanceService.addChargesFromPreviousAppearance(
        req.session,
        nomsId,
        courtAppearanceUuid,
        latestCourtAppearance,
      )
    }
    const addOrEditCourtCase = req.params.caseId ? 'edit-court-case' : 'add-court-case'
    const addOrEditCourtAppearance = 'add-court-appearance'

    this.courtAppearanceService.setSessionCourtAppearance(req.session, nomsId, {
      ...sessionAppearance,
      initialPrepopulatedHmctsAppearanceInformationDataValid: !(await this.validationApperanceInformationSection(
        res,
        req.session,
        username,
        nomsId,
        caseId,
        courtAppearanceUuid,
        addOrEditCourtCase,
        sessionAppearance,
      )),
      initialPrepopulatedHmctsOverallWarrantInformationDatavalid: !(await this.validationOverallWarrantSection(
        res,
        req.session,
        username,
        nomsId,
        caseId,
        courtAppearanceUuid,
        addOrEditCourtCase,
        sessionAppearance,
      )),
    })
    if (appearance.warrantType === 'SENTENCING') {
      return res.redirect(
        JourneyUrls.taskList(nomsId, addOrEditCourtCase, caseId, addOrEditCourtAppearance, courtAppearanceUuid),
      )
    }
    return res.redirect(
      JourneyUrls.overallCaseOutcome(nomsId, addOrEditCourtCase, caseId, addOrEditCourtAppearance, courtAppearanceUuid),
    )
  }

  private async validationApperanceInformationSection(
    res,
    session: Partial<SessionData>,
    username: string,
    nomsId: string,
    caseId: string,
    courtAppearanceUuid: string,
    addOrEditCourtCase: string,
    sessionAppearance: CourtAppearance,
  ): Promise<boolean> {
    const courtCaseReferenceForm = {
      referenceNumber: sessionAppearance.caseReferenceNumber,
    } as CourtCaseReferenceForm
    const caseReferenceErors = this.courtAppearanceService.setCaseReferenceNumber(
      session,
      nomsId,
      courtCaseReferenceForm,
      courtAppearanceUuid,
    )

    const selectCourtNameForm = {
      courtNameSelect: sessionAppearance.courtCode,
    } as CourtCaseSelectCourtNameForm
    const courtNameErrors = this.courtAppearanceService.setCourtNameFromSelect(
      session,
      nomsId,
      selectCourtNameForm,
      courtAppearanceUuid,
    )

    const warrantOrHearing = await this.courtAppearanceService.getWarrantOrHearing(
      res,
      username,
      sessionAppearance.appearanceOutcomeUuid,
      sessionAppearance.warrantType,
    )
    const warrantDate = new Date(sessionAppearance.warrantDate)
    const warrantDateForm = {
      'warrantDate-day': `${warrantDate.getDate()}`,
      'warrantDate-month': `${warrantDate.getMonth() + 1}`,
      'warrantDate-year': `${warrantDate.getFullYear()}`,
    } as CourtCaseWarrantDateForm
    const warrantDateErrors = await this.courtAppearanceService.setWarrantDate(
      session,
      nomsId,
      warrantDateForm,
      caseId,
      courtAppearanceUuid,
      addOrEditCourtCase,
      username,
      warrantOrHearing,
    )
    return !!warrantDateErrors.length || !!caseReferenceErors.length || !!courtNameErrors.length
  }

  private async validationOverallWarrantSection(
    res,
    session: Partial<SessionData>,
    username: string,
    nomsId: string,
    caseId: string,
    courtAppearanceUuid: string,
    addOrEditCourtCase: string,
    sessionAppearance: CourtAppearance,
  ): Promise<boolean> {
    const overallSentenceLengthForm = sentenceLengthToSentenceLengthForm(
      this.courtAppearanceService.getOverallCustodialSentenceLength(session, nomsId, courtAppearanceUuid),
      this.courtAppearanceService.getHasOverallSentenceLength(session, nomsId, courtAppearanceUuid),
    )

    const overallSentenceLengthErrors = this.courtAppearanceService.setOverallSentenceLength(
      session,
      nomsId,
      overallSentenceLengthForm,
      courtAppearanceUuid,
    )

    const overallCaseOutcomeForm = {
      overallCaseOutcome: `${sessionAppearance.appearanceOutcomeUuid}|${sessionAppearance.relatedOffenceOutcomeUuid}`,
    }
    const overallCaseOutcomeErrors = this.courtAppearanceService.setSentencingAppearanceOutcomeUuid(
      session,
      nomsId,
      overallCaseOutcomeForm,
      courtAppearanceUuid,
    )

    return !!overallSentenceLengthErrors.length || !!overallCaseOutcomeErrors.length
  }
}
