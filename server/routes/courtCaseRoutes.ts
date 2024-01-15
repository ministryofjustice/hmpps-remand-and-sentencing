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
} from 'forms'
import dayjs from 'dayjs'
import type { CourtAppearance } from 'models'
import trimForm from '../utils/trim'
import CourtCaseService from '../services/courtCaseService'
import CourtAppearanceService from '../services/courtAppearanceService'
import RemandAndSentencingService from '../services/remandAndSentencingService'
import { pageCourtCaseContentToCourtCase } from '../utils/mappingUtils'
import CourtCaseDetailsModel from './data/CourtCaseDetailsModel'
import ManageOffencesService from '../services/manageOffencesService'
import { getAsStringOrDefault } from '../utils/utils'
import DocumentManagementService from '../services/documentManagementService'
import CaseOutcomeService from '../services/caseOutcomeService'

export default class CourtCaseRoutes {
  constructor(
    private readonly courtCaseService: CourtCaseService,
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

    // temporary until backend is fully integrated, remove after
    this.courtCaseService.addAllCourtCasesToSession(
      req.session,
      nomsId,
      courtCases.content.map(courtCase => pageCourtCaseContentToCourtCase(courtCase)),
    )
    const newCourtCaseId = this.courtCaseService.getNewSessionCourtCaseId(req.session, nomsId)
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
      caseReferenceNumber = this.courtAppearanceService.getCaseReferenceNumber(req.session, nomsId, courtCaseReference)
    }
    const isFirstAppearance = appearanceReference === '0'
    const courtCaseUniqueIdentifier = this.courtCaseService.getUniqueIdentifier(req.session, nomsId, courtCaseReference)
    return res.render('pages/courtAppearance/reference', {
      nomsId,
      submitToCheckAnswers,
      caseReferenceNumber,
      courtCaseReference,
      appearanceReference,
      isFirstAppearance,
      courtCaseUniqueIdentifier,
      addOrEditCourtCase,
    })
  }

  public submitReference: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, appearanceReference, addOrEditCourtCase } = req.params
    const referenceForm = trimForm<CourtCaseReferenceForm>(req.body)
    this.courtAppearanceService.setCaseReferenceNumber(
      req.session,
      nomsId,
      courtCaseReference,
      referenceForm.referenceNumber,
    )
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
    const lastSavedAppearance = this.courtCaseService.getLastSavedAppearance(req.session, nomsId, courtCaseReference)
    const courtCaseUniqueIdentifier = this.courtCaseService.getUniqueIdentifier(req.session, nomsId, courtCaseReference)
    return res.render('pages/courtAppearance/select-reference', {
      nomsId,
      submitToCheckAnswers,
      lastCaseReferenceNumber: lastSavedAppearance.caseReferenceNumber,
      courtCaseReference,
      appearanceReference,
      courtCaseUniqueIdentifier,
      addOrEditCourtCase,
    })
  }

  public submitSelectReference: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, appearanceReference, addOrEditCourtCase } = req.params
    const referenceForm = trimForm<CourtCaseSelectReferenceForm>(req.body)
    if (referenceForm.referenceNumberSelect === 'true') {
      const lastSavedAppearance = this.courtCaseService.getLastSavedAppearance(req.session, nomsId, courtCaseReference)
      this.courtAppearanceService.setCaseReferenceNumber(
        req.session,
        nomsId,
        courtCaseReference,
        lastSavedAppearance.caseReferenceNumber,
      )
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
    let warrantDateDay: number
    let warrantDateMonth: number
    let warrantDateYear: number
    if (submitToCheckAnswers) {
      const warrantDate = this.courtAppearanceService.getWarrantDate(req.session, nomsId, courtCaseReference)
      if (warrantDate) {
        warrantDateDay = warrantDate.getDate()
        warrantDateMonth = warrantDate.getMonth() + 1
        warrantDateYear = warrantDate.getFullYear()
      }
    }
    const isFirstAppearance = appearanceReference === '0'
    const courtCaseUniqueIdentifier = this.courtCaseService.getUniqueIdentifier(req.session, nomsId, courtCaseReference)
    return res.render('pages/courtAppearance/warrant-date', {
      nomsId,
      submitToCheckAnswers,
      warrantDateDay,
      warrantDateMonth,
      warrantDateYear,
      courtCaseReference,
      appearanceReference,
      isFirstAppearance,
      courtCaseUniqueIdentifier,
      addOrEditCourtCase,
    })
  }

  public submitWarrantDate: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, appearanceReference, addOrEditCourtCase } = req.params
    const warrantDateForm = trimForm<CourtCaseWarrantDateForm>(req.body)
    const warrantDate = dayjs({
      year: warrantDateForm['warrantDate-year'],
      month: warrantDateForm['warrantDate-month'] - 1,
      day: warrantDateForm['warrantDate-day'],
    })
    this.courtAppearanceService.setWarrantDate(req.session, nomsId, courtCaseReference, warrantDate.toDate())
    const { submitToCheckAnswers } = req.query
    if (submitToCheckAnswers) {
      return res.redirect(
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/appearance/${appearanceReference}/check-answers`,
      )
    }
    const lastSavedAppearance = this.courtCaseService.getLastSavedAppearance(req.session, nomsId, courtCaseReference)
    if (lastSavedAppearance.nextHearingCourtName) {
      return res.redirect(
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/appearance/${appearanceReference}/select-court-name`,
      )
    }
    return res.redirect(
      `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/appearance/${appearanceReference}/court-name`,
    )
  }

  public getSelectCourtName: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, appearanceReference, addOrEditCourtCase } = req.params
    const { submitToCheckAnswers } = req.query
    const lastSavedAppearance = this.courtCaseService.getLastSavedAppearance(req.session, nomsId, courtCaseReference)
    const courtCaseUniqueIdentifier = this.courtCaseService.getUniqueIdentifier(req.session, nomsId, courtCaseReference)
    return res.render('pages/courtAppearance/select-court-name', {
      nomsId,
      submitToCheckAnswers,
      lastCourtName: lastSavedAppearance.nextHearingCourtName,
      courtCaseReference,
      appearanceReference,
      courtCaseUniqueIdentifier,
      addOrEditCourtCase,
    })
  }

  public submitSelectCourtName: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, appearanceReference, addOrEditCourtCase } = req.params
    const referenceForm = trimForm<CourtCaseSelectCourtNameForm>(req.body)
    if (referenceForm.courtNameSelect === 'true') {
      const lastSavedAppearance = this.courtCaseService.getLastSavedAppearance(req.session, nomsId, courtCaseReference)
      this.courtAppearanceService.setCourtName(
        req.session,
        nomsId,
        courtCaseReference,
        lastSavedAppearance.nextHearingCourtName,
      )
      return res.redirect(
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/appearance/${appearanceReference}/warrant-type`,
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
    if (submitToCheckAnswers) {
      courtName = this.courtAppearanceService.getCourtName(req.session, nomsId, courtCaseReference)
    }
    const isFirstAppearance = appearanceReference === '0'
    const courtCaseUniqueIdentifier = this.courtCaseService.getUniqueIdentifier(req.session, nomsId, courtCaseReference)
    return res.render('pages/courtAppearance/court-name', {
      nomsId,
      submitToCheckAnswers,
      courtName,
      courtCaseReference,
      appearanceReference,
      isFirstAppearance,
      courtCaseUniqueIdentifier,
      addOrEditCourtCase,
    })
  }

  public submitCourtName: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, appearanceReference, addOrEditCourtCase } = req.params
    const courtNameForm = trimForm<CourtCaseCourtNameForm>(req.body)

    this.courtAppearanceService.setCourtName(req.session, nomsId, courtCaseReference, courtNameForm.courtName)
    const { submitToCheckAnswers } = req.query
    if (submitToCheckAnswers) {
      return res.redirect(
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/appearance/${appearanceReference}/check-answers`,
      )
    }
    return res.redirect(
      `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/appearance/${appearanceReference}/warrant-type`,
    )
  }

  public getWarrantType: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, appearanceReference, addOrEditCourtCase } = req.params
    const { submitToCheckAnswers } = req.query
    let warrantType: string
    if (submitToCheckAnswers) {
      warrantType = this.courtAppearanceService.getWarrantType(req.session, nomsId, courtCaseReference)
    }
    const isFirstAppearance = appearanceReference === '0'
    const courtCaseUniqueIdentifier = this.courtCaseService.getUniqueIdentifier(req.session, nomsId, courtCaseReference)
    return res.render('pages/courtAppearance/warrant-type', {
      nomsId,
      submitToCheckAnswers,
      warrantType,
      courtCaseReference,
      appearanceReference,
      isFirstAppearance,
      courtCaseUniqueIdentifier,
      addOrEditCourtCase,
    })
  }

  public submitWarrantType: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, appearanceReference, addOrEditCourtCase } = req.params
    const warrantTypeForm = trimForm<CourtCaseWarrantTypeForm>(req.body)

    this.courtAppearanceService.setWarrantType(req.session, nomsId, courtCaseReference, warrantTypeForm.warrantType)
    const { submitToCheckAnswers } = req.query
    if (submitToCheckAnswers) {
      return res.redirect(
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/appearance/${appearanceReference}/check-answers`,
      )
    }
    return res.redirect(
      `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/appearance/${appearanceReference}/warrant-upload`,
    )
  }

  public getWarrantUpload: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, appearanceReference, addOrEditCourtCase } = req.params
    const { submitToCheckAnswers } = req.query
    const isFirstAppearance = appearanceReference === '0'
    const courtCaseUniqueIdentifier = this.courtCaseService.getUniqueIdentifier(req.session, nomsId, courtCaseReference)
    return res.render('pages/courtAppearance/warrant-upload', {
      nomsId,
      submitToCheckAnswers,
      courtCaseReference,
      appearanceReference,
      isFirstAppearance,
      courtCaseUniqueIdentifier,
      addOrEditCourtCase,
    })
  }

  public submitWarrantUpload: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, appearanceReference, addOrEditCourtCase } = req.params
    const { submitToCheckAnswers } = req.query
    const { username, activeCaseLoadId } = res.locals.user

    if (req.file) {
      const warrantId = await this.documentManagementService.uploadWarrant(nomsId, req.file, username, activeCaseLoadId)
      this.courtAppearanceService.setWarrantId(req.session, nomsId, courtCaseReference, warrantId)
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
    const overallCaseOutcome: string = this.courtAppearanceService.getOverallCaseOutcome(
      req.session,
      nomsId,
      courtCaseReference,
    )
    const warrantType: string = this.courtAppearanceService.getWarrantType(req.session, nomsId, courtCaseReference)
    const topCaseOutcomes = this.caseOutcomeService.getTopCaseOutcomes(warrantType)
    const isFirstAppearance = appearanceReference === '0'
    const courtCaseUniqueIdentifier = this.courtCaseService.getUniqueIdentifier(req.session, nomsId, courtCaseReference)
    return res.render('pages/courtAppearance/overall-case-outcome', {
      nomsId,
      submitToCheckAnswers,
      overallCaseOutcome,
      courtCaseReference,
      appearanceReference,
      isFirstAppearance,
      courtCaseUniqueIdentifier,
      addOrEditCourtCase,
      topCaseOutcomes,
    })
  }

  public submitOverallCaseOutcome: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, appearanceReference, addOrEditCourtCase } = req.params
    const overallCaseOutcomeForm = trimForm<CourtCaseOverallCaseOutcomeForm>(req.body)
    if (overallCaseOutcomeForm.overallCaseOutcome === 'LOOKUPDIFFERENT') {
      return res.redirect(
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/appearance/${appearanceReference}/lookup-case-outcome`,
      )
    }
    this.courtAppearanceService.setOverallCaseOutcome(
      req.session,
      nomsId,
      courtCaseReference,
      overallCaseOutcomeForm.overallCaseOutcome,
    )
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
    const isFirstAppearance = appearanceReference === '0'
    const courtCaseUniqueIdentifier = this.courtCaseService.getUniqueIdentifier(req.session, nomsId, courtCaseReference)
    return res.render('pages/courtAppearance/lookup-case-outcome', {
      nomsId,
      courtCaseReference,
      appearanceReference,
      isFirstAppearance,
      courtCaseUniqueIdentifier,
      addOrEditCourtCase,
    })
  }

  public submitLookupCaseOutcome: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, appearanceReference, addOrEditCourtCase } = req.params
    const lookupCaseOutcomeForm = trimForm<CourtCaseLookupCaseOutcomeForm>(req.body)
    this.courtAppearanceService.setOverallCaseOutcome(
      req.session,
      nomsId,
      courtCaseReference,
      lookupCaseOutcomeForm.caseOutcome,
    )
    return res.redirect(
      `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/appearance/${appearanceReference}/case-outcome-applied-all`,
    )
  }

  public getCaseOutcomeAppliedAll: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, appearanceReference, addOrEditCourtCase } = req.params
    const { submitToCheckAnswers } = req.query
    const overallCaseOutcome: string = this.courtAppearanceService.getOverallCaseOutcome(
      req.session,
      nomsId,
      courtCaseReference,
    )
    const caseOutcomeAppliedAll: boolean = this.courtAppearanceService.getCaseOutcomeAppliedAll(
      req.session,
      nomsId,
      courtCaseReference,
    )
    const isFirstAppearance = appearanceReference === '0'
    const courtCaseUniqueIdentifier = this.courtCaseService.getUniqueIdentifier(req.session, nomsId, courtCaseReference)
    return res.render('pages/courtAppearance/case-outcome-applied-all', {
      nomsId,
      submitToCheckAnswers,
      overallCaseOutcome,
      caseOutcomeAppliedAll,
      courtCaseReference,
      appearanceReference,
      isFirstAppearance,
      courtCaseUniqueIdentifier,
      addOrEditCourtCase,
    })
  }

  public submitCaseOutcomeAppliedAll: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, appearanceReference, addOrEditCourtCase } = req.params
    const caseOutcomeAppliedAllForm = trimForm<CourtCaseCaseOutcomeAppliedAllForm>(req.body)

    this.courtAppearanceService.setCaseOutcomeAppliedAll(
      req.session,
      nomsId,
      courtCaseReference,
      caseOutcomeAppliedAllForm.caseOutcomeAppliedAll === 'true',
    )
    const courtAppearance = this.courtAppearanceService.getSessionCourtAppearance(
      req.session,
      nomsId,
      courtCaseReference,
    )

    if (courtAppearance.offences.length) {
      return res.redirect(
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/appearance/${appearanceReference}/review-offences`,
      )
    }

    return res.redirect(
      `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/appearance/${appearanceReference}/check-answers`,
    )
  }

  public getCheckAnswers: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, appearanceReference, addOrEditCourtCase } = req.params
    const courtCase = this.courtCaseService.getSessionCourtCase(req.session, nomsId, courtCaseReference)
    const courtAppearance = this.courtAppearanceService.getSessionCourtAppearance(
      req.session,
      nomsId,
      courtCaseReference,
    )
    const isFirstAppearance = appearanceReference === '0'
    const courtCaseUniqueIdentifier = this.courtCaseService.getUniqueIdentifier(req.session, nomsId, courtCaseReference)
    return res.render('pages/courtAppearance/check-answers', {
      nomsId,
      courtCase,
      courtAppearance,
      courtCaseReference,
      appearanceReference,
      isFirstAppearance,
      courtCaseUniqueIdentifier,
      addOrEditCourtCase,
    })
  }

  public submitCheckAnswers: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, appearanceReference, addOrEditCourtCase } = req.params
    const courtAppearance = this.courtAppearanceService.getSessionCourtAppearance(
      req.session,
      nomsId,
      courtCaseReference,
    )

    return res.redirect(
      `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/appearance/${appearanceReference}/offences/${courtAppearance.offences.length}/offence-code`,
    )
  }

  public getNextHearingSelect: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, appearanceReference, addOrEditCourtCase } = req.params
    const nextHearingSelect = this.courtAppearanceService.getNextHearingSelect(req.session, nomsId, courtCaseReference)
    const isFirstAppearance = appearanceReference === '0'
    const courtCaseUniqueIdentifier = this.courtCaseService.getUniqueIdentifier(req.session, nomsId, courtCaseReference)
    return res.render('pages/courtAppearance/next-hearing-select', {
      nomsId,
      nextHearingSelect,
      courtCaseReference,
      appearanceReference,
      isFirstAppearance,
      courtCaseUniqueIdentifier,
      addOrEditCourtCase,
    })
  }

  public submitNextHearingSelect: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, appearanceReference, addOrEditCourtCase } = req.params
    const nextHearingSelectForm = trimForm<CourtCaseNextHearingSelectForm>(req.body)
    const nextHearingSelect = nextHearingSelectForm.nextHearingSelect === 'true'
    this.courtAppearanceService.setNextHearingSelect(req.session, nomsId, courtCaseReference, nextHearingSelect)
    if (nextHearingSelect) {
      return res.redirect(
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/appearance/${appearanceReference}/next-hearing-type`,
      )
    }
    const { token } = res.locals.user
    // this would be where we save which we don't currently have and then redirect to all court cases page
    await this.saveAppearance(req.session, nomsId, courtCaseReference, appearanceReference, token, addOrEditCourtCase)
    return res.redirect(
      `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/appearance/${appearanceReference}/confirmation`,
    )
  }

  public getNextHearingType: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, appearanceReference, addOrEditCourtCase } = req.params
    const { submitToCheckAnswers } = req.query
    const nextHearingType = this.courtAppearanceService.getNextHearingType(req.session, nomsId, courtCaseReference)
    const isFirstAppearance = appearanceReference === '0'
    const courtCaseUniqueIdentifier = this.courtCaseService.getUniqueIdentifier(req.session, nomsId, courtCaseReference)
    return res.render('pages/courtAppearance/next-hearing-type', {
      nomsId,
      nextHearingType,
      courtCaseReference,
      appearanceReference,
      submitToCheckAnswers,
      isFirstAppearance,
      courtCaseUniqueIdentifier,
      addOrEditCourtCase,
    })
  }

  public submitNextHearingType: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, appearanceReference, addOrEditCourtCase } = req.params
    const nextHearingTypeForm = trimForm<CourtCaseNextHearingTypeForm>(req.body)
    this.courtAppearanceService.setNextHearingType(
      req.session,
      nomsId,
      courtCaseReference,
      nextHearingTypeForm.nextHearingType,
    )
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
    const nextHearingDate = this.courtAppearanceService.getNextHearingDate(req.session, nomsId, courtCaseReference)
    const isFirstAppearance = appearanceReference === '0'
    const courtCaseUniqueIdentifier = this.courtCaseService.getUniqueIdentifier(req.session, nomsId, courtCaseReference)
    return res.render('pages/courtAppearance/next-hearing-date', {
      nomsId,
      nextHearingDate,
      courtCaseReference,
      appearanceReference,
      submitToCheckAnswers,
      isFirstAppearance,
      courtCaseUniqueIdentifier,
      addOrEditCourtCase,
    })
  }

  public submitNextHearingDate: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, appearanceReference, addOrEditCourtCase } = req.params
    const nextHearingDateForm = trimForm<CourtCaseNextHearingDateForm>(req.body)
    let nextHearingDate = dayjs({
      year: nextHearingDateForm['nextHearingDate-year'],
      month: parseInt(nextHearingDateForm['nextHearingDate-month'], 10) - 1,
      day: nextHearingDateForm['nextHearingDate-day'],
    })
    if (nextHearingDateForm.nextHearingTime) {
      const [nextHearingHour, nextHearingMinute] = nextHearingDateForm.nextHearingTime.split(':')
      nextHearingDate = nextHearingDate.set('hour', parseInt(nextHearingHour, 10))
      nextHearingDate = nextHearingDate.set('minute', parseInt(nextHearingMinute, 10))
    }
    this.courtAppearanceService.setNextHearingDate(
      req.session,
      nomsId,
      courtCaseReference,
      nextHearingDate.toDate(),
      Boolean(nextHearingDateForm.nextHearingTime),
    )
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
    const nextHearingCourtSelect = this.courtAppearanceService.getNextHearingCourtSelect(
      req.session,
      nomsId,
      courtCaseReference,
    )
    const courtName = this.courtAppearanceService.getCourtName(req.session, nomsId, courtCaseReference)
    const isFirstAppearance = appearanceReference === '0'
    const courtCaseUniqueIdentifier = this.courtCaseService.getUniqueIdentifier(req.session, nomsId, courtCaseReference)
    return res.render('pages/courtAppearance/next-hearing-court-select', {
      nomsId,
      nextHearingCourtSelect,
      courtName,
      courtCaseReference,
      appearanceReference,
      isFirstAppearance,
      courtCaseUniqueIdentifier,
      addOrEditCourtCase,
    })
  }

  public submitNextHearingCourtSelect: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, appearanceReference, addOrEditCourtCase } = req.params
    const nextHearingCourtSelectForm = trimForm<CourtCaseNextHearingCourtSelectForm>(req.body)
    const nextHearingCourtSelect = nextHearingCourtSelectForm.nextHearingCourtSelect === 'true'
    this.courtAppearanceService.setNextHearingCourtSelect(
      req.session,
      nomsId,
      courtCaseReference,
      nextHearingCourtSelect,
    )
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
    const nextHearingCourtName = this.courtAppearanceService.getNextHearingCourtName(
      req.session,
      nomsId,
      courtCaseReference,
    )
    const isFirstAppearance = appearanceReference === '0'
    const courtCaseUniqueIdentifier = this.courtCaseService.getUniqueIdentifier(req.session, nomsId, courtCaseReference)
    return res.render('pages/courtAppearance/next-hearing-court-name', {
      nomsId,
      nextHearingCourtName,
      courtCaseReference,
      appearanceReference,
      isFirstAppearance,
      courtCaseUniqueIdentifier,
      addOrEditCourtCase,
    })
  }

  public submitNextHearingCourtName: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, appearanceReference, addOrEditCourtCase } = req.params
    const nextHearingCourtNameForm = trimForm<CourtCaseNextHearingCourtNameForm>(req.body)
    this.courtAppearanceService.setNextHearingCourtName(
      req.session,
      nomsId,
      courtCaseReference,
      nextHearingCourtNameForm.nextHearingCourtName,
    )
    return res.redirect(
      `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/appearance/${appearanceReference}/check-next-hearing-answers`,
    )
  }

  public getCheckNextHearingAnswers: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, appearanceReference, addOrEditCourtCase } = req.params
    const courtAppearance = this.courtAppearanceService.getSessionCourtAppearance(
      req.session,
      nomsId,
      courtCaseReference,
    )
    const isFirstAppearance = appearanceReference === '0'
    const courtCaseUniqueIdentifier = this.courtCaseService.getUniqueIdentifier(req.session, nomsId, courtCaseReference)
    return res.render('pages/courtAppearance/check-next-hearing-answers', {
      nomsId,
      courtAppearance,
      courtCaseReference,
      appearanceReference,
      isFirstAppearance,
      courtCaseUniqueIdentifier,
      addOrEditCourtCase,
    })
  }

  public submiCheckNextHearingAnswers: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, appearanceReference, addOrEditCourtCase } = req.params
    const { token } = res.locals.user
    // save appearance here
    await this.saveAppearance(req.session, nomsId, courtCaseReference, appearanceReference, token, addOrEditCourtCase)
    return res.redirect(
      `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/appearance/${appearanceReference}/confirmation`,
    )
  }

  private async saveAppearance(
    session: CookieSessionInterfaces.CookieSessionObject,
    nomsId: string,
    courtCaseReference: string,
    appearanceReference: string,
    token: string,
    addOrEditCourtCase: string,
  ): Promise<CourtAppearance> {
    const courtAppearance = this.courtAppearanceService.getSessionCourtAppearance(session, nomsId, courtCaseReference)
    // remove this when integrated with backend
    this.courtCaseService.saveSessionCourtCase(
      session,
      nomsId,
      courtCaseReference,
      parseInt(appearanceReference, 10),
      courtAppearance,
    )
    if (addOrEditCourtCase === 'add-court-case') {
      const courtCase = this.courtCaseService.getSessionCourtCase(session, nomsId, courtCaseReference)
      await this.remandAndSentencingService.createCourtCase(nomsId, token, courtCase)
    } else {
      await this.remandAndSentencingService.createCourtAppearance(token, courtCaseReference, courtAppearance)
    }
    this.courtAppearanceService.clearSessionCourtAppearance(session, nomsId)
    return courtAppearance
  }
}
