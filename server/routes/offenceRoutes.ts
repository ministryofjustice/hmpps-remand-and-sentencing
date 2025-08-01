import { RequestHandler } from 'express'
import type {
  OffenceAlternativePeriodLengthForm,
  OffenceConfirmOffenceForm,
  OffenceConvictionDateForm,
  OffenceCountNumberForm,
  OffenceFineAmountForm,
  OffenceFinishedAddingForm,
  OffenceOffenceCodeForm,
  OffenceOffenceDateForm,
  OffenceOffenceNameForm,
  OffenceOffenceOutcomeForm,
  OffenceSentenceServeTypeForm,
  OffenceSentenceTypeForm,
  ReviewOffencesForm,
  SentenceLengthForm,
  UpdateOffenceOutcomesForm,
} from 'forms'
import type { Offence } from 'models'
import dayjs from 'dayjs'
import { ConsecutiveToDetails } from '@ministryofjustice/hmpps-court-cases-release-dates-design/hmpps/@types'
import trimForm from '../utils/trim'
import OffenceService from '../services/offenceService'
import ManageOffencesService from '../services/manageOffencesService'
import CourtAppearanceService from '../services/courtAppearanceService'
import RemandAndSentencingService from '../services/remandAndSentencingService'
import {
  offenceToConsecutiveToDetails,
  sentenceConsecutiveToDetailsToConsecutiveToDetails,
  sentenceLengthToAlternativeSentenceLengthForm,
  sentenceLengthToSentenceLengthForm,
} from '../utils/mappingUtils'
import periodLengthTypeHeadings from '../resources/PeriodLengthTypeHeadings'
import sentenceTypePeriodLengths from '../resources/sentenceTypePeriodLengths'
import {
  allPeriodLengthTypesEntered,
  extractKeyValue,
  getNextPeriodLengthType,
  outcomeValueOrLegacy,
  sentenceTypeValueOrLegacy,
} from '../utils/utils'
import OffenceOutcomeService from '../services/offenceOutcomeService'
import CalculateReleaseDatesService from '../services/calculateReleaseDatesService'
import CourtRegisterService from '../services/courtRegisterService'
import BaseRoutes from './baseRoutes'
import sentenceServeTypes from '../resources/sentenceServeTypes'
import InvalidatedFrom from '../resources/invalidatedFromTypes'
import { SentenceConsecutiveToDetails } from '../@types/remandAndSentencingApi/remandAndSentencingClientTypes'

export default class OffenceRoutes extends BaseRoutes {
  constructor(
    offenceService: OffenceService,
    private readonly manageOffencesService: ManageOffencesService,
    courtAppearanceService: CourtAppearanceService,
    remandAndSentencingService: RemandAndSentencingService,
    private readonly offenceOutcomeService: OffenceOutcomeService,
    private readonly calculateReleaseDatesService: CalculateReleaseDatesService,
    private readonly courtRegisterService: CourtRegisterService,
  ) {
    super(courtAppearanceService, offenceService, remandAndSentencingService)
  }

  public getOffenceDate: RequestHandler = async (req, res): Promise<void> => {
    const {
      nomsId,
      courtCaseReference,
      offenceReference,
      appearanceReference,
      addOrEditCourtCase,
      addOrEditCourtAppearance,
    } = req.params
    const { submitToEditOffence, invalidatedFrom } = req.query
    const offenceDateForm = (req.flash('offenceDateForm')[0] || {}) as OffenceOffenceDateForm
    let offenceStartDateDay: number | string = offenceDateForm['offenceStartDate-day']
    let offenceStartDateMonth: number | string = offenceDateForm['offenceStartDate-month']
    let offenceStartDateYear: number | string = offenceDateForm['offenceStartDate-year']
    let offenceEndDateDay: number | string = offenceDateForm['offenceEndDate-day']
    let offenceEndDateMonth: number | string = offenceDateForm['offenceEndDate-month']
    let offenceEndDateYear: number | string = offenceDateForm['offenceEndDate-year']
    const offence = this.offenceService.getSessionOffence(req.session, nomsId, courtCaseReference)

    if (offence.offenceStartDate && Object.keys(offenceDateForm).length === 0) {
      const offenceStartDate = new Date(offence.offenceStartDate)
      offenceStartDateDay = offenceStartDate.getDate()
      offenceStartDateMonth = offenceStartDate.getMonth() + 1
      offenceStartDateYear = offenceStartDate.getFullYear()
    }
    if (offence.offenceEndDate && Object.keys(offenceDateForm).length === 0) {
      const offenceEndDate = new Date(offence.offenceEndDate)
      offenceEndDateDay = offenceEndDate.getDate()
      offenceEndDateMonth = offenceEndDate.getMonth() + 1
      offenceEndDateYear = offenceEndDate.getFullYear()
    }
    let backLink = `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/offences/check-offence-answers`
    const { warrantType, offences } = this.courtAppearanceService.getSessionCourtAppearance(req.session, nomsId)
    const isFirstOffence = offences.length === 0
    const submitQuery = this.queryParametersToString(submitToEditOffence, invalidatedFrom)
    if (submitToEditOffence || invalidatedFrom) {
      backLink = `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/offences/${offenceReference}/edit-offence`
    } else if (this.isRepeatJourney(addOrEditCourtCase, addOrEditCourtAppearance)) {
      if (warrantType === 'REMAND') {
        backLink = `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/review-offences`
      } else {
        backLink = `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/update-offence-outcomes`
      }
    } else if (isFirstOffence) {
      backLink = `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/task-list`
    }

    return res.render('pages/offence/offence-date', {
      nomsId,
      courtCaseReference,
      offenceReference,
      appearanceReference,
      addOrEditCourtCase,
      addOrEditCourtAppearance,
      offenceStartDateDay,
      offenceStartDateMonth,
      offenceStartDateYear,
      offenceEndDateDay,
      offenceEndDateMonth,
      offenceEndDateYear,
      isAddOffences: this.isAddJourney(addOrEditCourtCase, addOrEditCourtAppearance),
      isFirstOffence,
      errors: req.flash('errors') || [],
      backLink,
      submitQuery,
    })
  }

  public submitOffenceDate: RequestHandler = async (req, res): Promise<void> => {
    const {
      nomsId,
      courtCaseReference,
      offenceReference,
      appearanceReference,
      addOrEditCourtCase,
      addOrEditCourtAppearance,
    } = req.params
    const { submitToEditOffence, invalidatedFrom } = req.query
    const submitQuery = this.queryParametersToString(submitToEditOffence, invalidatedFrom)
    const offenceDateForm = trimForm<OffenceOffenceDateForm>(req.body)
    const errors = this.offenceService.setOffenceDates(
      req.session,
      nomsId,
      courtCaseReference,
      offenceDateForm,
      addOrEditCourtAppearance,
      this.courtAppearanceService.getWarrantDate(req.session, nomsId),
      this.courtAppearanceService.getOverallConvictionDate(req.session, nomsId),
    )
    if (errors.length > 0) {
      req.flash('errors', errors)
      req.flash('offenceDateForm', { ...offenceDateForm })
      return res.redirect(
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/offences/${offenceReference}/offence-date${submitQuery}`,
      )
    }

    if (submitToEditOffence) {
      const offence = this.offenceService.getSessionOffence(req.session, nomsId, courtCaseReference)
      const hasInvalidatedOffence = await this.courtAppearanceService.checkOffenceDatesHaveInvalidatedOffence(
        req.session,
        nomsId,
        parseInt(offenceReference, 10),
        offence,
        res.locals.prisoner.dateOfBirth,
        req.user.username,
      )
      if (hasInvalidatedOffence) {
        this.offenceService.invalidateFromOffenceDate(req.session, nomsId, courtCaseReference, offenceReference)
        return res.redirect(
          `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/offences/${offenceReference}/conviction-date?invalidatedFrom=${InvalidatedFrom.OFFENCE_DATE}`,
        )
      }
      return res.redirect(
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/offences/${offenceReference}/edit-offence`,
      )
    }
    return res.redirect(
      `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/offences/${offenceReference}/offence-code`,
    )
  }

  public getUpdateOffenceOutcome: RequestHandler = async (req, res): Promise<void> => {
    const {
      nomsId,
      courtCaseReference,
      offenceReference,
      appearanceReference,
      addOrEditCourtCase,
      addOrEditCourtAppearance,
    } = req.params
    let offence = this.offenceService.getSessionOffence(req.session, nomsId, courtCaseReference)
    if (Object.keys(offence).length === 0) {
      const existingOffence = this.courtAppearanceService.getOffence(
        req.session,
        nomsId,
        parseInt(offenceReference, 10),
      )
      this.offenceService.setSessionOffence(req.session, nomsId, courtCaseReference, existingOffence)
      offence = existingOffence
    }
    const warrantType: string = this.courtAppearanceService.getWarrantType(req.session, nomsId)
    const caseOutcomes = await this.offenceOutcomeService.getAllOutcomes(req.user.username)

    const [warrantTypeOutcomes, nonCustodialOutcomes] = caseOutcomes
      .filter(caseOutcome => caseOutcome.outcomeType === warrantType || caseOutcome.outcomeType === 'NON_CUSTODIAL')
      .sort((a, b) => a.displayOrder - b.displayOrder)
      .reduce(
        ([warrantList, nonCustodialList], caseOutcome) => {
          return caseOutcome.outcomeType === warrantType
            ? [[...warrantList, caseOutcome], nonCustodialList]
            : [warrantList, [...nonCustodialList, caseOutcome]]
        },
        [[], []],
      )
    const offenceDetails = await this.manageOffencesService.getOffenceByCode(offence.offenceCode, req.user.token)
    let backLink
    if (warrantType === 'SENTENCING') {
      backLink = `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/update-offence-outcomes`
    } else {
      backLink = `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/review-offences`
    }

    return res.render('pages/offence/update-outcome', {
      nomsId,
      courtCaseReference,
      offenceReference,
      appearanceReference,
      addOrEditCourtCase,
      addOrEditCourtAppearance,
      errors: req.flash('errors') || [],
      backLink,
      warrantTypeOutcomes,
      nonCustodialOutcomes,
      offenceDetails,
      offence,
    })
  }

