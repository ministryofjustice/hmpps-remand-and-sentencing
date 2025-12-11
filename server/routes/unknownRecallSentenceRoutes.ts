import { RequestHandler } from 'express'
import type { OffenceConvictionDateForm, OffenceOffenceDateForm } from 'forms'
import type { Offence } from 'models'
import CourtAppearanceService from '../services/courtAppearanceService'
import ManageOffencesService from '../services/manageOffencesService'
import OffenceService from '../services/offenceService'
import RemandAndSentencingService from '../services/remandAndSentencingService'
import BaseRoutes from './baseRoutes'
import trimForm from '../utils/trim'
import { pageCourtCaseAppearanceToCourtAppearance } from '../utils/mappingUtils'
import UnknownRecallSentenceJourneyUrls from './data/UnknownRecallSentenceJourneyUrls'

export default class UnknownRecallSentenceRoutes extends BaseRoutes {
  constructor(
    courtAppearanceService: CourtAppearanceService,
    offenceService: OffenceService,
    remandAndSentencingService: RemandAndSentencingService,
    manageOffencesService: ManageOffencesService,
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
    const { submitToCheckAnswers } = req.params
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
    const { submitToCheckAnswers } = req.params
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
    const { submitToCheckAnswers } = req.params
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
    const { submitToCheckAnswers } = req.params
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
