import { RequestHandler } from 'express'
import type {
  AppealCourtNameForm,
  AppealDateForm,
  AppealOverallCaseOutcomeForm,
  CriminalOfficeReferenceForm,
} from 'forms'
import AuditService from '../services/auditService'
import CourtAppearanceService from '../services/courtAppearanceService'
import ManageOffencesService from '../services/manageOffencesService'
import OffenceService from '../services/offenceService'
import RemandAndSentencingService from '../services/remandAndSentencingService'
import BaseRoutes from './baseRoutes'
import AppealsJourneyUrls from './data/AppealsJourneyUrls'
import AppealsTaskListModel from './data/AppealsTaskListModel'
import JourneyUrls from './data/JourneyUrls'
import trimForm from '../utils/trim'
import CourtRegisterService from '../services/courtRegisterService'
import logger from '../../logger'
import RefDataService from '../services/refDataService'
import { outcomeValueOrLegacy } from '../utils/utils'

export default class AppealsRoutes extends BaseRoutes {
  constructor(
    courtAppearanceService: CourtAppearanceService,
    offenceService: OffenceService,
    remandAndSentencingService: RemandAndSentencingService,
    manageOffencesService: ManageOffencesService,
    auditService: AuditService,
    private readonly courtRegisterService: CourtRegisterService,
    private readonly refDataService: RefDataService,
  ) {
    super(courtAppearanceService, offenceService, remandAndSentencingService, manageOffencesService, auditService)
  }

