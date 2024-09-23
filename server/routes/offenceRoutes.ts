import { RequestHandler } from 'express'
import type {
  OffenceAlternativeSentenceLengthForm,
  OffenceConfirmOffenceForm,
  OffenceConsecutiveToForm,
  OffenceConvictionDateForm,
  OffenceCountNumberForm,
  OffenceDeleteOffenceForm,
  OffenceLookupOffenceOutcomeForm,
  OffenceOffenceCodeForm,
  OffenceOffenceDateForm,
  OffenceOffenceNameForm,
  OffenceOffenceOutcomeForm,
  OffenceSentenceServeTypeForm,
  OffenceSentenceTypeForm,
  OffenceTerrorRelatedForm,
  ReviewOffencesForm,
  SentenceLengthForm,
} from 'forms'
import deepmerge from 'deepmerge'
import type { Offence } from 'models'
import dayjs from 'dayjs'
import trimForm from '../utils/trim'
import OffenceService from '../services/offenceService'
import ManageOffencesService from '../services/manageOffencesService'
import CourtAppearanceService from '../services/courtAppearanceService'
import validate from '../validation/validation'
import OffencePersistType from '../@types/models/OffencePersistType'
import CaseOutcomeService from '../services/caseOutcomeService'
import RemandAndSentencingService from '../services/remandAndSentencingService'
import {
  chargeToOffence,
  sentenceLengthToAlternativeSentenceLengthForm,
  sentenceLengthToSentenceLengthForm,
} from '../utils/mappingUtils'
import periodLengthTypeHeadings from '../resources/PeriodLengthTypeHeadings'
import sentenceTypePeriodLengths from '../resources/sentenceTypePeriodLengths'
import { getNextPeriodLengthType } from '../utils/utils'

export default class OffenceRoutes {
  constructor(
    private readonly offenceService: OffenceService,
    private readonly manageOffencesService: ManageOffencesService,
    private readonly courtAppearanceService: CourtAppearanceService,
    private readonly caseOutcomeService: CaseOutcomeService,
    private readonly remandAndSentencingService: RemandAndSentencingService,
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
      errors: req.flash('errors') || [],
      backLink: req.get('Referrer'),
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
    const caseOutcomeAppliedAll = this.courtAppearanceService.getCaseOutcomeAppliedAll(req.session, nomsId)
    if (caseOutcomeAppliedAll) {
      this.offenceService.setOffenceOutcome(
        req.session,
        nomsId,
        courtCaseReference,
        this.courtAppearanceService.getOverallCaseOutcome(req.session, nomsId),
      )

      if (submitToEditOffence) {
        return res.redirect(
          `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/offences/${offenceReference}/edit-offence`,
        )
      }
      const warrantType = this.courtAppearanceService.getWarrantType(req.session, nomsId)
      if (warrantType === 'SENTENCING') {
        return res.redirect(
          `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/offences/${offenceReference}/sentence-type`,
        )
      }
      this.saveSessionOffenceInAppearance(req, nomsId, courtCaseReference, offenceReference)
      return res.redirect(
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/offences/check-offence-answers`,
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
    const offenceOutcome = this.getSessionOffenceOrAppearanceOffence(
      req,
      nomsId,
      courtCaseReference,
      offenceReference,
    ).outcome

    const warrantType: string = this.courtAppearanceService.getWarrantType(req.session, nomsId)
    const topCaseOutcomes = this.caseOutcomeService.getTopCaseOutcomes(warrantType)
    return res.render('pages/offence/offence-outcome', {
      nomsId,
      courtCaseReference,
      offenceOutcome,
      offenceReference,
      appearanceReference,
      addOrEditCourtCase,
      addOrEditCourtAppearance,
      topCaseOutcomes,
      submitToEditOffence,
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
    if (offenceOutcomeForm.offenceOutcome === 'LOOKUPDIFFERENT') {
      return res.redirect(
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/offences/${offenceReference}/lookup-offence-outcome${submitToEditOffence ? '?submitToEditOffence=true' : ''}`,
      )
    }
    this.offenceService.setOffenceOutcome(req.session, nomsId, courtCaseReference, offenceOutcomeForm.offenceOutcome)

    if (submitToEditOffence) {
      return res.redirect(
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/offences/${offenceReference}/edit-offence`,
      )
    }
    const warrantType = this.courtAppearanceService.getWarrantType(req.session, nomsId)
    if (warrantType === 'SENTENCING') {
      return res.redirect(
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/offences/${offenceReference}/period-length?periodLengthType=SENTENCE_LENGTH`,
      )
    }
    this.saveSessionOffenceInAppearance(req, nomsId, courtCaseReference, offenceReference)
    return res.redirect(
      `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/offences/check-offence-answers`,
    )
  }

