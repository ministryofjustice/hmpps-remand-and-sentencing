import { RequestHandler } from 'express'
import type {
  CourtCaseCourtNameForm,
  CourtCaseReferenceForm,
  CourtCaseWarrantDateForm,
  CourtCaseOverallCaseOutcomeForm,
  CourtCaseCaseOutcomeAppliedAllForm,
  CourtCaseLookupCaseOutcomeForm,
  CourtCaseNextHearingSelectForm,
  CourtCaseNextHearingTypeForm,
  CourtCaseNextHearingCourtSelectForm,
  CourtCaseNextHearingCourtNameForm,
  CourtCaseNextHearingDateForm,
  CourtCaseSelectReferenceForm,
  CourtCaseSelectCourtNameForm,
  CourtCaseWarrantTypeForm,
  CourtCaseTaggedBailForm,
  CourtCaseAlternativeSentenceLengthForm,
  SentenceLengthForm,
} from 'forms'
import type { CourtCase } from 'models'
import trimForm from '../utils/trim'
import CourtAppearanceService from '../services/courtAppearanceService'
import RemandAndSentencingService from '../services/remandAndSentencingService'
import CourtCaseDetailsModel from './data/CourtCaseDetailsModel'
import ManageOffencesService from '../services/manageOffencesService'
import { getAsStringOrDefault } from '../utils/utils'
import DocumentManagementService from '../services/documentManagementService'
import CaseOutcomeService from '../services/caseOutcomeService'
import validate from '../validation/validation'
import {
  pageCourtCaseAppearanceToCourtAppearance,
  sentenceLengthToAlternativeSentenceLengthForm,
  sentenceLengthToSentenceLengthForm,
} from '../utils/mappingUtils'
import TaskListModel from './data/TaskListModel'

export default class CourtCaseRoutes {
  constructor(
    private readonly courtAppearanceService: CourtAppearanceService,
    private readonly remandAndSentencingService: RemandAndSentencingService,
    private readonly manageOffencesService: ManageOffencesService,
    private readonly documentManagementService: DocumentManagementService,
    private readonly caseOutcomeService: CaseOutcomeService,
  ) {}

