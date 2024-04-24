import { RequestHandler } from 'express'
import type {
  OffenceAlternativeSentenceLengthForm,
  OffenceConfirmOffenceForm,
  OffenceConsecutiveToForm,
  OffenceCountNumberForm,
  OffenceDeleteOffenceForm,
  OffenceLookupOffenceOutcomeForm,
  OffenceOffenceCodeForm,
  OffenceOffenceDateForm,
  OffenceOffenceNameForm,
  OffenceOffenceOutcomeForm,
  OffenceSentenceLengthForm,
  OffenceSentenceServeTypeForm,
  OffenceTerrorRelatedForm,
  ReviewOffencesForm,
} from 'forms'
import dayjs from 'dayjs'
import deepmerge from 'deepmerge'
import trimForm from '../utils/trim'
import OffenceService from '../services/offenceService'
import ManageOffencesService from '../services/manageOffencesService'
import CourtAppearanceService from '../services/courtAppearanceService'
import validate from '../validation/validation'
import OffencePersistType from '../@types/models/OffencePersistType'
import CaseOutcomeService from '../services/caseOutcomeService'
import RemandAndSentencingService from '../services/remandAndSentencingService'
import { chargeToOffence } from '../utils/mappingUtils'
import logger from '../../logger'

export default class OffenceRoutes {
  constructor(
    private readonly offenceService: OffenceService,
    private readonly manageOffencesService: ManageOffencesService,
    private readonly courtAppearanceService: CourtAppearanceService,
    private readonly caseOutcomeService: CaseOutcomeService,
    private readonly remandAndSentencingService: RemandAndSentencingService,
  ) {}