  public submitUpdateOffenceOutcome: RequestHandler = async (req, res): Promise<void> => {
    const {
      nomsId,
      courtCaseReference,
      offenceReference,
      appearanceReference,
      addOrEditCourtCase,
      addOrEditCourtAppearance,
    } = req.params
    const offenceOutcomeForm = trimForm<OffenceOffenceOutcomeForm>(req.body)
    const errors = this.offenceService.updateOffenceOutcome(req.session, nomsId, courtCaseReference, offenceOutcomeForm)

    if (errors.length > 0) {
      req.flash('errors', errors)
      return res.redirect(
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/offences/${offenceReference}/update-offence-outcome`,
      )
    }

    const offence = this.offenceService.getSessionOffence(req.session, nomsId, courtCaseReference)
    const outcome = await this.offenceOutcomeService.getOutcomeById(
      offenceOutcomeForm.offenceOutcome,
      req.user.username,
    )
    if (outcome.outcomeType === 'SENTENCING') {
      return res.redirect(
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/offences/${offenceReference}/count-number`,
      )
    }
    if (outcome.outcomeType === 'NON_CUSTODIAL') {
      delete offence.sentence
    }
    this.saveOffenceInAppearance(req, nomsId, courtCaseReference, offenceReference, offence)
    const warrantType = this.courtAppearanceService.getWarrantType(req.session, nomsId)
    if (warrantType === 'SENTENCING') {
      return res.redirect(
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/update-offence-outcomes?backTo=OUTCOME&offenceReference=${offenceReference}`,
      )
    }
    return res.redirect(
      `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/review-offences`,
    )
  }

  public getOffenceOutcome: RequestHandler = async (req, res): Promise<void> => {
    const {
      nomsId,
      courtCaseReference,
      offenceReference,
      appearanceReference,
      addOrEditCourtCase,
      addOrEditCourtAppearance,
    } = req.params
    const { submitToEditOffence } = req.query
    let offenceOutcomeForm = (req.flash('offenceOutcomeForm')[0] || {}) as OffenceOffenceOutcomeForm
    const offence = this.offenceService.getSessionOffence(req.session, nomsId, courtCaseReference)
    if (Object.keys(offenceOutcomeForm).length === 0) {
      offenceOutcomeForm = {
        offenceOutcome: offence.outcomeUuid,
      }
    }

    const warrantType: string = this.courtAppearanceService.getWarrantType(req.session, nomsId)
    const [caseOutcomes, offenceDetails] = await Promise.all([
      this.offenceOutcomeService.getAllOutcomes(req.user.username),
      this.manageOffencesService.getOffenceByCode(offence.offenceCode, req.user.token),
    ])

    const [warrantTypeOutcomes, nonCustodialOutcomes] = caseOutcomes
      .filter(caseOutcome => caseOutcome.outcomeType === warrantType || caseOutcome.outcomeType === 'NON_CUSTODIAL')
      .sort((a, b) => a.displayOrder - b.displayOrder)
      .reduce(
        ([warrantList, nonCustodialList], caseOutcome) => {
          return caseOutcome.outcomeType === warrantType
            ? [[...warrantList, caseOutcome], nonCustodialList]
            : [warrantList, [...nonCustodialList, caseOutcome]]
        },
        [[], []],
      )

    let legacyCaseOutcome
    if (
      offence.outcomeUuid &&
      !warrantTypeOutcomes
        .concat(nonCustodialOutcomes)
        .map(outcome => outcome.outcomeUuid)
        .includes(offence.outcomeUuid)
    ) {
      const outcome = await this.offenceOutcomeService.getOutcomeById(offence.outcomeUuid, req.user.username)
      legacyCaseOutcome = outcome.outcomeName
    } else if (!offence.outcomeUuid && submitToEditOffence) {
      legacyCaseOutcome = outcomeValueOrLegacy(undefined, offence.legacyData)
    }

    let backLink = `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/offences/${offenceReference}/confirm-offence-code`
    if (submitToEditOffence || offence.onFinishGoToEdit === true) {
      backLink = `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/offences/${offenceReference}/edit-offence`
    } else if (this.isRepeatJourney(addOrEditCourtCase, addOrEditCourtAppearance)) {
      if (warrantType === 'SENTENCING') {
        backLink = `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/update-offence-outcomes`
      } else {
        backLink = `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/offences/${offenceReference}/review-offences`
      }
    }

    return res.render('pages/offence/offence-outcome', {
      nomsId,
      courtCaseReference,
      offenceOutcomeForm,
      offenceReference,
      appearanceReference,
      addOrEditCourtCase,
      addOrEditCourtAppearance,
      submitToEditOffence,
      errors: req.flash('errors') || [],
      backLink,
      warrantTypeOutcomes,
      nonCustodialOutcomes,
      legacyCaseOutcome,
      offenceDetails,
      isAddOffences: this.isAddJourney(addOrEditCourtCase, addOrEditCourtAppearance),
    })
  }

  public submitOffenceOutcome: RequestHandler = async (req, res): Promise<void> => {
    const {
      nomsId,
      courtCaseReference,
      offenceReference,
      appearanceReference,
      addOrEditCourtCase,
      addOrEditCourtAppearance,
    } = req.params
    const { submitToEditOffence } = req.query
    const offenceOutcomeForm = trimForm<OffenceOffenceOutcomeForm>(req.body)
    const existingOffence =
      this.courtAppearanceService.getOffence(req.session, nomsId, parseInt(offenceReference, 10)) ?? {}
    const { errors, outcome } = await this.offenceService.setOffenceOutcome(
      req.session,
      nomsId,
      courtCaseReference,
      offenceOutcomeForm,
      req.user.username,
    )

    if (errors.length > 0) {
      req.flash('errors', errors)
      req.flash('offenceOutcomeForm', { ...offenceOutcomeForm })
      return res.redirect(
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/offences/${offenceReference}/offence-outcome${submitToEditOffence ? '?submitToEditOffence=true' : ''}`,
      )
    }
    const potentialOffence = this.offenceService.getSessionOffence(req.session, nomsId, courtCaseReference)
    if (
      existingOffence.outcomeUuid &&
      (!existingOffence.sentence || !potentialOffence.sentence) &&
      outcome.outcomeType === 'SENTENCING'
    ) {
      this.offenceService.setOnFinishGoToEdit(req.session, nomsId, courtCaseReference)
      return res.redirect(
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/offences/${offenceReference}/count-number`,
      )
    }
    if (submitToEditOffence) {
      return res.redirect(
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/offences/${offenceReference}/edit-offence`,
      )
    }
    if (outcome.outcomeType === 'SENTENCING') {
      return res.redirect(
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/offences/${offenceReference}/count-number`,
      )
    }
    return this.saveSessionOffenceInAppearance(
      req,
      res,
      nomsId,
      addOrEditCourtCase,
      courtCaseReference,
      addOrEditCourtAppearance,
      appearanceReference,
      offenceReference,
    )
  }

  public getCountNumber: RequestHandler = async (req, res): Promise<void> => {
    const {
      nomsId,
      courtCaseReference,
      offenceReference,
      appearanceReference,
      addOrEditCourtCase,
      addOrEditCourtAppearance,
    } = req.params
    const { submitToEditOffence } = req.query
    let countNumberForm = (req.flash('countNumberForm')[0] || {}) as OffenceCountNumberForm
    const offence = this.offenceService.getSessionOffence(req.session, nomsId, courtCaseReference)
    if (Object.keys(countNumberForm).length === 0) {
      const { countNumber, hasCountNumber } = offence?.sentence || {}
      countNumberForm = {
        hasCountNumber,
        ...(countNumber && countNumber !== '-1' ? { countNumber } : {}),
      }
    }
    const courtAppearance = this.courtAppearanceService.getSessionCourtAppearance(req.session, nomsId)

    let backLink = `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/offences/${offenceReference}/confirm-offence-code`
    if (submitToEditOffence) {
      backLink = `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/offences/${offenceReference}/edit-offence`
    } else if (courtAppearance.caseOutcomeAppliedAll !== 'true' || offence.onFinishGoToEdit) {
      backLink = `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/offences/${offenceReference}/offence-outcome`
    }

    return res.render('pages/offence/count-number', {
      nomsId,
      courtCaseReference,
      offenceReference,
      appearanceReference,
      addOrEditCourtCase,
      addOrEditCourtAppearance,
      countNumberForm,
      submitToEditOffence,
      isAddOffences: this.isAddJourney(addOrEditCourtCase, addOrEditCourtAppearance),
      errors: req.flash('errors') || [],
      backLink,
    })
  }

  public submitCountNumber: RequestHandler = async (req, res): Promise<void> => {
    const {
      nomsId,
      courtCaseReference,
      offenceReference,
      appearanceReference,
      addOrEditCourtCase,
      addOrEditCourtAppearance,
    } = req.params
    const { submitToEditOffence } = req.query
    const countNumberForm = trimForm<OffenceCountNumberForm>(req.body)
    const existingCountNumbers = this.courtAppearanceService.getCountNumbers(
      req.session,
      nomsId,
      parseInt(offenceReference, 10),
    )
    const errors = await this.offenceService.setCountNumber(
      req.session,
      nomsId,
      courtCaseReference,
      offenceReference,
      countNumberForm,
      this.isRepeatJourney(addOrEditCourtCase, addOrEditCourtAppearance),
      existingCountNumbers,
      req.user.username,
    )
    if (errors.length > 0) {
      req.flash('errors', errors)
      req.flash('countNumberForm', { ...countNumberForm })
      return res.redirect(
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/offences/${offenceReference}/count-number${submitToEditOffence ? '?submitToEditOffence=true' : ''}`,
      )
    }

    if (submitToEditOffence) {
      return res.redirect(
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/offences/${offenceReference}/edit-offence`,
      )
    }
    const courtAppearance = this.courtAppearanceService.getSessionCourtAppearance(req.session, nomsId)
    if (courtAppearance.overallConvictionDateAppliedAll === 'true') {
      this.offenceService.setConvictionDate(
        req.session,
        nomsId,
        courtCaseReference,
        offenceReference,
        courtAppearance.overallConvictionDate,
      )
      return res.redirect(
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/offences/${offenceReference}/sentence-type`,
      )
    }
    return res.redirect(
      `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/offences/${offenceReference}/conviction-date`,
    )
  }

