import { RequestHandler } from 'express'
import type {
  CourtCaseCourtNameForm,
  CourtCaseReferenceForm,
  CourtCaseWarrantDateForm,
  CourtCaseOverallCaseOutcomeForm,
  CourtCaseCaseOutcomeAppliedAllForm,
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
  CourtCaseOverallConvictionDateForm,
  CourtCaseOverallConvictionDateAppliedAllForm,
} from 'forms'
import type { CourtAppearance, CourtCase } from 'models'
import trimForm from '../utils/trim'
import CourtAppearanceService from '../services/courtAppearanceService'
import RemandAndSentencingService from '../services/remandAndSentencingService'
import CourtCasesDetailsModel from './data/CourtCasesDetailsModel'
import CourtCaseDetailsModel from './data/CourtCaseDetailsModel'
import ManageOffencesService from '../services/manageOffencesService'
import { getAsStringOrDefault, outcomeValueOrLegacy } from '../utils/utils'
import DocumentManagementService from '../services/documentManagementService'
import validate from '../validation/validation'
import {
  draftCourtAppearanceToCourtAppearance,
  pageCourtCaseAppearanceToCourtAppearance,
  sentenceLengthToAlternativeSentenceLengthForm,
  sentenceLengthToSentenceLengthForm,
} from '../utils/mappingUtils'
import TaskListModel from './data/TaskListModel'
import { PrisonUser } from '../interfaces/hmppsUser'
import CourtRegisterService from '../services/courtRegisterService'
import logger from '../../logger'
import AppearanceOutcomeService from '../services/appearanceOutcomeService'
import OffenceOutcomeService from '../services/offenceOutcomeService'
import type { AppearanceOutcome } from '../@types/remandAndSentencingApi/remandAndSentencingClientTypes'
import CourtCasesReleaseDatesService from '../services/courtCasesReleaseDatesService'
import mojPaginationFromPageCourtCase from './data/pagination'
import config from '../config'

export default class CourtCaseRoutes {
  constructor(
    private readonly courtAppearanceService: CourtAppearanceService,
    private readonly remandAndSentencingService: RemandAndSentencingService,
    private readonly manageOffencesService: ManageOffencesService,
    private readonly documentManagementService: DocumentManagementService,
    private readonly courtRegisterService: CourtRegisterService,
    private readonly appearanceOutcomeService: AppearanceOutcomeService,
    private readonly offenceOutcomeService: OffenceOutcomeService,
    private readonly courtCasesReleaseDatesService: CourtCasesReleaseDatesService,
  ) {}

