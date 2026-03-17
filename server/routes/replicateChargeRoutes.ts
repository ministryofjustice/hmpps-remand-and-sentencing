import AuditService from '../services/auditService'
import CourtAppearanceService from '../services/courtAppearanceService'
import ManageOffencesService from '../services/manageOffencesService'
import OffenceService from '../services/offenceService'
import RemandAndSentencingService from '../services/remandAndSentencingService'
import BaseRoutes from './baseRoutes'
import ReplicateOffenceJourneyUrls from './data/ReplicateOffenceJourneyUrls'
import JourneyUrls from './data/JourneyUrls'

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
      originalOffence,
      replicatedOffence,
      offenceDetails,
      backLink,
      errors: req.flash('errors') || [],
    })
  }
}
