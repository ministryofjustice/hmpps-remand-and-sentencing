import { RequestHandler } from 'express'
import type {
  OffenceAlternativeSentenceLengthForm,
  OffenceConfirmOffenceForm,
  OffenceConsecutiveToForm,
  OffenceConvictionDateForm,
  OffenceCountNumberForm,
  OffenceDeleteOffenceForm,
  OffenceFineAmountForm,
  OffenceFinishedAddingForm,
  OffenceInactiveOffenceForm,
  OffenceOffenceCodeForm,
  OffenceOffenceDateForm,
  OffenceOffenceNameForm,
  OffenceOffenceOutcomeForm,
  OffenceSentenceServeTypeForm,
  OffenceSentenceTypeForm,
  ReviewOffencesForm,
  SentenceLengthForm,
  SentenceLengthMismatchForm,
} from 'forms'
import deepmerge from 'deepmerge'
import type { Offence } from 'models'
import dayjs from 'dayjs'
import trimForm from '../utils/trim'
import OffenceService from '../services/offenceService'
import ManageOffencesService from '../services/manageOffencesService'
import CourtAppearanceService from '../services/courtAppearanceService'
import validate from '../validation/validation'
import RemandAndSentencingService from '../services/remandAndSentencingService'
import {
  sentenceLengthToAlternativeSentenceLengthForm,
  sentenceLengthToSentenceLengthForm,
} from '../utils/mappingUtils'
import periodLengthTypeHeadings from '../resources/PeriodLengthTypeHeadings'
import sentenceTypePeriodLengths from '../resources/sentenceTypePeriodLengths'
import {
  allPeriodLengthTypesEntered,
  getNextPeriodLengthType,
  outcomeValueOrLegacy,
  sentenceTypeValueOrLegacy,
} from '../utils/utils'
import OffenceOutcomeService from '../services/offenceOutcomeService'
import CalculateReleaseDatesService from '../services/calculateReleaseDatesService'
import AppearanceOutcomeService from '../services/appearanceOutcomeService'

export default class OffenceRoutes {
  constructor(
    private readonly offenceService: OffenceService,
    private readonly manageOffencesService: ManageOffencesService,
    private readonly courtAppearanceService: CourtAppearanceService,
    private readonly remandAndSentencingService: RemandAndSentencingService,
    private readonly offenceOutcomeService: OffenceOutcomeService,
    private readonly calculateReleaseDatesService: CalculateReleaseDatesService,
    private readonly appearanceOutcomeService: AppearanceOutcomeService,
  ) {}

  public getOffenceDate: RequestHandler = async (req, res): Promise<void> => {
    const {
      nomsId,
      courtCaseReference,
      offenceReference,
      appearanceReference,
      addOrEditCourtCase,
      addOrEditCourtAppearance,
    } = req.params
    const { submitToEditOffence } = req.query
    const offenceDateForm = (req.flash('offenceDateForm')[0] || {}) as OffenceOffenceDateForm
    let offenceStartDateDay: number | string = offenceDateForm['offenceStartDate-day']
    let offenceStartDateMonth: number | string = offenceDateForm['offenceStartDate-month']
    let offenceStartDateYear: number | string = offenceDateForm['offenceStartDate-year']
    let offenceEndDateDay: number | string = offenceDateForm['offenceEndDate-day']
    let offenceEndDateMonth: number | string = offenceDateForm['offenceEndDate-month']
    let offenceEndDateYear: number | string = offenceDateForm['offenceEndDate-year']
    const offence = this.getSessionOffenceOrAppearanceOffence(req, nomsId, courtCaseReference, offenceReference)

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
    if (submitToEditOffence) {
      backLink = `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/offences/${offenceReference}/edit-offence`
    } else if (warrantType === 'SENTENCING') {
      const convictionDateAppliedAll = this.courtAppearanceService.getOverallConvictionDateAppliedAll(
        req.session,
        nomsId,
      )
      if (convictionDateAppliedAll === 'true') {
        backLink = `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/offences/${offenceReference}/count-number`
      } else {
        backLink = `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/offences/${offenceReference}/conviction-date`
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
      submitToEditOffence,
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
    const offenceDateForm = trimForm<OffenceOffenceDateForm>(req.body)
    const errors = this.offenceService.setOffenceDates(req.session, nomsId, courtCaseReference, offenceDateForm)
    if (errors.length > 0) {
      req.flash('errors', errors)
      req.flash('offenceDateForm', { ...offenceDateForm })
      return res.redirect(
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/offences/${offenceReference}/offence-date`,
      )
    }
    const { submitToEditOffence } = req.query
    if (submitToEditOffence) {
      return res.redirect(
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/offences/${offenceReference}/edit-offence`,
      )
    }
    return res.redirect(
      `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/offences/${offenceReference}/offence-code`,
    )
  }

  public getCheckOverallAnswers: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, appearanceReference, addOrEditCourtCase, addOrEditCourtAppearance } = req.params
    const courtAppearance = this.courtAppearanceService.getSessionCourtAppearance(req.session, nomsId)
    const appearanceOutcomeUuid = this.courtAppearanceService.getAppearanceOutcomeUuid(req.session, nomsId)
    const overallCaseOutcome = (
      await this.appearanceOutcomeService.getOutcomeByUuid(appearanceOutcomeUuid, req.user.username)
    ).outcomeName

    return res.render('pages/offence/check-overall-answers', {
      nomsId,
      courtAppearance,
      courtCaseReference,
      appearanceReference,
      overallCaseOutcome,
      addOrEditCourtCase,
      addOrEditCourtAppearance,
      backLink: `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/case-outcome-applied-all`,
    })
  }