  public getOffenceCode: RequestHandler = async (req, res): Promise<void> => {
    const {
      nomsId,
      courtCaseReference,
      offenceReference,
      appearanceReference,
      addOrEditCourtCase,
      addOrEditCourtAppearance,
    } = req.params
    const { submitToEditOffence } = req.query
    const offenceCodeForm = (req.flash('offenceCodeForm')[0] || {}) as OffenceOffenceCodeForm
    const offenceCode =
      offenceCodeForm.offenceCode ||
      this.offenceService.getSessionOffence(req.session, nomsId, courtCaseReference)?.offenceCode
    let backLink = `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/offences/${offenceReference}/offence-date`
    if (submitToEditOffence) {
      backLink = `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/offences/${offenceReference}/edit-offence`
    }
    return res.render('pages/offence/offence-code', {
      nomsId,
      courtCaseReference,
      offenceReference,
      appearanceReference,
      isAddOffences: this.isAddJourney(addOrEditCourtCase, addOrEditCourtAppearance),
      errors: req.flash('errors') || [],
      offenceCode,
      unknownCode: offenceCodeForm.unknownCode,
      addOrEditCourtCase,
      addOrEditCourtAppearance,
      submitToEditOffence,
      backLink,
    })
  }

  public submitOffenceCode: RequestHandler = async (req, res): Promise<void> => {
    const {
      nomsId,
      courtCaseReference,
      offenceReference,
      appearanceReference,
      addOrEditCourtCase,
      addOrEditCourtAppearance,
    } = req.params
    const { submitToEditOffence } = req.query
    const offenceCodeForm = trimForm<OffenceOffenceCodeForm>(req.body)
    const { errors, offence } = await this.offenceService.setOffenceCode(
      req.session,
      nomsId,
      courtCaseReference,
      req.user.token,
      offenceCodeForm,
    )
    if (errors.length > 0) {
      req.flash('errors', errors)
      req.flash('offenceCodeForm', { ...offenceCodeForm })
      return res.redirect(
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/offences/${offenceReference}/offence-code${submitToEditOffence ? '?submitToEditOffence=true' : ''}`,
      )
    }

    if (offenceCodeForm.unknownCode) {
      return res.redirect(
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/offences/${offenceReference}/offence-name${submitToEditOffence ? '?submitToEditOffence=true' : ''}`,
      )
    }

    if (offence.endDate) {
      const sessionOffence = this.offenceService.getSessionOffence(req.session, nomsId, courtCaseReference)
      const offenceEndDate = dayjs(offence.endDate)
      const enteredStartDate = dayjs(sessionOffence.offenceStartDate)
      if (offenceEndDate.isBefore(enteredStartDate)) {
        return res.redirect(
          `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/offences/${offenceReference}/inactive-offence?backTo=CODE${submitToEditOffence ? '&submitToEditOffence=true' : ''}`,
        )
      }
    }
    return res.redirect(
      `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/offences/${offenceReference}/confirm-offence-code${submitToEditOffence ? '?submitToEditOffence=true' : ''}`,
    )
  }

  public getOffenceName: RequestHandler = async (req, res): Promise<void> => {
    const {
      nomsId,
      courtCaseReference,
      offenceReference,
      appearanceReference,
      addOrEditCourtCase,
      addOrEditCourtAppearance,
    } = req.params
    const { submitToEditOffence } = req.query
    let offenceNameForm = (req.flash('offenceNameForm')[0] || {}) as OffenceOffenceNameForm
    if (Object.keys(offenceNameForm).length === 0) {
      const { offenceCode } = this.offenceService.getSessionOffence(req.session, nomsId, courtCaseReference)
      if (offenceCode) {
        const offence = await this.manageOffencesService.getOffenceByCode(offenceCode, res.locals.user.token)

        offenceNameForm = {
          offenceName: `${offence.code} ${offence.description}`,
        }
      }
    }
    return res.render('pages/offence/offence-name', {
      nomsId,
      courtCaseReference,
      offenceReference,
      appearanceReference,
      addOrEditCourtCase,
      addOrEditCourtAppearance,
      submitToEditOffence,
      offenceNameForm,
      isAddOffences: this.isAddJourney(addOrEditCourtCase, addOrEditCourtAppearance),
      errors: req.flash('errors') || [],
      backLink: `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/offences/${offenceReference}/offence-code`,
    })
  }

  public submitOffenceName: RequestHandler = async (req, res): Promise<void> => {
    const {
      nomsId,
      courtCaseReference,
      offenceReference,
      appearanceReference,
      addOrEditCourtCase,
      addOrEditCourtAppearance,
    } = req.params
    const { submitToEditOffence } = req.query
    const offenceNameForm = trimForm<OffenceOffenceNameForm>(req.body)
    const { errors, offence } = await this.offenceService.setOffenceCodeFromLookup(
      req.session,
      nomsId,
      courtCaseReference,
      res.locals.user.token,
      offenceNameForm,
    )
    if (errors.length > 0) {
      req.flash('errors', errors)
      req.flash('offenceNameForm', { ...offenceNameForm })
      return res.redirect(
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/offences/${offenceReference}/offence-name${submitToEditOffence ? '?submitToEditOffence=true' : ''}`,
      )
    }

    if (offence.endDate) {
      const sessionOffence = this.offenceService.getSessionOffence(req.session, nomsId, courtCaseReference)
      const offenceEndDate = dayjs(offence.endDate)
      const enteredStartDate = dayjs(sessionOffence.offenceStartDate)
      if (offenceEndDate.isBefore(enteredStartDate)) {
        return res.redirect(
          `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/offences/${offenceReference}/inactive-offence?backTo=NAME${submitToEditOffence ? '&submitToEditOffence=true' : ''}`,
        )
      }
    }

    if (submitToEditOffence) {
      return res.redirect(
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/offences/${offenceReference}/edit-offence`,
      )
    }
    return res.redirect(
      `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/offences/${offenceReference}/confirm-offence-code`,
    )
  }

  public getInactiveOffenceCode: RequestHandler = async (req, res): Promise<void> => {
    const {
      nomsId,
      courtCaseReference,
      offenceReference,
      appearanceReference,
      addOrEditCourtCase,
      addOrEditCourtAppearance,
    } = req.params
    const { submitToEditOffence, backTo } = req.query
    const offence = await this.manageOffencesService.getOffenceByCode(
      this.offenceService.getOffenceCode(req.session, nomsId, courtCaseReference),
      req.user.token,
    )

    return res.render('pages/offence/inactive-offence', {
      nomsId,
      courtCaseReference,
      offence,
      offenceReference,
      appearanceReference,
      addOrEditCourtCase,
      addOrEditCourtAppearance,
      submitToEditOffence,
      backTo,
      isAddOffences: this.isAddJourney(addOrEditCourtCase, addOrEditCourtAppearance),
      backLink:
        backTo === 'NAME'
          ? `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/offences/${offenceReference}/offence-name${submitToEditOffence ? '?submitToEditOffence=true' : ''}`
          : `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/offences/${offenceReference}/offence-code${submitToEditOffence ? '?submitToEditOffence=true' : ''}`,
    })
  }

  public getConfirmOffenceCode: RequestHandler = async (req, res): Promise<void> => {
    const {
      nomsId,
      courtCaseReference,
      offenceReference,
      appearanceReference,
      addOrEditCourtCase,
      addOrEditCourtAppearance,
    } = req.params
    const { submitToEditOffence } = req.query
    const offence = await this.manageOffencesService.getOffenceByCode(
      this.offenceService.getOffenceCode(req.session, nomsId, courtCaseReference),
      req.user.token,
    )

    return res.render('pages/offence/confirm-offence', {
      nomsId,
      courtCaseReference,
      offence,
      offenceReference,
      appearanceReference,
      addOrEditCourtCase,
      addOrEditCourtAppearance,
      submitToEditOffence,
      isAddOffences: this.isAddJourney(addOrEditCourtCase, addOrEditCourtAppearance),
      backLink: `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/offences/${offenceReference}/offence-code`,
    })
  }

