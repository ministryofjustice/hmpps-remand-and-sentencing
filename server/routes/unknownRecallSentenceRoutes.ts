import { RequestHandler } from 'express'
import type { OffenceOffenceDateForm } from 'forms'
import type { Offence } from 'models'
import CourtAppearanceService from '../services/courtAppearanceService'
import ManageOffencesService from '../services/manageOffencesService'
import OffenceService from '../services/offenceService'
import RemandAndSentencingService from '../services/remandAndSentencingService'
import BaseRoutes from './baseRoutes'
import trimForm from '../utils/trim'
import { pageCourtCaseAppearanceToCourtAppearance } from '../utils/mappingUtils'

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
        `/person/${nomsId}/unknown-recall-sentence/court-appearance/${appearanceReference}/charge/${chargeUuid}/offence-date?hasErrors=true${submitToCheckAnswers ? '&submitToCheckAnswers=true' : ''}`,
      )
    }

    if (submitToCheckAnswers) {
      return res.redirect(
        `/person/${nomsId}/unknown-recall-sentence/court-appearance/${appearanceReference}/charge/${chargeUuid}/check-answers`,
      )
    }

    return res.redirect(
      `/person/${nomsId}/unknown-recall-sentence/court-appearance/${appearanceReference}/charge/${chargeUuid}/conviction-date`,
    )
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
