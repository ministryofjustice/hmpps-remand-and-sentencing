import { RequestHandler } from 'express'
import type {
  OffenceAlternativePeriodLengthForm,
  OffenceConvictionDateForm,
  OffenceFineAmountForm,
  OffenceOffenceDateForm,
  OffenceSentenceTypeForm,
  SentenceLengthForm,
} from 'forms'
import type { Offence } from 'models'
import dayjs from 'dayjs'
import { PERIOD_TYPE_PRIORITY } from '@ministryofjustice/hmpps-court-cases-release-dates-design/hmpps/@types'
import CourtAppearanceService from '../services/courtAppearanceService'
import ManageOffencesService from '../services/manageOffencesService'
import OffenceService from '../services/offenceService'
import RemandAndSentencingService from '../services/remandAndSentencingService'
import BaseRoutes from './baseRoutes'
import trimForm from '../utils/trim'
import {
  pageCourtCaseAppearanceToCourtAppearance,
  sentenceLengthToAlternativeSentenceLengthForm,
  sentenceLengthToSentenceLengthForm,
} from '../utils/mappingUtils'
import UnknownRecallSentenceJourneyUrls from './data/UnknownRecallSentenceJourneyUrls'
import RefDataService from '../services/refDataService'
import { getNextPeriodLengthType } from '../utils/utils'
import sentenceTypePeriodLengths from '../resources/sentenceTypePeriodLengths'
import periodLengthTypeHeadings from '../resources/PeriodLengthTypeHeadings'
import { SentenceType } from '../@types/remandAndSentencingApi/remandAndSentencingClientTypes'

export default class UnknownRecallSentenceRoutes extends BaseRoutes {
  constructor(
    courtAppearanceService: CourtAppearanceService,
    offenceService: OffenceService,
    remandAndSentencingService: RemandAndSentencingService,
    manageOffencesService: ManageOffencesService,
    private readonly refDataService: RefDataService,
  ) {
    super(courtAppearanceService, offenceService, remandAndSentencingService, manageOffencesService)
  }