  public submitConfirmOffenceCode: RequestHandler = async (req, res): Promise<void> => {
    const {
      nomsId,
      courtCaseReference,
      offenceReference,
      appearanceReference,
      addOrEditCourtCase,
      addOrEditCourtAppearance,
    } = req.params
    const confirmOffenceForm = trimForm<OffenceConfirmOffenceForm>(req.body)
    this.offenceService.setOffenceCodeFromConfirm(req.session, nomsId, courtCaseReference, confirmOffenceForm)
    const { submitToEditOffence } = req.query
    const caseOutcomeAppliedAll = this.courtAppearanceService.getCaseOutcomeAppliedAll(req.session, nomsId)
    if (caseOutcomeAppliedAll === 'true') {
      const { outcome } = await this.offenceService.setOffenceOutcome(
        req.session,
        nomsId,
        courtCaseReference,
        {
          offenceOutcome: this.courtAppearanceService.getRelatedOffenceOutcomeUuid(req.session, nomsId),
        },
        req.user.username,
      )

      if (submitToEditOffence) {
        return res.redirect(
          `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/offences/${offenceReference}/edit-offence`,
        )
      }
      if (outcome.outcomeType === 'SENTENCING') {
        return res.redirect(
          `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/offences/${offenceReference}/count-number`,
        )
      }
      return this.saveSessionOffenceInAppearance(
        req,
        res,
        nomsId,
        addOrEditCourtCase,
        courtCaseReference,
        addOrEditCourtAppearance,
        appearanceReference,
        offenceReference,
      )
    }
    if (submitToEditOffence) {
      return res.redirect(
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/offences/${offenceReference}/edit-offence`,
      )
    }
    return res.redirect(
      `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/offences/${offenceReference}/offence-outcome`,
    )
  }

  public getSentenceType: RequestHandler = async (req, res): Promise<void> => {
    const {
      nomsId,
      courtCaseReference,
      offenceReference,
      appearanceReference,
      addOrEditCourtCase,
      addOrEditCourtAppearance,
    } = req.params
    const { submitToEditOffence, invalidatedFrom } = req.query
    let offenceSentenceTypeForm = (req.flash('offenceSentenceTypeForm')[0] || {}) as OffenceSentenceTypeForm
    const offence = this.offenceService.getSessionOffence(req.session, nomsId, courtCaseReference)
    if (Object.keys(offenceSentenceTypeForm).length === 0) {
      offenceSentenceTypeForm = {
        sentenceType: offence?.sentence?.sentenceTypeId,
      }
    }
    const convictionDate = dayjs(offence?.sentence?.convictionDate)
    const prisonerDateOfBirth = dayjs(res.locals.prisoner.dateOfBirth)
    const ageAtConviction = convictionDate.diff(prisonerDateOfBirth, 'years')
    const offenceDate = dayjs(offence?.offenceEndDate ?? offence?.offenceStartDate)
    const sentenceTypes = (
      await this.remandAndSentencingService.getSentenceTypes(
        ageAtConviction,
        convictionDate,
        offenceDate,
        req.user.username,
      )
    ).sort((a, b) => a.displayOrder - b.displayOrder)
    let legacySentenceType
    if (
      offence.sentence?.sentenceTypeId &&
      !sentenceTypes.map(sentenceType => sentenceType.sentenceTypeUuid).includes(offence.sentence?.sentenceTypeId)
    ) {
      const sentenceType = await this.remandAndSentencingService.getSentenceTypeById(
        offence.sentence.sentenceTypeId,
        req.user.username,
      )
      legacySentenceType = sentenceType.description
    } else if (!offence.sentence?.sentenceTypeId && !res.locals.isAddCourtCase) {
      legacySentenceType = sentenceTypeValueOrLegacy(undefined, offence.sentence?.legacyData)
    }

    const courtAppearance = this.courtAppearanceService.getSessionCourtAppearance(req.session, nomsId)
    let backLink = `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/offences/${offenceReference}/conviction-date`
    if (courtAppearance.overallConvictionDateAppliedAll === 'true') {
      backLink = `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/offences/${offenceReference}/count-number`
    }

    const submitQuery = this.queryParametersToString(submitToEditOffence, invalidatedFrom)
    if (invalidatedFrom) {
      backLink = `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/offences/${offenceReference}/conviction-date${submitQuery}`
    } else if (submitToEditOffence) {
      backLink = `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/offences/${offenceReference}/edit-offence`
    }

    return res.render('pages/offence/sentence-type', {
      nomsId,
      courtCaseReference,
      offenceReference,
      appearanceReference,
      addOrEditCourtCase,
      addOrEditCourtAppearance,
      offenceSentenceTypeForm,
      sentenceTypes,
      legacySentenceType,
      isAddOffences: this.isAddJourney(addOrEditCourtCase, addOrEditCourtAppearance),
      errors: req.flash('errors') || [],
      backLink,
      submitQuery,
    })
  }

  public submitSentenceType: RequestHandler = async (req, res): Promise<void> => {
    const {
      nomsId,
      courtCaseReference,
      offenceReference,
      appearanceReference,
      addOrEditCourtCase,
      addOrEditCourtAppearance,
    } = req.params
    const { submitToEditOffence, invalidatedFrom } = req.query
    const submitQuery = this.queryParametersToString(submitToEditOffence, invalidatedFrom)
    const offenceSentenceTypeForm = trimForm<OffenceSentenceTypeForm>(req.body)
    const errors = this.offenceService.setSentenceType(
      req.session,
      nomsId,
      courtCaseReference,
      offenceReference,
      offenceSentenceTypeForm,
    )

    if (errors.length > 0) {
      req.flash('errors', errors)
      req.flash('offenceSentenceTypeForm', { ...offenceSentenceTypeForm })
      return res.redirect(
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/offences/${offenceReference}/sentence-type${submitQuery}`,
      )
    }

    const offence = this.offenceService.getSessionOffence(req.session, nomsId, courtCaseReference)
    this.offenceService.updatePeriodLengths(req.session, nomsId, courtCaseReference, offenceReference, offence)

    const nextPeriodLengthType = getNextPeriodLengthType(
      this.offenceService.getSessionOffence(req.session, nomsId, courtCaseReference).sentence ?? {
        sentenceReference: '',
      },
      null,
    )

    if (nextPeriodLengthType) {
      return res.redirect(
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/offences/${offenceReference}/period-length${this.periodLengthQueryParameterToString(nextPeriodLengthType, submitToEditOffence, invalidatedFrom)}`,
      )
    }

    if (submitToEditOffence) {
      return res.redirect(
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/offences/${offenceReference}/edit-offence`,
      )
    }

    return this.determineSentenceServeType(
      req,
      res,
      nomsId,
      addOrEditCourtCase,
      courtCaseReference,
      addOrEditCourtAppearance,
      appearanceReference,
      offenceReference,
    )
  }

  public getPeriodLength: RequestHandler = async (req, res): Promise<void> => {
    const {
      nomsId,
      courtCaseReference,
      offenceReference,
      appearanceReference,
      addOrEditCourtCase,
      addOrEditCourtAppearance,
    } = req.params
    const { submitToEditOffence, periodLengthType, invalidatedFrom } = req.query
    const submitQuery = this.periodLengthQueryParameterToString(periodLengthType, submitToEditOffence, invalidatedFrom)
    const { sentence } = this.offenceService.getSessionOffence(req.session, nomsId, courtCaseReference)
    const currentPeriodLength = sentence.periodLengths?.find(
      periodLength => periodLength.periodLengthType === periodLengthType,
    )
    let periodLengthForm = (req.flash('periodLengthForm')[0] || {}) as SentenceLengthForm
    if (Object.keys(periodLengthForm).length === 0) {
      periodLengthForm = sentenceLengthToSentenceLengthForm(currentPeriodLength)
    }
    const expectedPeriodLengthTypeIndex = sentenceTypePeriodLengths[sentence?.sentenceTypeClassification]?.periodLengths
      .map(periodLength => periodLength.type)
      .indexOf(periodLengthType as string)

    const periodLengthHeader =
      periodLengthTypeHeadings[periodLengthType as string]?.toLowerCase() ??
      currentPeriodLength?.legacyData?.sentenceTermDescription
    let backLink = `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/offences/${offenceReference}/sentence-type${this.queryParametersToString(submitToEditOffence, invalidatedFrom)}`
    if (submitToEditOffence) {
      backLink = `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/offences/${offenceReference}/edit-offence`
    } else if (expectedPeriodLengthTypeIndex >= 1) {
      const backSubmitQuery = this.periodLengthQueryParameterToString(
        sentenceTypePeriodLengths[sentence?.sentenceTypeClassification].periodLengths[expectedPeriodLengthTypeIndex - 1]
          .type,
        submitToEditOffence,
        invalidatedFrom,
      )
      backLink = `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/offences/${offenceReference}/period-length${backSubmitQuery}`
    }
    let sentenceTypeHint
    if (sentence?.sentenceTypeId) {
      sentenceTypeHint = (
        await this.remandAndSentencingService.getSentenceTypeById(sentence.sentenceTypeId, req.user.username)
      ).hintText
    }
    return res.render('pages/offence/period-length', {
      nomsId,
      courtCaseReference,
      offenceReference,
      appearanceReference,
      addOrEditCourtCase,
      addOrEditCourtAppearance,
      periodLengthType,
      periodLengthForm,
      periodLengthHeader,
      sentenceTypeHint,
      isAddOffences: this.isAddJourney(addOrEditCourtCase, addOrEditCourtAppearance),
      errors: req.flash('errors') || [],
      backLink,
      submitQuery,
    })
  }

  public submitPeriodLength: RequestHandler = async (req, res): Promise<void> => {
    const {
      nomsId,
      courtCaseReference,
      offenceReference,
      appearanceReference,
      addOrEditCourtCase,
      addOrEditCourtAppearance,
    } = req.params
    const { submitToEditOffence, periodLengthType, invalidatedFrom } = req.query
    const submitQuery = this.periodLengthQueryParameterToString(periodLengthType, submitToEditOffence, invalidatedFrom)
    const offenceSentenceLengthForm = trimForm<SentenceLengthForm>(req.body)
    const { sentence } = this.offenceService.getSessionOffence(req.session, nomsId, courtCaseReference)
    this.offenceService.setInitialPeriodLengths(
      req.session,
      nomsId,
      courtCaseReference,
      offenceReference,
      sentence?.periodLengths ?? [],
    )
    const errors = this.offenceService.setPeriodLength(
      req.session,
      nomsId,
      courtCaseReference,
      offenceReference,
      offenceSentenceLengthForm,
      periodLengthType as string,
    )
    if (errors.length > 0) {
      req.flash('errors', errors)
      req.flash('offenceSentenceLengthForm', { ...offenceSentenceLengthForm })
      return res.redirect(
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/offences/${offenceReference}/period-length${submitQuery}`,
      )
    }

    if (sentence.sentenceTypeClassification === 'FINE') {
      return res.redirect(
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/offences/${offenceReference}/fine-amount${submitQuery}`,
      )
    }
    const allPeriodLengthsEntered = allPeriodLengthTypesEntered(sentence)
    const nextPeriodLengthType = getNextPeriodLengthType(sentence, periodLengthType as string)
    if (nextPeriodLengthType && !allPeriodLengthsEntered) {
      return res.redirect(
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/offences/${offenceReference}/period-length${this.periodLengthQueryParameterToString(nextPeriodLengthType, submitToEditOffence, invalidatedFrom)}`,
      )
    }

    if (submitToEditOffence || invalidatedFrom) {
      return res.redirect(
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/offences/${offenceReference}/edit-offence`,
      )
    }
    return this.determineSentenceServeType(
      req,
      res,
      nomsId,
      addOrEditCourtCase,
      courtCaseReference,
      addOrEditCourtAppearance,
      appearanceReference,
      offenceReference,
    )
  }

  public getFineAmount: RequestHandler = async (req, res): Promise<void> => {
    const {
      nomsId,
      courtCaseReference,
      offenceReference,
      appearanceReference,
      addOrEditCourtCase,
      addOrEditCourtAppearance,
    } = req.params
    const { submitToEditOffence, invalidatedFrom, periodLengthType } = req.query
    const submitQuery = this.periodLengthQueryParameterToString(periodLengthType, submitToEditOffence, invalidatedFrom)
    let offenceFineAmountForm = (req.flash('offenceFineAmountForm')[0] || {}) as OffenceFineAmountForm
    const { sentence } = this.offenceService.getSessionOffence(req.session, nomsId, courtCaseReference)
    if (Object.keys(offenceFineAmountForm).length === 0) {
      offenceFineAmountForm = {
        fineAmount: sentence?.fineAmount,
      }
    }

    let backLink = `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/offences/${offenceReference}/period-length${submitQuery}`
    if (submitToEditOffence && !invalidatedFrom) {
      backLink = `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/offences/${offenceReference}/edit-offence`
    }

    return res.render('pages/offence/fine-amount', {
      nomsId,
      courtCaseReference,
      appearanceReference,
      addOrEditCourtCase,
      addOrEditCourtAppearance,
      offenceFineAmountForm,
      offenceReference,
      backLink,
      isAddOffences: this.isAddJourney(addOrEditCourtCase, addOrEditCourtAppearance),
      errors: req.flash('errors') || [],
      submitQuery,
    })
  }