  public getLookupOffenceOutcome: RequestHandler = async (req, res): Promise<void> => {
    const {
      nomsId,
      courtCaseReference,
      offenceReference,
      appearanceReference,
      addOrEditCourtCase,
      addOrEditCourtAppearance,
    } = req.params
    const { submitToEditOffence } = req.query
    const offenceOutcome = this.getSessionOffenceOrAppearanceOffence(
      req,
      nomsId,
      courtCaseReference,
      offenceReference,
    ).outcome

    return res.render('pages/offence/lookup-offence-outcome', {
      nomsId,
      courtCaseReference,
      offenceOutcome,
      offenceReference,
      appearanceReference,
      addOrEditCourtCase,
      addOrEditCourtAppearance,
      submitToEditOffence,
    })
  }

  public submitLookupOffenceOutcome: RequestHandler = async (req, res): Promise<void> => {
    const {
      nomsId,
      courtCaseReference,
      offenceReference,
      appearanceReference,
      addOrEditCourtCase,
      addOrEditCourtAppearance,
    } = req.params
    const lookupOffenceOutcomeForm = trimForm<OffenceLookupOffenceOutcomeForm>(req.body)
    this.offenceService.setOffenceOutcome(
      req.session,
      nomsId,
      courtCaseReference,
      lookupOffenceOutcomeForm.offenceOutcome,
    )
    const { submitToEditOffence } = req.query
    if (submitToEditOffence) {
      return res.redirect(
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/offences/${offenceReference}/edit-offence`,
      )
    }
    const warrantType = this.courtAppearanceService.getWarrantType(req.session, nomsId)
    if (warrantType === 'SENTENCING') {
      return res.redirect(
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/offences/${offenceReference}/period-length?periodLengthType=SENTENCE_LENGTH`,
      )
    }

    this.saveSessionOffenceInAppearance(req, nomsId, courtCaseReference, offenceReference)
    return res.redirect(
      `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/offences/check-offence-answers`,
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
    let backLink = `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/offences/check-offence-answers`
    if (submitToEditOffence) {
      backLink = `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/offences/${offenceReference}/edit-offence`
    } else if (addOrEditCourtCase === 'edit-court-case') {
      backLink = `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/review-offences`
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
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/offences/${offenceReference}/offence-code`,
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
    const courtAppearance = this.courtAppearanceService.getSessionCourtAppearance(req.session, nomsId)
    const offenceCode =
      offenceCodeForm.offenceCode ||
      this.getSessionOffenceOrAppearanceOffence(req, nomsId, courtCaseReference, offenceReference)?.offenceCode
    let backLink = `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/offences/check-offence-answers`
    if (submitToEditOffence) {
      backLink = `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/offences/${offenceReference}/edit-offence`
    } else if (courtAppearance.warrantType === 'SENTENCING') {
      backLink = `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/offences/${offenceReference}/count-number`
    }
    return res.render('pages/offence/offence-code', {
      nomsId,
      courtCaseReference,
      offenceReference,
      appearanceReference,
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
    const errors = await this.offenceService.setOffenceCode(
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
    const errors = await this.offenceService.setOffenceCodeFromLookup(
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

    return res.redirect(
      `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/offences/${offenceReference}/terror-related${submitToEditOffence ? '?submitToEditOffence=true' : ''}`,
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
    return res.redirect(
      `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/offences/${offenceReference}/terror-related${submitToEditOffence ? '?submitToEditOffence=true' : ''}`,
    )
  }

  public getTerrorRelated: RequestHandler = async (req, res): Promise<void> => {
    const {
      nomsId,
      courtCaseReference,
      offenceReference,
      appearanceReference,
      addOrEditCourtCase,
      addOrEditCourtAppearance,
    } = req.params
    const { submitToEditOffence } = req.query
    let terrorRelatedForm = (req.flash('terrorRelatedForm')[0] || {}) as OffenceTerrorRelatedForm
    if (Object.keys(terrorRelatedForm).length === 0) {
      terrorRelatedForm = {
        terrorRelated: String(
          this.getSessionOffenceOrAppearanceOffence(req, nomsId, courtCaseReference, offenceReference)?.terrorRelated,
        ).toLowerCase(),
      }
    }

    return res.render('pages/offence/terror-related', {
      nomsId,
      courtCaseReference,
      terrorRelatedForm,
      offenceReference,
      appearanceReference,
      addOrEditCourtCase,
      addOrEditCourtAppearance,
      submitToEditOffence,
      errors: req.flash('errors') || [],
      backLink: submitToEditOffence
        ? `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/offences/${offenceReference}/edit-offence`
        : `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/offences/${offenceReference}/confirm-offence-code`,
    })
  }

  public submitTerrorRelated: RequestHandler = async (req, res): Promise<void> => {
    const {
      nomsId,
      courtCaseReference,
      offenceReference,
      appearanceReference,
      addOrEditCourtCase,
      addOrEditCourtAppearance,
    } = req.params
    const terrorRelatedForm = trimForm<OffenceTerrorRelatedForm>(req.body)
    const errors = this.offenceService.setTerrorRelated(req.session, nomsId, courtCaseReference, terrorRelatedForm)
    if (errors.length > 0) {
      req.flash('errors', errors)
      req.flash('terrorRelatedForm', { ...terrorRelatedForm })
      return res.redirect(
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/offences/${offenceReference}/terror-related`,
      )
    }
    const { submitToEditOffence } = req.query
    if (submitToEditOffence) {
      return res.redirect(
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/offences/${offenceReference}/edit-offence`,
      )
    }
    return res.redirect(
      `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/offences/${offenceReference}/offence-date`,
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
    const sentenceTypes = await this.remandAndSentencingService.getSentenceTypes(
      ageAtConviction,
      convictionDate,
      req.user.username,
    )
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
      errors: req.flash('errors') || [],
      backLink: submitToEditOffence
        ? `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/offences/${offenceReference}/edit-offence`
        : `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/offences/${offenceReference}/offence-date`,
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
    let periodLengthForm = (req.flash('periodLengthForm')[0] || {}) as SentenceLengthForm
    if (Object.keys(periodLengthForm).length === 0) {
      periodLengthForm = sentenceLengthToSentenceLengthForm(
        sentence.periodLengths?.find(periodLength => periodLength.periodLengthType === periodLengthType),
      )
    }
    const expectedPeriodLengthTypeIndex = sentenceTypePeriodLengths[sentence?.sentenceTypeClassification].periodLengths
      .map(periodLength => periodLength.type)
      .indexOf(periodLengthType as string)
    const periodLengthHeader = periodLengthTypeHeadings[periodLengthType as string]
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

    const nextPeriodLengthType = getNextPeriodLengthType(
      this.getSessionOffenceOrAppearanceOffence(req, nomsId, courtCaseReference, offenceReference).sentence ?? {},
      periodLengthType as string,
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
    this.saveSessionOffenceInAppearance(req, nomsId, courtCaseReference, offenceReference)
    return res.redirect(
      `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/offences/check-offence-answers`,
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
    this.saveSessionOffenceInAppearance(req, nomsId, courtCaseReference, offenceReference)
    return res.redirect(
      `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/offences/check-offence-answers`,
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
    const offence = this.getSessionOffenceOrAppearanceOffence(req, nomsId, courtCaseReference, offenceReference)
    let offenceConvictionDateForm: OffenceConvictionDateForm
    if (offence.sentence?.convictionDate) {
      offenceConvictionDateForm = {
        'convictionDate-day': `${offence.sentence.convictionDate.getDate()}`,
        'convictionDate-month': `${offence.sentence.convictionDate.getMonth()}`,
        'convictionDate-year': `${offence.sentence.convictionDate.getFullYear()}`,
      }
    } else {
      offenceConvictionDateForm = (req.flash('offenceConvictionDateForm')[0] || {}) as OffenceConvictionDateForm
    }

    const { submitToEditOffence } = req.query
    let convictionDateDay: number | string = offenceConvictionDateForm['convictionDate-day']
    let convictionDateMonth: number | string = offenceConvictionDateForm['convictionDate-month']
    let convictionDateYear: number | string = offenceConvictionDateForm['convictionDate-year']
    const convictionDateValue = this.offenceService.getConvictionDate(req.session, nomsId, courtCaseReference)
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
      `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/offences/${offenceReference}/offence-code`,
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

    const [offenceMap, sentenceTypeMap] = await Promise.all([
      this.manageOffencesService.getOffenceMap(offenceCodes, req.user.token),
      this.remandAndSentencingService.getSentenceTypeMap(sentenceTypeIds, req.user.username),
    ])

    return res.render('pages/offence/check-offence-answers', {
      nomsId,
      courtCaseReference,
      courtAppearance,
      appearanceReference,
      infoBanner: req.flash('infoBanner'),
      addOrEditCourtCase,
      addOrEditCourtAppearance,
      offenceMap,
      sentenceTypeMap,
      backLink: `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/task-list`,
    })
  }

  public submitCheckOffenceAnswers: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, appearanceReference, addOrEditCourtCase, addOrEditCourtAppearance } = req.params
    this.courtAppearanceService.setOffenceSentenceAcceptedTrue(req.session, nomsId)
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
    const warrantType = this.courtAppearanceService.getWarrantType(req.session, nomsId)
    if (warrantType === 'SENTENCING') {
      return res.redirect(
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/offences/${offenceReference}/count-number`,
      )
    }
    return res.redirect(
      `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/offences/${offenceReference}/offence-code`,
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

      req.flash('infoBanner', `${sentenceOffence} deleted`)
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
    let sentenceType
    if (offence.sentence?.sentenceTypeId) {
      sentenceType = (
        await this.remandAndSentencingService.getSentenceTypeById(offence.sentence?.sentenceTypeId, req.user.username)
      ).description
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
    return res.redirect(
      `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/offences/check-offence-answers`,
    )
  }

  public getReviewOffences: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, appearanceReference, addOrEditCourtCase, addOrEditCourtAppearance } = req.params
    const latestCourtAppearance = await this.remandAndSentencingService.getLatestCourtAppearanceByCourtCaseUuid(
      req.user.token,
      courtCaseReference,
    )
    const sentenceTypeMap = Object.entries(
      latestCourtAppearance.charges
        .filter(charge => charge.sentence?.sentenceType.sentenceTypeUuid)
        .map(charge => [charge.sentence.sentenceType.sentenceTypeUuid, charge.sentence.sentenceType.description]),
    )
    const offenceMap = await this.manageOffencesService.getOffenceMap(
      Array.from(new Set(latestCourtAppearance.charges.map(offence => offence.offenceCode))),
      req.user.token,
    )
    const offences = latestCourtAppearance.charges.map(charge => chargeToOffence(charge))
    return res.render('pages/offence/review-offences', {
      nomsId,
      courtCaseReference,
      latestCourtAppearance,
      appearanceReference,
      addOrEditCourtCase,
      addOrEditCourtAppearance,
      offenceMap,
      sentenceTypeMap,
      offences,
    })
  }

