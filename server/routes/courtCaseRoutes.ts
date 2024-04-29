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
} from 'forms'
import type { CourtAppearance, CourtCase } from 'models'
import trimForm from '../utils/trim'
import CourtAppearanceService from '../services/courtAppearanceService'
import RemandAndSentencingService from '../services/remandAndSentencingService'
import CourtCaseDetailsModel from './data/CourtCaseDetailsModel'
import ManageOffencesService from '../services/manageOffencesService'
import { getAsStringOrDefault } from '../utils/utils'
import DocumentManagementService from '../services/documentManagementService'
import CaseOutcomeService from '../services/caseOutcomeService'
import validate from '../validation/validation'

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

  public getReference: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, appearanceReference, addOrEditCourtCase } = req.params
    const { submitToCheckAnswers } = req.query
    let caseReferenceNumber: string
    if (submitToCheckAnswers) {
      caseReferenceNumber = this.courtAppearanceService.getCaseReferenceNumber(req.session, nomsId)
    }

    return res.render('pages/courtAppearance/reference', {
      nomsId,
      submitToCheckAnswers,
      caseReferenceNumber,
      courtCaseReference,
      appearanceReference,
      errors: req.flash('errors') || [],
      addOrEditCourtCase,
    })
  }

  public submitReference: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, appearanceReference, addOrEditCourtCase } = req.params
    const referenceForm = trimForm<CourtCaseReferenceForm>(req.body)
    const errors = validate(
      referenceForm,
      { referenceNumber: 'required' },
      { 'required.referenceNumber': 'You must enter the case reference' },
    )
    if (errors.length > 0) {
      req.flash('errors', errors)
      return res.redirect(
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/appearance/${appearanceReference}/reference`,
      )
    }
    this.courtAppearanceService.setCaseReferenceNumber(req.session, nomsId, referenceForm.referenceNumber)
    const { submitToCheckAnswers } = req.query
    if (submitToCheckAnswers) {
      return res.redirect(
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/appearance/${appearanceReference}/check-answers`,
      )
    }
    return res.redirect(
      `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/appearance/${appearanceReference}/warrant-date`,
    )
  }

  public getSelectReference: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, appearanceReference, addOrEditCourtCase } = req.params
    const { submitToCheckAnswers } = req.query
    const latestCourtAppearance = await this.remandAndSentencingService.getLatestCourtAppearanceByCourtCaseUuid(
      req.user.token,
      courtCaseReference,
    )
    return res.render('pages/courtAppearance/select-reference', {
      nomsId,
      submitToCheckAnswers,
      lastCaseReferenceNumber: latestCourtAppearance.courtCaseReference,
      courtCaseReference,
      appearanceReference,
      addOrEditCourtCase,
    })
  }

  public submitSelectReference: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, appearanceReference, addOrEditCourtCase } = req.params
    const referenceForm = trimForm<CourtCaseSelectReferenceForm>(req.body)
    if (referenceForm.referenceNumberSelect === 'true') {
      const latestCourtAppearance = await this.remandAndSentencingService.getLatestCourtAppearanceByCourtCaseUuid(
        req.user.token,
        courtCaseReference,
      )
      this.courtAppearanceService.setCaseReferenceNumber(req.session, nomsId, latestCourtAppearance.courtCaseReference)
      return res.redirect(
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/appearance/${appearanceReference}/warrant-date`,
      )
    }
    const { submitToCheckAnswers } = req.query
    const submitToCheckAnswersQuery = submitToCheckAnswers ? `?submitToCheckAnswers=${submitToCheckAnswers}` : ''
    return res.redirect(
      `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/appearance/${appearanceReference}/reference${submitToCheckAnswersQuery}`,
    )
  }

  public getWarrantDate: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, appearanceReference, addOrEditCourtCase } = req.params
    const { submitToCheckAnswers } = req.query
    const warrantDateForm = (req.flash('warrantDateForm')[0] || {}) as CourtCaseWarrantDateForm
    let warrantDateDay: number | string = warrantDateForm['warrantDate-day']
    let warrantDateMonth: number | string = warrantDateForm['warrantDate-month']
    let warrantDateYear: number | string = warrantDateForm['warrantDate-year']
    const warrantDateValue = this.courtAppearanceService.getWarrantDate(req.session, nomsId)
    if (warrantDateValue && !warrantDateForm) {
      const warrantDate = new Date(warrantDateValue)
      warrantDateDay = warrantDate.getDate()
      warrantDateMonth = warrantDate.getMonth() + 1
      warrantDateYear = warrantDate.getFullYear()
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
      errors: req.flash('errors') || [],
      backLink: req.get('Referrer'),
    })
  }

  public submitWarrantDate: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, appearanceReference, addOrEditCourtCase } = req.params
    const warrantDateForm = trimForm<CourtCaseWarrantDateForm>(req.body)
    const errors = this.courtAppearanceService.setWarrantDate(req.session, nomsId, warrantDateForm)
    if (errors.length > 0) {
      req.flash('errors', errors)
      req.flash('warrantDateForm', { ...warrantDateForm })
      return res.redirect(
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/appearance/${appearanceReference}/warrant-date`,
      )
    }

    const { submitToCheckAnswers } = req.query
    if (submitToCheckAnswers) {
      return res.redirect(
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/appearance/${appearanceReference}/check-answers`,
      )
    }
    if (addOrEditCourtCase === 'edit-court-case') {
      const latestCourtAppearance = await this.remandAndSentencingService.getLatestCourtAppearanceByCourtCaseUuid(
        req.user.token,
        courtCaseReference,
      )
      if (latestCourtAppearance.nextCourtAppearance?.courtCode) {
        return res.redirect(
          `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/appearance/${appearanceReference}/select-court-name`,
        )
      }
    }
    return res.redirect(
      `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/appearance/${appearanceReference}/court-name`,
    )
  }

  public getSelectCourtName: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, appearanceReference, addOrEditCourtCase } = req.params
    const { submitToCheckAnswers } = req.query
    const latestCourtAppearance = await this.remandAndSentencingService.getLatestCourtAppearanceByCourtCaseUuid(
      req.user.token,
      courtCaseReference,
    )
    return res.render('pages/courtAppearance/select-court-name', {
      nomsId,
      submitToCheckAnswers,
      lastCourtName: latestCourtAppearance.nextCourtAppearance?.courtCode,
      courtCaseReference,
      appearanceReference,
      addOrEditCourtCase,
      errors: req.flash('errors') || [],
      backLink: submitToCheckAnswers
        ? `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/appearance/${appearanceReference}/check-answers`
        : `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/appearance/${appearanceReference}/warrant-date`,
    })
  }

  public submitSelectCourtName: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, appearanceReference, addOrEditCourtCase } = req.params
    const selectCourtNameForm = trimForm<CourtCaseSelectCourtNameForm>(req.body)
    const errors = validate(
      selectCourtNameForm,
      { courtNameSelect: 'required' },
      { 'required.courtNameSelect': "Select 'Yes' if the appearance was at this court." },
    )
    if (errors.length > 0) {
      req.flash('errors', errors)
      return res.redirect(
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/appearance/${appearanceReference}/select-court-name`,
      )
    }
    if (selectCourtNameForm.courtNameSelect === 'true') {
      const latestCourtAppearance = await this.remandAndSentencingService.getLatestCourtAppearanceByCourtCaseUuid(
        req.user.token,
        courtCaseReference,
      )
      this.courtAppearanceService.setCourtName(
        req.session,
        nomsId,
        latestCourtAppearance.nextCourtAppearance?.courtCode,
      )
      const warrantType = this.courtAppearanceService.getWarrantType(req.session, nomsId)
      if (warrantType === 'SENTENCING') {
        return res.redirect(
          `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/appearance/${appearanceReference}/tagged-bail`,
        )
      }
      return res.redirect(
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/appearance/${appearanceReference}/overall-case-outcome`,
      )
    }
    const { submitToCheckAnswers } = req.query
    const submitToCheckAnswersQuery = submitToCheckAnswers ? `?submitToCheckAnswers=${submitToCheckAnswers}` : ''
    return res.redirect(
      `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/appearance/${appearanceReference}/court-name${submitToCheckAnswersQuery}`,
    )
  }

  public getCourtName: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, appearanceReference, addOrEditCourtCase } = req.params
    const { submitToCheckAnswers } = req.query
    let courtName: string
    let backLink = `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/appearance/${appearanceReference}/warrant-date`
    if (submitToCheckAnswers) {
      courtName = this.courtAppearanceService.getCourtName(req.session, nomsId)
      backLink = `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/appearance/${appearanceReference}/check-answers`
    } else if (addOrEditCourtCase === 'edit-court-case') {
      const latestCourtAppearance = await this.remandAndSentencingService.getLatestCourtAppearanceByCourtCaseUuid(
        req.user.token,
        courtCaseReference,
      )
      if (latestCourtAppearance.nextCourtAppearance?.courtCode) {
        backLink = `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/appearance/${appearanceReference}/select-court-name`
      }
    }

    return res.render('pages/courtAppearance/court-name', {
      nomsId,
      submitToCheckAnswers,
      courtName,
      courtCaseReference,
      appearanceReference,
      errors: req.flash('errors') || [],
      addOrEditCourtCase,
      backLink,
    })
  }

  public submitCourtName: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, appearanceReference, addOrEditCourtCase } = req.params
    const courtNameForm = trimForm<CourtCaseCourtNameForm>(req.body)

    const errors = validate(
      courtNameForm,
      { courtName: 'required' },
      { 'required.courtName': 'You must enter the court name' },
    )
    if (errors.length > 0) {
      req.flash('errors', errors)
      return res.redirect(
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/appearance/${appearanceReference}/court-name`,
      )
    }

    this.courtAppearanceService.setCourtName(req.session, nomsId, courtNameForm.courtName)
    const { submitToCheckAnswers } = req.query
    if (submitToCheckAnswers) {
      return res.redirect(
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/appearance/${appearanceReference}/check-answers`,
      )
    }
    const warrantType = this.courtAppearanceService.getWarrantType(req.session, nomsId)
    if (warrantType === 'SENTENCING') {
      return res.redirect(
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/appearance/${appearanceReference}/tagged-bail`,
      )
    }
    return res.redirect(
      `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/appearance/${appearanceReference}/overall-case-outcome`,
    )
  }

  public getWarrantType: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, appearanceReference, addOrEditCourtCase } = req.params
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
      backLink: submitToCheckAnswers
        ? `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/appearance/${appearanceReference}/check-answers`
        : `/person/${nomsId}`,
    })
  }

  public submitWarrantType: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, appearanceReference, addOrEditCourtCase } = req.params
    const warrantTypeForm = trimForm<CourtCaseWarrantTypeForm>(req.body)
    const errors = validate(
      warrantTypeForm,
      { warrantType: 'required' },
      { 'required.warrantType': 'You must select the type of warrant' },
    )
    if (errors.length > 0) {
      req.flash('errors', errors)
      return res.redirect(
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/appearance/${appearanceReference}/warrant-type`,
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
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/appearance/${appearanceReference}/check-answers`,
      )
    }
    return res.redirect(
      `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/appearance/${appearanceReference}/task-list`,
    )
  }

  public getTaskList: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, appearanceReference, addOrEditCourtCase } = req.params
    const warrantType = this.courtAppearanceService.getWarrantType(req.session, nomsId)
    const courtAppearance = this.courtAppearanceService.getSessionCourtAppearance(req.session, nomsId)

    return res.render('pages/courtAppearance/task-list', {
      nomsId,
      warrantType,
      courtCaseReference,
      appearanceReference,
      offenceReference: courtAppearance.offences.length,
      addOrEditCourtCase,
    })
  }

  public getWarrantUpload: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, appearanceReference, addOrEditCourtCase } = req.params
    const { submitToCheckAnswers } = req.query

    return res.render('pages/courtAppearance/warrant-upload', {
      nomsId,
      submitToCheckAnswers,
      courtCaseReference,
      appearanceReference,
      addOrEditCourtCase,
    })
  }

  public submitWarrantUpload: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, appearanceReference, addOrEditCourtCase } = req.params
    const { submitToCheckAnswers } = req.query
    const { username, activeCaseLoadId } = res.locals.user

    if (req.file) {
      const warrantId = await this.documentManagementService.uploadWarrant(nomsId, req.file, username, activeCaseLoadId)
      this.courtAppearanceService.setWarrantId(req.session, nomsId, warrantId)
    }

    if (submitToCheckAnswers) {
      return res.redirect(
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/appearance/${appearanceReference}/check-answers`,
      )
    }
    return res.redirect(
      `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/appearance/${appearanceReference}/overall-case-outcome`,
    )
  }

  public getOverallCaseOutcome: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, appearanceReference, addOrEditCourtCase } = req.params
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
      errors: req.flash('errors') || [],
      topCaseOutcomes,
    })
  }

  public submitOverallCaseOutcome: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, appearanceReference, addOrEditCourtCase } = req.params
    const overallCaseOutcomeForm = trimForm<CourtCaseOverallCaseOutcomeForm>(req.body)
    const errors = validate(
      overallCaseOutcomeForm,
      { overallCaseOutcome: 'required' },
      { 'required.overallCaseOutcome': 'You must select the overall case outcome' },
    )
    if (errors.length > 0) {
      req.flash('errors', errors)
      return res.redirect(
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/appearance/${appearanceReference}/overall-case-outcome`,
      )
    }
    if (overallCaseOutcomeForm.overallCaseOutcome === 'LOOKUPDIFFERENT') {
      return res.redirect(
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/appearance/${appearanceReference}/lookup-case-outcome`,
      )
    }
    this.courtAppearanceService.setOverallCaseOutcome(req.session, nomsId, overallCaseOutcomeForm.overallCaseOutcome)
    const { submitToCheckAnswers } = req.query
    if (submitToCheckAnswers) {
      return res.redirect(
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/appearance/${appearanceReference}/check-answers`,
      )
    }
    return res.redirect(
      `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/appearance/${appearanceReference}/case-outcome-applied-all`,
    )
  }

  public getLookupCaseOutcome: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, appearanceReference, addOrEditCourtCase } = req.params

    const warrantType: string = this.courtAppearanceService.getWarrantType(req.session, nomsId)
    return res.render('pages/courtAppearance/lookup-case-outcome', {
      nomsId,
      courtCaseReference,
      appearanceReference,
      addOrEditCourtCase,
      warrantType,
      errors: req.flash('errors') || [],
    })
  }

  public submitLookupCaseOutcome: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, appearanceReference, addOrEditCourtCase } = req.params
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
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/appearance/${appearanceReference}/lookup-case-outcome`,
      )
    }
    this.courtAppearanceService.setOverallCaseOutcome(req.session, nomsId, lookupCaseOutcomeForm.caseOutcome)
    return res.redirect(
      `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/appearance/${appearanceReference}/case-outcome-applied-all`,
    )
  }

  public getCaseOutcomeAppliedAll: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, appearanceReference, addOrEditCourtCase } = req.params
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
    })
  }

  public submitCaseOutcomeAppliedAll: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, appearanceReference, addOrEditCourtCase } = req.params
    const caseOutcomeAppliedAllForm = trimForm<CourtCaseCaseOutcomeAppliedAllForm>(req.body)

    this.courtAppearanceService.setCaseOutcomeAppliedAll(
      req.session,
      nomsId,
      caseOutcomeAppliedAllForm.caseOutcomeAppliedAll === 'true',
    )
    const { submitToCheckAnswers } = req.query
    if (submitToCheckAnswers) {
      return res.redirect(
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/appearance/${appearanceReference}/check-answers`,
      )
    }
    return res.redirect(
      `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/appearance/${appearanceReference}/tagged-bail`,
    )
  }

  public getTaggedBail: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, appearanceReference, addOrEditCourtCase } = req.params
    const { submitToCheckAnswers } = req.query
    let taggedBail: string
    if (submitToCheckAnswers) {
      taggedBail = this.courtAppearanceService.getTaggedBail(req.session, nomsId)
    }

    return res.render('pages/courtAppearance/tagged-bail', {
      nomsId,
      submitToCheckAnswers,
      taggedBail,
      courtCaseReference,
      appearanceReference,
      errors: req.flash('errors') || [],
      taggedBailForm: req.flash('taggedBailForm')[0] || {},
      addOrEditCourtCase,
    })
  }

  public submitTaggedBail: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, appearanceReference, addOrEditCourtCase } = req.params
    const taggedBailForm = trimForm<CourtCaseTaggedBailForm>(req.body)
    const errors = validate(
      taggedBailForm,
      { taggedBail: 'required_if:hasTaggedBail,true|minWholeNumber:1', hasTaggedBail: 'required' },
      {
        'required_if.taggedBail': 'Enter the number of days for the tagged bail',
        'minWholeNumber.taggedBail': 'Enter a whole number for the number of days on tagged bail',
        'required.hasTaggedBail': 'Enter the number of days for the tagged bail',
      },
    )
    if (errors.length > 0) {
      req.flash('errors', errors)
      req.flash('taggedBailForm', { ...taggedBailForm })
      return res.redirect(
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/appearance/${appearanceReference}/tagged-bail`,
      )
    }
    this.courtAppearanceService.setTaggedBail(req.session, nomsId, taggedBailForm.taggedBail)

    return res.redirect(
      `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/appearance/${appearanceReference}/check-answers`,
    )
  }

  public getCheckAnswers: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, appearanceReference, addOrEditCourtCase } = req.params
    const courtAppearance = this.courtAppearanceService.getSessionCourtAppearance(req.session, nomsId)

    return res.render('pages/courtAppearance/check-answers', {
      nomsId,
      courtAppearance,
      courtCaseReference,
      appearanceReference,
      addOrEditCourtCase,
      backLink:
        courtAppearance.warrantType === 'SENTENCING'
          ? `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/appearance/${appearanceReference}/overall-sentence-length`
          : `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/appearance/${appearanceReference}/tagged-bail`,
    })
  }

  public submitCheckAnswers: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, appearanceReference, addOrEditCourtCase } = req.params
    return res.redirect(
      `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/appearance/${appearanceReference}/task-list`,
    )
  }

  public getNextHearingSelect: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, appearanceReference, addOrEditCourtCase } = req.params
    const nextHearingSelect = this.courtAppearanceService.getNextHearingSelect(req.session, nomsId)

    return res.render('pages/courtAppearance/next-hearing-select', {
      nomsId,
      nextHearingSelect,
      courtCaseReference,
      appearanceReference,
      addOrEditCourtCase,
    })
  }

  public submitNextHearingSelect: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, appearanceReference, addOrEditCourtCase } = req.params
    const nextHearingSelectForm = trimForm<CourtCaseNextHearingSelectForm>(req.body)
    const nextHearingSelect = nextHearingSelectForm.nextHearingSelect === 'true'
    this.courtAppearanceService.setNextHearingSelect(req.session, nomsId, nextHearingSelect)
    if (nextHearingSelect) {
      return res.redirect(
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/appearance/${appearanceReference}/next-hearing-type`,
      )
    }
    const { token } = res.locals.user
    // this would be where we save which we don't currently have and then redirect to all court cases page
    await this.saveAppearance(req.session, nomsId, courtCaseReference, token, addOrEditCourtCase)
    return res.redirect(
      `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/appearance/${appearanceReference}/confirmation`,
    )
  }

  public getNextHearingType: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, appearanceReference, addOrEditCourtCase } = req.params
    const { submitToCheckAnswers } = req.query
    const nextHearingType = this.courtAppearanceService.getNextHearingType(req.session, nomsId)

    return res.render('pages/courtAppearance/next-hearing-type', {
      nomsId,
      nextHearingType,
      courtCaseReference,
      appearanceReference,
      submitToCheckAnswers,
      addOrEditCourtCase,
    })
  }

  public submitNextHearingType: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, appearanceReference, addOrEditCourtCase } = req.params
    const nextHearingTypeForm = trimForm<CourtCaseNextHearingTypeForm>(req.body)
    this.courtAppearanceService.setNextHearingType(req.session, nomsId, nextHearingTypeForm.nextHearingType)
    const { submitToCheckAnswers } = req.query
    if (submitToCheckAnswers) {
      return res.redirect(
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/appearance/${appearanceReference}/check-next-hearing-answers`,
      )
    }
    return res.redirect(
      `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/appearance/${appearanceReference}/next-hearing-date`,
    )
  }

  public getNextHearingDate: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, appearanceReference, addOrEditCourtCase } = req.params
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
      errors: req.flash('errors') || [],
      backLink: `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/appearance/${appearanceReference}/next-hearing-type`,
    })
  }

  public submitNextHearingDate: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, appearanceReference, addOrEditCourtCase } = req.params
    const nextHearingDateForm = trimForm<CourtCaseNextHearingDateForm>(req.body)
    const errors = this.courtAppearanceService.setNextHearingDate(req.session, nomsId, nextHearingDateForm)

    if (errors.length > 0) {
      req.flash('errors', errors)
      req.flash('nextHearingDateForm', { ...nextHearingDateForm })
      return res.redirect(
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/appearance/${appearanceReference}/next-hearing-date`,
      )
    }
    const { submitToCheckAnswers } = req.query
    if (submitToCheckAnswers) {
      return res.redirect(
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/appearance/${appearanceReference}/check-next-hearing-answers`,
      )
    }
    return res.redirect(
      `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/appearance/${appearanceReference}/next-hearing-court-select`,
    )
  }

  public getNextHearingCourtSelect: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, appearanceReference, addOrEditCourtCase } = req.params
    const nextHearingCourtSelect = this.courtAppearanceService.getNextHearingCourtSelect(req.session, nomsId)
    const courtName = this.courtAppearanceService.getCourtName(req.session, nomsId)

    return res.render('pages/courtAppearance/next-hearing-court-select', {
      nomsId,
      nextHearingCourtSelect,
      courtName,
      courtCaseReference,
      appearanceReference,
      addOrEditCourtCase,
    })
  }

  public submitNextHearingCourtSelect: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, appearanceReference, addOrEditCourtCase } = req.params
    const nextHearingCourtSelectForm = trimForm<CourtCaseNextHearingCourtSelectForm>(req.body)
    const nextHearingCourtSelect = nextHearingCourtSelectForm.nextHearingCourtSelect === 'true'
    this.courtAppearanceService.setNextHearingCourtSelect(req.session, nomsId, nextHearingCourtSelect)
    if (nextHearingCourtSelect) {
      return res.redirect(
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/appearance/${appearanceReference}/check-next-hearing-answers`,
      )
    }
    return res.redirect(
      `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/appearance/${appearanceReference}/next-hearing-court-name`,
    )
  }

  public getNextHearingCourtName: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, appearanceReference, addOrEditCourtCase } = req.params
    const nextHearingCourtName = this.courtAppearanceService.getNextHearingCourtName(req.session, nomsId)

    return res.render('pages/courtAppearance/next-hearing-court-name', {
      nomsId,
      nextHearingCourtName,
      courtCaseReference,
      appearanceReference,
      addOrEditCourtCase,
    })
  }

  public submitNextHearingCourtName: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, appearanceReference, addOrEditCourtCase } = req.params
    const nextHearingCourtNameForm = trimForm<CourtCaseNextHearingCourtNameForm>(req.body)
    this.courtAppearanceService.setNextHearingCourtName(
      req.session,
      nomsId,
      nextHearingCourtNameForm.nextHearingCourtName,
    )
    return res.redirect(
      `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/appearance/${appearanceReference}/check-next-hearing-answers`,
    )
  }

  public getCheckNextHearingAnswers: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, appearanceReference, addOrEditCourtCase } = req.params
    const courtAppearance = this.courtAppearanceService.getSessionCourtAppearance(req.session, nomsId)

    return res.render('pages/courtAppearance/check-next-hearing-answers', {
      nomsId,
      courtAppearance,
      courtCaseReference,
      appearanceReference,
      addOrEditCourtCase,
    })
  }

  public submiCheckNextHearingAnswers: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, appearanceReference, addOrEditCourtCase } = req.params
    const { token } = res.locals.user
    // save appearance here
    await this.saveAppearance(req.session, nomsId, courtCaseReference, token, addOrEditCourtCase)
    return res.redirect(
      `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/appearance/${appearanceReference}/confirmation`,
    )
  }

  private async saveAppearance(
    session: CookieSessionInterfaces.CookieSessionObject,
    nomsId: string,
    courtCaseReference: string,
    token: string,
    addOrEditCourtCase: string,
  ): Promise<CourtAppearance> {
    const courtAppearance = this.courtAppearanceService.getSessionCourtAppearance(session, nomsId)
    if (addOrEditCourtCase === 'add-court-case') {
      const courtCase = { appearances: [courtAppearance] } as CourtCase
      await this.remandAndSentencingService.createCourtCase(nomsId, token, courtCase)
    } else {
      await this.remandAndSentencingService.createCourtAppearance(token, courtCaseReference, courtAppearance)
    }
    this.courtAppearanceService.clearSessionCourtAppearance(session, nomsId)
    return courtAppearance
  }
}