  public submitFineAmount: RequestHandler = async (req, res): Promise<void> => {
    const {
      nomsId,
      courtCaseReference,
      appearanceReference,
      addOrEditCourtCase,
      addOrEditCourtAppearance,
      offenceReference,
    } = req.params
    const { submitToEditOffence } = req.query
    const offenceFineAmountForm = trimForm<OffenceFineAmountForm>(req.body)
    const errors = this.offenceService.setOffenceFineAmount(
      req.session,
      nomsId,
      courtCaseReference,
      offenceReference,
      offenceFineAmountForm,
    )

    if (errors.length > 0) {
      req.flash('errors', errors)
      req.flash('offenceFineAmountForm', { ...offenceFineAmountForm })
      return res.redirect(
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/offences/${offenceReference}/fine-amount${submitToEditOffence ? '?submitToEditOffence=true' : ''}`,
      )
    }

    if (submitToEditOffence) {
      return res.redirect(
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/offences/${offenceReference}/edit-offence`,
      )
    }
    return this.determineSentenceServeType(
      req,
      res,
      nomsId,
      addOrEditCourtCase,
      courtCaseReference,
      addOrEditCourtAppearance,
      appearanceReference,
      offenceReference,
    )
  }

  public getAlternativePeriodLength: RequestHandler = async (req, res): Promise<void> => {
    const {
      nomsId,
      courtCaseReference,
      offenceReference,
      appearanceReference,
      addOrEditCourtCase,
      addOrEditCourtAppearance,
    } = req.params
    const { submitToEditOffence, periodLengthType, invalidatedFrom } = req.query
    const submitQuery = this.periodLengthQueryParameterToString(periodLengthType, submitToEditOffence, invalidatedFrom)
    const { sentence } = this.offenceService.getSessionOffence(req.session, nomsId, courtCaseReference)
    let offenceAlternativeSentenceLengthForm = (req.flash('offenceAlternativeSentenceLengthForm')[0] ||
      {}) as OffenceAlternativePeriodLengthForm
    if (Object.keys(offenceAlternativeSentenceLengthForm).length === 0) {
      offenceAlternativeSentenceLengthForm = sentenceLengthToAlternativeSentenceLengthForm(
        sentence?.periodLengths?.find(periodLength => periodLength.periodLengthType === periodLengthType),
      )
    }
    const currentPeriodLength = sentence.periodLengths?.find(
      periodLength => periodLength.periodLengthType === periodLengthType,
    )
    const periodLengthHeader =
      periodLengthTypeHeadings[periodLengthType as string]?.toLowerCase() ??
      currentPeriodLength?.legacyData?.sentenceTermDescription

    return res.render('pages/offence/alternative-period-length', {
      nomsId,
      courtCaseReference,
      offenceReference,
      appearanceReference,
      addOrEditCourtCase,
      addOrEditCourtAppearance,
      offenceAlternativeSentenceLengthForm,
      isAddOffences: this.isAddJourney(addOrEditCourtCase, addOrEditCourtAppearance),
      errors: req.flash('errors') || [],
      backLink: `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/offences/${offenceReference}/period-length${submitQuery}`,
      periodLengthType,
      periodLengthHeader,
      submitQuery,
    })
  }

  public submitAlternativePeriodLength: RequestHandler = async (req, res): Promise<void> => {
    const {
      nomsId,
      courtCaseReference,
      offenceReference,
      appearanceReference,
      addOrEditCourtCase,
      addOrEditCourtAppearance,
    } = req.params
    const { periodLengthType, submitToEditOffence, invalidatedFrom } = req.query
    const submitQuery = this.periodLengthQueryParameterToString(periodLengthType, submitToEditOffence, invalidatedFrom)
    const offenceAlternativeSentenceLengthForm = trimForm<OffenceAlternativePeriodLengthForm>(req.body)
    const { sentence } = this.offenceService.getSessionOffence(req.session, nomsId, courtCaseReference)
    this.offenceService.setInitialPeriodLengths(
      req.session,
      nomsId,
      courtCaseReference,
      offenceReference,
      sentence?.periodLengths ?? [],
    )
    const errors = this.offenceService.setAlternativePeriodLength(
      req.session,
      nomsId,
      courtCaseReference,
      offenceReference,
      offenceAlternativeSentenceLengthForm,
      periodLengthType as string,
    )
    if (errors.length > 0) {
      req.flash('errors', errors)
      req.flash('offenceAlternativeSentenceLengthForm', { ...offenceAlternativeSentenceLengthForm })
      return res.redirect(
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/offences/${offenceReference}/alternative-period-length${submitQuery}`,
      )
    }
    if (sentence.sentenceTypeClassification === 'FINE') {
      return res.redirect(
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/offences/${offenceReference}/fine-amount${submitQuery}`,
      )
    }
    const allPeriodLengthsEntered = allPeriodLengthTypesEntered(sentence)
    const nextPeriodLengthType = getNextPeriodLengthType(sentence, periodLengthType as string)
    if (nextPeriodLengthType && !allPeriodLengthsEntered) {
      return res.redirect(
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/offences/${offenceReference}/period-length${this.periodLengthQueryParameterToString(nextPeriodLengthType, submitToEditOffence, invalidatedFrom)}`,
      )
    }

    if (submitToEditOffence) {
      return res.redirect(
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/offences/${offenceReference}/edit-offence`,
      )
    }
    return this.determineSentenceServeType(
      req,
      res,
      nomsId,
      addOrEditCourtCase,
      courtCaseReference,
      addOrEditCourtAppearance,
      appearanceReference,
      offenceReference,
    )
  }

  public getSelectConsecutiveConcurrent: RequestHandler = async (req, res): Promise<void> => {
    const {
      nomsId,
      courtCaseReference,
      offenceReference,
      appearanceReference,
      addOrEditCourtCase,
      addOrEditCourtAppearance,
    } = req.params

    const offence = this.courtAppearanceService.getOffence(req.session, nomsId, parseInt(offenceReference, 10))
    this.offenceService.setSessionOffence(req.session, nomsId, courtCaseReference, offence)
    return res.redirect(
      `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/offences/${offenceReference}/sentence-serve-type?invalidatedFrom=${InvalidatedFrom.DELETE_CHAIN}`,
    )
  }

  public getSentenceServeType: RequestHandler = async (req, res): Promise<void> => {
    const {
      nomsId,
      courtCaseReference,
      offenceReference,
      appearanceReference,
      addOrEditCourtCase,
      addOrEditCourtAppearance,
    } = req.params
    const { submitToEditOffence, invalidatedFrom } = req.query
    const forthwithAlreadySelected = this.courtAppearanceService.isForwithAlreadySelected(
      req.session,
      nomsId,
      parseInt(offenceReference, 10),
    )
    const { sentence } = this.offenceService.getSessionOffence(req.session, nomsId, courtCaseReference)
    const sentenceServeType = sentence?.sentenceServeType
    const expectedPeriodLengthsSize =
      sentenceTypePeriodLengths[sentence?.sentenceTypeClassification]?.periodLengths?.length
    const submitQuery = this.queryParametersToString(submitToEditOffence, invalidatedFrom)
    let backLink = `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/offences/${offenceReference}/sentence-type`
    if (invalidatedFrom) {
      backLink = `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/offences/check-offence-answers`
    } else if (submitToEditOffence) {
      backLink = `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/offences/${offenceReference}/edit-offence`
    } else if (sentence?.sentenceTypeClassification === 'FINE') {
      backLink = `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/offences/${offenceReference}/fine-amount`
    } else if (expectedPeriodLengthsSize) {
      backLink = `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/offences/${offenceReference}/period-length?periodLengthType=${
        sentenceTypePeriodLengths[sentence.sentenceTypeClassification].periodLengths[expectedPeriodLengthsSize - 1].type
      }`
    }
    return res.render('pages/offence/sentence-serve-type', {
      nomsId,
      courtCaseReference,
      offenceReference,
      appearanceReference,
      addOrEditCourtCase,
      addOrEditCourtAppearance,
      errors: req.flash('errors') || [],
      showForthwith: sentenceServeType === 'FORTHWITH' || !forthwithAlreadySelected,
      isAddOffences: this.isAddJourney(addOrEditCourtCase, addOrEditCourtAppearance),
      sentenceServeType,
      submitQuery,
      backLink,
    })
  }

  public submitSentenceServeType: RequestHandler = async (req, res): Promise<void> => {
    const {
      nomsId,
      courtCaseReference,
      offenceReference,
      appearanceReference,
      addOrEditCourtCase,
      addOrEditCourtAppearance,
    } = req.params
    const { submitToEditOffence, invalidatedFrom } = req.query
    const submitQuery = this.queryParametersToString(submitToEditOffence, invalidatedFrom)
    const offenceSentenceServeTypeForm = trimForm<OffenceSentenceServeTypeForm>(req.body)
    const existingSentenceServeType = this.offenceService.getSentenceServeType(req.session, nomsId, courtCaseReference)
    const sentenceIsInChain = this.courtAppearanceService.sentenceIsInChain(
      req.session,
      nomsId,
      parseInt(offenceReference, 10),
    )
    const errors = this.offenceService.setSentenceServeType(
      req.session,
      nomsId,
      courtCaseReference,
      offenceReference,
      offenceSentenceServeTypeForm,
      existingSentenceServeType,
      sentenceIsInChain,
    )

    if (errors.length > 0) {
      req.flash('errors', errors)
      return res.redirect(
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/offences/${offenceReference}/sentence-serve-type${submitQuery}`,
      )
    }

    const serveType = offenceSentenceServeTypeForm.sentenceServeType
    const isConsecutive = serveType === extractKeyValue(sentenceServeTypes, sentenceServeTypes.CONSECUTIVE)
    const redirectBase = `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/sentencing/offences/${offenceReference}`

    if (submitToEditOffence) {
      const newType = serveType

      if (sentenceIsInChain && existingSentenceServeType !== newType) {
        if (newType === extractKeyValue(sentenceServeTypes, sentenceServeTypes.CONCURRENT)) {
          return res.redirect(`${redirectBase}/making-sentence-concurrent${submitQuery}`)
        }
        if (newType === extractKeyValue(sentenceServeTypes, sentenceServeTypes.FORTHWITH)) {
          return res.redirect(`${redirectBase}/making-sentence-forthwith${submitQuery}`)
        }
        if (isConsecutive) {
          return res.redirect(`${redirectBase}/making-sentence-consecutive${submitQuery}`)
        }
      }
      if (isConsecutive) {
        return res.redirect(`${redirectBase}/sentence-consecutive-to${submitQuery}`)
      }

      this.courtAppearanceService.resetConsecutiveFields(req.session, nomsId, parseInt(offenceReference, 10))

      // Go back to edit screen as fallback
      return res.redirect(
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/offences/${offenceReference}/edit-offence`,
      )
    }

    if (isConsecutive) {
      return res.redirect(`${redirectBase}/sentence-consecutive-to${submitQuery}`)
    }

    return this.saveSessionOffenceInAppearance(
      req,
      res,
      nomsId,
      addOrEditCourtCase,
      courtCaseReference,
      addOrEditCourtAppearance,
      appearanceReference,
      offenceReference,
    )
  }

