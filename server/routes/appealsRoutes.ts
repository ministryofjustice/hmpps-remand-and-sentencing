import { RequestHandler } from 'express'
import type { CriminalOfficeReferenceForm } from 'forms'
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

export default class AppealsRoutes extends BaseRoutes {
  constructor(
    courtAppearanceService: CourtAppearanceService,
    offenceService: OffenceService,
    remandAndSentencingService: RemandAndSentencingService,
    manageOffencesService: ManageOffencesService,
    auditService: AuditService,
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
      errors: req.flash('errors') || [],
      backLink,
      showHearingDetails: this.isEditJourney(addOrEditCourtCase, addOrEditCourtAppearance),
    })
  }

  public submitCriminalOfficeReference: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, appearanceReference, addOrEditCourtCase, addOrEditCourtAppearance } = req.params

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
          true,
        ),
      )
    }
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
    const { submitToCheckAnswers } = req.query
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
    return res.redirect(
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
    return res.render('pages/appeals/appeal-date')
  }
}