  public newJourney: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, appearanceReference, addOrEditCourtCase, addOrEditCourtAppearance } = req.params
    this.courtAppearanceService.clearSessionCourtAppearance(req.session, nomsId)
    this.offenceService.clearAllOffences(req.session, nomsId, courtCaseReference)
    const courtAppearanceUuid = appearanceReference
    this.courtAppearanceService.initialiseAppeals(req.session, nomsId, courtAppearanceUuid)
    return res.redirect(
      AppealsJourneyUrls.taskList(
        nomsId,
        addOrEditCourtCase,
        courtCaseReference,
        addOrEditCourtAppearance,
        courtAppearanceUuid,
      ),
    )
  }

  public taskList: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, appearanceReference, addOrEditCourtCase, addOrEditCourtAppearance } = req.params
    const courtAppearance = this.courtAppearanceService.getSessionCourtAppearance(
      req.session,
      nomsId,
      appearanceReference,
    )
    let caseReferenceSet = !!courtAppearance.caseReferenceNumber
    if (!caseReferenceSet) {
      const latestCourtAppearance = await this.remandAndSentencingService.getLatestCourtAppearanceByCourtCaseUuid(
        req.user.username,
        courtCaseReference,
      )
      caseReferenceSet = !!latestCourtAppearance.courtCaseReference
    }
    return res.render('pages/appeals/task-list', {
      nomsId,
      addOrEditCourtCase,
      addOrEditCourtAppearance,
      courtCaseReference,
      appearanceReference,
      model: new AppealsTaskListModel(
        nomsId,
        addOrEditCourtCase,
        addOrEditCourtAppearance,
        courtCaseReference,
        appearanceReference,
        courtAppearance,
        caseReferenceSet,
      ),
    })
  }

  public getCriminalOfficeReference: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, appearanceReference, addOrEditCourtCase, addOrEditCourtAppearance } = req.params
    const { submitToCheckAnswers } = req.query
    let criminalOfficeReferenceForm = (req.flash('criminalOfficeReferenceForm')[0] || {}) as CriminalOfficeReferenceForm
    const { criminalAppealOfficeReference, referenceNumberSelect } =
      this.courtAppearanceService.getSessionCourtAppearance(req.session, nomsId, appearanceReference)
    if (Object.keys(criminalOfficeReferenceForm).length === 0) {
      criminalOfficeReferenceForm = {
        referenceNumber: criminalAppealOfficeReference,
      }
    }
    let backLink = JourneyUrls.reference(
      nomsId,
      addOrEditCourtCase,
      courtCaseReference,
      addOrEditCourtAppearance,
      appearanceReference,
    )
    if (submitToCheckAnswers) {
      backLink = AppealsJourneyUrls.checkHearingAnswers(
        nomsId,
        addOrEditCourtCase,
        courtCaseReference,
        addOrEditCourtAppearance,
        appearanceReference,
      )
    } else if (this.isEditJourney(addOrEditCourtCase, addOrEditCourtAppearance)) {
      backLink = AppealsJourneyUrls.hearingDetails(
        nomsId,
        addOrEditCourtCase,
        courtCaseReference,
        addOrEditCourtAppearance,
        appearanceReference,
      )
    } else if (referenceNumberSelect !== undefined) {
      backLink = JourneyUrls.selectReference(
        nomsId,
        addOrEditCourtCase,
        courtCaseReference,
        addOrEditCourtAppearance,
        appearanceReference,
      )
    }
    return res.render('pages/appeals/criminal-office-reference', {
      nomsId,
      addOrEditCourtCase,
      courtCaseReference,
      addOrEditCourtAppearance,
      appearanceReference,
      criminalOfficeReferenceForm,
      errors: req.flash('errors') || [],
      backLink,
      showHearingDetails: this.isEditJourney(addOrEditCourtCase, addOrEditCourtAppearance),
    })
  }

  public submitCriminalOfficeReference: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, appearanceReference, addOrEditCourtCase, addOrEditCourtAppearance } = req.params
    const { submitToCheckAnswers } = req.query as { submitToCheckAnswers: string }
    const criminalOfficeReferenceForm = trimForm<CriminalOfficeReferenceForm>(req.body)
    const errors = this.courtAppearanceService.setCriminalOfficeReference(
      req.session,
      nomsId,
      appearanceReference,
      criminalOfficeReferenceForm,
    )
    if (errors.length > 0) {
      req.flash('errors', errors)
      req.flash('criminalOfficeReferenceForm', { ...criminalOfficeReferenceForm })
      return res.redirect(
        AppealsJourneyUrls.criminalOfficeReference(
          nomsId,
          addOrEditCourtCase,
          courtCaseReference,
          addOrEditCourtAppearance,
          appearanceReference,
          'true',
          submitToCheckAnswers,
        ),
      )
    }
    return this.submitRedirect(
      res,
      nomsId,
      addOrEditCourtCase,
      courtCaseReference,
      addOrEditCourtAppearance,
      appearanceReference,
      submitToCheckAnswers,
      AppealsJourneyUrls.appealDate(
        nomsId,
        addOrEditCourtCase,
        courtCaseReference,
        addOrEditCourtAppearance,
        appearanceReference,
      ),
    )
  }

  public getAppealDate: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, appearanceReference, addOrEditCourtCase, addOrEditCourtAppearance } = req.params
    const { submitToCheckAnswers } = req.query
    const appealDateForm = (req.flash('appealDateForm')[0] || {}) as AppealDateForm
    let appealDateDay: number | string = appealDateForm['appealDate-day']
    let appealDateMonth: number | string = appealDateForm['appealDate-month']
    let appealDateYear: number | string = appealDateForm['appealDate-year']
    const warrantDateValue = this.courtAppearanceService.getWarrantDate(req.session, nomsId, appearanceReference)
    if (warrantDateValue && Object.keys(appealDateForm).length === 0) {
      const appealDate = new Date(warrantDateValue)
      appealDateDay = appealDate.getDate()
      appealDateMonth = appealDate.getMonth() + 1
      appealDateYear = appealDate.getFullYear()
    }
    let backLink = AppealsJourneyUrls.criminalOfficeReference(
      nomsId,
      addOrEditCourtCase,
      courtCaseReference,
      addOrEditCourtAppearance,
      appearanceReference,
    )
    if (this.isEditJourney(addOrEditCourtCase, addOrEditCourtAppearance)) {
      backLink = AppealsJourneyUrls.hearingDetails(
        nomsId,
        addOrEditCourtCase,
        courtCaseReference,
        addOrEditCourtAppearance,
        appearanceReference,
      )
    } else if (submitToCheckAnswers) {
      backLink = AppealsJourneyUrls.checkHearingAnswers(
        nomsId,
        addOrEditCourtCase,
        courtCaseReference,
        addOrEditCourtAppearance,
        appearanceReference,
      )
    }
    return res.render('pages/appeals/appeal-date', {
      nomsId,
      addOrEditCourtCase,
      courtCaseReference,
      addOrEditCourtAppearance,
      appearanceReference,
      appealDateDay,
      appealDateMonth,
      appealDateYear,
      errors: req.flash('errors') || [],
      backLink,
      showHearingDetails: this.isEditJourney(addOrEditCourtCase, addOrEditCourtAppearance),
    })
  }

  public submitAppealDate: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, appearanceReference, addOrEditCourtCase, addOrEditCourtAppearance } = req.params
    const { submitToCheckAnswers } = req.query as { submitToCheckAnswers: string }
    const appealDateForm = trimForm<AppealDateForm>(req.body)
    const { username } = res.locals.user
    const errors = await this.courtAppearanceService.setAppealDate(
      req.session,
      nomsId,
      appearanceReference,
      appealDateForm,
      courtCaseReference,
      username,
    )
    if (errors.length) {
      req.flash('errors', errors)
      req.flash('appealDateForm', { ...appealDateForm })
      return res.redirect(
        AppealsJourneyUrls.appealDate(
          nomsId,
          addOrEditCourtCase,
          courtCaseReference,
          addOrEditCourtAppearance,
          appearanceReference,
          'true',
          submitToCheckAnswers,
        ),
      )
    }
    return this.submitRedirect(
      res,
      nomsId,
      addOrEditCourtCase,
      courtCaseReference,
      addOrEditCourtAppearance,
      appearanceReference,
      submitToCheckAnswers,
      AppealsJourneyUrls.appealCourt(
        nomsId,
        addOrEditCourtCase,
        courtCaseReference,
        addOrEditCourtAppearance,
        appearanceReference,
      ),
    )
  }

  public getAppealCourt: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, appearanceReference, addOrEditCourtCase, addOrEditCourtAppearance } = req.params
    const { submitToCheckAnswers } = req.query
    let appealCourtNameForm = (req.flash('courtNameForm')[0] || {}) as AppealCourtNameForm
    if (Object.keys(appealCourtNameForm).length === 0) {
      appealCourtNameForm = {
        courtCode: this.courtAppearanceService.getCourtCode(req.session, nomsId, appearanceReference),
      }
    }
    if (appealCourtNameForm.courtCode && appealCourtNameForm.courtName === undefined) {
      try {
        const court = await this.courtRegisterService.findCourtById(appealCourtNameForm.courtCode, req.user.username)
        appealCourtNameForm.courtName = court.courtName
      } catch (e) {
        logger.error(e)
      }
    }
    let backLink = AppealsJourneyUrls.appealDate(
      nomsId,
      addOrEditCourtCase,
      courtCaseReference,
      addOrEditCourtAppearance,
      appearanceReference,
    )
    if (this.isEditJourney(addOrEditCourtCase, addOrEditCourtAppearance)) {
      backLink = AppealsJourneyUrls.hearingDetails(
        nomsId,
        addOrEditCourtCase,
        courtCaseReference,
        addOrEditCourtAppearance,
        appearanceReference,
      )
    } else if (submitToCheckAnswers) {
      backLink = AppealsJourneyUrls.checkHearingAnswers(
        nomsId,
        addOrEditCourtCase,
        courtCaseReference,
        addOrEditCourtAppearance,
        appearanceReference,
      )
    }
    return res.render('pages/appeals/appeal-court', {
      nomsId,
      addOrEditCourtCase,
      courtCaseReference,
      addOrEditCourtAppearance,
      appearanceReference,
      appealCourtNameForm,
      errors: req.flash('errors') || [],
      backLink,
      showHearingDetails: this.isEditJourney(addOrEditCourtCase, addOrEditCourtAppearance),
    })
  }

  public submitAppealCourt: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, appearanceReference, addOrEditCourtCase, addOrEditCourtAppearance } = req.params
    const { submitToCheckAnswers } = req.query as { submitToCheckAnswers: string }
    const appealCourtNameForm = trimForm<AppealCourtNameForm>(req.body)
    const errors = this.courtAppearanceService.setAppealCourtName(
      req.session,
      nomsId,
      appearanceReference,
      appealCourtNameForm,
    )
    if (errors.length > 0) {
      req.flash('errors', errors)
      req.flash('appealCourtNameForm', { ...appealCourtNameForm })
      return res.redirect(
        AppealsJourneyUrls.appealCourt(
          nomsId,
          addOrEditCourtCase,
          courtCaseReference,
          addOrEditCourtAppearance,
          appearanceReference,
          'true',
          submitToCheckAnswers,
        ),
      )
    }
    return this.submitRedirect(
      res,
      nomsId,
      addOrEditCourtCase,
      courtCaseReference,
      addOrEditCourtAppearance,
      appearanceReference,
      submitToCheckAnswers,
      AppealsJourneyUrls.overallCaseOutcome(
        nomsId,
        addOrEditCourtCase,
        courtCaseReference,
        addOrEditCourtAppearance,
        appearanceReference,
      ),
    )
  }

  public getOverallCaseOutcome: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, appearanceReference, addOrEditCourtCase, addOrEditCourtAppearance } = req.params
    const { submitToCheckAnswers } = req.query
    let overallCaseOutcomeForm = (req.flash('overallCaseOutcomeForm')[0] || {}) as AppealOverallCaseOutcomeForm
    const courtAppearance = this.courtAppearanceService.getSessionCourtAppearance(
      req.session,
      nomsId,
      appearanceReference,
    )
    if (Object.keys(overallCaseOutcomeForm).length === 0) {
      overallCaseOutcomeForm = {
        overallCaseOutcome: `${courtAppearance.appearanceOutcomeUuid}`,
      }
    }
    const { appearanceOutcomeUuid } = courtAppearance
    const caseOutcomes = await this.refDataService.getAllAppearanceOutcomes(req.user.username)
    const outcomes = caseOutcomes
      .filter(caseOutcome => caseOutcome.outcomeType === 'APPEAL')
      .sort((a, b) => a.displayOrder - b.displayOrder)
    let legacyCaseOutcome
    if (appearanceOutcomeUuid && !outcomes.map(outcome => outcome.outcomeUuid).includes(appearanceOutcomeUuid)) {
      const outcome = await this.refDataService.getAppearanceOutcomeByUuid(appearanceOutcomeUuid, req.user.username)
      legacyCaseOutcome = outcome.outcomeName
    } else if (!appearanceOutcomeUuid && !res.locals.isAddCourtAppearance) {
      legacyCaseOutcome = outcomeValueOrLegacy(undefined, courtAppearance.legacyData)
    }
    let backLink = AppealsJourneyUrls.appealCourt(
      nomsId,
      addOrEditCourtCase,
      courtCaseReference,
      addOrEditCourtAppearance,
      appearanceReference,
    )
    if (this.isEditJourney(addOrEditCourtCase, addOrEditCourtAppearance)) {
      backLink = AppealsJourneyUrls.hearingDetails(
        nomsId,
        addOrEditCourtCase,
        courtCaseReference,
        addOrEditCourtAppearance,
        appearanceReference,
      )
    } else if (submitToCheckAnswers) {
      backLink = AppealsJourneyUrls.checkHearingAnswers(
        nomsId,
        addOrEditCourtCase,
        courtCaseReference,
        addOrEditCourtAppearance,
        appearanceReference,
      )
    }
    return res.render('pages/appeals/overall-case-outcome', {
      nomsId,
      addOrEditCourtCase,
      courtCaseReference,
      addOrEditCourtAppearance,
      appearanceReference,
      overallCaseOutcomeForm,
      legacyCaseOutcome,
      outcomes,
      errors: req.flash('errors') || [],
      backLink,
      showHearingDetails: this.isEditJourney(addOrEditCourtCase, addOrEditCourtAppearance),
    })
  }

  public submitOverallCaseOutcome: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, appearanceReference, addOrEditCourtCase, addOrEditCourtAppearance } = req.params
    const { submitToCheckAnswers } = req.query as { submitToCheckAnswers: string }
    const overallCaseOutcomeForm = trimForm<AppealOverallCaseOutcomeForm>(req.body)
    const errors = this.courtAppearanceService.setAppealAppearanceOutcome(
      req.session,
      nomsId,
      appearanceReference,
      overallCaseOutcomeForm,
    )

    if (errors.length > 0) {
      req.flash('errors', errors)
      req.flash('overallCaseOutcomeForm', { ...overallCaseOutcomeForm })
      return res.redirect(
        AppealsJourneyUrls.overallCaseOutcome(
          nomsId,
          addOrEditCourtCase,
          courtCaseReference,
          addOrEditCourtAppearance,
          appearanceReference,
          'true',
          submitToCheckAnswers,
        ),
      )
    }
    return this.submitRedirect(
      res,
      nomsId,
      addOrEditCourtCase,
      courtCaseReference,
      addOrEditCourtAppearance,
      appearanceReference,
      submitToCheckAnswers,
      AppealsJourneyUrls.checkHearingAnswers(
        nomsId,
        addOrEditCourtCase,
        courtCaseReference,
        addOrEditCourtAppearance,
        appearanceReference,
      ),
    )
  }

  public getCheckHearingAnswers: RequestHandler = async (req, res): Promise<void> => {
    return res.render('pages/appeals/check-hearing-answers')
  }

  private submitRedirect(
    res,
    nomsId,
    addOrEditCourtCase,
    courtCaseReference,
    addOrEditCourtAppearance,
    appearanceReference,
    submitToCheckAnswers,
    fallbackUrl,
  ) {
    if (this.isEditJourney(addOrEditCourtCase, addOrEditCourtAppearance)) {
      return res.redirect(
        AppealsJourneyUrls.hearingDetails(
          nomsId,
          addOrEditCourtCase,
          courtCaseReference,
          addOrEditCourtAppearance,
          appearanceReference,
        ),
      )
    }
    if (submitToCheckAnswers) {
      return res.redirect(
        AppealsJourneyUrls.checkHearingAnswers(
          nomsId,
          addOrEditCourtCase,
          courtCaseReference,
          addOrEditCourtAppearance,
          appearanceReference,
        ),
      )
    }
    return res.redirect(fallbackUrl)
  }
}