  public loadCharge: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, appearanceReference, chargeUuid } = req.params
    const { username } = res.locals.user
    const storedAppearance = await this.remandAndSentencingService.getCourtAppearanceByAppearanceUuid(
      appearanceReference,
      username,
    )
    this.courtAppearanceService.clearSessionCourtAppearance(req.session, nomsId)
    this.offenceService.clearAllOffences(req.session, nomsId, appearanceReference)
    const sessionAppearance = pageCourtCaseAppearanceToCourtAppearance(storedAppearance)
    this.courtAppearanceService.setSessionCourtAppearance(req.session, nomsId, sessionAppearance)
    const sessionOffence = sessionAppearance.offences.find(offence => offence.chargeUuid === chargeUuid)
    this.offenceService.setSessionOffence(req.session, nomsId, appearanceReference, sessionOffence)
    return res.redirect(
      `/person/${nomsId}/unknown-recall-sentence/court-appearance/${appearanceReference}/charge/${chargeUuid}/offence-date`,
    )
  }

  public getOffenceDate: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, appearanceReference, chargeUuid } = req.params
    const { submitToCheckAnswers } = req.query
    const offenceDateForm = (req.flash('offenceDateForm')[0] || {}) as OffenceOffenceDateForm
    let offenceStartDateDay: number | string = offenceDateForm['offenceStartDate-day']
    let offenceStartDateMonth: number | string = offenceDateForm['offenceStartDate-month']
    let offenceStartDateYear: number | string = offenceDateForm['offenceStartDate-year']
    let offenceEndDateDay: number | string = offenceDateForm['offenceEndDate-day']
    let offenceEndDateMonth: number | string = offenceDateForm['offenceEndDate-month']
    let offenceEndDateYear: number | string = offenceDateForm['offenceEndDate-year']
    const offence = this.offenceService.getSessionOffence(req.session, nomsId, appearanceReference, chargeUuid)

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

    const offenceName = await this.getOffenceDescription(offence, res.locals.user.username)
    let backLink = UnknownRecallSentenceJourneyUrls.landingPage(nomsId)
    if (submitToCheckAnswers) {
      backLink = UnknownRecallSentenceJourneyUrls.checkAnswers(nomsId, appearanceReference, chargeUuid)
    }
    return res.render('pages/offence/offence-date', {
      nomsId,
      chargeUuid,
      offenceStartDateDay,
      offenceStartDateMonth,
      offenceStartDateYear,
      offenceEndDateDay,
      offenceEndDateMonth,
      offenceEndDateYear,
      errors: req.flash('errors') || [],
      offenceName,
      hideOffences: true,
      isUnknownRecallSentence: true,
      backLink,
    })
  }

  public submitOffenceDate: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, appearanceReference, chargeUuid } = req.params
    const { submitToCheckAnswers } = req.query
    const offenceDateForm = trimForm<OffenceOffenceDateForm>(req.body)
    const errors = this.offenceService.setOffenceDates(
      req.session,
      nomsId,
      appearanceReference,
      offenceDateForm,
      this.courtAppearanceService.getWarrantDate(req.session, nomsId, appearanceReference),
      this.courtAppearanceService.getOverallConvictionDate(req.session, nomsId, appearanceReference),
      chargeUuid,
    )
    if (errors.length > 0) {
      req.flash('errors', errors)
      req.flash('offenceDateForm', { ...offenceDateForm })
      return res.redirect(
        `${UnknownRecallSentenceJourneyUrls.offenceDate(nomsId, appearanceReference, chargeUuid)}?hasErrors=true${submitToCheckAnswers ? '&submitToCheckAnswers=true' : ''}`,
      )
    }

    if (submitToCheckAnswers) {
      return res.redirect(UnknownRecallSentenceJourneyUrls.checkAnswers(nomsId, appearanceReference, chargeUuid))
    }

    return res.redirect(UnknownRecallSentenceJourneyUrls.convictionDate(nomsId, appearanceReference, chargeUuid))
  }

  public getConvictionDate: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, appearanceReference, chargeUuid } = req.params
    const { submitToCheckAnswers } = req.query
    const offenceConvictionDateForm = (req.flash('offenceConvictionDateForm')[0] || {}) as OffenceConvictionDateForm
    let convictionDateDay: number | string = offenceConvictionDateForm['convictionDate-day']
    let convictionDateMonth: number | string = offenceConvictionDateForm['convictionDate-month']
    let convictionDateYear: number | string = offenceConvictionDateForm['convictionDate-year']
    const offence = this.offenceService.getSessionOffence(req.session, nomsId, appearanceReference, chargeUuid)
    const convictionDateValue = offence.sentence?.convictionDate
    if (convictionDateValue && Object.keys(offenceConvictionDateForm).length === 0) {
      const convictionDate = new Date(convictionDateValue)
      convictionDateDay = convictionDate.getDate()
      convictionDateMonth = convictionDate.getMonth() + 1
      convictionDateYear = convictionDate.getFullYear()
    }
    const offenceHint = await this.getOffenceDescription(offence, res.locals.user.username)
    let backLink = UnknownRecallSentenceJourneyUrls.offenceDate(nomsId, appearanceReference, chargeUuid)
    if (submitToCheckAnswers) {
      backLink = UnknownRecallSentenceJourneyUrls.checkAnswers(nomsId, appearanceReference, chargeUuid)
    }
    return res.render('pages/offence/offence-conviction-date', {
      nomsId,
      convictionDateDay,
      convictionDateMonth,
      convictionDateYear,
      offenceHint,
      errors: req.flash('errors') || [],
      backLink,
      hideOffences: true,
      isUnknownRecallSentence: true,
    })
  }

  public submitConvictionDate: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, appearanceReference, chargeUuid } = req.params
    const { submitToCheckAnswers } = req.query
    const offenceConvictionDateForm = trimForm<OffenceConvictionDateForm>(req.body)

    const errors = this.offenceService.setConvictionDateForm(
      req.session,
      nomsId,
      appearanceReference,
      chargeUuid,
      offenceConvictionDateForm,
      this.courtAppearanceService.getWarrantDate(req.session, nomsId, appearanceReference),
    )
    if (errors.length > 0) {
      req.flash('errors', errors)
      req.flash('offenceConvictionDateForm', { ...offenceConvictionDateForm })
      return res.redirect(
        `${UnknownRecallSentenceJourneyUrls.convictionDate(nomsId, appearanceReference, chargeUuid)}?hasErrors=true${submitToCheckAnswers ? '&submitToCheckAnswers=true' : ''}`,
      )
    }

    if (submitToCheckAnswers) {
      return res.redirect(UnknownRecallSentenceJourneyUrls.checkAnswers(nomsId, appearanceReference, chargeUuid))
    }

    return res.redirect(UnknownRecallSentenceJourneyUrls.sentenceType(nomsId, appearanceReference, chargeUuid))
  }

  public getSentenceType: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, appearanceReference, chargeUuid } = req.params
    const { submitToCheckAnswers } = req.query
    let offenceSentenceTypeForm = (req.flash('offenceSentenceTypeForm')[0] || {}) as OffenceSentenceTypeForm
    const offence = this.offenceService.getSessionOffence(req.session, nomsId, appearanceReference, chargeUuid)
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
      await this.refDataService.getSentenceTypes(ageAtConviction, convictionDate, offenceDate, req.user.username)
    ).sort((a, b) => a.displayOrder - b.displayOrder)

    let backLink = UnknownRecallSentenceJourneyUrls.convictionDate(nomsId, appearanceReference, chargeUuid)
    if (submitToCheckAnswers) {
      backLink = UnknownRecallSentenceJourneyUrls.checkAnswers(nomsId, appearanceReference, chargeUuid)
    }

    const offenceHint = await this.getOffenceDescription(offence, req.user.username)
    return res.render('pages/offence/sentence-type', {
      nomsId,
      chargeUuid,
      appearanceReference,
      offenceSentenceTypeForm,
      sentenceTypes,
      offenceHint,
      errors: req.flash('errors') || [],
      backLink,
      displaySelect: true,
      hideOffences: true,
      isUnknownRecallSentence: true,
    })
  }

  public submitSentenceType: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, appearanceReference, chargeUuid } = req.params
    const { submitToCheckAnswers } = req.query
    const offenceSentenceTypeForm = trimForm<OffenceSentenceTypeForm>(req.body)
    const errors = this.offenceService.setSentenceType(
      req.session,
      nomsId,
      appearanceReference,
      chargeUuid,
      offenceSentenceTypeForm,
    )

    if (errors.length > 0) {
      req.flash('errors', errors)
      req.flash('offenceSentenceTypeForm', { ...offenceSentenceTypeForm })
      return res.redirect(
        `${UnknownRecallSentenceJourneyUrls.sentenceType(nomsId, appearanceReference, chargeUuid)}?hasErrors=true${submitToCheckAnswers ? '&submitToCheckAnswers=true' : ''}`,
      )
    }

    const offence = this.offenceService.getSessionOffence(req.session, nomsId, appearanceReference, chargeUuid)
    this.offenceService.updatePeriodLengths(req.session, nomsId, appearanceReference, chargeUuid, offence)

    const nextPeriodLengthType = getNextPeriodLengthType(
      this.offenceService.getSessionOffence(req.session, nomsId, appearanceReference, chargeUuid).sentence ?? {
        sentenceUuid: crypto.randomUUID(),
      },
      null,
    )

    if (nextPeriodLengthType) {
      return res.redirect(
        UnknownRecallSentenceJourneyUrls.periodLength(nomsId, appearanceReference, chargeUuid, nextPeriodLengthType),
      )
    }

    if (offence.sentence.sentenceTypeClassification === 'FINE' && !offence.sentence.fineAmount) {
      return res.redirect(UnknownRecallSentenceJourneyUrls.fineAmount(nomsId, appearanceReference, chargeUuid))
    }

    return res.redirect(UnknownRecallSentenceJourneyUrls.checkAnswers(nomsId, appearanceReference, chargeUuid))
  }

  public getPeriodLength: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, appearanceReference, chargeUuid } = req.params
    const { submitToCheckAnswers, periodLengthType } = req.query as {
      submitToCheckAnswers: string
      periodLengthType: string
    }
    const offence = this.offenceService.getSessionOffence(req.session, nomsId, appearanceReference, chargeUuid)
    const { sentence } = offence
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
    let backLink = UnknownRecallSentenceJourneyUrls.sentenceType(nomsId, appearanceReference, chargeUuid)
    if (submitToCheckAnswers) {
      backLink = UnknownRecallSentenceJourneyUrls.checkAnswers(nomsId, appearanceReference, chargeUuid)
    } else if (expectedPeriodLengthTypeIndex >= 1) {
      const previousPeriodLengthType =
        sentenceTypePeriodLengths[sentence?.sentenceTypeClassification].periodLengths[expectedPeriodLengthTypeIndex - 1]
          .type
      backLink = `${UnknownRecallSentenceJourneyUrls.periodLength(nomsId, appearanceReference, chargeUuid, previousPeriodLengthType)}${submitToCheckAnswers ? '&submitToCheckAnswers=true' : ''}`
    }
    let sentenceTypeHint
    if (sentence?.sentenceTypeId) {
      sentenceTypeHint = (await this.refDataService.getSentenceTypeById(sentence.sentenceTypeId, req.user.username))
        .hintText
    }
    const offenceHint = await this.getOffenceDescription(offence, req.user.username)
    return res.render('pages/offence/period-length', {
      nomsId,
      chargeUuid,
      appearanceReference,
      periodLengthType,
      periodLengthForm,
      periodLengthHeader,
      sentenceTypeHint,
      offenceHint,
      errors: req.flash('errors') || [],
      backLink,
      hideOffences: true,
      isUnknownRecallSentence: true,
      alternativePeriodLengthHref: UnknownRecallSentenceJourneyUrls.alternativePeriodLength(
        nomsId,
        appearanceReference,
        chargeUuid,
        periodLengthType,
      ),
    })
  }

  public submitPeriodLength: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, appearanceReference, chargeUuid } = req.params
    const { submitToCheckAnswers, periodLengthType } = req.query as {
      submitToCheckAnswers: string
      periodLengthType: string
    }
    const offenceSentenceLengthForm = trimForm<SentenceLengthForm>(req.body)
    const { sentence } = this.offenceService.getSessionOffence(req.session, nomsId, appearanceReference, chargeUuid)
    this.offenceService.setInitialPeriodLengths(
      req.session,
      nomsId,
      appearanceReference,
      sentence?.periodLengths ?? [],
      chargeUuid,
    )
    const currentPeriodLength = sentence.periodLengths?.find(
      periodLength => periodLength.periodLengthType === periodLengthType,
    )
    const periodLengthHeader =
      periodLengthTypeHeadings[periodLengthType]?.toLowerCase() ??
      currentPeriodLength?.legacyData?.sentenceTermDescription
    const errors = this.offenceService.setPeriodLength(
      req.session,
      nomsId,
      appearanceReference,
      chargeUuid,
      offenceSentenceLengthForm,
      periodLengthType,
      periodLengthHeader,
    )
    if (errors.length > 0) {
      req.flash('errors', errors)
      req.flash('offenceSentenceLengthForm', { ...offenceSentenceLengthForm })
      return res.redirect(
        `${UnknownRecallSentenceJourneyUrls.periodLength(nomsId, appearanceReference, chargeUuid, periodLengthType)}&hasErrors=true${submitToCheckAnswers ? '&submitToCheckAnswers=true' : ''}`,
      )
    }

    const nextPeriodLengthType = getNextPeriodLengthType(sentence, periodLengthType)
    if (nextPeriodLengthType) {
      return res.redirect(
        UnknownRecallSentenceJourneyUrls.periodLength(nomsId, appearanceReference, chargeUuid, nextPeriodLengthType),
      )
    }

    if (sentence.sentenceTypeClassification === 'FINE') {
      return res.redirect(UnknownRecallSentenceJourneyUrls.fineAmount(nomsId, appearanceReference, chargeUuid))
    }
    return res.redirect(UnknownRecallSentenceJourneyUrls.checkAnswers(nomsId, appearanceReference, chargeUuid))
  }

  public getAlternativePeriodLength: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, appearanceReference, chargeUuid } = req.params
    const { submitToCheckAnswers, periodLengthType } = req.query as {
      submitToCheckAnswers: string
      periodLengthType: string
    }
    const offence = this.offenceService.getSessionOffence(req.session, nomsId, appearanceReference, chargeUuid)
    const { sentence } = offence
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
    const offenceHint = await this.getOffenceDescription(offence, req.user.username)
    const backLink = `${UnknownRecallSentenceJourneyUrls.periodLength(
      nomsId,
      appearanceReference,
      chargeUuid,
      periodLengthType,
    )}${submitToCheckAnswers ? '&submitToCheckAnswers=true' : ''}`
    return res.render('pages/offence/alternative-period-length', {
      nomsId,
      chargeUuid,
      appearanceReference,
      offenceAlternativeSentenceLengthForm,
      offenceHint,
      errors: req.flash('errors') || [],
      backLink,
      periodLengthType,
      periodLengthHeader,
      hideOffences: true,
      isUnknownRecallSentence: true,
    })
  }

  public submitAlternativePeriodLength: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, appearanceReference, chargeUuid } = req.params
    const { periodLengthType } = req.query as {
      periodLengthType: string
    }
    const offenceAlternativeSentenceLengthForm = trimForm<OffenceAlternativePeriodLengthForm>(req.body)
    const { sentence } = this.offenceService.getSessionOffence(req.session, nomsId, appearanceReference, chargeUuid)
    this.offenceService.setInitialPeriodLengths(
      req.session,
      nomsId,
      appearanceReference,
      sentence?.periodLengths ?? [],
      chargeUuid,
    )
    const errors = this.offenceService.setAlternativePeriodLength(
      req.session,
      nomsId,
      appearanceReference,
      chargeUuid,
      offenceAlternativeSentenceLengthForm,
      periodLengthType as string,
    )
    if (errors.length > 0) {
      req.flash('errors', errors)
      req.flash('offenceAlternativeSentenceLengthForm', { ...offenceAlternativeSentenceLengthForm })
      return res.redirect(
        `${UnknownRecallSentenceJourneyUrls.alternativePeriodLength(nomsId, appearanceReference, chargeUuid, periodLengthType)}&hasErrors=true`,
      )
    }
    const nextPeriodLengthType = getNextPeriodLengthType(sentence, periodLengthType)
    if (nextPeriodLengthType) {
      return res.redirect(
        UnknownRecallSentenceJourneyUrls.periodLength(nomsId, appearanceReference, chargeUuid, nextPeriodLengthType),
      )
    }

    if (sentence.sentenceTypeClassification === 'FINE') {
      return res.redirect(UnknownRecallSentenceJourneyUrls.fineAmount(nomsId, appearanceReference, chargeUuid))
    }
    return res.redirect(UnknownRecallSentenceJourneyUrls.checkAnswers(nomsId, appearanceReference, chargeUuid))
  }

  public getFineAmount: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, appearanceReference, chargeUuid } = req.params
    const { submitToCheckAnswers } = req.query
    let offenceFineAmountForm = (req.flash('offenceFineAmountForm')[0] || {}) as OffenceFineAmountForm
    const offence = this.offenceService.getSessionOffence(req.session, nomsId, appearanceReference, chargeUuid)
    const { sentence } = offence
    if (Object.keys(offenceFineAmountForm).length === 0) {
      offenceFineAmountForm = {
        fineAmount: sentence?.fineAmount,
      }
    }
    const lastPeriodLengthType = sentenceTypePeriodLengths[sentence?.sentenceTypeClassification]?.periodLengths.at(-1)
      .type as string
    let backLink = UnknownRecallSentenceJourneyUrls.periodLength(
      nomsId,
      appearanceReference,
      chargeUuid,
      lastPeriodLengthType,
    )
    if (submitToCheckAnswers) {
      backLink = UnknownRecallSentenceJourneyUrls.checkAnswers(nomsId, appearanceReference, chargeUuid)
    }
    const offenceHint = await this.getOffenceDescription(offence, req.user.username)
    return res.render('pages/offence/fine-amount', {
      nomsId,
      appearanceReference,
      offenceFineAmountForm,
      chargeUuid,
      backLink,
      offenceHint,
      errors: req.flash('errors') || [],
      hideOffences: true,
      isUnknownRecallSentence: true,
    })
  }

  public submitFineAmount: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, appearanceReference, chargeUuid } = req.params
    const { submitToCheckAnswers } = req.query
    const offenceFineAmountForm = trimForm<OffenceFineAmountForm>(req.body)
    const errors = this.offenceService.setOffenceFineAmount(
      req.session,
      nomsId,
      appearanceReference,
      chargeUuid,
      offenceFineAmountForm,
    )

    if (errors.length > 0) {
      req.flash('errors', errors)
      req.flash('offenceFineAmountForm', { ...offenceFineAmountForm })
      return res.redirect(
        `${UnknownRecallSentenceJourneyUrls.fineAmount(nomsId, appearanceReference, chargeUuid)}?hasErrors=true${submitToCheckAnswers ? '&submitToCheckAnswers=true' : ''}`,
      )
    }

    return res.redirect(UnknownRecallSentenceJourneyUrls.checkAnswers(nomsId, appearanceReference, chargeUuid))
  }

  public getCheckAnswers: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, appearanceReference, chargeUuid } = req.params
    const offence = this.offenceService.getSessionOffence(req.session, nomsId, appearanceReference, chargeUuid)
    let sentenceType: SentenceType
    if (offence.sentence.sentenceTypeId) {
      sentenceType = await this.refDataService.getSentenceTypeById(offence.sentence?.sentenceTypeId, req.user.username)
    }
    const periodLengths = offence.sentence?.periodLengths ?? []
    const expectedPeriodLengthTypes = sentenceTypePeriodLengths[sentenceType.classification]?.periodLengths ?? []
    expectedPeriodLengthTypes
      .filter(expectedType => !periodLengths.some(periodLength => periodLength.periodLengthType === expectedType.type))
      .forEach(missingPeriodLength =>
        periodLengths.push({
          periodLengthType: missingPeriodLength.type,
          periodOrder: [],
          uuid: '-1',
          description: periodLengthTypeHeadings[missingPeriodLength.type],
        }),
      )
    return res.render('pages/unknownRecallSentence/check-answers', {
      nomsId,
      appearanceReference,
      chargeUuid,
      offence,
      errors: req.flash('errors') || [],
      sentenceType: sentenceType?.description,
      periodLengthTypeHeadings,
      periodLengths: periodLengths.sort(
        (a, b) =>
          (PERIOD_TYPE_PRIORITY[a.periodLengthType] ?? PERIOD_TYPE_PRIORITY.UNSUPPORTED) -
          (PERIOD_TYPE_PRIORITY[b.periodLengthType] ?? PERIOD_TYPE_PRIORITY.UNSUPPORTED),
      ),
      sentenceTypeClassification: sentenceType?.classification,
      hideOffences: true,
    })
  }

  public submitCheckAnswers: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, appearanceReference, chargeUuid } = req.params
    const { username } = res.locals.user
    const { prisonId } = res.locals.prisoner
    const offence = this.offenceService.getSessionOffence(req.session, nomsId, appearanceReference, chargeUuid)
    const errors = this.offenceService.validateUnknownRecallSentenceMandatoryFields(offence)
    if (errors.length > 0) {
      req.flash('errors', errors)
      return res.redirect(
        `${UnknownRecallSentenceJourneyUrls.checkAnswers(nomsId, appearanceReference, chargeUuid)}?hasErrors=true`,
      )
    }
    await this.remandAndSentencingService.updateCharge(offence, prisonId, appearanceReference, chargeUuid, username)
    this.offenceService.clearAllOffences(req.session, nomsId, appearanceReference)
    this.courtAppearanceService.clearSessionCourtAppearance(req.session, nomsId)
    return res.redirect(UnknownRecallSentenceJourneyUrls.landingPage(nomsId))
  }

  private async getOffenceDescription(sessionOffence: Offence, username: string): Promise<string> {
    const { offenceCode } = sessionOffence
    if (offenceCode) {
      const apiOffence = await this.manageOffencesService.getOffenceByCode(
        offenceCode,
        username,
        sessionOffence.legacyData?.offenceDescription,
      )
      return `${offenceCode} - ${apiOffence.description}`
    }
    return ''
  }
}
