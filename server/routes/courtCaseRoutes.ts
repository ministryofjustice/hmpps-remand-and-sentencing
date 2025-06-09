import { RequestHandler } from 'express'
import type {
  CourtCaseCaseOutcomeAppliedAllForm,
  CourtCaseCourtNameForm,
  CourtCaseNextHearingCourtNameForm,
  CourtCaseNextHearingCourtSelectForm,
  CourtCaseNextHearingDateForm,
  CourtCaseNextHearingSelectForm,
  CourtCaseNextHearingTypeForm,
  CourtCaseOverallCaseOutcomeForm,
  CourtCaseReferenceForm,
  CourtCaseSelectCourtNameForm,
  CourtCaseSelectReferenceForm,
  CourtCaseWarrantDateForm,
  CourtCaseWarrantTypeForm,
} from 'forms'
import type { CourtAppearance, CourtCase } from 'models'
import dayjs from 'dayjs'
import { ConsecutiveToDetails } from '@ministryofjustice/hmpps-court-cases-release-dates-design/hmpps/@types'
import trimForm from '../utils/trim'
import CourtAppearanceService from '../services/courtAppearanceService'
import RemandAndSentencingService from '../services/remandAndSentencingService'
import CourtCasesDetailsModel from './data/CourtCasesDetailsModel'
import CourtCaseDetailsModel from './data/CourtCaseDetailsModel'
import ManageOffencesService from '../services/manageOffencesService'
import { getAsStringOrDefault, outcomeValueOrLegacy, sortByDateDesc } from '../utils/utils'
import DocumentManagementService from '../services/documentManagementService'
import validate from '../validation/validation'
import { chargeToOffence, draftCourtAppearanceToCourtAppearance } from '../utils/mappingUtils'
import TaskListModel from './data/TaskListModel'
import { PrisonUser } from '../interfaces/hmppsUser'
import CourtRegisterService from '../services/courtRegisterService'
import logger from '../../logger'
import AppearanceOutcomeService from '../services/appearanceOutcomeService'
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
    private readonly courtCasesReleaseDatesService: CourtCasesReleaseDatesService,
  ) {}

  public start: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId } = req.params
    const { token, username } = res.locals.user
    const sortBy = getAsStringOrDefault(req.query.sortBy, 'STATUS_APPEARANCE_DATE_DESC')
    const pageNumber = parseInt(getAsStringOrDefault(req.query.pageNumber, '1'), 10) - 1

    const [courtCases, serviceDefinitions] = await Promise.all([
      this.remandAndSentencingService.searchCourtCases(nomsId, username, sortBy, pageNumber),
      this.courtCasesReleaseDatesService.getServiceDefinitions(nomsId, token),
    ])
    const consecutiveToSentenceUuids = courtCases.content
      .flatMap(courtCase => courtCase.latestCourtAppearance.charges)
      .map(charge => charge.sentence?.consecutiveToSentenceUuid)
      .filter(sentenceUuid => sentenceUuid)

    const consecutiveToSentenceDetails = await this.remandAndSentencingService.getConsecutiveToDetails(
      consecutiveToSentenceUuids,
      req.user.username,
    )

    const chargeCodes = courtCases.content
      .flatMap(courtCase => courtCase.latestCourtAppearance.charges)
      .map(charge => charge.offenceCode)
      .concat(consecutiveToSentenceDetails.sentences.map(consecutiveToDetails => consecutiveToDetails.offenceCode))
    const courtIds = courtCases.content
      .flatMap(courtCase =>
        [courtCase.latestCourtAppearance.courtCode, courtCase.latestCourtAppearance.nextCourtAppearance?.courtCode]
          .concat(courtCase.latestCourtAppearance.charges.map(charge => charge.mergedFromCase?.courtCode))
          .filter(courtCode => courtCode !== undefined && courtCode !== null),
      )
      .flat()
      .concat(consecutiveToSentenceDetails.sentences.map(consecutiveToDetails => consecutiveToDetails.courtCode))
    const [offenceMap, courtMap] = await Promise.all([
      this.manageOffencesService.getOffenceMap(Array.from(new Set(chargeCodes)), req.user.token),
      this.courtRegisterService.getCourtMap(Array.from(new Set(courtIds)), req.user.username),
    ])
    const consecutiveToSentenceDetailsMap = Object.fromEntries(
      consecutiveToSentenceDetails.sentences.map(consecutiveToDetails => {
        return [
          consecutiveToDetails.sentenceUuid,
          {
            countNumber: consecutiveToDetails.countNumber,
            offenceCode: consecutiveToDetails.offenceCode,
            offenceDescription: offenceMap[consecutiveToDetails.offenceCode],
            courtCaseReference: consecutiveToDetails.courtCaseReference,
            courtName: courtMap[consecutiveToDetails.courtCode],
            warrantDate: dayjs(consecutiveToDetails.appearanceDate).format(config.dateFormat),
          } as ConsecutiveToDetails,
        ]
      }),
    )
    const courtCaseDetailModels = courtCases.content.map(
      pageCourtCaseContent => new CourtCasesDetailsModel(pageCourtCaseContent, courtMap),
    )
    const offenceOutcomeMap = Object.fromEntries(
      courtCases.content
        .flatMap(courtCase =>
          courtCase.latestCourtAppearance.charges.filter(charge => charge.outcome).map(charge => charge.outcome),
        )
        .map(outcome => [outcome.outcomeUuid, outcome.outcomeName]),
    )
    const newCourtCaseId = courtCases.totalElements
    const paginationUrl = new URL(`/person/${nomsId}`, config.domain)
    paginationUrl.searchParams.set('sortBy', sortBy)
    const pagination = mojPaginationFromPageCourtCase(courtCases, paginationUrl)
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
      consecutiveToSentenceDetailsMap,
    })
  }

  public getCourtCaseDetails: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, addOrEditCourtCase } = req.params
    const { token } = res.locals.user
    const courtCaseDetails = await this.remandAndSentencingService.getCourtCaseDetails(courtCaseReference, token)

    const consecutiveToUuids = courtCaseDetails.appearances
      .flatMap(appearance => appearance.charges.map(charge => charge.sentence?.consecutiveToSentenceUuid))
      .filter(sentenceUuid => sentenceUuid)

    const consecutiveToSentenceDetails = await this.remandAndSentencingService.getConsecutiveToDetails(
      consecutiveToUuids,
      req.user.username,
    )

    const chargeCodes = courtCaseDetails.appearances
      .map(appearance => appearance.charges.map(charge => charge.offenceCode))
      .flat()
      .concat(consecutiveToSentenceDetails.sentences.map(consecutiveToDetails => consecutiveToDetails.offenceCode))

    const courtIds = [courtCaseDetails.latestAppearance?.courtCode]
      .concat(
        courtCaseDetails.appearances.flatMap(appearance => [
          appearance.courtCode,
          appearance.nextCourtAppearance?.courtCode,
        ]),
        consecutiveToSentenceDetails.sentences.map(consecutiveToDetails => consecutiveToDetails.courtCode),
      )
      .filter(courtId => courtId !== undefined && courtId !== null)

    const [offenceMap, courtMap] = await Promise.all([
      this.manageOffencesService.getOffenceMap(Array.from(new Set(chargeCodes)), req.user.token),
      this.courtRegisterService.getCourtMap(Array.from(new Set(courtIds)), req.user.username),
    ])
    const allSentenceUuids = courtCaseDetails.appearances
      .flatMap(appearance => appearance.charges.map(charge => charge.sentence?.sentenceUuid))
      .filter(sentenceUuid => sentenceUuid)
    const consecutiveToSentenceDetailsMap = Object.fromEntries(
      consecutiveToSentenceDetails.sentences.map(consecutiveToDetails => {
        let consecutiveToDetailsEntry = {
          countNumber: consecutiveToDetails.countNumber,
          offenceCode: consecutiveToDetails.offenceCode,
          offenceDescription: offenceMap[consecutiveToDetails.offenceCode],
          courtCaseReference: consecutiveToDetails.courtCaseReference,
          courtName: courtMap[consecutiveToDetails.courtCode],
          warrantDate: dayjs(consecutiveToDetails.appearanceDate).format(config.dateFormat),
        } as ConsecutiveToDetails
        if (allSentenceUuids.includes(consecutiveToDetails.sentenceUuid)) {
          consecutiveToDetailsEntry = {
            countNumber: consecutiveToDetails.countNumber,
            offenceCode: consecutiveToDetails.offenceCode,
            offenceDescription: offenceMap[consecutiveToDetails.offenceCode],
          }
        }
        return [consecutiveToDetails.sentenceUuid, consecutiveToDetailsEntry]
      }),
    )
    return res.render('pages/courtCaseDetails', {
      nomsId,
      courtCaseReference,
      addOrEditCourtCase,
      courtCaseDetails: new CourtCaseDetailsModel(courtCaseDetails),
      offenceMap,
      courtMap,
      consecutiveToSentenceDetailsMap,
      backLink: `/person/${nomsId}`,
    })
  }

  public getAppearanceUpdatedConfirmation: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, addOrEditCourtCase } = req.params
    const { token, username } = res.locals.user
    const latestAppearance = await this.remandAndSentencingService.getLatestCourtAppearanceByCourtCaseUuid(
      token,
      courtCaseReference,
    )
    const courtDetails = await this.courtRegisterService.findCourtById(latestAppearance.courtCode, username)
    return res.render('pages/appearanceUpdatedConfirmation', {
      nomsId,
      courtCaseReference,
      addOrEditCourtCase,
      latestAppearance,
      courtDetails,
    })
  }

  public getReference: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, appearanceReference, addOrEditCourtCase, addOrEditCourtAppearance } = req.params
    const { submitToCheckAnswers } = req.query
    const warrantType = this.courtAppearanceService.getWarrantType(req.session, nomsId)
    let courtCaseReferenceForm = (req.flash('courtCaseReferenceForm')[0] || {}) as CourtCaseReferenceForm
    const { caseReferenceNumber, referenceNumberSelect, noCaseReference } =
      this.courtAppearanceService.getSessionCourtAppearance(req.session, nomsId)
    if (Object.keys(courtCaseReferenceForm).length === 0) {
      courtCaseReferenceForm = {
        referenceNumber: caseReferenceNumber,
        noCaseReference,
      }
    }
    let backLink = `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/task-list`
    if (addOrEditCourtAppearance === 'edit-court-appearance') {
      if (warrantType === 'SENTENCING') {
        backLink = `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/sentencing/appearance-details`
      } else {
        backLink = `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/remand/appearance-details`
      }
    } else if (submitToCheckAnswers) {
      backLink = `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/check-answers`
    } else if (addOrEditCourtCase === 'edit-court-case' && referenceNumberSelect !== undefined) {
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
    const warrantType = this.courtAppearanceService.getWarrantType(req.session, nomsId)
    if (errors.length > 0) {
      req.flash('errors', errors)
      req.flash('courtCaseReferenceForm', { ...courtCaseReferenceForm })
      return res.redirect(
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/reference`,
      )
    }
    if (addOrEditCourtAppearance === 'edit-court-appearance') {
      if (warrantType === 'SENTENCING') {
        return res.redirect(
          `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/sentencing/appearance-details`,
        )
      }
      return res.redirect(
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/remand/appearance-details`,
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
    const warrantType = this.courtAppearanceService.getWarrantType(req.session, nomsId)
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
      if (warrantType === 'SENTENCING') {
        backLink = `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/sentencing/appearance-details`
      } else {
        backLink = `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/remand/appearance-details`
      }
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
    const warrantType = this.courtAppearanceService.getWarrantType(req.session, nomsId)
    const errors = this.courtAppearanceService.setWarrantDate(req.session, nomsId, warrantDateForm)
    if (errors.length > 0) {
      req.flash('errors', errors)
      req.flash('warrantDateForm', { ...warrantDateForm })
      return res.redirect(
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/warrant-date`,
      )
    }
    if (addOrEditCourtAppearance === 'edit-court-appearance') {
      if (warrantType === 'SENTENCING') {
        return res.redirect(
          `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/sentencing/appearance-details`,
        )
      }
      return res.redirect(
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/remand/appearance-details`,
      )
    }
    const { submitToCheckAnswers } = req.query
    if (submitToCheckAnswers) {
      return res.redirect(
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/check-answers`,
      )
    }
    if (addOrEditCourtCase === 'edit-court-case') {
      try {
        const latestCourtAppearance = await this.remandAndSentencingService.getLatestCourtAppearanceByCourtCaseUuid(
          req.user.token,
          courtCaseReference,
        )
        if (latestCourtAppearance) {
          return res.redirect(
            `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/select-court-name`,
          )
        }
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (e) {
        logger.info(`no latest appearance for ${courtCaseReference}`)
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
    const sessionAppearance = this.courtAppearanceService.getSessionCourtAppearance(req.session, nomsId)
    let { courtCode } = latestCourtAppearance
    let nextCourtAppearanceUsed = false
    if (latestCourtAppearance.nextCourtAppearance?.appearanceDate) {
      const nextAppearanceDate = dayjs(latestCourtAppearance.nextCourtAppearance.appearanceDate)
      const currentWarrantDate = dayjs(sessionAppearance.warrantDate)
      if (nextAppearanceDate.isSame(currentWarrantDate)) {
        courtCode = latestCourtAppearance.nextCourtAppearance.courtCode
        nextCourtAppearanceUsed = true
      }
    }
    let selectCourtNameForm = (req.flash('selectCourtNameForm')[0] || {}) as CourtCaseSelectCourtNameForm
    if (Object.keys(selectCourtNameForm).length === 0) {
      const court = this.courtAppearanceService.getCourtCode(req.session, nomsId)
      if (court) {
        selectCourtNameForm = {
          courtNameSelect: court === courtCode ? 'true' : 'false',
          previousCourtCode: courtCode,
        }
      }
    }

    const lastCourtName = (await this.courtRegisterService.findCourtById(courtCode, req.user.username)).courtName
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
      previousCourtCode: courtCode,
      nextCourtAppearanceUsed,
      backLink: submitToCheckAnswers
        ? `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/check-answers`
        : `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/warrant-date`,
    })
  }

  public submitSelectCourtName: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, appearanceReference, addOrEditCourtCase, addOrEditCourtAppearance } = req.params
    const selectCourtNameForm = trimForm<CourtCaseSelectCourtNameForm>(req.body)
    const errors = this.courtAppearanceService.setCourtNameFromSelect(req.session, nomsId, selectCourtNameForm)

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
          `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/check-answers`,
        )
      }

      return res.redirect(
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/overall-case-outcome?backTo=SELECT`,
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
    const warrantType = this.courtAppearanceService.getWarrantType(req.session, nomsId)
    let courtNameForm = (req.flash('courtNameForm')[0] || {}) as CourtCaseCourtNameForm
    if (Object.keys(courtNameForm).length === 0) {
      courtNameForm = {
        courtCode: this.courtAppearanceService.getCourtCode(req.session, nomsId),
      }
    }
    if (courtNameForm.courtCode && courtNameForm.courtName === undefined) {
      try {
        const court = await this.courtRegisterService.findCourtById(courtNameForm.courtCode, req.user.username)
        courtNameForm.courtName = court.courtName
      } catch (e) {
        logger.error(e)
      }
    }
    let backLink = `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/warrant-date`

    if (addOrEditCourtAppearance === 'edit-court-appearance') {
      if (warrantType === 'SENTENCING') {
        backLink = `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/sentencing/appearance-details`
      } else {
        backLink = `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/remand/appearance-details`
      }
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
    const warrantType = this.courtAppearanceService.getWarrantType(req.session, nomsId)
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
      if (warrantType === 'SENTENCING') {
        return res.redirect(
          `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/sentencing/appearance-details`,
        )
      }
      return res.redirect(
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/remand/appearance-details`,
      )
    }
    const { submitToCheckAnswers } = req.query
    if (submitToCheckAnswers || warrantType === 'SENTENCING') {
      return res.redirect(
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/check-answers`,
      )
    }
    return res.redirect(
      `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/overall-case-outcome?backTo=NAME`,
    )
  }

  public newJourney: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, appearanceReference, addOrEditCourtCase, addOrEditCourtAppearance } = req.params
    this.courtAppearanceService.clearSessionCourtAppearance(req.session, nomsId)
    if (!res.locals.isAddCourtCase) {
      const latestCourtAppearance = await this.remandAndSentencingService.getLatestCourtAppearanceByCourtCaseUuid(
        req.user.token,
        courtCaseReference,
      )
      latestCourtAppearance.charges
        .filter(charge => {
          const dispositionCode = charge.outcome?.dispositionCode ?? charge.legacyData?.outcomeDispositionCode
          return !dispositionCode || dispositionCode === 'INTERIM'
        })
        .sort((a, b) => {
          return sortByDateDesc(a.offenceStartDate, b.offenceStartDate)
        })
        .map((charge, index) => chargeToOffence(charge, index))
        .forEach((offence, index) => this.courtAppearanceService.addOffence(req.session, nomsId, index, offence))
    }
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
    const { warrantType } = warrantTypeForm
    this.courtAppearanceService.setWarrantType(req.session, nomsId, warrantType)
    if (warrantType === 'SENTENCING') {
      const overallCaseOutcomeForm = {
        overallCaseOutcome: '62412083-9892-48c9-bf01-7864af4a8b3c|f17328cf-ceaa-43c2-930a-26cf74480e18',
      }
      this.courtAppearanceService.setAppearanceOutcomeUuid(req.session, nomsId, overallCaseOutcomeForm)
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
    const { submitToCheckAnswers, backTo } = req.query

    let backLink = `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/court-name`
    if (addOrEditCourtAppearance === 'edit-court-appearance') {
      backLink = `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/remand/appearance-details`
    } else if (submitToCheckAnswers) {
      backLink = `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/check-answers`
    } else if (backTo === 'SELECT') {
      backLink = `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/select-court-name`
    }

    let overallCaseOutcomeForm = (req.flash('overallCaseOutcomeForm')[0] || {}) as CourtCaseOverallCaseOutcomeForm
    const courtAppearance = this.courtAppearanceService.getSessionCourtAppearance(req.session, nomsId)
    if (Object.keys(overallCaseOutcomeForm).length === 0) {
      overallCaseOutcomeForm = {
        overallCaseOutcome: `${courtAppearance.appearanceOutcomeUuid}|${courtAppearance.relatedOffenceOutcomeUuid}`,
      }
    }
    const { warrantType, appearanceOutcomeUuid } = courtAppearance
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
    if (
      appearanceOutcomeUuid &&
      !mainOutcomes
        .concat(subListOutcomes)
        .map(outcome => outcome.outcomeUuid)
        .includes(appearanceOutcomeUuid)
    ) {
      const outcome = await this.appearanceOutcomeService.getOutcomeByUuid(appearanceOutcomeUuid, req.user.username)
      legacyCaseOutcome = outcome.outcomeName
    } else if (!appearanceOutcomeUuid && !res.locals.isAddCourtAppearance) {
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
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/remand/appearance-details`,
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
    const overallCaseOutcome = (
      await this.appearanceOutcomeService.getOutcomeByUuid(appearanceOutcomeUuid, req.user.username)
    ).outcomeName

    let caseOutcomeAppliedAllForm = (req.flash('caseOutcomeAppliedAllForm')[0] ||
      {}) as CourtCaseCaseOutcomeAppliedAllForm
    if (Object.keys(caseOutcomeAppliedAllForm).length === 0) {
      caseOutcomeAppliedAllForm = {
        caseOutcomeAppliedAll: this.courtAppearanceService.getCaseOutcomeAppliedAll(req.session, nomsId),
      }
    }

    let backLink = `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/overall-case-outcome`

    if (submitToCheckAnswers) {
      backLink = `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/check-answers`
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
    return res.redirect(
      `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/check-answers`,
    )
  }

  public getCheckAnswers: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, appearanceReference, addOrEditCourtCase, addOrEditCourtAppearance } = req.params
    const courtAppearance = this.courtAppearanceService.getSessionCourtAppearance(req.session, nomsId)

    let overallCaseOutcome = ''
    if (courtAppearance.warrantType !== 'SENTENCING') {
      overallCaseOutcome = (
        await this.appearanceOutcomeService.getOutcomeByUuid(courtAppearance.appearanceOutcomeUuid, req.user.username)
      ).outcomeName
    }

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
          ? `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/court-name`
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
    const warrantType = this.courtAppearanceService.getWarrantType(req.session, nomsId)
    let nextHearingSelectForm = (req.flash('nextHearingSelectForm')[0] || {}) as CourtCaseNextHearingSelectForm
    if (Object.keys(nextHearingSelectForm).length === 0) {
      nextHearingSelectForm = {
        nextHearingSelect: this.courtAppearanceService.getNextHearingSelect(req.session, nomsId)?.toString(),
      }
    }
    let backLink = `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/task-list`
    if (addOrEditCourtAppearance === 'edit-court-appearance') {
      if (warrantType === 'SENTENCING') {
        backLink = `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/sentencing/appearance-details`
      } else {
        backLink = `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/remand/appearance-details`
      }
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
    const warrantType = this.courtAppearanceService.getWarrantType(req.session, nomsId)
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
        if (warrantType === 'SENTENCING') {
          return res.redirect(
            `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/sentencing/appearance-details`,
          )
        }
        return res.redirect(
          `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/remand/appearance-details`,
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
    const warrantType = this.courtAppearanceService.getWarrantType(req.session, nomsId)
    let nextHearingTypeForm = (req.flash('nextHearingTypeForm')[0] || {}) as CourtCaseNextHearingTypeForm
    const nextHearingTypeUuid = this.courtAppearanceService.getNextHearingTypeUuid(req.session, nomsId)
    if (Object.keys(nextHearingTypeForm).length === 0) {
      nextHearingTypeForm = {
        nextHearingType: nextHearingTypeUuid,
      }
    }
    let backLink = `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/next-hearing-select`
    if (addOrEditCourtAppearance === 'edit-court-appearance') {
      if (warrantType === 'SENTENCING') {
        backLink = `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/sentencing/appearance-details`
      } else {
        backLink = `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/remand/appearance-details`
      }
    } else if (submitToCheckAnswers) {
      backLink = `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/check-next-hearing-answers`
    }
    const appearanceTypes = (await this.remandAndSentencingService.getAllAppearanceTypes(req.user.username)).sort(
      (first, second) => first.displayOrder - second.displayOrder,
    )
    let currentlySetTypeDescription
    if (nextHearingTypeUuid && !appearanceTypes.map(type => type.appearanceTypeUuid).includes(nextHearingTypeUuid)) {
      const currentlySetType = await this.remandAndSentencingService.getAppearanceTypeByUuid(
        nextHearingTypeUuid,
        req.user.username,
      )
      currentlySetTypeDescription = currentlySetType.description
    }
    return res.render('pages/courtAppearance/next-hearing-type', {
      nomsId,
      nextHearingTypeForm,
      courtCaseReference,
      appearanceReference,
      appearanceTypes,
      submitToCheckAnswers,
      addOrEditCourtCase,
      addOrEditCourtAppearance,
      currentlySetTypeDescription,
      errors: req.flash('errors') || [],
      backLink,
    })
  }

  public submitNextHearingType: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, appearanceReference, addOrEditCourtCase, addOrEditCourtAppearance } = req.params
    const { submitToCheckAnswers } = req.query
    const warrantType = this.courtAppearanceService.getWarrantType(req.session, nomsId)
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
      if (warrantType === 'SENTENCING') {
        return res.redirect(
          `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/sentencing/appearance-details`,
        )
      }
      return res.redirect(
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/remand/appearance-details`,
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
    const warrantType = this.courtAppearanceService.getWarrantType(req.session, nomsId)
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
        ? dayjs(nextHearingDate).format('HH:mm')
        : ''
    }
    let backLink = `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/next-hearing-type`

    if (addOrEditCourtAppearance === 'edit-court-appearance') {
      if (warrantType === 'SENTENCING') {
        backLink = `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/sentencing/appearance-details`
      } else {
        backLink = `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/remand/appearance-details`
      }
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
      backLink,
    })
  }

  public submitNextHearingDate: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, appearanceReference, addOrEditCourtCase, addOrEditCourtAppearance } = req.params
    const { warrantType } = this.courtAppearanceService.getSessionCourtAppearance(req.session, nomsId)
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
      if (warrantType === 'SENTENCING') {
        return res.redirect(
          `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/sentencing/appearance-details`,
        )
      }
      return res.redirect(
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/remand/appearance-details`,
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
    const warrantType = this.courtAppearanceService.getWarrantType(req.session, nomsId)
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
    } else if (addOrEditCourtAppearance === 'edit-court-appearance') {
      if (warrantType === 'SENTENCING') {
        backLink = `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/sentencing/appearance-details`
      } else {
        backLink = `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/remand/appearance-details`
      }
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
    const { warrantType } = this.courtAppearanceService.getSessionCourtAppearance(req.session, nomsId)
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
        if (warrantType === 'SENTENCING') {
          return res.redirect(
            `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/sentencing/appearance-details`,
          )
        }
        return res.redirect(
          `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/remand/appearance-details`,
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
    const warrantType = this.courtAppearanceService.getWarrantType(req.session, nomsId)
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
        nextHearingCourtNameForm.nextHearingCourtName = court.courtName
      } catch (e) {
        logger.error(e)
      }
    }

    let backLink = `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/next-hearing-court-select`

    if (addOrEditCourtAppearance === 'edit-court-appearance') {
      if (warrantType === 'SENTENCING') {
        backLink = `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/sentencing/appearance-details`
      } else {
        backLink = `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/remand/appearance-details`
      }
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
    const warrantType = this.courtAppearanceService.getWarrantType(req.session, nomsId)
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
      if (warrantType === 'SENTENCING') {
        return res.redirect(
          `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/sentencing/appearance-details`,
        )
      }
      return res.redirect(
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/remand/appearance-details`,
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
    if (courtAppearance.nextHearingSelect) {
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
    const warrantType = this.courtAppearanceService.getWarrantType(req.session, nomsId)
    this.courtAppearanceService.setNextCourtAppearanceAcceptedTrue(req.session, nomsId)
    if (addOrEditCourtAppearance === 'edit-court-appearance') {
      if (warrantType === 'SENTENCING') {
        return res.redirect(
          `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/sentencing/appearance-details`,
        )
      }
      return res.redirect(
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/remand/appearance-details`,
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

  public getCourtDocumentsPage: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, appearanceReference, addOrEditCourtCase, addOrEditCourtAppearance } = req.params
    const courtAppearance = this.courtAppearanceService.getSessionCourtAppearance(req.session, nomsId)
    return res.render('pages/courtAppearance/upload-court-documents', {
      nomsId,
      courtCaseReference,
      appearanceReference,
      addOrEditCourtCase,
      addOrEditCourtAppearance,
      courtAppearance,
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

  private isAddJourney(addOrEditCourtCase: string, addOrEditCourtAppearance: string): boolean {
    return addOrEditCourtCase === 'add-court-case' && addOrEditCourtAppearance === 'add-court-appearance'
  }
}