  public start: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId } = req.params
    const { token } = res.locals.user
    const sortBy = getAsStringOrDefault(req.query.sortBy, 'desc')

    const courtCases = await this.remandAndSentencingService.searchCourtCases(nomsId, token, sortBy)
    const courtCaseDetailModels = courtCases.content.map(
      pageCourtCaseContent => new CourtCaseDetailsModel(pageCourtCaseContent),
    )
    const chargeCodes = courtCases.content
      .map(courtCase => courtCase.appearances.map(appearance => appearance.charges.map(charge => charge.offenceCode)))
      .flat()
      .flat()
    const offenceMap = await this.manageOffencesService.getOffenceMap(Array.from(new Set(chargeCodes)), req.user.token)

    const newCourtCaseId = courtCases.totalElements
    return res.render('pages/start', {
      nomsId,
      newCourtCaseId,
      courtCaseDetailModels,
      offenceMap,
      sortBy,
      courtCaseTotal: courtCaseDetailModels.length,
    })
  }

  public getAppearanceDetails: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, appearanceReference, addOrEditCourtCase, addOrEditCourtAppearance } = req.params
    const { token } = res.locals.user
    if (!this.courtAppearanceService.sessionCourtAppearanceExists(req.session, nomsId)) {
      const storedAppearance = await this.remandAndSentencingService.getCourtAppearanceByAppearanceUuid(
        appearanceReference,
        token,
      )
      this.courtAppearanceService.setSessionCourtAppearance(
        req.session,
        nomsId,
        pageCourtCaseAppearanceToCourtAppearance(storedAppearance),
      )
    }

    const appearance = this.courtAppearanceService.getSessionCourtAppearance(req.session, nomsId)
    const chargeCodes = appearance.offences.map(offences => offences.offenceCode)
    const offenceMap = await this.manageOffencesService.getOffenceMap(Array.from(new Set(chargeCodes)), req.user.token)

    return res.render('pages/courtAppearance/details', {
      nomsId,
      courtCaseReference,
      appearanceReference,
      addOrEditCourtCase,
      addOrEditCourtAppearance,
      appearance,
      offenceMap,
      backLink: `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/details`,
    })
  }

  public getReference: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, appearanceReference, addOrEditCourtCase, addOrEditCourtAppearance } = req.params
    const { submitToCheckAnswers } = req.query
    let courtCaseReferenceForm = (req.flash('courtCaseReferenceForm')[0] || {}) as CourtCaseReferenceForm
    if (Object.keys(courtCaseReferenceForm).length === 0) {
      const referenceNumber = this.courtAppearanceService.getCaseReferenceNumber(req.session, nomsId)
      const noCaseReference = submitToCheckAnswers ? 'true' : ''
      courtCaseReferenceForm = {
        referenceNumber,
        noCaseReference: referenceNumber ? '' : noCaseReference,
      }
    }
    let backLink = `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/task-list`
    if (addOrEditCourtAppearance === 'edit-court-appearance') {
      backLink = `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/details`
    } else if (submitToCheckAnswers) {
      backLink = `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/check-answers`
    } else if (addOrEditCourtCase === 'edit-court-case') {
      backLink = `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/select-reference`
    }

    return res.render('pages/courtAppearance/reference', {
      nomsId,
      submitToCheckAnswers,
      courtCaseReferenceForm,
      courtCaseReference,
      appearanceReference,
      errors: req.flash('errors') || [],
      addOrEditCourtCase,
      addOrEditCourtAppearance,
      backLink,
    })
  }

  public submitReference: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, appearanceReference, addOrEditCourtCase, addOrEditCourtAppearance } = req.params
    const courtCaseReferenceForm = trimForm<CourtCaseReferenceForm>(req.body)
    const errors = this.courtAppearanceService.setCaseReferenceNumber(req.session, nomsId, courtCaseReferenceForm)
    if (errors.length > 0) {
      req.flash('errors', errors)
      req.flash('courtCaseReferenceForm', { ...courtCaseReferenceForm })
      return res.redirect(
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/reference`,
      )
    }
    if (addOrEditCourtAppearance === 'edit-court-appearance') {
      return res.redirect(
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/details`,
      )
    }
    const { submitToCheckAnswers } = req.query
    if (submitToCheckAnswers) {
      return res.redirect(
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/check-answers`,
      )
    }
    return res.redirect(
      `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/warrant-date`,
    )
  }

  public getSelectReference: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, appearanceReference, addOrEditCourtCase, addOrEditCourtAppearance } = req.params
    const { submitToCheckAnswers } = req.query
    const latestCourtAppearance = await this.remandAndSentencingService.getLatestCourtAppearanceByCourtCaseUuid(
      req.user.token,
      courtCaseReference,
    )
    let referenceForm = (req.flash('referenceForm')[0] || {}) as CourtCaseSelectReferenceForm
    if (Object.keys(referenceForm).length === 0) {
      referenceForm = {
        referenceNumberSelect: this.courtAppearanceService.getSessionCourtAppearance(req.session, nomsId)
          .referenceNumberSelect,
      }
    }
    return res.render('pages/courtAppearance/select-reference', {
      nomsId,
      submitToCheckAnswers,
      lastCaseReferenceNumber: latestCourtAppearance.courtCaseReference,
      courtCaseReference,
      appearanceReference,
      addOrEditCourtCase,
      addOrEditCourtAppearance,
      referenceForm,
      errors: req.flash('errors') || [],
      backLink: submitToCheckAnswers
        ? `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/check-answers`
        : `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/task-list`,
    })
  }

  public submitSelectReference: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, appearanceReference, addOrEditCourtCase, addOrEditCourtAppearance } = req.params
    const { submitToCheckAnswers } = req.query
    const submitToCheckAnswersQuery = submitToCheckAnswers ? `?submitToCheckAnswers=${submitToCheckAnswers}` : ''
    const referenceForm = trimForm<CourtCaseSelectReferenceForm>(req.body)
    const errors = await this.courtAppearanceService.setCaseReferenceFromSelectCaseReference(
      req.session,
      nomsId,
      courtCaseReference,
      req.user.token,
      referenceForm,
    )

    if (errors.length > 0) {
      req.flash('errors', errors)
      req.flash('referenceForm', { ...referenceForm })
      return res.redirect(
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/select-reference${submitToCheckAnswersQuery}`,
      )
    }
    if (referenceForm.referenceNumberSelect === 'true') {
      if (submitToCheckAnswers) {
        return res.redirect(
          `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/check-answers`,
        )
      }
      return res.redirect(
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/warrant-date`,
      )
    }

    return res.redirect(
      `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/reference${submitToCheckAnswersQuery}`,
    )
  }

  public getWarrantDate: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, appearanceReference, addOrEditCourtCase, addOrEditCourtAppearance } = req.params
    const { submitToCheckAnswers } = req.query
    const warrantDateForm = (req.flash('warrantDateForm')[0] || {}) as CourtCaseWarrantDateForm
    let warrantDateDay: number | string = warrantDateForm['warrantDate-day']
    let warrantDateMonth: number | string = warrantDateForm['warrantDate-month']
    let warrantDateYear: number | string = warrantDateForm['warrantDate-year']
    const warrantDateValue = this.courtAppearanceService.getWarrantDate(req.session, nomsId)
    if (warrantDateValue && Object.keys(warrantDateForm).length === 0) {
      const warrantDate = new Date(warrantDateValue)
      warrantDateDay = warrantDate.getDate()
      warrantDateMonth = warrantDate.getMonth() + 1
      warrantDateYear = warrantDate.getFullYear()
    }

    let backLink = `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/reference`
    if (addOrEditCourtAppearance === 'edit-court-appearance') {
      backLink = `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/details`
    } else if (submitToCheckAnswers) {
      backLink = `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/check-answers`
    }

    return res.render('pages/courtAppearance/warrant-date', {
      nomsId,
      submitToCheckAnswers,
      warrantDateDay,
      warrantDateMonth,
      warrantDateYear,
      courtCaseReference,
      appearanceReference,
      addOrEditCourtCase,
      addOrEditCourtAppearance,
      errors: req.flash('errors') || [],
      backLink,
    })
  }

  public submitWarrantDate: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, appearanceReference, addOrEditCourtCase, addOrEditCourtAppearance } = req.params
    const warrantDateForm = trimForm<CourtCaseWarrantDateForm>(req.body)
    const errors = this.courtAppearanceService.setWarrantDate(req.session, nomsId, warrantDateForm)
    if (errors.length > 0) {
      req.flash('errors', errors)
      req.flash('warrantDateForm', { ...warrantDateForm })
      return res.redirect(
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/warrant-date`,
      )
    }
    if (addOrEditCourtAppearance === 'edit-court-appearance') {
      return res.redirect(
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/details`,
      )
    }
    const { submitToCheckAnswers } = req.query
    if (submitToCheckAnswers) {
      return res.redirect(
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/check-answers`,
      )
    }
    if (addOrEditCourtCase === 'edit-court-case') {
      const latestCourtAppearance = await this.remandAndSentencingService.getLatestCourtAppearanceByCourtCaseUuid(
        req.user.token,
        courtCaseReference,
      )
      if (latestCourtAppearance.nextCourtAppearance?.courtCode) {
        return res.redirect(
          `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/select-court-name`,
        )
      }
    }
    return res.redirect(
      `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/court-name`,
    )
  }

  public getSelectCourtName: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, appearanceReference, addOrEditCourtCase, addOrEditCourtAppearance } = req.params
    const { submitToCheckAnswers } = req.query
    const latestCourtAppearance = await this.remandAndSentencingService.getLatestCourtAppearanceByCourtCaseUuid(
      req.user.token,
      courtCaseReference,
    )
    let selectCourtNameForm = (req.flash('selectCourtNameForm')[0] || {}) as CourtCaseSelectCourtNameForm
    if (Object.keys(selectCourtNameForm).length === 0) {
      const court = this.courtAppearanceService.getCourtName(req.session, nomsId)
      if (court) {
        selectCourtNameForm = {
          courtNameSelect: court === latestCourtAppearance.nextCourtAppearance?.courtCode ? 'true' : 'false',
        }
      }
    }
    return res.render('pages/courtAppearance/select-court-name', {
      nomsId,
      submitToCheckAnswers,
      lastCourtName: latestCourtAppearance.nextCourtAppearance?.courtCode,
      courtCaseReference,
      appearanceReference,
      addOrEditCourtCase,
      addOrEditCourtAppearance,
      errors: req.flash('errors') || [],
      selectCourtNameForm,
      backLink: submitToCheckAnswers
        ? `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/check-answers`
        : `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/warrant-date`,
    })
  }

  public submitSelectCourtName: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, appearanceReference, addOrEditCourtCase, addOrEditCourtAppearance } = req.params
    const selectCourtNameForm = trimForm<CourtCaseSelectCourtNameForm>(req.body)
    const errors = await this.courtAppearanceService.setCourtNameFromSelect(
      req.session,
      nomsId,
      courtCaseReference,
      req.user.token,
      selectCourtNameForm,
    )

    if (errors.length > 0) {
      req.flash('errors', errors)
      req.flash('selectCourtNameForm', { ...selectCourtNameForm })
      return res.redirect(
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/select-court-name`,
      )
    }
    if (selectCourtNameForm.courtNameSelect === 'true') {
      const warrantType = this.courtAppearanceService.getWarrantType(req.session, nomsId)
      if (warrantType === 'SENTENCING') {
        return res.redirect(
          `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/tagged-bail`,
        )
      }
      return res.redirect(
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/overall-case-outcome`,
      )
    }
    const { submitToCheckAnswers } = req.query
    const submitToCheckAnswersQuery = submitToCheckAnswers ? `?submitToCheckAnswers=${submitToCheckAnswers}` : ''
    return res.redirect(
      `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/court-name${submitToCheckAnswersQuery}`,
    )
  }

  public getCourtName: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, appearanceReference, addOrEditCourtCase, addOrEditCourtAppearance } = req.params
    const { submitToCheckAnswers } = req.query
    let courtNameForm = (req.flash('courtNameForm')[0] || {}) as CourtCaseCourtNameForm
    if (Object.keys(courtNameForm).length === 0) {
      courtNameForm = {
        courtName: this.courtAppearanceService.getCourtName(req.session, nomsId),
      }
    }
    let backLink = `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/warrant-date`

    if (addOrEditCourtAppearance === 'edit-court-appearance') {
      backLink = `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/details`
    } else if (submitToCheckAnswers) {
      backLink = `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/check-answers`
    } else if (addOrEditCourtCase === 'edit-court-case') {
      const latestCourtAppearance = await this.remandAndSentencingService.getLatestCourtAppearanceByCourtCaseUuid(
        req.user.token,
        courtCaseReference,
      )
      if (latestCourtAppearance.nextCourtAppearance?.courtCode) {
        backLink = `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/select-court-name`
      }
    }

    return res.render('pages/courtAppearance/court-name', {
      nomsId,
      submitToCheckAnswers,
      courtNameForm,
      courtCaseReference,
      appearanceReference,
      errors: req.flash('errors') || [],
      addOrEditCourtCase,
      addOrEditCourtAppearance,
      backLink,
    })
  }

  public submitCourtName: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, appearanceReference, addOrEditCourtCase, addOrEditCourtAppearance } = req.params
    const courtNameForm = trimForm<CourtCaseCourtNameForm>(req.body)

    const errors = this.courtAppearanceService.setCourtName(req.session, nomsId, courtNameForm)
    if (errors.length > 0) {
      req.flash('errors', errors)
      req.flash('courtNameForm', { ...courtNameForm })
      return res.redirect(
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/court-name`,
      )
    }
    if (addOrEditCourtAppearance === 'edit-court-appearance') {
      return res.redirect(
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/details`,
      )
    }
    const { submitToCheckAnswers } = req.query
    if (submitToCheckAnswers) {
      return res.redirect(
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/check-answers`,
      )
    }
    const warrantType = this.courtAppearanceService.getWarrantType(req.session, nomsId)
    if (warrantType === 'SENTENCING') {
      return res.redirect(
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/tagged-bail`,
      )
    }
    return res.redirect(
      `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/overall-case-outcome`,
    )
  }

  public getWarrantType: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, appearanceReference, addOrEditCourtCase, addOrEditCourtAppearance } = req.params
    const { submitToCheckAnswers } = req.query
    let warrantType: string
    if (submitToCheckAnswers) {
      warrantType = this.courtAppearanceService.getWarrantType(req.session, nomsId)
    }

    return res.render('pages/courtAppearance/warrant-type', {
      nomsId,
      submitToCheckAnswers,
      warrantType,
      courtCaseReference,
      appearanceReference,
      errors: req.flash('errors') || [],
      addOrEditCourtCase,
      addOrEditCourtAppearance,
      backLink: submitToCheckAnswers
        ? `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/check-answers`
        : `/person/${nomsId}`,
    })
  }

  public submitWarrantType: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, appearanceReference, addOrEditCourtCase, addOrEditCourtAppearance } = req.params
    const warrantTypeForm = trimForm<CourtCaseWarrantTypeForm>(req.body)
    const errors = validate(
      warrantTypeForm,
      { warrantType: 'required' },
      { 'required.warrantType': 'You must select the type of warrant' },
    )
    if (errors.length > 0) {
      req.flash('errors', errors)
      return res.redirect(
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/warrant-type`,
      )
    }
    this.courtAppearanceService.setWarrantType(req.session, nomsId, warrantTypeForm.warrantType)
    if (warrantTypeForm.warrantType === 'SENTENCING') {
      this.courtAppearanceService.setOverallCaseOutcome(req.session, nomsId, 'Imprisonment')
      this.courtAppearanceService.setCaseOutcomeAppliedAll(req.session, nomsId, true)
    }
    const { submitToCheckAnswers } = req.query
    if (submitToCheckAnswers) {
      return res.redirect(
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/check-answers`,
      )
    }
    return res.redirect(
      `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/task-list`,
    )
  }

  public getTaskList: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, appearanceReference, addOrEditCourtCase, addOrEditCourtAppearance } = req.params
    const warrantType = this.courtAppearanceService.getWarrantType(req.session, nomsId)
    const courtAppearance = this.courtAppearanceService.getSessionCourtAppearance(req.session, nomsId)

    return res.render('pages/courtAppearance/task-list', {
      nomsId,
      warrantType,
      courtCaseReference,
      appearanceReference,
      addOrEditCourtCase,
      addOrEditCourtAppearance,
      model: new TaskListModel(
        nomsId,
        addOrEditCourtCase,
        addOrEditCourtAppearance,
        courtCaseReference,
        appearanceReference,
        courtAppearance,
      ),
    })
  }

  public submitTaskList: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, appearanceReference, addOrEditCourtCase, addOrEditCourtAppearance } = req.params
    const { token } = res.locals.user
    const courtAppearance = this.courtAppearanceService.getSessionCourtAppearance(req.session, nomsId)
    if (addOrEditCourtCase === 'add-court-case') {
      const courtCase = { appearances: [courtAppearance] } as CourtCase
      await this.remandAndSentencingService.createCourtCase(nomsId, token, courtCase)
    } else {
      await this.remandAndSentencingService.createCourtAppearance(token, courtCaseReference, courtAppearance)
    }
    this.courtAppearanceService.clearSessionCourtAppearance(req.session, nomsId)
    return res.redirect(
      `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/confirmation`,
    )
  }

  public getWarrantUpload: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, appearanceReference, addOrEditCourtCase, addOrEditCourtAppearance } = req.params
    const { submitToCheckAnswers } = req.query

    return res.render('pages/courtAppearance/warrant-upload', {
      nomsId,
      submitToCheckAnswers,
      courtCaseReference,
      appearanceReference,
      addOrEditCourtCase,
      addOrEditCourtAppearance,
    })
  }

  public submitWarrantUpload: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, appearanceReference, addOrEditCourtCase, addOrEditCourtAppearance } = req.params
    const { submitToCheckAnswers } = req.query
    const { username, activeCaseLoadId } = res.locals.user

    if (req.file) {
      const warrantId = await this.documentManagementService.uploadWarrant(nomsId, req.file, username, activeCaseLoadId)
      this.courtAppearanceService.setWarrantId(req.session, nomsId, warrantId)
    }

    if (submitToCheckAnswers) {
      return res.redirect(
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/check-answers`,
      )
    }
    return res.redirect(
      `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/overall-case-outcome`,
    )
  }

  public getOverallCaseOutcome: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, appearanceReference, addOrEditCourtCase, addOrEditCourtAppearance } = req.params
    const { submitToCheckAnswers } = req.query
    const overallCaseOutcome: string = this.courtAppearanceService.getOverallCaseOutcome(req.session, nomsId)
    const warrantType: string = this.courtAppearanceService.getWarrantType(req.session, nomsId)
    const topCaseOutcomes = this.caseOutcomeService.getTopCaseOutcomes(warrantType)

    return res.render('pages/courtAppearance/overall-case-outcome', {
      nomsId,
      submitToCheckAnswers,
      overallCaseOutcome,
      courtCaseReference,
      appearanceReference,
      addOrEditCourtCase,
      addOrEditCourtAppearance,
      errors: req.flash('errors') || [],
      topCaseOutcomes,
    })
  }

  public submitOverallCaseOutcome: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, appearanceReference, addOrEditCourtCase, addOrEditCourtAppearance } = req.params
    const overallCaseOutcomeForm = trimForm<CourtCaseOverallCaseOutcomeForm>(req.body)
    const errors = validate(
      overallCaseOutcomeForm,
      { overallCaseOutcome: 'required' },
      { 'required.overallCaseOutcome': 'You must select the overall case outcome' },
    )
    if (errors.length > 0) {
      req.flash('errors', errors)
      return res.redirect(
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/overall-case-outcome`,
      )
    }
    if (overallCaseOutcomeForm.overallCaseOutcome === 'LOOKUPDIFFERENT') {
      return res.redirect(
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/lookup-case-outcome`,
      )
    }
    this.courtAppearanceService.setOverallCaseOutcome(req.session, nomsId, overallCaseOutcomeForm.overallCaseOutcome)
    if (addOrEditCourtAppearance === 'edit-court-appearance') {
      return res.redirect(
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/details`,
      )
    }
    const { submitToCheckAnswers } = req.query
    if (submitToCheckAnswers) {
      return res.redirect(
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/check-answers`,
      )
    }
    return res.redirect(
      `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/case-outcome-applied-all`,
    )
  }

  public getLookupCaseOutcome: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, appearanceReference, addOrEditCourtCase, addOrEditCourtAppearance } = req.params

    const warrantType: string = this.courtAppearanceService.getWarrantType(req.session, nomsId)
    return res.render('pages/courtAppearance/lookup-case-outcome', {
      nomsId,
      courtCaseReference,
      appearanceReference,
      addOrEditCourtCase,
      addOrEditCourtAppearance,
      warrantType,
      errors: req.flash('errors') || [],
    })
  }

  public submitLookupCaseOutcome: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, appearanceReference, addOrEditCourtCase, addOrEditCourtAppearance } = req.params
    const lookupCaseOutcomeForm = trimForm<CourtCaseLookupCaseOutcomeForm>(req.body)
    const errors = validate(
      lookupCaseOutcomeForm,
      { caseOutcome: 'required' },
      {
        'required.caseOutcome': 'You must enter an outcome',
      },
    )
    if (lookupCaseOutcomeForm.caseOutcome && !this.caseOutcomeService.validOutcome(lookupCaseOutcomeForm.caseOutcome)) {
      errors.push({ text: 'You must enter a valid outcome', href: '#caseOutcome' })
    }
    if (errors.length > 0) {
      req.flash('errors', errors)
      return res.redirect(
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/lookup-case-outcome`,
      )
    }
    this.courtAppearanceService.setOverallCaseOutcome(req.session, nomsId, lookupCaseOutcomeForm.caseOutcome)
    return res.redirect(
      `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/case-outcome-applied-all`,
    )
  }

  public getCaseOutcomeAppliedAll: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, appearanceReference, addOrEditCourtCase, addOrEditCourtAppearance } = req.params
    const { submitToCheckAnswers } = req.query
    const overallCaseOutcome: string = this.courtAppearanceService.getOverallCaseOutcome(req.session, nomsId)
    const caseOutcomeAppliedAll: boolean = this.courtAppearanceService.getCaseOutcomeAppliedAll(req.session, nomsId)

    return res.render('pages/courtAppearance/case-outcome-applied-all', {
      nomsId,
      submitToCheckAnswers,
      overallCaseOutcome,
      caseOutcomeAppliedAll,
      courtCaseReference,
      appearanceReference,
      addOrEditCourtCase,
      addOrEditCourtAppearance,
    })
  }

  public submitCaseOutcomeAppliedAll: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, appearanceReference, addOrEditCourtCase, addOrEditCourtAppearance } = req.params
    const caseOutcomeAppliedAllForm = trimForm<CourtCaseCaseOutcomeAppliedAllForm>(req.body)

    this.courtAppearanceService.setCaseOutcomeAppliedAll(
      req.session,
      nomsId,
      caseOutcomeAppliedAllForm.caseOutcomeAppliedAll === 'true',
    )
    const { submitToCheckAnswers } = req.query
    if (submitToCheckAnswers) {
      return res.redirect(
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/check-answers`,
      )
    }
    return res.redirect(
      `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/tagged-bail`,
    )
  }

  public getTaggedBail: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, appearanceReference, addOrEditCourtCase, addOrEditCourtAppearance } = req.params
    const { submitToCheckAnswers } = req.query
    let taggedBailForm = (req.flash('taggedBailForm')[0] || {}) as CourtCaseTaggedBailForm
    if (Object.keys(taggedBailForm).length === 0) {
      const taggedBail = this.courtAppearanceService.getTaggedBail(req.session, nomsId)
      const hasTaggedBail = taggedBail ? 'true' : 'false'
      taggedBailForm = {
        taggedBail,
        hasTaggedBail: submitToCheckAnswers ? hasTaggedBail : '',
      }
    }
    const warrantType = this.courtAppearanceService.getWarrantType(req.session, nomsId)
    let backLink = `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/case-outcome-applied-all`
    if (warrantType === 'SENTENCING') {
      if (addOrEditCourtCase === 'add-court-case') {
        backLink = `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/court-name`
      } else {
        backLink = `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/select-court-name`
      }
    } else if (addOrEditCourtCase === 'edit-court-case') {
      backLink = `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/overall-case-outcome`
    }

    return res.render('pages/courtAppearance/tagged-bail', {
      nomsId,
      submitToCheckAnswers,
      courtCaseReference,
      appearanceReference,
      errors: req.flash('errors') || [],
      taggedBailForm,
      addOrEditCourtCase,
      addOrEditCourtAppearance,
      backLink,
    })
  }

  public submitTaggedBail: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, appearanceReference, addOrEditCourtCase, addOrEditCourtAppearance } = req.params
    const taggedBailForm = trimForm<CourtCaseTaggedBailForm>(req.body)
    const errors = this.courtAppearanceService.setTaggedBail(req.session, nomsId, taggedBailForm)
    if (errors.length > 0) {
      req.flash('errors', errors)
      req.flash('taggedBailForm', { ...taggedBailForm })
      return res.redirect(
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/tagged-bail`,
      )
    }
    const courtAppearance = this.courtAppearanceService.getSessionCourtAppearance(req.session, nomsId)
    if (courtAppearance.warrantType === 'SENTENCING') {
      return res.redirect(
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/overall-sentence-length`,
      )
    }
    return res.redirect(
      `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/check-answers`,
    )
  }

  public getOverallSentenceLength: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, appearanceReference, addOrEditCourtCase, addOrEditCourtAppearance } = req.params
    const { submitToCheckAnswers } = req.query
    let courtCaseOverallSentenceLengthForm = (req.flash('courtCaseOverallSentenceLengthForm')[0] ||
      {}) as SentenceLengthForm
    if (Object.keys(courtCaseOverallSentenceLengthForm).length === 0) {
      courtCaseOverallSentenceLengthForm = sentenceLengthToSentenceLengthForm(
        this.courtAppearanceService.getOverallCustodialSentenceLength(req.session, nomsId),
      )
    }
    return res.render('pages/courtAppearance/overall-sentence-length', {
      nomsId,
      courtCaseReference,
      appearanceReference,
      addOrEditCourtCase,
      addOrEditCourtAppearance,
      submitToCheckAnswers,
      courtCaseOverallSentenceLengthForm,
      errors: req.flash('errors') || [],
      backLink: submitToCheckAnswers
        ? `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/check-answers`
        : `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/tagged-bail`,
    })
  }

  public submitOverallSentenceLength: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, appearanceReference, addOrEditCourtCase, addOrEditCourtAppearance } = req.params
    const courtCaseOverallSentenceLengthForm = trimForm<SentenceLengthForm>(req.body)
    const errors = this.courtAppearanceService.setOverallSentenceLength(
      req.session,
      nomsId,
      courtCaseOverallSentenceLengthForm,
    )
    if (errors.length > 0) {
      req.flash('errors', errors)
      req.flash('courtCaseOverallSentenceLengthForm', { ...courtCaseOverallSentenceLengthForm })
      return res.redirect(
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/overall-sentence-length`,
      )
    }
    return res.redirect(
      `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/check-answers`,
    )
  }

  public getAlternativeSentenceLength: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, appearanceReference, addOrEditCourtCase, addOrEditCourtAppearance } = req.params
    const { submitToCheckAnswers } = req.query
    let courtCaseAlternativeSentenceLengthForm = (req.flash('courtCaseAlternativeSentenceLengthForm')[0] ||
      {}) as CourtCaseAlternativeSentenceLengthForm

    if (Object.keys(courtCaseAlternativeSentenceLengthForm).length === 0) {
      courtCaseAlternativeSentenceLengthForm =
        sentenceLengthToAlternativeSentenceLengthForm<CourtCaseAlternativeSentenceLengthForm>(
          this.courtAppearanceService.getOverallCustodialSentenceLength(req.session, nomsId),
        )
    }
    return res.render('pages/courtAppearance/alternative-sentence-length', {
      nomsId,
      courtCaseReference,
      appearanceReference,
      addOrEditCourtCase,
      addOrEditCourtAppearance,
      submitToCheckAnswers,
      courtCaseAlternativeSentenceLengthForm,
      errors: req.flash('errors') || [],
      backLink: `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/overall-sentence-length`,
    })
  }

  public submitAlternativeSentenceLength: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, appearanceReference, addOrEditCourtCase, addOrEditCourtAppearance } = req.params
    const courtCaseAlternativeSentenceLengthForm = trimForm<CourtCaseAlternativeSentenceLengthForm>(req.body)
    const errors = this.courtAppearanceService.setOverallAlternativeSentenceLength(
      req.session,
      nomsId,
      courtCaseAlternativeSentenceLengthForm,
    )
    if (errors.length > 0) {
      req.flash('errors', errors)
      req.flash('courtCaseAlternativeSentenceLengthForm', { ...courtCaseAlternativeSentenceLengthForm })
      return res.redirect(
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/alternative-overall-sentence-length`,
      )
    }
    return res.redirect(
      `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/check-answers`,
    )
  }

  public getCheckAnswers: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, appearanceReference, addOrEditCourtCase, addOrEditCourtAppearance } = req.params
    const courtAppearance = this.courtAppearanceService.getSessionCourtAppearance(req.session, nomsId)

    return res.render('pages/courtAppearance/check-answers', {
      nomsId,
      courtAppearance,
      courtCaseReference,
      appearanceReference,
      addOrEditCourtCase,
      addOrEditCourtAppearance,
      backLink:
        courtAppearance.warrantType === 'SENTENCING'
          ? `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/overall-sentence-length`
          : `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/tagged-bail`,
    })
  }

  public submitCheckAnswers: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, appearanceReference, addOrEditCourtCase, addOrEditCourtAppearance } = req.params
    this.courtAppearanceService.setAppearanceInformationAcceptedTrue(req.session, nomsId)
    return res.redirect(
      `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/task-list`,
    )
  }

  public getNextHearingSelect: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, appearanceReference, addOrEditCourtCase, addOrEditCourtAppearance } = req.params
    const nextHearingSelect = this.courtAppearanceService.getNextHearingSelect(req.session, nomsId)

    return res.render('pages/courtAppearance/next-hearing-select', {
      nomsId,
      nextHearingSelect,
      courtCaseReference,
      appearanceReference,
      addOrEditCourtCase,
      addOrEditCourtAppearance,
    })
  }

  public submitNextHearingSelect: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, appearanceReference, addOrEditCourtCase, addOrEditCourtAppearance } = req.params
    const nextHearingSelectForm = trimForm<CourtCaseNextHearingSelectForm>(req.body)
    const nextHearingSelect = nextHearingSelectForm.nextHearingSelect === 'true'
    this.courtAppearanceService.setNextHearingSelect(req.session, nomsId, nextHearingSelect)
    if (nextHearingSelect) {
      return res.redirect(
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/next-hearing-type`,
      )
    }
    this.courtAppearanceService.setNextCourtAppearanceAcceptedTrue(req.session, nomsId)
    if (addOrEditCourtAppearance === 'edit-court-appearance') {
      return res.redirect(
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/details`,
      )
    }
    return res.redirect(
      `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/task-list`,
    )
  }

  public getNextHearingType: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, appearanceReference, addOrEditCourtCase, addOrEditCourtAppearance } = req.params
    const { submitToCheckAnswers } = req.query
    const nextHearingType = this.courtAppearanceService.getNextHearingType(req.session, nomsId)

    return res.render('pages/courtAppearance/next-hearing-type', {
      nomsId,
      nextHearingType,
      courtCaseReference,
      appearanceReference,
      submitToCheckAnswers,
      addOrEditCourtCase,
      addOrEditCourtAppearance,
    })
  }

  public submitNextHearingType: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, appearanceReference, addOrEditCourtCase, addOrEditCourtAppearance } = req.params
    const nextHearingTypeForm = trimForm<CourtCaseNextHearingTypeForm>(req.body)
    this.courtAppearanceService.setNextHearingType(req.session, nomsId, nextHearingTypeForm.nextHearingType)
    if (
      addOrEditCourtAppearance === 'edit-court-appearance' &&
      this.courtAppearanceService.isNextCourtAppearanceAccepted(req.session, nomsId)
    ) {
      return res.redirect(
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/details`,
      )
    }
    const { submitToCheckAnswers } = req.query
    if (submitToCheckAnswers) {
      return res.redirect(
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/check-next-hearing-answers`,
      )
    }
    return res.redirect(
      `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/next-hearing-date`,
    )
  }

  public getNextHearingDate: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, appearanceReference, addOrEditCourtCase, addOrEditCourtAppearance } = req.params
    const { submitToCheckAnswers } = req.query
    const nextHearingDateForm = (req.flash('nextHearingDateForm')[0] || {}) as CourtCaseNextHearingDateForm
    const nextHearingDateValue = this.courtAppearanceService.getNextHearingDate(req.session, nomsId)
    let nextHearingDateDay: number | string = nextHearingDateForm['nextHearingDate-day']
    let nextHearingDateMonth: number | string = nextHearingDateForm['nextHearingDate-month']
    let nextHearingDateYear: number | string = nextHearingDateForm['nextHearingDate-year']
    let { nextHearingTime } = nextHearingDateForm
    if (nextHearingDateValue && !nextHearingDateForm) {
      const nextHearingDate = new Date(nextHearingDateValue)
      nextHearingDateDay = nextHearingDate.getDate()
      nextHearingDateMonth = nextHearingDate.getMonth() + 1
      nextHearingDateYear = nextHearingDate.getFullYear()
      nextHearingTime = this.courtAppearanceService.hasNextHearingTimeSet(req.session, nomsId)
        ? `${nextHearingDate.getHours()}:${nextHearingDate.getMinutes()}`
        : ''
    }

    return res.render('pages/courtAppearance/next-hearing-date', {
      nomsId,
      nextHearingDateDay,
      nextHearingDateMonth,
      nextHearingDateYear,
      nextHearingTime,
      courtCaseReference,
      appearanceReference,
      submitToCheckAnswers,
      addOrEditCourtCase,
      addOrEditCourtAppearance,
      errors: req.flash('errors') || [],
      backLink: `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/next-hearing-type`,
    })
  }

  public submitNextHearingDate: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, appearanceReference, addOrEditCourtCase, addOrEditCourtAppearance } = req.params
    const nextHearingDateForm = trimForm<CourtCaseNextHearingDateForm>(req.body)
    const errors = this.courtAppearanceService.setNextHearingDate(req.session, nomsId, nextHearingDateForm)

    if (errors.length > 0) {
      req.flash('errors', errors)
      req.flash('nextHearingDateForm', { ...nextHearingDateForm })
      return res.redirect(
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/next-hearing-date`,
      )
    }
    if (
      addOrEditCourtAppearance === 'edit-court-appearance' &&
      this.courtAppearanceService.isNextCourtAppearanceAccepted(req.session, nomsId)
    ) {
      return res.redirect(
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/details`,
      )
    }
    const { submitToCheckAnswers } = req.query
    if (submitToCheckAnswers) {
      return res.redirect(
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/check-next-hearing-answers`,
      )
    }
    return res.redirect(
      `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/next-hearing-court-select`,
    )
  }

  public getNextHearingCourtSelect: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, appearanceReference, addOrEditCourtCase, addOrEditCourtAppearance } = req.params
    const nextHearingCourtSelect = this.courtAppearanceService.getNextHearingCourtSelect(req.session, nomsId)
    const courtName = this.courtAppearanceService.getCourtName(req.session, nomsId)

    return res.render('pages/courtAppearance/next-hearing-court-select', {
      nomsId,
      nextHearingCourtSelect,
      courtName,
      courtCaseReference,
      appearanceReference,
      addOrEditCourtCase,
      addOrEditCourtAppearance,
    })
  }

  public submitNextHearingCourtSelect: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, appearanceReference, addOrEditCourtCase, addOrEditCourtAppearance } = req.params
    const nextHearingCourtSelectForm = trimForm<CourtCaseNextHearingCourtSelectForm>(req.body)
    const nextHearingCourtSelect = nextHearingCourtSelectForm.nextHearingCourtSelect === 'true'
    this.courtAppearanceService.setNextHearingCourtSelect(req.session, nomsId, nextHearingCourtSelect)
    if (nextHearingCourtSelect) {
      if (
        addOrEditCourtAppearance === 'edit-court-appearance' &&
        this.courtAppearanceService.isNextCourtAppearanceAccepted(req.session, nomsId)
      ) {
        return res.redirect(
          `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/details`,
        )
      }
      return res.redirect(
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/check-next-hearing-answers`,
      )
    }
    return res.redirect(
      `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/next-hearing-court-name`,
    )
  }

  public getNextHearingCourtName: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, appearanceReference, addOrEditCourtCase, addOrEditCourtAppearance } = req.params
    const nextHearingCourtName = this.courtAppearanceService.getNextHearingCourtName(req.session, nomsId)

    return res.render('pages/courtAppearance/next-hearing-court-name', {
      nomsId,
      nextHearingCourtName,
      courtCaseReference,
      appearanceReference,
      addOrEditCourtCase,
      addOrEditCourtAppearance,
    })
  }

  public submitNextHearingCourtName: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, appearanceReference, addOrEditCourtCase, addOrEditCourtAppearance } = req.params
    const nextHearingCourtNameForm = trimForm<CourtCaseNextHearingCourtNameForm>(req.body)
    this.courtAppearanceService.setNextHearingCourtName(
      req.session,
      nomsId,
      nextHearingCourtNameForm.nextHearingCourtName,
    )
    if (
      addOrEditCourtAppearance === 'edit-court-appearance' &&
      this.courtAppearanceService.isNextCourtAppearanceAccepted(req.session, nomsId)
    ) {
      return res.redirect(
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/details`,
      )
    }
    return res.redirect(
      `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/check-next-hearing-answers`,
    )
  }

  public getCheckNextHearingAnswers: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, appearanceReference, addOrEditCourtCase, addOrEditCourtAppearance } = req.params
    const courtAppearance = this.courtAppearanceService.getSessionCourtAppearance(req.session, nomsId)

    return res.render('pages/courtAppearance/check-next-hearing-answers', {
      nomsId,
      courtAppearance,
      courtCaseReference,
      appearanceReference,
      addOrEditCourtCase,
      addOrEditCourtAppearance,
      backLink: courtAppearance.nextCourtAppearanceAccepted
        ? `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/task-list`
        : `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/next-hearing-court-select`,
    })
  }

  public submiCheckNextHearingAnswers: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, appearanceReference, addOrEditCourtCase, addOrEditCourtAppearance } = req.params
    this.courtAppearanceService.setNextCourtAppearanceAcceptedTrue(req.session, nomsId)
    if (addOrEditCourtAppearance === 'edit-court-appearance') {
      return res.redirect(
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/details`,
      )
    }
    return res.redirect(
      `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/task-list`,
    )
  }

  public getConfirmationPage: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId } = req.params

    return res.render('pages/courtAppearance/confirmation', {
      nomsId,
    })
  }
}