  public submitCheckOverallAnswers: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, appearanceReference, addOrEditCourtCase, addOrEditCourtAppearance } = req.params
    const courtAppearance = this.courtAppearanceService.getSessionCourtAppearance(req.session, nomsId)
    if (courtAppearance.offences.length) {
      if (res.locals.isAddCourtCase) {
        return res.redirect(
          `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/offences/check-offence-answers`,
        )
      }
      return res.redirect(
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/review-offences`,
      )
    }
    return res.redirect(
      `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/offences/0/offence-date`,
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
    const offence = this.getSessionOffenceOrAppearanceOffence(req, nomsId, courtCaseReference, offenceReference)
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
    const backLink = `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/review-offences`

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
    const offence = this.getSessionOffenceOrAppearanceOffence(req, nomsId, courtCaseReference, offenceReference)
    this.saveOffenceInAppearance(req, nomsId, courtCaseReference, offenceReference, offence)
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
    const offence = this.getSessionOffenceOrAppearanceOffence(req, nomsId, courtCaseReference, offenceReference)
    if (Object.keys(offenceOutcomeForm).length === 0) {
      offenceOutcomeForm = {
        offenceOutcome: offence.outcomeUuid,
      }
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
    } else if (!offence.outcomeUuid && !res.locals.isAddCourtAppearance) {
      legacyCaseOutcome = outcomeValueOrLegacy(undefined, offence.legacyData)
    }

    let backLink = `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/offences/${offenceReference}/sentence-type`
    if (submitToEditOffence) {
      backLink = `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/offences/${offenceReference}/edit-offence`
    } else if (addOrEditCourtCase === 'edit-court-case') {
      backLink = `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/review-offences`
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
    const errors = this.offenceService.setOffenceOutcome(req.session, nomsId, courtCaseReference, offenceOutcomeForm)

    if (errors.length > 0) {
      req.flash('errors', errors)
      req.flash('offenceOutcomeForm', { ...offenceOutcomeForm })
      return res.redirect(
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/offences/${offenceReference}/offence-outcome${submitToEditOffence ? '?submitToEditOffence=true' : ''}`,
      )
    }

    if (submitToEditOffence) {
      return res.redirect(
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/offences/${offenceReference}/edit-offence`,
      )
    }
    const warrantType = this.courtAppearanceService.getWarrantType(req.session, nomsId)
    if (warrantType === 'SENTENCING') {
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
    if (Object.keys(countNumberForm).length === 0) {
      countNumberForm = {
        countNumber: this.getSessionOffenceOrAppearanceOffence(req, nomsId, courtCaseReference, offenceReference)
          ?.sentence?.countNumber,
      }
    }
    const courtAppearance = this.courtAppearanceService.getSessionCourtAppearance(req.session, nomsId)

    let backLink = `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/offences/${offenceReference}/confirm-offence-code`
    if (submitToEditOffence) {
      backLink = `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/offences/${offenceReference}/edit-offence`
    } else if (courtAppearance.caseOutcomeAppliedAll !== 'true') {
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
    const countNumberForm = trimForm<OffenceCountNumberForm>(req.body)
    const errors = this.offenceService.setCountNumber(req.session, nomsId, courtCaseReference, countNumberForm)
    if (errors.length > 0) {
      req.flash('errors', errors)
      req.flash('countNumberForm', { ...countNumberForm })
      return res.redirect(
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/offences/${offenceReference}/count-number`,
      )
    }
    const { submitToEditOffence } = req.query
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
      this.getSessionOffenceOrAppearanceOffence(req, nomsId, courtCaseReference, offenceReference)?.offenceCode
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
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/offences/${offenceReference}/offence-code`,
      )
    }
    const { submitToEditOffence } = req.query
    if (offenceCodeForm.unknownCode) {
      return res.redirect(
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/offences/${offenceReference}/offence-name${submitToEditOffence ? '?submitToEditOffence=true' : ''}`,
      )
    }

    if (offence.endDate) {
      const sessionOffence = this.getSessionOffenceOrAppearanceOffence(
        req,
        nomsId,
        courtCaseReference,
        offenceReference,
      )
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
      const { offenceCode } = this.getSessionOffenceOrAppearanceOffence(
        req,
        nomsId,
        courtCaseReference,
        offenceReference,
      )
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
      const sessionOffence = this.getSessionOffenceOrAppearanceOffence(
        req,
        nomsId,
        courtCaseReference,
        offenceReference,
      )
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
    const inactiveOffenceForm = (req.flash('inactiveOffenceForm')[0] || {}) as OffenceInactiveOffenceForm
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
      inactiveOffenceForm,
      isAddOffences: this.isAddJourney(addOrEditCourtCase, addOrEditCourtAppearance),
      errors: req.flash('errors') || [],
      backLink:
        backTo === 'NAME'
          ? `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/offences/${offenceReference}/offence-name${submitToEditOffence ? '?submitToEditOffence=true' : ''}`
          : `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/offences/${offenceReference}/offence-code${submitToEditOffence ? '?submitToEditOffence=true' : ''}`,
    })
  }

  public submitInactiveOffenceCode: RequestHandler = async (req, res): Promise<void> => {
    const {
      nomsId,
      courtCaseReference,
      offenceReference,
      appearanceReference,
      addOrEditCourtCase,
      addOrEditCourtAppearance,
    } = req.params
    const { submitToEditOffence, backTo } = req.query
    const inactiveOffenceForm = trimForm<OffenceInactiveOffenceForm>(req.body)
    const errors = this.offenceService.validateOffenceInactiveForm(inactiveOffenceForm)
    if (errors.length > 0) {
      req.flash('errors', errors)
      req.flash('inactiveOffenceForm', { ...inactiveOffenceForm })
      return res.redirect(
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/offences/${offenceReference}/inactive-offence${submitToEditOffence ? '?submitToEditOffence=true' : ''}`,
      )
    }
    if (inactiveOffenceForm.confirmOffence === 'false') {
      if (backTo === 'NAME') {
        return res.redirect(
          `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/offences/${offenceReference}/offence-name${submitToEditOffence ? '?submitToEditOffence=true' : ''}`,
        )
      }
      return res.redirect(
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/offences/${offenceReference}/offence-code${submitToEditOffence ? '?submitToEditOffence=true' : ''}`,
      )
    }
    return res.redirect(
      `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/offences/${offenceReference}/confirm-offence-code${submitToEditOffence ? '?submitToEditOffence=true' : ''}`,
    )
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
      this.offenceService.setOffenceOutcome(req.session, nomsId, courtCaseReference, {
        offenceOutcome: this.courtAppearanceService.getRelatedOffenceOutcomeUuid(req.session, nomsId),
      })

      if (submitToEditOffence) {
        return res.redirect(
          `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/offences/${offenceReference}/edit-offence`,
        )
      }
      const warrantType = this.courtAppearanceService.getWarrantType(req.session, nomsId)
      if (warrantType === 'SENTENCING') {
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
    const { submitToEditOffence } = req.query
    let offenceSentenceTypeForm = (req.flash('offenceSentenceTypeForm')[0] || {}) as OffenceSentenceTypeForm
    const offence = this.getSessionOffenceOrAppearanceOffence(req, nomsId, courtCaseReference, offenceReference)
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

    return res.render('pages/offence/sentence-type', {
      nomsId,
      courtCaseReference,
      offenceReference,
      appearanceReference,
      addOrEditCourtCase,
      addOrEditCourtAppearance,
      submitToEditOffence,
      offenceSentenceTypeForm,
      sentenceTypes,
      legacySentenceType,
      isAddOffences: this.isAddJourney(addOrEditCourtCase, addOrEditCourtAppearance),
      errors: req.flash('errors') || [],
      backLink: submitToEditOffence
        ? `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/offences/${offenceReference}/edit-offence`
        : `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/offences/${offenceReference}/confirm-offence-code`,
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
    const { submitToEditOffence } = req.query
    const offenceSentenceTypeForm = trimForm<OffenceSentenceTypeForm>(req.body)
    const errors = this.offenceService.setSentenceType(req.session, nomsId, courtCaseReference, offenceSentenceTypeForm)

    if (errors.length > 0) {
      req.flash('errors', errors)
      req.flash('offenceSentenceTypeForm', { ...offenceSentenceTypeForm })
      return res.redirect(
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/offences/${offenceReference}/sentence-type${submitToEditOffence ? '?submitToEditOffence=true' : ''}`,
      )
    }

    const offence = this.getSessionOffenceOrAppearanceOffence(req, nomsId, courtCaseReference, offenceReference)
    this.offenceService.updatePeriodLengths(req.session, nomsId, courtCaseReference, offence)

    const nextPeriodLengthType = getNextPeriodLengthType(
      this.getSessionOffenceOrAppearanceOffence(req, nomsId, courtCaseReference, offenceReference).sentence ?? {},
      null,
    )

    if (nextPeriodLengthType) {
      return res.redirect(
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/offences/${offenceReference}/period-length?periodLengthType=${nextPeriodLengthType}${submitToEditOffence ? '&submitToEditOffence=true' : ''}`,
      )
    }

    if (submitToEditOffence) {
      return res.redirect(
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/offences/${offenceReference}/edit-offence`,
      )
    }

    return res.redirect(
      `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/offences/${offenceReference}/sentence-serve-type`,
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
    const { submitToEditOffence, periodLengthType } = req.query
    const { sentence } = this.getSessionOffenceOrAppearanceOffence(req, nomsId, courtCaseReference, offenceReference)
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
    const sentenceTypeClassification = sentence?.sentenceTypeClassification
    const periodLengthHeader =
      periodLengthTypeHeadings[periodLengthType as string]?.toLowerCase() ??
      currentPeriodLength?.legacyData?.sentenceTermDescription
    let backLink = `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/offences/${offenceReference}/sentence-type`
    if (submitToEditOffence) {
      backLink = `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/offences/${offenceReference}/edit-offence`
    } else if (expectedPeriodLengthTypeIndex >= 1) {
      backLink = `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/offences/${offenceReference}/period-length?periodLengthType=${
        sentenceTypePeriodLengths[sentence?.sentenceTypeClassification].periodLengths[expectedPeriodLengthTypeIndex - 1]
          .type
      }`
    }
    return res.render('pages/offence/period-length', {
      nomsId,
      courtCaseReference,
      offenceReference,
      appearanceReference,
      addOrEditCourtCase,
      addOrEditCourtAppearance,
      submitToEditOffence,
      periodLengthType,
      periodLengthForm,
      periodLengthHeader,
      sentenceTypeClassification,
      isAddOffences: this.isAddJourney(addOrEditCourtCase, addOrEditCourtAppearance),
      errors: req.flash('errors') || [],
      backLink,
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
    const { submitToEditOffence, periodLengthType } = req.query
    const offenceSentenceLengthForm = trimForm<SentenceLengthForm>(req.body)
    const { sentence } = this.getSessionOffenceOrAppearanceOffence(req, nomsId, courtCaseReference, offenceReference)
    this.offenceService.setInitialPeriodLengths(req.session, nomsId, courtCaseReference, sentence?.periodLengths ?? [])
    const errors = this.offenceService.setPeriodLength(
      req.session,
      nomsId,
      courtCaseReference,
      offenceSentenceLengthForm,
      periodLengthType as string,
    )
    if (errors.length > 0) {
      req.flash('errors', errors)
      req.flash('offenceSentenceLengthForm', { ...offenceSentenceLengthForm })
      return res.redirect(
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/offences/${offenceReference}/period-length?periodLengthType=${periodLengthType}${submitToEditOffence ? '&submitToEditOffence=true' : ''}`,
      )
    }

    if (sentence.sentenceTypeClassification === 'FINE') {
      return res.redirect(
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/offences/${offenceReference}/fine-amount`,
      )
    }
    const allPeriodLengthsEntered = allPeriodLengthTypesEntered(sentence)
    const nextPeriodLengthType = getNextPeriodLengthType(sentence, periodLengthType as string)
    if (nextPeriodLengthType && !allPeriodLengthsEntered) {
      return res.redirect(
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/offences/${offenceReference}/period-length?periodLengthType=${nextPeriodLengthType}${submitToEditOffence ? '&submitToEditOffence=true' : ''}`,
      )
    }

    if (submitToEditOffence) {
      return res.redirect(
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/offences/${offenceReference}/edit-offence`,
      )
    }

    return res.redirect(
      `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/offences/${offenceReference}/sentence-serve-type`,
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
    const { submitToEditOffence } = req.query
    let offenceFineAmountForm = (req.flash('offenceFineAmountForm')[0] || {}) as OffenceFineAmountForm
    const { sentence } = this.getSessionOffenceOrAppearanceOffence(req, nomsId, courtCaseReference, offenceReference)
    if (Object.keys(offenceFineAmountForm).length === 0) {
      offenceFineAmountForm = {
        fineAmount: sentence?.fineAmount,
      }
    }

    let backLink = `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/offences/${offenceReference}/period-length`
    if (submitToEditOffence) {
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
      submitToEditOffence,
      isAddOffences: this.isAddJourney(addOrEditCourtCase, addOrEditCourtAppearance),
      errors: req.flash('errors') || [],
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
    return res.redirect(
      `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/offences/${offenceReference}/sentence-serve-type`,
    )
  }

  public getAlternativeSentenceLength: RequestHandler = async (req, res): Promise<void> => {
    const {
      nomsId,
      courtCaseReference,
      offenceReference,
      appearanceReference,
      addOrEditCourtCase,
      addOrEditCourtAppearance,
    } = req.params
    const { submitToEditOffence } = req.query
    let offenceAlternativeSentenceLengthForm = (req.flash('offenceAlternativeSentenceLengthForm')[0] ||
      {}) as OffenceAlternativeSentenceLengthForm
    if (Object.keys(offenceAlternativeSentenceLengthForm).length === 0) {
      offenceAlternativeSentenceLengthForm = sentenceLengthToAlternativeSentenceLengthForm(
        this.getSessionOffenceOrAppearanceOffence(
          req,
          nomsId,
          courtCaseReference,
          offenceReference,
        )?.sentence?.periodLengths?.find(periodLength => periodLength.periodLengthType === 'SENTENCE_LENGTH'),
      )
    }

    return res.render('pages/offence/alternative-sentence-length', {
      nomsId,
      courtCaseReference,
      offenceReference,
      appearanceReference,
      addOrEditCourtCase,
      addOrEditCourtAppearance,
      submitToEditOffence,
      offenceAlternativeSentenceLengthForm,
      isAddOffences: this.isAddJourney(addOrEditCourtCase, addOrEditCourtAppearance),
      errors: req.flash('errors') || [],
      backLink: `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/offences/${offenceReference}/period-length?periodLengthType=SENTENCE_LENGTH`,
    })
  }

  public submitAlternativeSentenceLength: RequestHandler = async (req, res): Promise<void> => {
    const {
      nomsId,
      courtCaseReference,
      offenceReference,
      appearanceReference,
      addOrEditCourtCase,
      addOrEditCourtAppearance,
    } = req.params
    const offenceAlternativeSentenceLengthForm = trimForm<OffenceAlternativeSentenceLengthForm>(req.body)
    const errors = this.offenceService.setAlternativeSentenceLength(
      req.session,
      nomsId,
      courtCaseReference,
      offenceAlternativeSentenceLengthForm,
    )
    if (errors.length > 0) {
      req.flash('errors', errors)
      req.flash('offenceAlternativeSentenceLengthForm', { ...offenceAlternativeSentenceLengthForm })
      return res.redirect(
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/offences/${offenceReference}/alternative-sentence-length`,
      )
    }
    const { submitToEditOffence } = req.query
    if (submitToEditOffence) {
      return res.redirect(
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/offences/${offenceReference}/edit-offence`,
      )
    }
    return res.redirect(
      `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/offences/${offenceReference}/sentence-serve-type`,
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
    const { submitToEditOffence } = req.query
    const forthwithAlreadySelected = this.courtAppearanceService.isForwithAlreadySelected(req.session, nomsId)
    const sentence = this.getSessionOffenceOrAppearanceOffence(
      req,
      nomsId,
      courtCaseReference,
      offenceReference,
    )?.sentence
    const sentenceServeType = sentence?.sentenceServeType
    const expectedPeriodLengthsSize =
      sentenceTypePeriodLengths[sentence?.sentenceTypeClassification]?.periodLengths?.length

    let backLink = `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/offences/${offenceReference}/sentence-type`
    if (submitToEditOffence) {
      backLink = `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/offences/${offenceReference}/edit-offence`
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
      submitToEditOffence,
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
    const offenceSentenceServeTypeForm = trimForm<OffenceSentenceServeTypeForm>(req.body)
    const errors = validate(
      offenceSentenceServeTypeForm,
      {
        sentenceServeType: 'required',
      },
      {
        'required.sentenceServeType': `You must select the consecutive or concurrent`,
      },
    )
    if (errors.length > 0) {
      req.flash('errors', errors)
      return res.redirect(
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/offences/${offenceReference}/sentence-serve-type`,
      )
    }
    this.offenceService.setSentenceServeType(
      req.session,
      nomsId,
      courtCaseReference,
      offenceSentenceServeTypeForm.sentenceServeType,
    )
    const { submitToEditOffence } = req.query

    if (offenceSentenceServeTypeForm.sentenceServeType === 'CONSECUTIVE') {
      return res.redirect(
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/offences/${offenceReference}/consecutive-to${submitToEditOffence ? '?submitToEditOffence=true' : ''}`,
      )
    }
    if (submitToEditOffence) {
      return res.redirect(
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/offences/${offenceReference}/edit-offence`,
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

  public getConsecutiveTo: RequestHandler = async (req, res): Promise<void> => {
    const {
      nomsId,
      courtCaseReference,
      offenceReference,
      appearanceReference,
      addOrEditCourtCase,
      addOrEditCourtAppearance,
    } = req.params
    const { submitToEditOffence } = req.query
    const countNumber = this.offenceService.getCountNumber(req.session, nomsId, courtCaseReference)
    let offenceConsecutiveToForm = (req.flash('offenceConsecutiveToForm')[0] || {}) as OffenceConsecutiveToForm
    if (Object.keys(offenceConsecutiveToForm).length === 0) {
      offenceConsecutiveToForm = {
        consecutiveTo: this.getSessionOffenceOrAppearanceOffence(req, nomsId, courtCaseReference, offenceReference)
          ?.sentence?.consecutiveTo,
      }
    }
    return res.render('pages/offence/consecutive-to', {
      nomsId,
      courtCaseReference,
      offenceReference,
      appearanceReference,
      addOrEditCourtCase,
      addOrEditCourtAppearance,
      errors: req.flash('errors') || [],
      countNumber,
      offenceConsecutiveToForm,
      submitToEditOffence,
      isAddOffences: this.isAddJourney(addOrEditCourtCase, addOrEditCourtAppearance),
      backLink: `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/offences/${offenceReference}/sentence-serve-type`,
    })
  }

  public submitConsecutiveTo: RequestHandler = async (req, res): Promise<void> => {
    const {
      nomsId,
      courtCaseReference,
      offenceReference,
      appearanceReference,
      addOrEditCourtCase,
      addOrEditCourtAppearance,
    } = req.params
    const offenceConsecutiveToForm = trimForm<OffenceConsecutiveToForm>(req.body)
    const errors = this.offenceService.setConsecutiveTo(
      req.session,
      nomsId,
      courtCaseReference,
      offenceConsecutiveToForm,
    )
    if (errors.length > 0) {
      req.flash('errors', errors)
      req.flash('offenceConsecutiveToForm', { ...offenceConsecutiveToForm })
      return res.redirect(
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/offences/${offenceReference}/consecutive-to`,
      )
    }

    const { submitToEditOffence } = req.query
    if (submitToEditOffence) {
      return res.redirect(
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/offences/${offenceReference}/edit-offence`,
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
    const { submitToEditOffence } = req.query
    let convictionDateDay: number | string = offenceConvictionDateForm['convictionDate-day']
    let convictionDateMonth: number | string = offenceConvictionDateForm['convictionDate-month']
    let convictionDateYear: number | string = offenceConvictionDateForm['convictionDate-year']
    const convictionDateValue = this.getSessionOffenceOrAppearanceOffence(
      req,
      nomsId,
      courtCaseReference,
      offenceReference,
    ).sentence?.convictionDate
    if (convictionDateValue && Object.keys(offenceConvictionDateForm).length === 0) {
      const convictionDate = new Date(convictionDateValue)
      convictionDateDay = convictionDate.getDate()
      convictionDateMonth = convictionDate.getMonth() + 1
      convictionDateYear = convictionDate.getFullYear()
    }

    return res.render('pages/offence/offence-conviction-date', {
      nomsId,
      courtCaseReference,
      offenceReference,
      appearanceReference,
      addOrEditCourtCase,
      addOrEditCourtAppearance,
      submitToEditOffence,
      convictionDateDay,
      convictionDateMonth,
      convictionDateYear,
      isAddOffences: this.isAddJourney(addOrEditCourtCase, addOrEditCourtAppearance),
      errors: req.flash('errors') || [],
      backLink: submitToEditOffence
        ? `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/offences/${offenceReference}/edit-offence`
        : `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/offences/${offenceReference}/count-number`,
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
    const offenceConvictionDateForm = trimForm<OffenceConvictionDateForm>(req.body)
    const errors = this.offenceService.setConvictionDateForm(
      req.session,
      nomsId,
      courtCaseReference,
      offenceConvictionDateForm,
    )
    if (errors.length > 0) {
      req.flash('errors', errors)
      req.flash('offenceConvictionDateForm', { ...offenceConvictionDateForm })
      return res.redirect(
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/offences/${offenceReference}/conviction-date`,
      )
    }
    const { submitToEditOffence } = req.query
    if (submitToEditOffence) {
      return res.redirect(
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/offences/${offenceReference}/edit-offence`,
      )
    }
    return res.redirect(
      `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/offences/${offenceReference}/sentence-type`,
    )
  }

  public getCheckOffenceAnswers: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, appearanceReference, addOrEditCourtCase, addOrEditCourtAppearance } = req.params
    const courtAppearance = this.courtAppearanceService.getSessionCourtAppearance(req.session, nomsId)

    const sentenceTypeIds = Array.from(
      new Set(
        courtAppearance.offences
          .filter(offence => offence.sentence?.sentenceTypeId)
          .map(offence => offence.sentence?.sentenceTypeId),
      ),
    )
    const offenceCodes = Array.from(new Set(courtAppearance.offences.map(offence => offence.offenceCode)))
    const outcomeIds = Array.from(new Set(courtAppearance.offences.map(offence => offence.outcomeUuid)))

    const [offenceMap, sentenceTypeMap, outcomeMap, overallSentenceLengthComparison] = await Promise.all([
      this.manageOffencesService.getOffenceMap(offenceCodes, req.user.token),
      this.remandAndSentencingService.getSentenceTypeMap(sentenceTypeIds, req.user.username),
      this.offenceOutcomeService.getOutcomeMap(outcomeIds, req.user.username),
      this.calculateReleaseDatesService.compareOverallSentenceLength(courtAppearance, req.user.username),
    ])

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
      isAddOffences: this.isAddJourney(addOrEditCourtCase, addOrEditCourtAppearance),
      errors: req.flash('errors') || [],
      backLink: `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/task-list`,
    })
  }

  public submitCheckOffenceAnswers: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, appearanceReference, addOrEditCourtCase, addOrEditCourtAppearance } = req.params
    const finishedAddingOffences = trimForm<OffenceFinishedAddingForm>(req.body)
    const errors = validate(
      finishedAddingOffences,
      {
        finishedAddingOffences: 'required',
      },
      {
        'required.finishedAddingOffences': `You must select whether you have finished adding offences`,
      },
    )
    if (errors.length > 0) {
      req.flash('errors', errors)
      return res.redirect(
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/offences/check-offence-answers`,
      )
    }
    const courtAppearance = this.courtAppearanceService.getSessionCourtAppearance(req.session, nomsId)
    if (
      courtAppearance.warrantType === 'SENTENCING' &&
      finishedAddingOffences.finishedAddingOffences === 'true' &&
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
      finishedAddingOffences.finishedAddingOffences === 'true',
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

    return res.render('pages/offence/sentence-length-mismatch', {
      nomsId,
      courtCaseReference,
      courtAppearance,
      appearanceReference,
      addOrEditCourtCase,
      addOrEditCourtAppearance,
      overallSentenceLengthComparison,
      isAddOffences: this.isAddJourney(addOrEditCourtCase, addOrEditCourtAppearance),
      errors: req.flash('errors') || [],
      backLink: `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/offences/check-offence-answers`,
    })
  }

  public submitSentenceLengthMismatch: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, appearanceReference, addOrEditCourtCase, addOrEditCourtAppearance } = req.params

    const sentenceLengthMismatch = trimForm<SentenceLengthMismatchForm>(req.body)
    const errors = validate(
      sentenceLengthMismatch,
      {
        confirmMismatch: 'required',
      },
      {
        'required.confirmMismatch': `You must select whether you want to continue.`,
      },
    )

    if (errors.length > 0) {
      req.flash('errors', errors)
      return res.redirect(
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/offences/sentence-length-mismatch`,
      )
    }

    if (sentenceLengthMismatch.confirmMismatch === 'yes') {
      this.courtAppearanceService.setOffenceSentenceAccepted(req.session, nomsId, true)
      return res.redirect(
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/task-list`,
      )
    }

    return res.redirect(
      `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/offences/check-offence-answers`,
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
    const offence = this.courtAppearanceService.getOffence(req.session, nomsId, parseInt(offenceReference, 10))
    const offenceMap = await this.manageOffencesService.getOffenceMap([offence.offenceCode], req.user.token)
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
      isAddOffences: this.isAddJourney(addOrEditCourtCase, addOrEditCourtAppearance),
      outcome,
      backLink: `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/offences/check-offence-answers`,
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
    const warrantType = this.courtAppearanceService.getWarrantType(req.session, nomsId)
    const sentenceOffence = warrantType === 'SENTENCING' ? 'Sentence' : 'Offence'
    const deleteOffenceForm = trimForm<OffenceDeleteOffenceForm>(req.body)
    const errors = validate(
      deleteOffenceForm,
      {
        deleteOffence: 'required',
      },
      {
        'required.deleteOffence': `You must select whether you want to delete this ${sentenceOffence.toLowerCase()}`,
      },
    )
    if (errors.length > 0) {
      req.flash('errors', errors)
      return res.redirect(
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/offences/${offenceReference}/delete-offence`,
      )
    }
    if (deleteOffenceForm.deleteOffence === 'true') {
      this.courtAppearanceService.deleteOffence(req.session, nomsId, parseInt(offenceReference, 10))
    }
    if (addOrEditCourtAppearance === 'edit-court-appearance') {
      return res.redirect(
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/details`,
      )
    }
    return res.redirect(
      `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/offences/check-offence-answers`,
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
    const offence = this.getSessionOffenceOrAppearanceOffence(req, nomsId, courtCaseReference, offenceReference)
    const offenceMap = await this.manageOffencesService.getOffenceMap([offence.offenceCode], req.user.token)
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
      backLink: res.locals.isAddCourtAppearance
        ? `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/offences/check-offence-answers`
        : `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/details`,
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
    const offence = this.getSessionOffenceOrAppearanceOffence(req, nomsId, courtCaseReference, offenceReference)
    this.saveOffenceInAppearance(req, nomsId, courtCaseReference, offenceReference, offence)
    if (addOrEditCourtAppearance === 'edit-court-appearance') {
      return res.redirect(
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/details`,
      )
    }
    if (this.isAddJourney(addOrEditCourtCase, addOrEditCourtAppearance)) {
      return res.redirect(
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/offences/check-offence-answers`,
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

  private getSessionOffenceOrAppearanceOffence(
    req,
    nomsId: string,
    courtCaseReference: string,
    offenceReference: string,
  ): Offence {
    const appearanceOffence = this.courtAppearanceService.getOffence(
      req.session,
      nomsId,
      parseInt(offenceReference, 10),
    )
    const sessionOffence = this.offenceService.getSessionOffence(req.session, nomsId, courtCaseReference)
    return deepmerge(appearanceOffence, sessionOffence, { arrayMerge: (_target, source, _options) => source })
  }

  private saveSessionOffenceInAppearance(
    req,
    res,
    nomsId: string,
    addOrEditCourtCase: string,
    courtCaseReference: string,
    addOrEditCourtAppearance: string,
    appearanceReference: string,
    offenceReference: string,
  ) {
    const offence = this.offenceService.getSessionOffence(req.session, nomsId, courtCaseReference)
    this.saveOffenceInAppearance(req, nomsId, courtCaseReference, offenceReference, offence)
    if (this.isAddJourney(addOrEditCourtCase, addOrEditCourtAppearance)) {
      return res.redirect(
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/offences/check-offence-answers`,
      )
    }
    return res.redirect(
      `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/review-offences`,
    )
  }

  private isAddJourney(addOrEditCourtCase: string, addOrEditCourtAppearance: string): boolean {
    return addOrEditCourtCase === 'add-court-case' && addOrEditCourtAppearance === 'add-court-appearance'
  }

  private saveOffenceInAppearance(
    req,
    nomsId: string,
    courtCaseReference: string,
    offenceReference: string,
    offence: Offence,
  ) {
    this.courtAppearanceService.addOffence(req.session, nomsId, parseInt(offenceReference, 10), offence)
    this.offenceService.clearOffence(req.session, nomsId, courtCaseReference)
  }
}
