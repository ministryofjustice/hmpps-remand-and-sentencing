import type { IsOffenceDateSameForm, OffenceOffenceOutcomeForm } from 'forms'
import AuditService from '../services/auditService'
import CourtAppearanceService from '../services/courtAppearanceService'
import ManageOffencesService from '../services/manageOffencesService'
import OffenceService from '../services/offenceService'
import RemandAndSentencingService from '../services/remandAndSentencingService'
import BaseRoutes from './baseRoutes'
import ReplicateOffenceJourneyUrls from './data/ReplicateOffenceJourneyUrls'
import JourneyUrls from './data/JourneyUrls'
import trimForm from '../utils/trim'
import RefDataService from '../services/refDataService'

export default class ReplicateChargeRoutes extends BaseRoutes {
  constructor(
    offenceService: OffenceService,
    manageOffencesService: ManageOffencesService,
    courtAppearanceService: CourtAppearanceService,
    remandAndSentencingService: RemandAndSentencingService,
    auditService: AuditService,
    private readonly refDataService: RefDataService,
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
    const replicatedOffence = this.offenceService.getSessionOffence(req.session, nomsId, courtCaseReference, chargeUuid)
    const originalOffence = this.courtAppearanceService.getOffence(
      req.session,
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
    const replicatedOffence = this.offenceService.getSessionOffence(req.session, nomsId, courtCaseReference, chargeUuid)
    const originalOffence = this.courtAppearanceService.getOffence(
      req.session,
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
          true,
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

  public getReplicateOffenceOutcome = async (req, res): Promise<void> => {
    const {
      nomsId,
      courtCaseReference,
      appearanceReference,
      addOrEditCourtCase,
      addOrEditCourtAppearance,
      chargeUuid,
    } = req.params
    let offenceOutcomeForm = (req.flash('offenceOutcomeForm')[0] || {}) as OffenceOffenceOutcomeForm
    const offence = this.offenceService.getSessionOffence(req.session, nomsId, courtCaseReference, chargeUuid)
    if (Object.keys(offenceOutcomeForm).length === 0) {
      offenceOutcomeForm = {
        offenceOutcome: offence.outcomeUuid,
      }
    }
    const outcomeUuid = this.courtAppearanceService.getAppearanceOutcomeUuid(req.session, nomsId, appearanceReference)
    const appearanceOutcome = await this.refDataService.getAppearanceOutcomeByUuid(outcomeUuid, req.user.username)
    const [caseOutcomes, offenceHint] = await Promise.all([
      this.refDataService.getAllChargeOutcomes(req.user.username),
      this.getOffenceHint(offence, req.user.username),
    ])
    let outcomeTypes = ['REMAND', 'NON_CUSTODIAL']
    if (appearanceOutcome.outcomeType === 'NON_CUSTODIAL') {
      outcomeTypes = ['NON_CUSTODIAL']
    }

    const chargeOutcomes = caseOutcomes
      .filter(caseOutcome => outcomeTypes.includes(caseOutcome.outcomeType))
      .sort((a, b) => a.displayOrder - b.displayOrder)

    const primaryOutcomes = chargeOutcomes.filter(o => o.outcomeType !== 'NON_CUSTODIAL')
    const nonCustodialOutcomes = chargeOutcomes.filter(o => o.outcomeType === 'NON_CUSTODIAL')
    const backLink = ReplicateOffenceJourneyUrls.isOffenceDateSame(
      nomsId,
      addOrEditCourtCase,
      courtCaseReference,
      addOrEditCourtAppearance,
      appearanceReference,
      chargeUuid,
    )
    return res.render('pages/replicateOffence/replicate-offence-outcome', {
      nomsId,
      courtCaseReference,
      offenceOutcomeForm,
      chargeUuid,
      appearanceReference,
      addOrEditCourtCase,
      addOrEditCourtAppearance,
      errors: req.flash('errors') || [],
      backLink,
      primaryOutcomes,
      nonCustodialOutcomes,
      offenceHint,
    })
  }

  public submitReplicateOffenceOutcome = async (req, res): Promise<void> => {
    const {
      nomsId,
      courtCaseReference,
      appearanceReference,
      addOrEditCourtCase,
      addOrEditCourtAppearance,
      chargeUuid,
    } = req.params
    const offenceOutcomeForm = trimForm<OffenceOffenceOutcomeForm>(req.body)
    const { errors } = await this.offenceService.setOffenceOutcome(
      req.session,
      nomsId,
      courtCaseReference,
      offenceOutcomeForm,
      [],
      req.user.username,
      chargeUuid,
    )

    if (errors.length > 0) {
      req.flash('errors', errors)
      req.flash('offenceOutcomeForm', { ...offenceOutcomeForm })
      return res.redirect(
        ReplicateOffenceJourneyUrls.replicateOffenceOutcome(
          nomsId,
          addOrEditCourtCase,
          courtCaseReference,
          addOrEditCourtAppearance,
          appearanceReference,
          chargeUuid,
          true,
        ),
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
      chargeUuid,
    )
  }
}
