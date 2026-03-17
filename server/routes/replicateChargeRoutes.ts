import type { IsOffenceDateSameForm } from 'forms'
import AuditService from '../services/auditService'
import CourtAppearanceService from '../services/courtAppearanceService'
import ManageOffencesService from '../services/manageOffencesService'
import OffenceService from '../services/offenceService'
import RemandAndSentencingService from '../services/remandAndSentencingService'
import BaseRoutes from './baseRoutes'
import ReplicateOffenceJourneyUrls from './data/ReplicateOffenceJourneyUrls'
import JourneyUrls from './data/JourneyUrls'
import trimForm from '../utils/trim'

export default class ReplicateChargeRoutes extends BaseRoutes {
  constructor(
    offenceService: OffenceService,
    manageOffencesService: ManageOffencesService,
    courtAppearanceService: CourtAppearanceService,
    remandAndSentencingService: RemandAndSentencingService,
    auditService: AuditService,
  ) {
    super(courtAppearanceService, offenceService, remandAndSentencingService, manageOffencesService, auditService)
  }

  public loadReplicateOffence = async (req, res): Promise<void> => {
    const {
      nomsId,
      courtCaseReference,
      appearanceReference,
      addOrEditCourtCase,
      addOrEditCourtAppearance,
      chargeUuid,
    } = req.params
    this.offenceService.clearAllOffences(req.session, nomsId, courtCaseReference)
    const offence = this.courtAppearanceService.getOffence(req.session, nomsId, chargeUuid, appearanceReference)
    const replicatedOffence = this.offenceService.setSessionReplicatedOffence(
      req.session,
      nomsId,
      courtCaseReference,
      offence,
    )
    return res.redirect(
      ReplicateOffenceJourneyUrls.isOffenceDateSame(
        nomsId,
        addOrEditCourtCase,
        courtCaseReference,
        addOrEditCourtAppearance,
        appearanceReference,
        replicatedOffence.chargeUuid,
      ),
    )
  }

  public getIsOffenceDateSame = async (req, res): Promise<void> => {
    const {
      nomsId,
      courtCaseReference,
      appearanceReference,
      addOrEditCourtCase,
      addOrEditCourtAppearance,
      chargeUuid,
    } = req.params
    const isOffenceDateSameForm = (req.flash('isOffenceDateSameForm')[0] || {}) as IsOffenceDateSameForm
    let offenceStartDateDay: number | string = isOffenceDateSameForm['offenceStartDate-day']
    let offenceStartDateMonth: number | string = isOffenceDateSameForm['offenceStartDate-month']
    let offenceStartDateYear: number | string = isOffenceDateSameForm['offenceStartDate-year']
    let offenceEndDateDay: number | string = isOffenceDateSameForm['offenceEndDate-day']
    let offenceEndDateMonth: number | string = isOffenceDateSameForm['offenceEndDate-month']
    let offenceEndDateYear: number | string = isOffenceDateSameForm['offenceEndDate-year']
    let { offenceDateIsSame } = isOffenceDateSameForm
    const replicatedOffence = this.offenceService.getSessionOffence(res.session, nomsId, courtCaseReference, chargeUuid)
    const originalOffence = this.courtAppearanceService.getOffence(
      res.session,
      nomsId,
      replicatedOffence.replicatedFromUuid,
      appearanceReference,
    )
    const offenceDetails = await this.manageOffencesService.getOffenceByCode(
      replicatedOffence.offenceCode,
      req.user.username,
      replicatedOffence.legacyData?.offenceDescription,
    )

    if (Object.keys(isOffenceDateSameForm).length === 0) {
      offenceDateIsSame = replicatedOffence.offenceDateIsSame
      if (offenceDateIsSame && offenceDateIsSame === 'false') {
        if (replicatedOffence.offenceStartDate) {
          const offenceStartDate = new Date(replicatedOffence.offenceStartDate)
          offenceStartDateDay = offenceStartDate.getDate()
          offenceStartDateMonth = offenceStartDate.getMonth() + 1
          offenceStartDateYear = offenceStartDate.getFullYear()
        }
        if (replicatedOffence.offenceEndDate) {
          const offenceEndDate = new Date(replicatedOffence.offenceEndDate)
          offenceEndDateDay = offenceEndDate.getDate()
          offenceEndDateMonth = offenceEndDate.getMonth() + 1
          offenceEndDateYear = offenceEndDate.getFullYear()
        }
      }
    }

    let backLink = JourneyUrls.checkOffenceAnswers(
      nomsId,
      addOrEditCourtCase,
      courtCaseReference,
      addOrEditCourtAppearance,
      appearanceReference,
    )
    if (this.isRepeatJourney(addOrEditCourtCase, addOrEditCourtAppearance)) {
      backLink = JourneyUrls.reviewOffences(
        nomsId,
        addOrEditCourtCase,
        courtCaseReference,
        addOrEditCourtAppearance,
        appearanceReference,
      )
    }

    return res.render('pages/replicateOffence/is-offence-date-same', {
      nomsId,
      courtCaseReference,
      appearanceReference,
      addOrEditCourtCase,
      addOrEditCourtAppearance,
      chargeUuid,
      offenceStartDateDay,
      offenceStartDateMonth,
      offenceStartDateYear,
      offenceEndDateDay,
      offenceEndDateMonth,
      offenceEndDateYear,
      offenceDateIsSame,
      originalOffence,
      replicatedOffence,
      offenceDetails,
      backLink,
      errors: req.flash('errors') || [],
    })
  }

  public submitIsOffenceDateSame = async (req, res): Promise<void> => {
    const {
      nomsId,
      courtCaseReference,
      appearanceReference,
      addOrEditCourtCase,
      addOrEditCourtAppearance,
      chargeUuid,
    } = req.params
    const isOffenceDateSameForm = trimForm<IsOffenceDateSameForm>(req.body)
    const replicatedOffence = this.offenceService.getSessionOffence(res.session, nomsId, courtCaseReference, chargeUuid)
    const originalOffence = this.courtAppearanceService.getOffence(
      res.session,
      nomsId,
      replicatedOffence.replicatedFromUuid,
      appearanceReference,
    )
    const errors = this.offenceService.setIsOffenceDateSame(
      req.session,
      nomsId,
      courtCaseReference,
      chargeUuid,
      isOffenceDateSameForm,
      originalOffence,
      this.courtAppearanceService.getWarrantDate(req.session, nomsId, appearanceReference),
      this.courtAppearanceService.getOverallConvictionDate(req.session, nomsId, appearanceReference),
    )
    if (errors.length > 0) {
      req.flash('errors', errors)
      req.flash('isOffenceDateSameForm', { ...isOffenceDateSameForm })
      return res.redirect(
        ReplicateOffenceJourneyUrls.isOffenceDateSame(
          nomsId,
          addOrEditCourtCase,
          courtCaseReference,
          addOrEditCourtAppearance,
          appearanceReference,
          chargeUuid,
        ),
      )
    }
    return res.redirect(
      ReplicateOffenceJourneyUrls.replicateOffenceOutcome(
        nomsId,
        addOrEditCourtCase,
        courtCaseReference,
        addOrEditCourtAppearance,
        appearanceReference,
        chargeUuid,
      ),
    )
  }
}