  public start: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId } = req.params
    const { token } = res.locals.user
    const sortBy = getAsStringOrDefault(req.query.sortBy, 'desc')
    const pageNumber = parseInt(getAsStringOrDefault(req.query.pageNumber, '1'), 10) - 1

    const [courtCases, serviceDefinitions] = await Promise.all([
      this.remandAndSentencingService.searchCourtCases(nomsId, token, sortBy, pageNumber),
      this.courtCasesReleaseDatesService.getServiceDefinitions(nomsId, token),
    ])

    const chargeCodes = courtCases.content
      .map(courtCase => courtCase.appearances.map(appearance => appearance.charges.map(charge => charge.offenceCode)))
      .flat()
      .flat()
    const courtIds = courtCases.content
      .map(courtCase =>
        courtCase.appearances.map(appearance =>
          [
            appearance.courtCode,
            appearance.nextCourtAppearance?.courtCode,
            courtCase.latestAppearance?.courtCode,
            courtCase.latestAppearance?.nextCourtAppearance?.courtCode,
          ].filter(courtCode => courtCode !== undefined && courtCode !== null),
        ),
      )
      .flat()
      .flat()
    const [offenceMap, courtMap] = await Promise.all([
      this.manageOffencesService.getOffenceMap(Array.from(new Set(chargeCodes)), req.user.token),
      this.courtRegisterService.getCourtMap(Array.from(new Set(courtIds)), req.user.username),
    ])
    const courtCaseDetailModels = courtCases.content.map(
      pageCourtCaseContent => new CourtCasesDetailsModel(pageCourtCaseContent, courtMap),
    )
    const offenceOutcomeMap = Object.fromEntries(
      courtCases.content
        .filter(courtCase => courtCase.latestAppearance)
        .flatMap(courtCase =>
          courtCase.latestAppearance.charges.filter(charge => charge.outcome).map(charge => charge.outcome),
        )
        .map(outcome => [outcome.outcomeUuid, outcome.outcomeName]),
    )
    const newCourtCaseId = courtCases.totalElements
    const pagination = mojPaginationFromPageCourtCase(courtCases, new URL(`/person/${nomsId}`, config.domain))
    return res.render('pages/start', {
      nomsId,
      newCourtCaseId,
      courtCaseDetailModels,
      offenceMap,
      courtMap,
      sortBy,
      courtCaseTotal: courtCaseDetailModels.length,
      offenceOutcomeMap,
      serviceDefinitions,
      pagination,
    })
  }

  public getCourtCaseDetails: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, addOrEditCourtCase } = req.params
    const { token } = res.locals.user
    const courtCaseDetails = await this.remandAndSentencingService.getCourtCaseDetails(courtCaseReference, token)

    const chargeCodes = courtCaseDetails.appearances
      .map(appearance => appearance.charges.map(charge => charge.offenceCode))
      .flat()

    const courtIds = [courtCaseDetails.latestAppearance?.courtCode]
      .concat(
        courtCaseDetails.appearances.flatMap(appearance => [
          appearance.courtCode,
          appearance.nextCourtAppearance?.courtCode,
        ]),
      )
      .concat(courtCaseDetails.draftAppearances?.map(draft => draft.sessionBlob.courtCode))
      .filter(courtId => courtId !== undefined && courtId !== null)

    const [offenceMap, courtMap] = await Promise.all([
      this.manageOffencesService.getOffenceMap(Array.from(new Set(chargeCodes)), req.user.token),
      this.courtRegisterService.getCourtMap(Array.from(new Set(courtIds)), req.user.username),
    ])
    return res.render('pages/courtCaseDetails', {
      nomsId,
      courtCaseReference,
      addOrEditCourtCase,
      courtCaseDetails: new CourtCaseDetailsModel(courtCaseDetails),
      offenceMap,
      courtMap,
      backLink: `/person/${nomsId}`,
    })
  }

  public getAppearanceDetails: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, appearanceReference, addOrEditCourtCase, addOrEditCourtAppearance } = req.params
    const { token } = res.locals.user
    if (!this.courtAppearanceService.sessionCourtAppearanceExists(req.session, nomsId, appearanceReference)) {
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
    const courtIds = [appearance.courtCode, appearance.nextHearingCourtCode].filter(
      courtId => courtId !== undefined && courtId !== null,
    )
    const sentenceTypeIds = appearance.offences
      .filter(offence => offence.sentence?.sentenceTypeId)
      .map(offence => offence.sentence?.sentenceTypeId)
    const offenceOutcomeIds = appearance.offences.map(offence => offence.outcomeUuid)
    const outcomePromise = appearance.appearanceOutcomeUuid
      ? this.appearanceOutcomeService
          .getOutcomeByUuid(appearance.appearanceOutcomeUuid, req.user.username)
          .then(outcome => outcome.outcomeName)
      : Promise.resolve(appearance.legacyData?.outcomeDescription ?? 'Not entered')
    const appearanceTypePromise = appearance.nextHearingTypeUuid
      ? this.remandAndSentencingService
          .getAppearanceTypeByUuid(appearance.nextHearingTypeUuid, req.user.username)
          .then(appearanceType => appearanceType.description)
      : Promise.resolve('Not entered')
    const [offenceMap, courtMap, sentenceTypeMap, overallCaseOutcome, outcomeMap, appearanceTypeDescription] =
      await Promise.all([
        this.manageOffencesService.getOffenceMap(Array.from(new Set(chargeCodes)), req.user.token),
        this.courtRegisterService.getCourtMap(Array.from(new Set(courtIds)), req.user.username),
        this.remandAndSentencingService.getSentenceTypeMap(Array.from(new Set(sentenceTypeIds)), req.user.username),
        outcomePromise,
        this.offenceOutcomeService.getOutcomeMap(Array.from(new Set(offenceOutcomeIds)), req.user.username),
        appearanceTypePromise,
      ])

    return res.render('pages/courtAppearance/details', {
      nomsId,
      courtCaseReference,
      appearanceReference,
      addOrEditCourtCase,
      addOrEditCourtAppearance,
      appearance,
      offenceMap,
      courtMap,
      sentenceTypeMap,
      overallCaseOutcome,
      outcomeMap,
      appearanceTypeDescription,
      backLink: `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/details`,
    })
  }

  public submitAppearanceDetailsEdit: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, appearanceReference, addOrEditCourtCase } = req.params
    const { token } = res.locals.user
    const { prisonId } = res.locals.prisoner
    const courtAppearance = this.courtAppearanceService.getSessionCourtAppearance(req.session, nomsId)
    await this.remandAndSentencingService.updateCourtAppearance(
      token,
      courtCaseReference,
      appearanceReference,
      courtAppearance,
      prisonId,
    )
    this.courtAppearanceService.clearSessionCourtAppearance(req.session, nomsId)
    return res.redirect(`/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/details`)
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
      return res.redirect(
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/select-court-name`,
      )
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
      const court = this.courtAppearanceService.getCourtCode(req.session, nomsId)
      if (court) {
        selectCourtNameForm = {
          courtNameSelect: court === latestCourtAppearance.courtCode ? 'true' : 'false',
        }
      }
    }

    let lastCourtName = latestCourtAppearance.courtCode
    try {
      lastCourtName = (
        await this.courtRegisterService.findCourtById(latestCourtAppearance.courtCode, req.user.username)
      ).courtDescription
    } catch (e) {
      logger.error(e)
    }
    return res.render('pages/courtAppearance/select-court-name', {
      nomsId,
      submitToCheckAnswers,
      lastCourtName,
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
        courtCode: this.courtAppearanceService.getCourtCode(req.session, nomsId),
      }
    }
    if (courtNameForm.courtCode && courtNameForm.courtName === undefined) {
      try {
        const court = await this.courtRegisterService.findCourtById(courtNameForm.courtCode, req.user.username)
        courtNameForm.courtName = court.courtDescription
      } catch (e) {
        logger.error(e)
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
    return res.redirect(
      `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/overall-case-outcome`,
    )
  }

  public newJourney: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, appearanceReference, addOrEditCourtCase, addOrEditCourtAppearance } = req.params
    this.courtAppearanceService.clearSessionCourtAppearance(req.session, nomsId)
    return res.redirect(
      `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/warrant-type`,
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

  public getDraftAppearance: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, appearanceReference, addOrEditCourtCase, addOrEditCourtAppearance } = req.params
    const { username } = req.user

    const draftAppearance = await this.remandAndSentencingService.getDraftCourtAppearanceByAppearanceUuid(
      appearanceReference,
      username,
    )
    this.courtAppearanceService.setSessionCourtAppearance(
      req.session,
      nomsId,
      draftCourtAppearanceToCourtAppearance(draftAppearance),
    )
    return res.redirect(
      `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/task-list`,
    )
  }

  public getTaskList: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, appearanceReference, addOrEditCourtCase, addOrEditCourtAppearance } = req.params
    const warrantType = this.courtAppearanceService.getWarrantType(req.session, nomsId)
    const courtAppearance = this.courtAppearanceService.getSessionCourtAppearance(req.session, nomsId)
    let caseReferenceSet = !!courtAppearance.caseReferenceNumber
    if (!res.locals.isAddCourtCase && !caseReferenceSet) {
      const latestCourtAppearance = await this.remandAndSentencingService.getLatestCourtAppearanceByCourtCaseUuid(
        req.user.token,
        courtCaseReference,
      )
      caseReferenceSet = !!latestCourtAppearance.courtCaseReference
    }
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
        caseReferenceSet,
      ),
    })
  }

  public submitTaskList: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, appearanceReference, addOrEditCourtCase, addOrEditCourtAppearance } = req.params
    const { token } = res.locals.user
    const { prisonId } = res.locals.prisoner
    const courtAppearance = this.courtAppearanceService.getSessionCourtAppearance(req.session, nomsId)
    if (addOrEditCourtCase === 'add-court-case') {
      const courtCase = { appearances: [courtAppearance] } as CourtCase
      await this.remandAndSentencingService.createCourtCase(nomsId, token, courtCase, prisonId)
    } else {
      await this.remandAndSentencingService.createCourtAppearance(token, courtCaseReference, courtAppearance, prisonId)
    }
    this.courtAppearanceService.clearSessionCourtAppearance(req.session, nomsId)
    return res.redirect(
      `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/confirmation`,
    )
  }

  public submitTaskListAsDraft: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, appearanceReference, addOrEditCourtCase, addOrEditCourtAppearance } = req.params
    const { username } = res.locals.user
    const courtAppearance = this.courtAppearanceService.getSessionCourtAppearance(req.session, nomsId)
    if (addOrEditCourtCase === 'add-court-case' && !courtAppearance.existingDraft) {
      const courtCase = { appearances: [courtAppearance] } as CourtCase
      await this.remandAndSentencingService.createDraftCourtCase(username, nomsId, courtCase)
    } else {
      await this.createOrUpdateDraftAppearance(username, courtCaseReference, courtAppearance)
    }
    return res.redirect(
      `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/save-court-case`,
    )
  }

  private async createOrUpdateDraftAppearance(
    username: string,
    courtCaseReference: string,
    courtAppearance: CourtAppearance,
  ) {
    return courtAppearance.existingDraft
      ? this.remandAndSentencingService.updateDraftCourtAppearance(
          username,
          courtAppearance.appearanceReference,
          courtAppearance,
        )
      : this.remandAndSentencingService.createDraftCourtAppearance(username, courtCaseReference, courtAppearance)
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
    const { username, activeCaseLoadId } = res.locals.user as PrisonUser

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
    const { submitToCheckAnswers, backNav } = req.query

    let backLink = `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/court-name`
    if (backNav) {
      return res.redirect(backLink)
    }
    if (addOrEditCourtAppearance === 'edit-court-appearance') {
      backLink = `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/details`
    } else if (submitToCheckAnswers) {
      backLink = `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/check-answers`
    } else if (addOrEditCourtCase === 'edit-court-case') {
      backLink = `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/select-court-name`
    }

    let overallCaseOutcomeForm = (req.flash('overallCaseOutcomeForm')[0] || {}) as CourtCaseOverallCaseOutcomeForm
    const courtAppearance = this.courtAppearanceService.getSessionCourtAppearance(req.session, nomsId)
    if (Object.keys(overallCaseOutcomeForm).length === 0) {
      overallCaseOutcomeForm = {
        overallCaseOutcome: `${courtAppearance.appearanceOutcomeUuid}|${courtAppearance.relatedOffenceOutcomeUuid}`,
      }
    }
    const { warrantType } = courtAppearance
    const caseOutcomes = await this.appearanceOutcomeService.getAllOutcomes(req.user.username)
    const [subListOutcomes, mainOutcomes] = caseOutcomes
      .filter(caseOutcome => caseOutcome.outcomeType === warrantType)
      .sort((a, b) => a.displayOrder - b.displayOrder)
      .reduce(
        ([subList, mainList], caseOutcome) => {
          return caseOutcome.isSubList ? [[...subList, caseOutcome], mainList] : [subList, [...mainList, caseOutcome]]
        },
        [[], []],
      )
    let legacyCaseOutcome
    if (!courtAppearance.appearanceOutcomeUuid && !res.locals.isAddCourtAppearance) {
      legacyCaseOutcome = outcomeValueOrLegacy(undefined, courtAppearance.legacyData)
    }

    if (mainOutcomes.length === 1 && subListOutcomes.length === 0) {
      const outcome: AppearanceOutcome = mainOutcomes[0]
      overallCaseOutcomeForm.overallCaseOutcome = `${outcome.outcomeUuid}|${outcome.relatedChargeOutcomeUuid}`
      req.body = overallCaseOutcomeForm
      req.flash('skippedOutcome', 'true')
      return this.submitOverallCaseOutcome(req, res, null)
    }

    return res.render('pages/courtAppearance/overall-case-outcome', {
      nomsId,
      submitToCheckAnswers,
      overallCaseOutcomeForm,
      courtCaseReference,
      appearanceReference,
      addOrEditCourtCase,
      addOrEditCourtAppearance,
      errors: req.flash('errors') || [],
      backLink,
      mainOutcomes,
      subListOutcomes,
      legacyCaseOutcome,
    })
  }

  public submitOverallCaseOutcome: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, appearanceReference, addOrEditCourtCase, addOrEditCourtAppearance } = req.params
    const { submitToCheckAnswers } = req.query
    const skippedOutcome = req.flash('skippedOutcome')[0] === 'true' || false
    const overallCaseOutcomeForm = trimForm<CourtCaseOverallCaseOutcomeForm>(req.body)
    const errors = this.courtAppearanceService.setAppearanceOutcomeUuid(req.session, nomsId, overallCaseOutcomeForm)
    if (errors.length > 0) {
      req.flash('errors', errors)
      req.flash('overallCaseOutcomeForm', { ...overallCaseOutcomeForm })
      return res.redirect(
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/overall-case-outcome${submitToCheckAnswers ? '?submitToCheckAnswers=true' : ''}${skippedOutcome ? '?skippedOutcome=true' : ''}`,
      )
    }
    if (addOrEditCourtAppearance === 'edit-court-appearance') {
      return res.redirect(
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/details`,
      )
    }

    if (submitToCheckAnswers) {
      return res.redirect(
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/check-answers`,
      )
    }
    if (skippedOutcome) {
      req.flash('skippedOutcome', 'true')
    }
    return res.redirect(
      `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/case-outcome-applied-all`,
    )
  }

  public getCaseOutcomeAppliedAll: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, appearanceReference, addOrEditCourtCase, addOrEditCourtAppearance } = req.params
    const { submitToCheckAnswers } = req.query
    const appearanceOutcomeUuid = this.courtAppearanceService.getAppearanceOutcomeUuid(req.session, nomsId)
    const skippedOutcome = req.flash('skippedOutcome')[0] === 'true' || false

    const overallCaseOutcome: string = (
      await this.appearanceOutcomeService.getOutcomeByUuid(appearanceOutcomeUuid, req.user.username)
    ).outcomeName
    let caseOutcomeAppliedAllForm = (req.flash('caseOutcomeAppliedAllForm')[0] ||
      {}) as CourtCaseCaseOutcomeAppliedAllForm
    if (Object.keys(caseOutcomeAppliedAllForm).length === 0) {
      caseOutcomeAppliedAllForm = {
        caseOutcomeAppliedAll: this.courtAppearanceService.getCaseOutcomeAppliedAll(req.session, nomsId),
      }
    }
    let backLink = `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/overall-case-outcome?backNav=true`
    if (submitToCheckAnswers) {
      backLink = `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/check-answers`
    }
    if (skippedOutcome) {
      backLink = `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/court-name?backNav`
    }

    return res.render('pages/courtAppearance/case-outcome-applied-all', {
      nomsId,
      submitToCheckAnswers,
      overallCaseOutcome,
      caseOutcomeAppliedAllForm,
      courtCaseReference,
      appearanceReference,
      addOrEditCourtCase,
      addOrEditCourtAppearance,
      errors: req.flash('errors') || [],
      backLink,
    })
  }

  public submitCaseOutcomeAppliedAll: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, appearanceReference, addOrEditCourtCase, addOrEditCourtAppearance } = req.params
    const caseOutcomeAppliedAllForm = trimForm<CourtCaseCaseOutcomeAppliedAllForm>(req.body)
    const { submitToCheckAnswers } = req.query
    const errors = this.courtAppearanceService.setCaseOutcomeAppliedAll(req.session, nomsId, caseOutcomeAppliedAllForm)
    if (errors.length > 0) {
      req.flash('errors', errors)
      req.flash('caseOutcomeAppliedAllForm', { ...caseOutcomeAppliedAllForm })
      return res.redirect(
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/appearance/${appearanceReference}/case-outcome-applied-all${submitToCheckAnswers ? '?submitToCheckAnswers=true' : ''}`,
      )
    }

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
      `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/check-answers`,
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

    let backLink = `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/case-outcome-applied-all`
    if (submitToCheckAnswers) {
      backLink = `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/check-answers`
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
    const { submitToCheckAnswers } = req.query
    const taggedBailForm = trimForm<CourtCaseTaggedBailForm>(req.body)
    const errors = this.courtAppearanceService.setTaggedBail(req.session, nomsId, taggedBailForm)
    if (errors.length > 0) {
      req.flash('errors', errors)
      req.flash('taggedBailForm', { ...taggedBailForm })
      return res.redirect(
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/tagged-bail${submitToCheckAnswers ? '?submitToCheckAnswers=true' : ''}`,
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
        ? `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/offences/check-offence-answers`
        : `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/task-list`,
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
    if (addOrEditCourtAppearance === 'edit-court-appearance') {
      return res.redirect(
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/details`,
      )
    }
    return res.redirect(
      `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/overall-conviction-date`,
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
    if (addOrEditCourtAppearance === 'edit-court-appearance') {
      return res.redirect(
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/details`,
      )
    }
    return res.redirect(
      `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/check-answers`,
    )
  }

  public getOverallConvictionDate: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, appearanceReference, addOrEditCourtCase, addOrEditCourtAppearance } = req.params
    const { submitToCheckAnswers } = req.query
    const overallConvictionDateForm = (req.flash('overallConvictionDateForm')[0] ||
      {}) as CourtCaseOverallConvictionDateForm
    let overallConvictionDateDay: number | string = overallConvictionDateForm['overallConvictionDate-day']
    let overallConvictionDateMonth: number | string = overallConvictionDateForm['overallConvictionDate-month']
    let overallConvictionDateYear: number | string = overallConvictionDateForm['overallConvictionDate-year']
    const overallConvictionDateValue = this.courtAppearanceService.getOverallConvictionDate(req.session, nomsId)
    if (overallConvictionDateValue && Object.keys(overallConvictionDateForm).length === 0) {
      const overallConvictionDate = new Date(overallConvictionDateValue)
      overallConvictionDateDay = overallConvictionDate.getDate()
      overallConvictionDateMonth = overallConvictionDate.getMonth() + 1
      overallConvictionDateYear = overallConvictionDate.getFullYear()
    }

    let backLink = `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/overall-sentence-length`
    if (addOrEditCourtAppearance === 'edit-court-appearance') {
      backLink = `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/details`
    } else if (submitToCheckAnswers) {
      backLink = `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/check-answers`
    }

    return res.render('pages/courtAppearance/overall-conviction-date', {
      nomsId,
      submitToCheckAnswers,
      overallConvictionDateDay,
      overallConvictionDateMonth,
      overallConvictionDateYear,
      courtCaseReference,
      appearanceReference,
      addOrEditCourtCase,
      addOrEditCourtAppearance,
      errors: req.flash('errors') || [],
      backLink,
    })
  }

  public submitOverallConvictionDate: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, appearanceReference, addOrEditCourtCase, addOrEditCourtAppearance } = req.params
    const overallConvictionDateForm = trimForm<CourtCaseOverallConvictionDateForm>(req.body)
    const errors = this.courtAppearanceService.setOverallConvictionDate(req.session, nomsId, overallConvictionDateForm)
    if (errors.length > 0) {
      req.flash('errors', errors)
      req.flash('overallConvictionDateForm', { ...overallConvictionDateForm })
      return res.redirect(
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/overall-conviction-date`,
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
      `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/overall-conviction-date-applied-all`,
    )
  }

  public getOverallConvictionDateAppliedAll: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, appearanceReference, addOrEditCourtCase, addOrEditCourtAppearance } = req.params
    const { submitToCheckAnswers } = req.query
    const overallConvictionDate: Date = this.courtAppearanceService.getOverallConvictionDate(req.session, nomsId)
    let overallConvictionDateAppliedAllForm = (req.flash('overallConvictionDateAppliedAllForm')[0] ||
      {}) as CourtCaseOverallConvictionDateAppliedAllForm
    if (Object.keys(overallConvictionDateAppliedAllForm).length === 0) {
      overallConvictionDateAppliedAllForm = {
        overallConvictionDateAppliedAll: this.courtAppearanceService.getOverallConvictionDateAppliedAll(
          req.session,
          nomsId,
        ),
      }
    }

    let backLink = `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/overall-conviction-date`
    if (addOrEditCourtAppearance === 'edit-court-appearance') {
      backLink = `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/details`
    } else if (submitToCheckAnswers) {
      backLink = `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/check-answers`
    }

    return res.render('pages/courtAppearance/overall-conviction-date-applied-all', {
      nomsId,
      submitToCheckAnswers,
      overallConvictionDate,
      overallConvictionDateAppliedAllForm,
      courtCaseReference,
      appearanceReference,
      addOrEditCourtCase,
      addOrEditCourtAppearance,
      errors: req.flash('errors') || [],
      backLink,
    })
  }

  public submitOverallConvictionDateAppliedAll: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, appearanceReference, addOrEditCourtCase, addOrEditCourtAppearance } = req.params
    const overallConvictionDateAppliedAllForm = trimForm<CourtCaseOverallConvictionDateAppliedAllForm>(req.body)
    const { submitToCheckAnswers } = req.query
    const errors = this.courtAppearanceService.setOverallConvictionDateAppliedAll(
      req.session,
      nomsId,
      overallConvictionDateAppliedAllForm,
    )
    if (errors.length > 0) {
      req.flash('errors', errors)
      req.flash('overallConvictionDateAppliedAllForm', { ...overallConvictionDateAppliedAllForm })
      return res.redirect(
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/appearance/${appearanceReference}/overall-conviction-date-applied-all${submitToCheckAnswers ? '?submitToCheckAnswers=true' : ''}`,
      )
    }

    if (addOrEditCourtAppearance === 'edit-court-appearance') {
      return res.redirect(
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/details`,
      )
    }
    if (submitToCheckAnswers) {
      return res.redirect(
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/check-answers`,
      )
    }
    if (res.locals.isAddCourtCase) {
      return res.redirect(
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/offences/check-offence-answers`,
      )
    }
    return res.redirect(
      `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/review-offences`,
    )
  }

  public getCheckAnswers: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, appearanceReference, addOrEditCourtCase, addOrEditCourtAppearance } = req.params
    const courtAppearance = this.courtAppearanceService.getSessionCourtAppearance(req.session, nomsId)
    const overallCaseOutcome: string = (
      await this.appearanceOutcomeService.getOutcomeByUuid(courtAppearance.appearanceOutcomeUuid, req.user.username)
    ).outcomeName
    let courtName
    if (courtAppearance.courtCode) {
      try {
        const court = await this.courtRegisterService.findCourtById(courtAppearance.courtCode, req.user.username)
        courtName = court.courtName
      } catch (e) {
        logger.error(e)
        courtName = courtAppearance.courtCode
      }
    }

    return res.render('pages/courtAppearance/check-answers', {
      nomsId,
      courtAppearance,
      courtName,
      overallCaseOutcome,
      courtCaseReference,
      appearanceReference,
      addOrEditCourtCase,
      addOrEditCourtAppearance,
      backLink:
        courtAppearance.warrantType === 'SENTENCING'
          ? `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/overall-sentence-length`
          : `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/case-outcome-applied-all`,
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
    const { submitToCheckAnswers } = req.query
    let nextHearingSelectForm = (req.flash('nextHearingSelectForm')[0] || {}) as CourtCaseNextHearingSelectForm
    if (Object.keys(nextHearingSelectForm).length === 0) {
      nextHearingSelectForm = {
        nextHearingSelect: this.courtAppearanceService.getNextHearingSelect(req.session, nomsId)?.toString(),
      }
    }
    let backLink = `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/task-list`
    if (addOrEditCourtAppearance === 'edit-court-appearance') {
      backLink = `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/details`
    } else if (submitToCheckAnswers) {
      backLink = `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/check-next-hearing-answers`
    }

    return res.render('pages/courtAppearance/next-hearing-select', {
      nomsId,
      nextHearingSelectForm,
      courtCaseReference,
      appearanceReference,
      addOrEditCourtCase,
      addOrEditCourtAppearance,
      errors: req.flash('errors') || [],
      backLink,
    })
  }

  public submitNextHearingSelect: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, appearanceReference, addOrEditCourtCase, addOrEditCourtAppearance } = req.params
    const { submitToCheckAnswers } = req.query
    const nextHearingSelectForm = trimForm<CourtCaseNextHearingSelectForm>(req.body)
    const errors = this.courtAppearanceService.setNextHearingSelect(req.session, nomsId, nextHearingSelectForm)
    if (errors.length > 0) {
      req.flash('errors', errors)
      req.flash('nextHearingSelectForm', { ...nextHearingSelectForm })
      return res.redirect(
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/next-hearing-select${submitToCheckAnswers ? '?submitToCheckAnswers=true' : ''}`,
      )
    }
    if (this.courtAppearanceService.isNextCourtAppearanceAccepted(req.session, nomsId)) {
      if (addOrEditCourtAppearance === 'edit-court-appearance') {
        return res.redirect(
          `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/details`,
        )
      }
      return res.redirect(
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/check-next-hearing-answers`,
      )
    }
    return res.redirect(
      `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/next-hearing-type`,
    )
  }

  public getNextHearingType: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, appearanceReference, addOrEditCourtCase, addOrEditCourtAppearance } = req.params
    const { submitToCheckAnswers } = req.query
    let nextHearingTypeForm = (req.flash('nextHearingTypeForm')[0] || {}) as CourtCaseNextHearingTypeForm
    if (Object.keys(nextHearingTypeForm).length === 0) {
      nextHearingTypeForm = {
        nextHearingType: this.courtAppearanceService.getNextHearingTypeUuid(req.session, nomsId),
      }
    }
    let backLink = `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/next-hearing-select`
    if (addOrEditCourtAppearance === 'edit-court-appearance') {
      backLink = `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/details`
    } else if (submitToCheckAnswers) {
      backLink = `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/check-next-hearing-answers`
    }
    const appearanceTypes = (await this.remandAndSentencingService.getAllAppearanceTypes(req.user.username)).sort(
      (first, second) => first.displayOrder - second.displayOrder,
    )
    return res.render('pages/courtAppearance/next-hearing-type', {
      nomsId,
      nextHearingTypeForm,
      courtCaseReference,
      appearanceReference,
      appearanceTypes,
      submitToCheckAnswers,
      addOrEditCourtCase,
      addOrEditCourtAppearance,
      errors: req.flash('errors') || [],
      backLink,
    })
  }

  public submitNextHearingType: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, appearanceReference, addOrEditCourtCase, addOrEditCourtAppearance } = req.params
    const { submitToCheckAnswers } = req.query
    const nextHearingTypeForm = trimForm<CourtCaseNextHearingTypeForm>(req.body)
    const errors = this.courtAppearanceService.setNextHearingType(req.session, nomsId, nextHearingTypeForm)
    if (errors.length > 0) {
      req.flash('errors', errors)
      req.flash('nextHearingTypeForm', { ...nextHearingTypeForm })
      return res.redirect(
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/next-hearing-type${submitToCheckAnswers ? '?submitToCheckAnswers=true' : ''}`,
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
    if (nextHearingDateValue && Object.keys(nextHearingDateForm).length === 0) {
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
      backLink: res.locals.isAddCourtAppearance
        ? `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/next-hearing-type`
        : `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/details`,
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
    const { submitToCheckAnswers } = req.query
    let nextHearingCourtSelectForm = (req.flash('nextHearingCourtSelectForm')[0] ||
      {}) as CourtCaseNextHearingCourtSelectForm
    if (Object.keys(nextHearingCourtSelectForm).length === 0) {
      nextHearingCourtSelectForm = {
        nextHearingCourtSelect: this.courtAppearanceService.getNextHearingCourtSelect(req.session, nomsId),
      }
    }
    const courtCode = this.courtAppearanceService.getCourtCode(req.session, nomsId)
    const court = await this.courtRegisterService.findCourtById(courtCode, res.locals.user.username)
    let backLink
    if (submitToCheckAnswers) {
      backLink = `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/check-next-hearing-answers`
    } else if (res.locals.isAddCourtAppearance) {
      backLink = `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/next-hearing-date`
    } else {
      backLink = `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/details`
    }
    return res.render('pages/courtAppearance/next-hearing-court-select', {
      nomsId,
      nextHearingCourtSelectForm,
      courtName: court.courtName,
      courtCaseReference,
      appearanceReference,
      addOrEditCourtCase,
      addOrEditCourtAppearance,
      errors: req.flash('errors') || [],
      backLink,
    })
  }

  public submitNextHearingCourtSelect: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, appearanceReference, addOrEditCourtCase, addOrEditCourtAppearance } = req.params
    const nextHearingCourtSelectForm = trimForm<CourtCaseNextHearingCourtSelectForm>(req.body)
    const errors = this.courtAppearanceService.setNextHearingCourtSelect(
      req.session,
      nomsId,
      nextHearingCourtSelectForm,
    )
    if (errors.length > 0) {
      req.flash('errors', errors)
      req.flash('nextHearingCourtSelectForm', { ...nextHearingCourtSelectForm })
      return res.redirect(
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/next-hearing-court-select`,
      )
    }
    if (nextHearingCourtSelectForm.nextHearingCourtSelect === 'true') {
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
    const { submitToCheckAnswers } = req.query
    let nextHearingCourtNameForm = (req.flash('nextHearingCourtNameForm')[0] || {}) as CourtCaseNextHearingCourtNameForm
    if (Object.keys(nextHearingCourtNameForm).length === 0) {
      nextHearingCourtNameForm = {
        courtCode: this.courtAppearanceService.getNextHearingCourtCode(req.session, nomsId),
      }
    }
    if (nextHearingCourtNameForm.courtCode && nextHearingCourtNameForm.nextHearingCourtName === undefined) {
      try {
        const court = await this.courtRegisterService.findCourtById(
          nextHearingCourtNameForm.courtCode,
          req.user.username,
        )
        nextHearingCourtNameForm.nextHearingCourtName = court.courtDescription
      } catch (e) {
        logger.error(e)
      }
    }

    let backLink = `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/next-hearing-court-select`

    if (addOrEditCourtAppearance === 'edit-court-appearance') {
      backLink = `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/details`
    } else if (submitToCheckAnswers) {
      backLink = `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/check-next-hearing-answers`
    }

    return res.render('pages/courtAppearance/next-hearing-court-name', {
      nomsId,
      submitToCheckAnswers,
      nextHearingCourtNameForm,
      courtCaseReference,
      appearanceReference,
      errors: req.flash('errors') || [],
      addOrEditCourtCase,
      addOrEditCourtAppearance,
      backLink,
    })
  }

  public submitNextHearingCourtName: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, appearanceReference, addOrEditCourtCase, addOrEditCourtAppearance } = req.params
    const nextHearingCourtNameForm = trimForm<CourtCaseNextHearingCourtNameForm>(req.body)
    const errors = this.courtAppearanceService.setNextHearingCourtName(req.session, nomsId, nextHearingCourtNameForm)
    if (errors.length > 0) {
      req.flash('errors', errors)
      req.flash('nextHearingCourtNameForm', { ...nextHearingCourtNameForm })
      return res.redirect(
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/next-hearing-court-name`,
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
    return res.redirect(
      `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/check-next-hearing-answers`,
    )
  }

  public getCheckNextHearingAnswers: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, appearanceReference, addOrEditCourtCase, addOrEditCourtAppearance } = req.params
    const courtAppearance = this.courtAppearanceService.getSessionCourtAppearance(req.session, nomsId)
    let nextHearingCourtName
    let nextHearingAppearanceType
    if (courtAppearance.nextHearingCourtSelect === 'true') {
      const [court, appearanceType] = await Promise.all([
        this.courtRegisterService.findCourtById(courtAppearance.nextHearingCourtCode, req.user.username),
        this.remandAndSentencingService.getAppearanceTypeByUuid(courtAppearance.nextHearingTypeUuid, req.user.username),
      ])
      nextHearingCourtName = court.courtName
      nextHearingAppearanceType = appearanceType.description
    }
    return res.render('pages/courtAppearance/check-next-hearing-answers', {
      nomsId,
      courtAppearance,
      nextHearingCourtName,
      nextHearingAppearanceType,
      courtCaseReference,
      appearanceReference,
      addOrEditCourtCase,
      addOrEditCourtAppearance,
      backLink: courtAppearance.nextCourtAppearanceAccepted
        ? `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/task-list`
        : `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/next-hearing-court-select`,
    })
  }

  public submitCheckNextHearingAnswers: RequestHandler = async (req, res): Promise<void> => {
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

  public getDraftConfirmationPage: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, addOrEditCourtCase, courtCaseReference, addOrEditCourtAppearance, appearanceReference } = req.params
    const { courtAppearanceCourtName } = res.locals
    const courtAppearance = this.courtAppearanceService.getSessionCourtAppearance(req.session, nomsId)
    this.courtAppearanceService.clearSessionCourtAppearance(req.session, nomsId)
    return res.render('pages/courtAppearance/save-court-case', {
      nomsId,
      addOrEditCourtCase,
      courtCaseReference,
      addOrEditCourtAppearance,
      appearanceReference,
      courtAppearance,
      courtAppearanceCourtName,
      backLink: `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/task-list`,
    })
  }
}