  public submitReviewOffences: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, appearanceReference, addOrEditCourtCase, addOrEditCourtAppearance } = req.params
    const latestCourtAppearance = await this.remandAndSentencingService.getLatestCourtAppearanceByCourtCaseUuid(
      req.user.token,
      courtCaseReference,
    )
    latestCourtAppearance.charges
      .map(charge => chargeToOffence(charge))
      .forEach((offence, index) => this.courtAppearanceService.addOffence(req.session, nomsId, index, offence))

    const reviewOffenceForm = trimForm<ReviewOffencesForm>(req.body)
    if (reviewOffenceForm.changeOffence === 'true') {
      return res.redirect(
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/offences/check-offence-answers`,
      )
    }
    this.courtAppearanceService.setOffenceSentenceAcceptedTrue(req.session, nomsId)
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

  private saveSessionOffenceInAppearance(req, nomsId: string, courtCaseReference: string, offenceReference: string) {
    const offence = this.offenceService.getSessionOffence(req.session, nomsId, courtCaseReference)
    this.saveOffenceInAppearance(req, nomsId, courtCaseReference, offenceReference, offence)
  }

  private saveOffenceInAppearance(
    req,
    nomsId: string,
    courtCaseReference: string,
    offenceReference: string,
    offence: Offence,
  ) {
    const offencePersistType = this.courtAppearanceService.addOffence(
      req.session,
      nomsId,
      parseInt(offenceReference, 10),
      offence,
    )
    this.offenceService.clearOffence(req.session, nomsId, courtCaseReference)
    const warrantType = this.courtAppearanceService.getWarrantType(req.session, nomsId)
    const sentenceOffence = warrantType === 'SENTENCING' ? 'sentence' : 'offence'
    if (offencePersistType === OffencePersistType.CREATED) {
      req.flash('infoBanner', `New ${sentenceOffence} added`)
    } else if (offencePersistType === OffencePersistType.EDITED) {
      req.flash('infoBanner', 'Changes successfully made')
    }
  }
}