  public getConvictionDate: RequestHandler = async (req, res): Promise<void> => {
    const {
      nomsId,
      courtCaseReference,
      offenceReference,
      appearanceReference,
      addOrEditCourtCase,
      addOrEditCourtAppearance,
    } = req.params
    const offenceConvictionDateForm = (req.flash('offenceConvictionDateForm')[0] || {}) as OffenceConvictionDateForm
    const { submitToEditOffence, invalidatedFrom } = req.query
    let convictionDateDay: number | string = offenceConvictionDateForm['convictionDate-day']
    let convictionDateMonth: number | string = offenceConvictionDateForm['convictionDate-month']
    let convictionDateYear: number | string = offenceConvictionDateForm['convictionDate-year']
    const convictionDateValue = this.offenceService.getSessionOffence(req.session, nomsId, courtCaseReference).sentence
      ?.convictionDate
    if (convictionDateValue && Object.keys(offenceConvictionDateForm).length === 0) {
      const convictionDate = new Date(convictionDateValue)
      convictionDateDay = convictionDate.getDate()
      convictionDateMonth = convictionDate.getMonth() + 1
      convictionDateYear = convictionDate.getFullYear()
    }
    const submitQuery = this.queryParametersToString(submitToEditOffence, invalidatedFrom)
    let backLink = `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/offences/${offenceReference}/count-number`
    if (invalidatedFrom) {
      const invalidatedFromType = InvalidatedFrom[invalidatedFrom as keyof typeof InvalidatedFrom]
      if (invalidatedFromType === InvalidatedFrom.OFFENCE_DATE) {
        backLink = `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/offences/${offenceReference}/offence-date${submitQuery}`
      } else {
        backLink = `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/offences/${offenceReference}/edit-offence`
      }
    } else if (submitToEditOffence) {
      backLink = `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/offences/${offenceReference}/edit-offence`
    }

    return res.render('pages/offence/offence-conviction-date', {
      nomsId,
      courtCaseReference,
      offenceReference,
      appearanceReference,
      addOrEditCourtCase,
      addOrEditCourtAppearance,
      convictionDateDay,
      convictionDateMonth,
      convictionDateYear,
      isAddOffences: this.isAddJourney(addOrEditCourtCase, addOrEditCourtAppearance),
      errors: req.flash('errors') || [],
      submitQuery,
      backLink,
    })
  }

  public submitConvictionDate: RequestHandler = async (req, res): Promise<void> => {
    const {
      nomsId,
      courtCaseReference,
      offenceReference,
      appearanceReference,
      addOrEditCourtCase,
      addOrEditCourtAppearance,
    } = req.params
    const { submitToEditOffence, invalidatedFrom } = req.query
    const submitQuery = this.queryParametersToString(submitToEditOffence, invalidatedFrom)
    const offenceConvictionDateForm = trimForm<OffenceConvictionDateForm>(req.body)

    const errors = this.offenceService.setConvictionDateForm(
      req.session,
      nomsId,
      courtCaseReference,
      offenceReference,
      offenceConvictionDateForm,
      addOrEditCourtAppearance,
      this.courtAppearanceService.getWarrantDate(req.session, nomsId),
    )
    if (errors.length > 0) {
      req.flash('errors', errors)
      req.flash('offenceConvictionDateForm', { ...offenceConvictionDateForm })
      return res.redirect(
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/offences/${offenceReference}/conviction-date${submitQuery}`,
      )
    }

    if (invalidatedFrom) {
      return res.redirect(
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/offences/${offenceReference}/sentence-type${submitQuery}`,
      )
    }
    if (submitToEditOffence) {
      const offence = this.offenceService.getSessionOffence(req.session, nomsId, courtCaseReference)
      const hasInvalidatedOffence = await this.courtAppearanceService.checkConvictionDateHasInvalidatedOffence(
        req.session,
        nomsId,
        parseInt(offenceReference, 10),
        offence,
        res.locals.prisoner.dateOfBirth,
        req.user.username,
      )
      if (hasInvalidatedOffence) {
        this.offenceService.invalidateFromConvictionDate(req.session, nomsId, courtCaseReference, offenceReference)
        return res.redirect(
          `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/offences/${offenceReference}/sentence-type?invalidatedFrom=${InvalidatedFrom.CONVICTION_DATE}`,
        )
      }
      return res.redirect(
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/offences/${offenceReference}/edit-offence`,
      )
    }
    return res.redirect(
      `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/offences/${offenceReference}/sentence-type`,
    )
  }

  private periodLengthQueryParameterToString(periodLengthType, submitToEditOffence, invalidatedFrom): string {
    const submitQueries: string[] = [`periodLengthType=${periodLengthType}`]
    if (submitToEditOffence) {
      submitQueries.push('submitToEditOffence=true')
    }
    if (invalidatedFrom) {
      submitQueries.push(`invalidatedFrom=${invalidatedFrom}`)
    }
    return `?${submitQueries.join('&')}`
  }

  public getCheckOffenceAnswers: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, appearanceReference, addOrEditCourtCase, addOrEditCourtAppearance } = req.params
    const courtAppearance = this.courtAppearanceService.getSessionCourtAppearance(req.session, nomsId)
    const consecutiveToSentenceDetails = await this.getSessionConsecutiveToSentenceDetails(req, nomsId)
    const sentenceTypeIds = Array.from(
      new Set(
        courtAppearance.offences
          .filter(offence => offence.sentence?.sentenceTypeId)
          .map(offence => offence.sentence?.sentenceTypeId),
      ),
    )
    const offenceCodes = Array.from(
      new Set(
        courtAppearance.offences
          .map(offence => offence.offenceCode)
          .concat(consecutiveToSentenceDetails.sentences.map(consecutiveToDetails => consecutiveToDetails.offenceCode)),
      ),
    )
    const outcomeIds = Array.from(new Set(courtAppearance.offences.map(offence => offence.outcomeUuid)))
    const courtIds = Array.from(
      new Set(consecutiveToSentenceDetails.sentences.map(consecutiveToDetails => consecutiveToDetails.courtCode)),
    )
    const [offenceMap, sentenceTypeMap, outcomeMap, overallSentenceLengthComparison, courtMap] = await Promise.all([
      this.manageOffencesService.getOffenceMap(offenceCodes, req.user.token),
      this.remandAndSentencingService.getSentenceTypeMap(sentenceTypeIds, req.user.username),
      this.offenceOutcomeService.getOutcomeMap(outcomeIds, req.user.username),
      this.calculateReleaseDatesService.compareOverallSentenceLength(courtAppearance, req.user.username),
      this.courtRegisterService.getCourtMap(courtIds, req.user.username),
    ])

    const offences = courtAppearance.offences.map((offence, index) => {
      return { ...offence, index }
    })

    const [custodialOffences, nonCustodialOffences] = offences.reduce(
      ([custodialList, nonCustodialList], offence, index) => {
        return outcomeMap[offence.outcomeUuid].outcomeType === 'SENTENCING'
          ? [[...custodialList, { ...offence, index }], nonCustodialList]
          : [custodialList, [...nonCustodialList, { ...offence, index }]]
      },
      [[], []],
    )

    const showCountWarning = custodialOffences.some(
      offence => !offence.sentence?.countNumber || offence.sentence?.countNumber === '-1',
    )
    const allSentenceUuids = offences
      .map(offence => offence.sentence?.sentenceUuid)
      .filter(sentenceUuid => sentenceUuid)
    const consecutiveToSentenceDetailsMap = this.getConsecutiveToSentenceDetailsMap(
      allSentenceUuids,
      consecutiveToSentenceDetails,
      offenceMap,
      courtMap,
    )
    const sessionConsecutiveToSentenceDetailsMap = this.getSessionConsecutiveToSentenceDetailsMap(
      req,
      nomsId,
      offenceMap,
    )
    return res.render('pages/offence/check-offence-answers', {
      nomsId,
      courtCaseReference,
      courtAppearance,
      appearanceReference,
      addOrEditCourtCase,
      addOrEditCourtAppearance,
      offenceMap,
      sentenceTypeMap,
      outcomeMap,
      overallSentenceLengthComparison,
      offences,
      custodialOffences,
      nonCustodialOffences,
      showCountWarning,
      consecutiveToSentenceDetailsMap,
      sessionConsecutiveToSentenceDetailsMap,
      isAddOffences: this.isAddJourney(addOrEditCourtCase, addOrEditCourtAppearance),
      errors: req.flash('errors') || [],
    })
  }

  public submitCheckOffenceAnswers: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, appearanceReference, addOrEditCourtCase, addOrEditCourtAppearance } = req.params
    const offenceFinishedAddingForm = trimForm<OffenceFinishedAddingForm>(req.body)
    let errors = this.courtAppearanceService.checkFinishingOffences(offenceFinishedAddingForm)
    if (offenceFinishedAddingForm.finishedAddingOffences === 'true') {
      const offenceErrors = this.courtAppearanceService.checkOffencesHaveMandatoryFields(req.session, nomsId)
      errors = errors.concat(offenceErrors)
    }
    if (errors.length > 0) {
      req.flash('errors', errors)
      return res.redirect(
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/offences/check-offence-answers`,
      )
    }
    const courtAppearance = this.courtAppearanceService.getSessionCourtAppearance(req.session, nomsId)
    if (
      courtAppearance.warrantType === 'SENTENCING' &&
      offenceFinishedAddingForm.finishedAddingOffences === 'true' &&
      courtAppearance.hasOverallSentenceLength
    ) {
      const overallSentenceComparison = await this.calculateReleaseDatesService.compareOverallSentenceLength(
        courtAppearance,
        req.user.username,
      )
      if (
        overallSentenceComparison.custodialLengthMatches === false ||
        overallSentenceComparison.licenseLengthMatches === false
      ) {
        return res.redirect(
          `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/offences/sentence-length-mismatch`,
        )
      }
    }
    this.courtAppearanceService.setOffenceSentenceAccepted(
      req.session,
      nomsId,
      offenceFinishedAddingForm.finishedAddingOffences === 'true',
    )
    return res.redirect(
      `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/task-list`,
    )
  }