  public getOffenceDate: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, offenceReference, appearanceReference, addOrEditCourtCase } = req.params
    const { submitToEditOffence } = req.query
    return res.render('pages/offence/offence-date', {
      nomsId,
      courtCaseReference,
      offenceReference,
      appearanceReference,
      addOrEditCourtCase,
      submitToEditOffence,
    })
  }

  public submitOffenceDate: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, offenceReference, appearanceReference, addOrEditCourtCase } = req.params
    const offenceDateForm = trimForm<OffenceOffenceDateForm>(req.body)
    const offenceStartDate = dayjs({
      year: offenceDateForm['offenceStartDate-year'],
      month: offenceDateForm['offenceStartDate-month'] - 1,
      day: offenceDateForm['offenceStartDate-day'],
    })
    this.offenceService.setOffenceStartDate(req.session, nomsId, courtCaseReference, offenceStartDate.toDate())

    if (
      offenceDateForm['offenceEndDate-day'] &&
      offenceDateForm['offenceEndDate-month'] &&
      offenceDateForm['offenceEndDate-year']
    ) {
      const offenceEndDate = dayjs({
        year: offenceDateForm['offenceEndDate-year'],
        month: offenceDateForm['offenceEndDate-month'] - 1,
        day: offenceDateForm['offenceEndDate-day'],
      })
      this.offenceService.setOffenceEndDate(req.session, nomsId, courtCaseReference, offenceEndDate.toDate())
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
          `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/appearance/${appearanceReference}/offences/${offenceReference}/edit-offence`,
        )
      }
      const warrantType = this.courtAppearanceService.getWarrantType(req.session, nomsId)
      if (warrantType === 'SENTENCING') {
        return res.redirect(
          `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/appearance/${appearanceReference}/offences/${offenceReference}/sentence-length`,
        )
      }
      this.saveOffenceInAppearance(req, nomsId, courtCaseReference, offenceReference)
      return res.redirect(
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/appearance/${appearanceReference}/offences/check-offence-answers`,
      )
    }
    if (submitToEditOffence) {
      return res.redirect(
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/appearance/${appearanceReference}/offences/${offenceReference}/edit-offence`,
      )
    }
    return res.redirect(
      `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/appearance/${appearanceReference}/offences/${offenceReference}/offence-outcome`,
    )
  }

  public getOffenceOutcome: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, offenceReference, appearanceReference, addOrEditCourtCase } = req.params
    const { submitToEditOffence } = req.query
    const offenceOutcome = this.offenceService.getOffenceOutcome(req.session, nomsId, courtCaseReference)

    const warrantType: string = this.courtAppearanceService.getWarrantType(req.session, nomsId)
    const topCaseOutcomes = this.caseOutcomeService.getTopCaseOutcomes(warrantType)
    return res.render('pages/offence/offence-outcome', {
      nomsId,
      courtCaseReference,
      offenceOutcome,
      offenceReference,
      appearanceReference,
      addOrEditCourtCase,
      topCaseOutcomes,
      submitToEditOffence,
    })
  }

  public submitOffenceOutcome: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, offenceReference, appearanceReference, addOrEditCourtCase } = req.params
    const { submitToEditOffence } = req.query
    const offenceOutcomeForm = trimForm<OffenceOffenceOutcomeForm>(req.body)
    if (offenceOutcomeForm.offenceOutcome === 'LOOKUPDIFFERENT') {
      return res.redirect(
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/appearance/${appearanceReference}/offences/${offenceReference}/lookup-offence-outcome${submitToEditOffence ? '?submitToEditOffence=true' : ''}`,
      )
    }
    this.offenceService.setOffenceOutcome(req.session, nomsId, courtCaseReference, offenceOutcomeForm.offenceOutcome)

    if (submitToEditOffence) {
      return res.redirect(
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/appearance/${appearanceReference}/offences/${offenceReference}/edit-offence`,
      )
    }
    const warrantType = this.courtAppearanceService.getWarrantType(req.session, nomsId)
    if (warrantType === 'SENTENCING') {
      return res.redirect(
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/appearance/${appearanceReference}/offences/${offenceReference}/sentence-length`,
      )
    }
    this.saveOffenceInAppearance(req, nomsId, courtCaseReference, offenceReference)
    return res.redirect(
      `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/appearance/${appearanceReference}/offences/check-offence-answers`,
    )
  }

  public getLookupOffenceOutcome: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, offenceReference, appearanceReference, addOrEditCourtCase } = req.params
    const { submitToEditOffence } = req.query
    const offenceOutcome = this.offenceService.getOffenceOutcome(req.session, nomsId, courtCaseReference)

    return res.render('pages/offence/lookup-offence-outcome', {
      nomsId,
      courtCaseReference,
      offenceOutcome,
      offenceReference,
      appearanceReference,
      addOrEditCourtCase,
      submitToEditOffence,
    })
  }

  public submitLookupOffenceOutcome: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, offenceReference, appearanceReference, addOrEditCourtCase } = req.params
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
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/appearance/${appearanceReference}/offences/${offenceReference}/edit-offence`,
      )
    }
    const warrantType = this.courtAppearanceService.getWarrantType(req.session, nomsId)
    if (warrantType === 'SENTENCING') {
      return res.redirect(
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/appearance/${appearanceReference}/offences/${offenceReference}/sentence-length`,
      )
    }

    this.saveOffenceInAppearance(req, nomsId, courtCaseReference, offenceReference)
    return res.redirect(
      `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/appearance/${appearanceReference}/offences/check-offence-answers`,
    )
  }

  public getCountNumber: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, offenceReference, appearanceReference, addOrEditCourtCase } = req.params
    const countNumber =
      this.offenceService.getCountNumber(req.session, nomsId, courtCaseReference) ??
      this.courtAppearanceService.getOffence(req.session, nomsId, parseInt(offenceReference, 10))?.sentence?.countNumber
    const { submitToEditOffence } = req.query
    return res.render('pages/offence/count-number', {
      nomsId,
      courtCaseReference,
      offenceReference,
      appearanceReference,
      addOrEditCourtCase,
      countNumber,
      submitToEditOffence,
    })
  }

  public submitCountNumber: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, offenceReference, appearanceReference, addOrEditCourtCase } = req.params
    const countNumberForm = trimForm<OffenceCountNumberForm>(req.body)
    this.offenceService.setCountNumber(req.session, nomsId, courtCaseReference, countNumberForm.countNumber)

    const { submitToEditOffence } = req.query
    if (submitToEditOffence) {
      return res.redirect(
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/appearance/${appearanceReference}/offences/${offenceReference}/edit-offence`,
      )
    }
    return res.redirect(
      `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/appearance/${appearanceReference}/offences/${offenceReference}/offence-code`,
    )
  }

  public getOffenceCode: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, offenceReference, appearanceReference, addOrEditCourtCase } = req.params
    const { submitToEditOffence } = req.query
    return res.render('pages/offence/offence-code', {
      nomsId,
      courtCaseReference,
      offenceReference,
      appearanceReference,
      errors: req.flash('errors') || [],
      offenceCodeForm: req.flash('offenceCodeForm')[0] || {},
      addOrEditCourtCase,
      submitToEditOffence,
    })
  }

  public submitOffenceCode: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, offenceReference, appearanceReference, addOrEditCourtCase } = req.params
    const offenceCodeForm = trimForm<OffenceOffenceCodeForm>(req.body)
    const errors = validate(
      offenceCodeForm,
      {
        offenceCode: `required_without:unknownCode|onlyOne:${offenceCodeForm.unknownCode ?? ''}`,
        unknownCode: `onlyOne:${offenceCodeForm.offenceCode ?? ''}`,
      },
      {
        'onlyOne.offenceCode': 'Either code or unknown must be submitted',
        'onlyOne.unknownCode': 'Either code or unknown must be submitted',
        'required_without.offenceCode': 'You must enter the offence code',
      },
    )
    if (offenceCodeForm.offenceCode && !offenceCodeForm.unknownCode) {
      try {
        await this.manageOffencesService.getOffenceByCode(offenceCodeForm.offenceCode, req.user.token)
      } catch (error) {
        logger.error(error)
        errors.push({ text: 'You must enter a valid offence code.', href: '#offenceCode' })
      }
    }
    if (errors.length > 0) {
      req.flash('errors', errors)
      req.flash('offenceCodeForm', { ...offenceCodeForm })
      return res.redirect(
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/appearance/${appearanceReference}/offences/${offenceReference}/offence-code`,
      )
    }
    const { submitToEditOffence } = req.query
    if (offenceCodeForm.unknownCode) {
      return res.redirect(
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/appearance/${appearanceReference}/offences/${offenceReference}/offence-name${submitToEditOffence ? '?submitToEditOffence=true' : ''}`,
      )
    }
    this.offenceService.setOffenceCode(req.session, nomsId, courtCaseReference, offenceCodeForm.offenceCode)
    return res.redirect(
      `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/appearance/${appearanceReference}/offences/${offenceReference}/confirm-offence-code${submitToEditOffence ? '?submitToEditOffence=true' : ''}`,
    )
  }

  public getOffenceName: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, offenceReference, appearanceReference, addOrEditCourtCase } = req.params
    const { submitToEditOffence } = req.query
    return res.render('pages/offence/offence-name', {
      nomsId,
      courtCaseReference,
      offenceReference,
      appearanceReference,
      addOrEditCourtCase,
      submitToEditOffence,
    })
  }

  public submitOffenceName: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, offenceReference, appearanceReference, addOrEditCourtCase } = req.params
    const offenceNameForm = trimForm<OffenceOffenceNameForm>(req.body)
    const [offenceCode, ...offenceNames] = offenceNameForm.offenceName.split(' ')
    const offenceName = offenceNames.join(' ')

    this.offenceService.setOffenceCode(req.session, nomsId, courtCaseReference, offenceCode)
    this.offenceService.setOffenceName(req.session, nomsId, courtCaseReference, offenceName)
    const { submitToEditOffence } = req.query
    const courtAppearance = this.courtAppearanceService.getSessionCourtAppearance(req.session, nomsId)
    if (courtAppearance.warrantType === 'SENTENCING') {
      return res.redirect(
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/appearance/${appearanceReference}/offences/${offenceReference}/terror-related${submitToEditOffence ? '?submitToEditOffence=true' : ''}`,
      )
    }
    if (submitToEditOffence) {
      return res.redirect(
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/appearance/${appearanceReference}/offences/${offenceReference}/edit-offence`,
      )
    }
    return res.redirect(
      `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/appearance/${appearanceReference}/offences/${offenceReference}/offence-date`,
    )
  }

  public getConfirmOffenceCode: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, offenceReference, appearanceReference, addOrEditCourtCase } = req.params
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
      submitToEditOffence,
      backLink: `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/appearance/${appearanceReference}/offences/${offenceReference}/offence-code`,
    })
  }

  public submitConfirmOffenceCode: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, offenceReference, appearanceReference, addOrEditCourtCase } = req.params
    const confirmOffenceForm = trimForm<OffenceConfirmOffenceForm>(req.body)
    this.offenceService.setOffenceCode(req.session, nomsId, courtCaseReference, confirmOffenceForm.offenceCode)
    this.offenceService.setOffenceName(req.session, nomsId, courtCaseReference, confirmOffenceForm.offenceName)
    const { submitToEditOffence } = req.query
    const courtAppearance = this.courtAppearanceService.getSessionCourtAppearance(req.session, nomsId)

    if (courtAppearance.warrantType === 'SENTENCING') {
      return res.redirect(
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/appearance/${appearanceReference}/offences/${offenceReference}/terror-related${submitToEditOffence ? '?submitToEditOffence=true' : ''}`,
      )
    }

    if (submitToEditOffence) {
      return res.redirect(
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/appearance/${appearanceReference}/offences/${offenceReference}/edit-offence`,
      )
    }

    return res.redirect(
      `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/appearance/${appearanceReference}/offences/${offenceReference}/offence-date`,
    )
  }

  public getTerrorRelated: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, offenceReference, appearanceReference, addOrEditCourtCase } = req.params
    const { submitToEditOffence } = req.query
    const terrorRelated = this.offenceService.getTerrorRelated(req.session, nomsId, courtCaseReference)

    return res.render('pages/offence/terror-related', {
      nomsId,
      courtCaseReference,
      terrorRelated,
      offenceReference,
      appearanceReference,
      addOrEditCourtCase,
      submitToEditOffence,
    })
  }

  public submitTerrorRelated: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, offenceReference, appearanceReference, addOrEditCourtCase } = req.params
    const terrorRelatedForm = trimForm<OffenceTerrorRelatedForm>(req.body)
    const terrorRelated = terrorRelatedForm.terrorRelated === 'true'
    this.offenceService.setTerrorRelated(req.session, nomsId, courtCaseReference, terrorRelated)
    const { submitToEditOffence } = req.query
    if (submitToEditOffence) {
      return res.redirect(
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/appearance/${appearanceReference}/offences/${offenceReference}/edit-offence`,
      )
    }
    return res.redirect(
      `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/appearance/${appearanceReference}/offences/${offenceReference}/offence-date`,
    )
  }

  public getSentenceLength: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, offenceReference, appearanceReference, addOrEditCourtCase } = req.params
    const { submitToEditOffence } = req.query
    return res.render('pages/offence/sentence-length', {
      nomsId,
      courtCaseReference,
      offenceReference,
      appearanceReference,
      addOrEditCourtCase,
      submitToEditOffence,
    })
  }

  public submitSentenceLength: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, offenceReference, appearanceReference, addOrEditCourtCase } = req.params
    const offenceSentenceLengthForm = trimForm<OffenceSentenceLengthForm>(req.body)
    const sentenceLength = {
      ...(offenceSentenceLengthForm['sentenceLength-years']
        ? { years: offenceSentenceLengthForm['sentenceLength-years'] }
        : {}),
      ...(offenceSentenceLengthForm['sentenceLength-months']
        ? { months: offenceSentenceLengthForm['sentenceLength-months'] }
        : {}),
      ...(offenceSentenceLengthForm['sentenceLength-weeks']
        ? { weeks: offenceSentenceLengthForm['sentenceLength-weeks'] }
        : {}),
      ...(offenceSentenceLengthForm['sentenceLength-days']
        ? { days: offenceSentenceLengthForm['sentenceLength-days'] }
        : {}),
      periodOrder: [
        ...(offenceSentenceLengthForm['sentenceLength-years'] ? ['years'] : []),
        ...(offenceSentenceLengthForm['sentenceLength-months'] ? ['months'] : []),
        ...(offenceSentenceLengthForm['sentenceLength-weeks'] ? ['weeks'] : []),
        ...(offenceSentenceLengthForm['sentenceLength-days'] ? ['days'] : []),
      ],
    }
    this.offenceService.setCustodialSentenceLength(req.session, nomsId, courtCaseReference, sentenceLength)
    const { submitToEditOffence } = req.query
    if (submitToEditOffence) {
      return res.redirect(
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/appearance/${appearanceReference}/offences/${offenceReference}/edit-offence`,
      )
    }
    return res.redirect(
      `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/appearance/${appearanceReference}/offences/${offenceReference}/sentence-serve-type`,
    )
  }

  public getAlternativeSentenceLength: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, offenceReference, appearanceReference, addOrEditCourtCase } = req.params
    const { submitToEditOffence } = req.query
    return res.render('pages/offence/alternative-sentence-length', {
      nomsId,
      courtCaseReference,
      offenceReference,
      appearanceReference,
      addOrEditCourtCase,
      submitToEditOffence,
    })
  }

  public submitAlternativeSentenceLength: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, offenceReference, appearanceReference, addOrEditCourtCase } = req.params
    const offenceAlternativeSentenceLengthForm = trimForm<OffenceAlternativeSentenceLengthForm>(req.body)
    const sentenceLengths = offenceAlternativeSentenceLengthForm.sentenceLengths
      .filter(sentenceLength => sentenceLength.value)
      .reduce(
        (prev, current) => {
          // eslint-disable-next-line no-param-reassign
          prev[current.period] = current.value
          prev.periodOrder.push(current.period)
          return prev
        },
        { periodOrder: [] },
      )
    this.offenceService.setCustodialSentenceLength(req.session, nomsId, courtCaseReference, sentenceLengths)
    const { submitToEditOffence } = req.query
    if (submitToEditOffence) {
      return res.redirect(
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/appearance/${appearanceReference}/offences/${offenceReference}/edit-offence`,
      )
    }
    return res.redirect(
      `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/appearance/${appearanceReference}/offences/${offenceReference}/sentence-serve-type`,
    )
  }

  public getSentenceServeType: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, offenceReference, appearanceReference, addOrEditCourtCase } = req.params
    const { submitToEditOffence } = req.query
    const forthwithAlreadySelected = this.courtAppearanceService.isForwithAlreadySelected(req.session, nomsId)
    return res.render('pages/offence/sentence-serve-type', {
      nomsId,
      courtCaseReference,
      offenceReference,
      appearanceReference,
      addOrEditCourtCase,
      errors: req.flash('errors') || [],
      forthwithAlreadySelected,
      submitToEditOffence,
      backLink: `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/appearance/${appearanceReference}/offences/${offenceReference}/sentence-length`,
    })
  }

  public submitSentenceServeType: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, offenceReference, appearanceReference, addOrEditCourtCase } = req.params
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
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/appearance/${appearanceReference}/offences/${offenceReference}/sentence-serve-type`,
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
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/appearance/${appearanceReference}/offences/${offenceReference}/consecutive-to${submitToEditOffence ? '?submitToEditOffence=true' : ''}`,
      )
    }
    if (submitToEditOffence) {
      return res.redirect(
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/appearance/${appearanceReference}/offences/${offenceReference}/edit-offence`,
      )
    }
    this.saveOffenceInAppearance(req, nomsId, courtCaseReference, offenceReference)
    return res.redirect(
      `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/appearance/${appearanceReference}/offences/check-offence-answers`,
    )
  }

  public getConsecutiveTo: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, offenceReference, appearanceReference, addOrEditCourtCase } = req.params
    const { submitToEditOffence } = req.query
    const countNumber = this.offenceService.getCountNumber(req.session, nomsId, courtCaseReference)
    return res.render('pages/offence/consecutive-to', {
      nomsId,
      courtCaseReference,
      offenceReference,
      appearanceReference,
      addOrEditCourtCase,
      errors: req.flash('errors') || [],
      countNumber,
      submitToEditOffence,
      backLink: `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/appearance/${appearanceReference}/offences/${offenceReference}/sentence-serve-type`,
    })
  }

  public submitConsecutiveTo: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, offenceReference, appearanceReference, addOrEditCourtCase } = req.params
    const offenceConsecutiveToForm = trimForm<OffenceConsecutiveToForm>(req.body)
    const errors = validate(
      offenceConsecutiveToForm,
      {
        consecutiveTo: 'required',
      },
      {
        'required.consecutiveTo': `You must enter the consecutive to`,
      },
    )
    if (errors.length > 0) {
      req.flash('errors', errors)
      return res.redirect(
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/appearance/${appearanceReference}/offences/${offenceReference}/consecutive-to`,
      )
    }
    this.offenceService.setConsecutiveTo(
      req.session,
      nomsId,
      courtCaseReference,
      offenceConsecutiveToForm.consecutiveTo,
    )
    const { submitToEditOffence } = req.query
    if (submitToEditOffence) {
      return res.redirect(
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/appearance/${appearanceReference}/offences/${offenceReference}/edit-offence`,
      )
    }
    this.saveOffenceInAppearance(req, nomsId, courtCaseReference, offenceReference)
    return res.redirect(
      `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/appearance/${appearanceReference}/offences/check-offence-answers`,
    )
  }

  public getCheckOffenceAnswers: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, appearanceReference, addOrEditCourtCase } = req.params
    const courtAppearance = this.courtAppearanceService.getSessionCourtAppearance(req.session, nomsId)

    const offenceMap = await this.manageOffencesService.getOffenceMap(
      Array.from(new Set(courtAppearance.offences.map(offence => offence.offenceCode))),
      req.user.token,
    )
    return res.render('pages/offence/check-offence-answers', {
      nomsId,
      courtCaseReference,
      courtAppearance,
      appearanceReference,
      infoBanner: req.flash('infoBanner'),
      addOrEditCourtCase,
      offenceMap,
      backLink: `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/appearance/${appearanceReference}/task-list`,
    })
  }

  public addAnotherOffence: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, offenceReference, appearanceReference, addOrEditCourtCase } = req.params
    this.offenceService.clearOffence(req.session, nomsId, courtCaseReference)
    const warrantType = this.courtAppearanceService.getWarrantType(req.session, nomsId)
    if (warrantType === 'SENTENCING') {
      return res.redirect(
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/appearance/${appearanceReference}/offences/${offenceReference}/count-number`,
      )
    }
    return res.redirect(
      `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/appearance/${appearanceReference}/offences/${offenceReference}/offence-code`,
    )
  }

  public getDeleteOffence: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, offenceReference, appearanceReference, addOrEditCourtCase } = req.params
    const offence = this.courtAppearanceService.getOffence(req.session, nomsId, parseInt(offenceReference, 10))
    const offenceMap = await this.manageOffencesService.getOffenceMap([offence.offenceCode], req.user.token)
    return res.render('pages/offence/delete-offence', {
      nomsId,
      courtCaseReference,
      offence,
      offenceReference,
      appearanceReference,
      addOrEditCourtCase,
      errors: req.flash('errors') || [],
      offenceMap,
      backLink: `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/appearance/${appearanceReference}/offences/check-offence-answers`,
    })
  }

  public submitDeleteOffence: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, offenceReference, appearanceReference, addOrEditCourtCase } = req.params
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
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/appearance/${appearanceReference}/offences/${offenceReference}/delete-offence`,
      )
    }
    if (deleteOffenceForm.deleteOffence === 'true') {
      this.courtAppearanceService.deleteOffence(req.session, nomsId, parseInt(offenceReference, 10))

      req.flash('infoBanner', `${sentenceOffence} deleted`)
    }
    return res.redirect(
      `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/appearance/${appearanceReference}/offences/check-offence-answers`,
    )
  }

  public getEditOffence: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, offenceReference, appearanceReference, addOrEditCourtCase } = req.params
    const appearanceOffence = this.courtAppearanceService.getOffence(
      req.session,
      nomsId,
      parseInt(offenceReference, 10),
    )
    const sessionOffence = this.offenceService.getSessionOffence(req.session, nomsId, courtCaseReference)
    const offence = deepmerge(appearanceOffence, sessionOffence, { arrayMerge: (_target, source, _options) => source })
    const offenceMap = await this.manageOffencesService.getOffenceMap([offence.offenceCode], req.user.token)
    return res.render('pages/offence/edit-offence', {
      nomsId,
      courtCaseReference,
      offence,
      offenceReference,
      appearanceReference,
      addOrEditCourtCase,
      errors: req.flash('errors') || [],
      offenceMap,
      backLink: `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/appearance/${appearanceReference}/offences/check-offence-answers`,
    })
  }

  public getReviewOffences: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, appearanceReference, addOrEditCourtCase } = req.params
    const latestCourtAppearance = await this.remandAndSentencingService.getLatestCourtAppearanceByCourtCaseUuid(
      req.user.token,
      courtCaseReference,
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
      offenceMap,
      offences,
    })
  }

  public submitReviewOffences: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, appearanceReference, addOrEditCourtCase } = req.params
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
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/appearance/${appearanceReference}/offences/check-offence-answers`,
      )
    }
    return res.redirect(
      `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/appearance/${appearanceReference}/next-hearing-select`,
    )
  }

  private saveOffenceInAppearance(req, nomsId: string, courtCaseReference: string, offenceReference: string) {
    const offence = this.offenceService.getSessionOffence(req.session, nomsId, courtCaseReference)
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