  public getSentenceLengthMismatch: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, appearanceReference, addOrEditCourtCase, addOrEditCourtAppearance } = req.params
    const courtAppearance = this.courtAppearanceService.getSessionCourtAppearance(req.session, nomsId)

    const overallSentenceLengthComparison = await this.calculateReleaseDatesService.compareOverallSentenceLength(
      courtAppearance,
      req.user.username,
    )
    const isAddJourney = this.isAddJourney(addOrEditCourtCase, addOrEditCourtAppearance)
    let backLink = `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/update-offence-outcomes`
    if (isAddJourney) {
      backLink = `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/offences/check-offence-answers`
    }

    return res.render('pages/offence/sentence-length-mismatch', {
      nomsId,
      courtCaseReference,
      courtAppearance,
      appearanceReference,
      addOrEditCourtCase,
      addOrEditCourtAppearance,
      overallSentenceLengthComparison,
      backLink,
      isAddJourney,
    })
  }

  public continueSentenceLengthMismatch: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, appearanceReference, addOrEditCourtCase, addOrEditCourtAppearance } = req.params
    this.courtAppearanceService.setOffenceSentenceAccepted(req.session, nomsId, true)
    return res.redirect(
      `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/task-list`,
    )
  }

  public addAnotherOffence: RequestHandler = async (req, res): Promise<void> => {
    const {
      nomsId,
      courtCaseReference,
      offenceReference,
      appearanceReference,
      addOrEditCourtCase,
      addOrEditCourtAppearance,
    } = req.params
    this.offenceService.clearOffence(req.session, nomsId, courtCaseReference)
    return res.redirect(
      `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/offences/${offenceReference}/offence-date`,
    )
  }

  public getDeleteOffence: RequestHandler = async (req, res): Promise<void> => {
    const {
      nomsId,
      courtCaseReference,
      offenceReference,
      appearanceReference,
      addOrEditCourtCase,
      addOrEditCourtAppearance,
    } = req.params
    const courtAppearance = this.courtAppearanceService.getSessionCourtAppearance(req.session, nomsId)
    const offence = courtAppearance.offences[parseInt(offenceReference, 10)]
    const consecutiveToSentenceDetails = await this.remandAndSentencingService.getConsecutiveToDetails(
      [offence.sentence?.consecutiveToSentenceUuid],
      req.user.username,
    )
    let sessionConsecutiveTo
    if (offence.sentence?.consecutiveToSentenceReference) {
      sessionConsecutiveTo = courtAppearance.offences.find(
        appearanceOffence =>
          appearanceOffence.sentence?.sentenceReference === offence.sentence?.consecutiveToSentenceReference,
      )
    }

    const [offenceMap, courtMap] = await Promise.all([
      this.manageOffencesService.getOffenceMap(
        Array.from(
          new Set(
            [offence.offenceCode, sessionConsecutiveTo?.offenceCode].concat(
              consecutiveToSentenceDetails.sentences.map(consecutiveToDetails => consecutiveToDetails.offenceCode),
            ),
          ),
        ),
        req.user.token,
      ),
      this.courtRegisterService.getCourtMap(
        consecutiveToSentenceDetails.sentences.map(consecutiveToDetails => consecutiveToDetails.courtCode),
        req.user.username,
      ),
    ])
    let sentenceType
    if (offence.sentence?.sentenceTypeId) {
      sentenceType = await this.remandAndSentencingService.getSentenceTypeById(
        offence.sentence?.sentenceTypeId,
        req.user.username,
      )
    }
    let outcome
    if (offence.outcomeUuid) {
      outcome = (await this.offenceOutcomeService.getOutcomeById(offence.outcomeUuid, req.user.username)).outcomeName
    }
    const allSentenceUuids = courtAppearance.offences
      .map(appearanceOffence => appearanceOffence.sentence?.sentenceUuid)
      .filter(sentenceUuid => sentenceUuid)
    const consecutiveToSentenceDetailsMap = this.getConsecutiveToSentenceDetailsMap(
      allSentenceUuids,
      consecutiveToSentenceDetails,
      offenceMap,
      courtMap,
    )
    let sessionConsecutiveToSentenceDetailsMap = {}
    if (sessionConsecutiveTo) {
      sessionConsecutiveToSentenceDetailsMap = {
        [offence.sentence?.consecutiveToSentenceReference]: {
          countNumber: sessionConsecutiveTo.sentence.countNumber,
          offenceCode: sessionConsecutiveTo.offenceCode,
          offenceDescription: offenceMap[sessionConsecutiveTo.offenceCode],
        } as ConsecutiveToDetails,
      }
    }
    let cancelLink = `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/offences/check-offence-answers`
    if (this.isEditJourney(addOrEditCourtCase, addOrEditCourtAppearance)) {
      if (courtAppearance.warrantType === 'SENTENCING') {
        cancelLink = `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/sentencing/appearance-details`
      } else {
        cancelLink = `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/remand/appearance-details`
      }
    }

    return res.render('pages/offence/delete-offence', {
      nomsId,
      courtCaseReference,
      offence,
      offenceReference,
      appearanceReference,
      addOrEditCourtCase,
      addOrEditCourtAppearance,
      errors: req.flash('errors') || [],
      offenceMap,
      sentenceType,
      consecutiveToSentenceDetailsMap,
      sessionConsecutiveToSentenceDetailsMap,
      isAddOffences: this.isAddJourney(addOrEditCourtCase, addOrEditCourtAppearance),
      isEditJourney: this.isEditJourney(addOrEditCourtCase, addOrEditCourtAppearance),
      outcome,
      cancelLink,
    })
  }

  public submitDeleteOffence: RequestHandler = async (req, res): Promise<void> => {
    const {
      nomsId,
      courtCaseReference,
      offenceReference,
      appearanceReference,
      addOrEditCourtCase,
      addOrEditCourtAppearance,
    } = req.params

    const sentenceIsInChain = this.courtAppearanceService.sentenceIsInChain(
      req.session,
      nomsId,
      parseInt(offenceReference, 10),
    )

    if (sentenceIsInChain) {
      return res.redirect(
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/sentencing/offences/${offenceReference}/delete-sentence-in-chain`,
      )
    }
    this.courtAppearanceService.deleteOffence(req.session, nomsId, parseInt(offenceReference, 10))
    if (this.isEditJourney(addOrEditCourtCase, addOrEditCourtAppearance)) {
      const warrantType = this.courtAppearanceService.getWarrantType(req.session, nomsId)
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
      `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/offences/check-offence-answers`,
    )
  }

  public loadEditOffence: RequestHandler = async (req, res): Promise<void> => {
    const {
      nomsId,
      courtCaseReference,
      offenceReference,
      appearanceReference,
      addOrEditCourtCase,
      addOrEditCourtAppearance,
    } = req.params
    const offence = this.courtAppearanceService.getOffence(req.session, nomsId, parseInt(offenceReference, 10))
    this.offenceService.setSessionOffence(req.session, nomsId, courtCaseReference, offence)
    return res.redirect(
      `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/offences/${offenceReference}/edit-offence`,
    )
  }

  public getEditOffence: RequestHandler = async (req, res): Promise<void> => {
    const {
      nomsId,
      courtCaseReference,
      offenceReference,
      appearanceReference,
      addOrEditCourtCase,
      addOrEditCourtAppearance,
    } = req.params
    const offence = this.offenceService.getSessionOffence(req.session, nomsId, courtCaseReference)
    const courtCodes = []
    const offenceCodes = [offence.offenceCode]
    let sentenceConsecutiveToDetails: SentenceConsecutiveToDetails | undefined
    let consecutiveToOffence
    if (offence.sentence?.consecutiveToSentenceUuid) {
      const consecutiveToDetails = await this.remandAndSentencingService.getConsecutiveToDetails(
        [offence.sentence.consecutiveToSentenceUuid],
        req.user.username,
      )
      // eslint-disable-next-line prefer-destructuring
      sentenceConsecutiveToDetails = consecutiveToDetails.sentences[0]
      courtCodes.push(sentenceConsecutiveToDetails.courtCode)
      offenceCodes.push(sentenceConsecutiveToDetails.offenceCode)
    } else if (offence.sentence?.consecutiveToSentenceReference) {
      consecutiveToOffence = this.courtAppearanceService.getOffenceBySentenceReference(
        req.session,
        nomsId,
        offence.sentence.consecutiveToSentenceReference,
      )
      offenceCodes.push(consecutiveToOffence.offenceCode)
    }
    const [offenceMap, courtMap] = await Promise.all([
      await this.manageOffencesService.getOffenceMap(offenceCodes, req.user.token),
      await this.courtRegisterService.getCourtMap(courtCodes, req.user.username),
    ])

    let sentenceType: string
    if (offence.sentence) {
      if (offence.sentence.sentenceTypeId) {
        sentenceType = (
          await this.remandAndSentencingService.getSentenceTypeById(offence.sentence?.sentenceTypeId, req.user.username)
        ).description
      }
    }
    let outcome
    if (offence.outcomeUuid) {
      outcome = (await this.offenceOutcomeService.getOutcomeById(offence.outcomeUuid, req.user.username)).outcomeName
    }
    let consecutiveToDetails
    if (offence.sentence?.consecutiveToSentenceUuid) {
      consecutiveToDetails = sentenceConsecutiveToDetailsToConsecutiveToDetails(
        sentenceConsecutiveToDetails,
        offenceMap,
        courtMap,
        false,
      )
    } else if (offence.sentence?.consecutiveToSentenceReference) {
      consecutiveToDetails = offenceToConsecutiveToDetails(consecutiveToOffence, offenceMap)
    }

    return res.render('pages/offence/edit-offence', {
      nomsId,
      courtCaseReference,
      offence,
      offenceReference,
      appearanceReference,
      addOrEditCourtCase,
      addOrEditCourtAppearance,
      errors: req.flash('errors') || [],
      offenceMap,
      sentenceType,
      outcome,
      periodLengthTypeHeadings,
      isAddOffences: this.isAddJourney(addOrEditCourtCase, addOrEditCourtAppearance),
      consecutiveToDetails,
    })
  }

  public submitEditOffence: RequestHandler = async (req, res): Promise<void> => {
    const {
      nomsId,
      courtCaseReference,
      offenceReference,
      appearanceReference,
      addOrEditCourtCase,
      addOrEditCourtAppearance,
    } = req.params
    const offence = this.offenceService.getSessionOffence(req.session, nomsId, courtCaseReference)
    this.saveOffenceInAppearance(req, nomsId, courtCaseReference, offenceReference, offence)
    const warrantType = this.courtAppearanceService.getWarrantType(req.session, nomsId)

    if (this.isEditJourney(addOrEditCourtCase, addOrEditCourtAppearance)) {
      if (warrantType === 'SENTENCING') {
        return res.redirect(
          `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/sentencing/appearance-details`,
        )
      }
      return res.redirect(
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/remand/appearance-details`,
      )
    }
    if (this.isAddJourney(addOrEditCourtCase, addOrEditCourtAppearance)) {
      return res.redirect(
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/offences/check-offence-answers`,
      )
    }
    if (warrantType === 'SENTENCING') {
      return res.redirect(
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/update-offence-outcomes`,
      )
    }
    return res.redirect(
      `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/review-offences`,
    )
  }

  public getReviewOffences: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, appearanceReference, addOrEditCourtCase, addOrEditCourtAppearance } = req.params
    const { offences } = this.courtAppearanceService.getSessionCourtAppearance(req.session, nomsId)

    const sentenceTypeIds = Array.from(
      new Set(
        offences.filter(offence => offence.sentence?.sentenceTypeId).map(offence => offence.sentence?.sentenceTypeId),
      ),
    )
    const offenceCodes = Array.from(new Set(offences.map(offence => offence.offenceCode)))
    const outcomeIds = Array.from(new Set(offences.map(offence => offence.outcomeUuid)))

    const [offenceMap, sentenceTypeMap, outcomeMap] = await Promise.all([
      this.manageOffencesService.getOffenceMap(offenceCodes, req.user.token),
      this.remandAndSentencingService.getSentenceTypeMap(sentenceTypeIds, req.user.username),
      this.offenceOutcomeService.getOutcomeMap(outcomeIds, req.user.username),
    ])
    const [changedOffences, unchangedOffences] = offences.reduce(
      ([changedList, unchangedList], offence, index) => {
        return offence.updatedOutcome
          ? [[...changedList, { ...offence, index }], unchangedList]
          : [changedList, [...unchangedList, { ...offence, index }]]
      },
      [[], []],
    )
    return res.render('pages/offence/review-offences', {
      nomsId,
      courtCaseReference,
      appearanceReference,
      addOrEditCourtCase,
      addOrEditCourtAppearance,
      offenceMap,
      sentenceTypeMap,
      changedOffences,
      unchangedOffences,
      outcomeMap,
      isAddOffences: this.isAddJourney(addOrEditCourtCase, addOrEditCourtAppearance),
    })
  }

  public submitReviewOffences: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, appearanceReference, addOrEditCourtCase, addOrEditCourtAppearance } = req.params
    const reviewOffenceForm = trimForm<ReviewOffencesForm>(req.body)
    this.courtAppearanceService.setOffenceSentenceAccepted(
      req.session,
      nomsId,
      reviewOffenceForm.changeOffence === 'true',
    )
    return res.redirect(
      `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/task-list`,
    )
  }

  public getUpdateOffenceOutcomes: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, appearanceReference, addOrEditCourtCase, addOrEditCourtAppearance } = req.params
    const courtAppearance = this.courtAppearanceService.getSessionCourtAppearance(req.session, nomsId)
    const { offences, warrantType } = courtAppearance

    const { backTo, offenceReference } = req.query // Query parameter to determine navigation context
    const backLink =
      backTo === 'OUTCOME'
        ? `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/offences/${offenceReference}/update-offence-outcome`
        : `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/task-list`

    const consecutiveToSentenceDetails = await this.getSessionConsecutiveToSentenceDetails(req, nomsId)

    const sentenceTypeIds = Array.from(
      new Set(
        offences.filter(offence => offence.sentence?.sentenceTypeId).map(offence => offence.sentence?.sentenceTypeId),
      ),
    )
    const offenceCodes = Array.from(
      new Set(
        offences
          .map(offence => offence.offenceCode)
          .concat(consecutiveToSentenceDetails.sentences.map(consecutiveToDetails => consecutiveToDetails.offenceCode)),
      ),
    )
    const outcomeIds = Array.from(new Set(offences.map(offence => offence.outcomeUuid)))
    const courtIds = Array.from(
      new Set(consecutiveToSentenceDetails.sentences.map(consecutiveToDetails => consecutiveToDetails.courtCode)),
    )

    const [offenceMap, sentenceTypeMap, outcomeMap, overallSentenceLengthComparison, courtMap] = await Promise.all([
      this.manageOffencesService.getOffenceMap(offenceCodes, req.user.token),
      this.remandAndSentencingService.getSentenceTypeMap(sentenceTypeIds, req.user.username),
      this.offenceOutcomeService.getOutcomeMap(outcomeIds, req.user.username),
      this.calculateReleaseDatesService.compareOverallSentenceLength(courtAppearance, req.user.username),
      this.courtRegisterService.getCourtMap(courtIds, req.user.username),
    ])

    const [unchangedOffences, custodialChangedOffences, nonCustodialChangedOffences] = offences.reduce(
      (acc, offence, index) => {
        const [unchangedList, custodialList, nonCustodialList] = acc

        if (offence.outcomeUuid && offence.updatedOutcome) {
          const outcome = outcomeMap[offence.outcomeUuid]

          if (outcome.outcomeType === 'SENTENCING') {
            return [unchangedList, [...custodialList, { ...offence, index }], nonCustodialList]
          }
          if (outcome.outcomeType === 'NON_CUSTODIAL') {
            return [unchangedList, custodialList, [...nonCustodialList, { ...offence, index }]]
          }
        }
        return [[...unchangedList, { ...offence, index }], custodialList, nonCustodialList]
      },
      [[], [], []] as [Offence[], Offence[], Offence[]],
    )

    const allSentenceUuids = offences
      .map(offence => offence.sentence?.sentenceUuid)
      .filter(sentenceUuid => sentenceUuid)
    const consecutiveToSentenceDetailsMap = this.getConsecutiveToSentenceDetailsMap(
      allSentenceUuids,
      consecutiveToSentenceDetails,
      offenceMap,
      courtMap,
    )
    const sessionConsecutiveToSentenceDetailsMap = this.getSessionConsecutiveToSentenceDetailsMap(
      req,
      nomsId,
      offenceMap,
    )

    return res.render('pages/offence/update-offence-outcomes', {
      nomsId,
      courtCaseReference,
      appearanceReference,
      addOrEditCourtCase,
      addOrEditCourtAppearance,
      offenceMap,
      sentenceTypeMap,
      unchangedOffences,
      custodialChangedOffences,
      nonCustodialChangedOffences,
      outcomeMap,
      courtAppearance,
      warrantType,
      backLink,
      overallSentenceLengthComparison,
      consecutiveToSentenceDetailsMap,
      sessionConsecutiveToSentenceDetailsMap,
      errors: req.flash('errors') || [],
      isAddOffences: this.isAddJourney(addOrEditCourtCase, addOrEditCourtAppearance),
    })
  }

  public submitUpdateOffenceOutcomes: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, appearanceReference, addOrEditCourtCase, addOrEditCourtAppearance } = req.params
    const updateOffenceOutcomesForm = trimForm<UpdateOffenceOutcomesForm>(req.body)

    let errors = this.offenceService.validateUpdateOffenceOutcomesForm(updateOffenceOutcomesForm)
    if (updateOffenceOutcomesForm.finishedReviewOffenceOutcomes === 'true') {
      const offenceErrors = this.courtAppearanceService.checkOffencesHaveMandatoryFields(req.session, nomsId)
      errors = errors.concat(offenceErrors)
    }
    if (errors.length > 0) {
      req.flash('errors', errors)
      return res.redirect(
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/update-offence-outcomes`,
      )
    }

    const courtAppearance = this.courtAppearanceService.getSessionCourtAppearance(req.session, nomsId)

    if (
      updateOffenceOutcomesForm.finishedReviewOffenceOutcomes === 'true' &&
      courtAppearance.hasOverallSentenceLength
    ) {
      const overallSentenceComparison = await this.calculateReleaseDatesService.compareOverallSentenceLength(
        courtAppearance,
        req.user.username,
      )
      if (
        overallSentenceComparison.custodialLengthMatches === false ||
        overallSentenceComparison.licenseLengthMatches === false
      ) {
        return res.redirect(
          `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/offences/sentence-length-mismatch`,
        )
      }
    }

    this.courtAppearanceService.setOffenceSentenceAccepted(
      req.session,
      nomsId,
      updateOffenceOutcomesForm.finishedReviewOffenceOutcomes === 'true',
    )

    return res.redirect(
      `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/task-list`,
    )
  }

  private async determineSentenceServeType(
    req,
    res,
    nomsId: string,
    addOrEditCourtCase: string,
    courtCaseReference: string,
    addOrEditCourtAppearance: string,
    appearanceReference: string,
    offenceReference: string,
  ) {
    const isFirstSentence = this.courtAppearanceService.hasNoSentences(req.session, nomsId)

    if (isFirstSentence) {
      const warrantDate = this.courtAppearanceService.getWarrantDate(req.session, nomsId)
      const { hasSentenceToChainTo } = await this.remandAndSentencingService.hasSentenceToChainTo(
        nomsId,
        dayjs(warrantDate),
        req.user.username,
      )
      if (hasSentenceToChainTo) {
        return res.redirect(
          `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/sentencing/offences/${offenceReference}/is-sentence-consecutive-to`,
        )
      }
      this.offenceService.setSentenceServeType(
        req.session,
        nomsId,
        courtCaseReference,
        offenceReference,
        {
          sentenceServeType: extractKeyValue(sentenceServeTypes, sentenceServeTypes.FORTHWITH),
        },
        null,
        false,
      )
      return this.saveSessionOffenceInAppearance(
        req,
        res,
        nomsId,
        addOrEditCourtCase,
        courtCaseReference,
        addOrEditCourtAppearance,
        appearanceReference,
        offenceReference,
      )
    }
    return res.redirect(
      `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/offences/${offenceReference}/sentence-serve-type`,
    )
  }
}
