import { RequestHandler } from 'express'
import type { UrlParameters } from 'models'
import AuditService from '../services/auditService'
import CourtAppearanceService from '../services/courtAppearanceService'
import ManageOffencesService from '../services/manageOffencesService'
import OffenceService from '../services/offenceService'
import RemandAndSentencingService from '../services/remandAndSentencingService'
import BaseRoutes from './baseRoutes'
import JourneyUrls from './data/JourneyUrls'
import CourtRegisterService from '../services/courtRegisterService'
import { pageCourtCaseAppearanceToCourtAppearance } from '../utils/mappingUtils'
import DocumentManagementService from '../services/documentManagementService'

export default class CourtDataIngestionRoutes extends BaseRoutes {
  constructor(
    courtAppearanceService: CourtAppearanceService,
    offenceService: OffenceService,
    remandAndSentencingService: RemandAndSentencingService,
    manageOffencesService: ManageOffencesService,
    auditService: AuditService,
    documentManagementService: DocumentManagementService,
    courtRegisterService: CourtRegisterService,
  ) {
    super(
      courtAppearanceService,
      offenceService,
      remandAndSentencingService,
      manageOffencesService,
      auditService,
      documentManagementService,
      courtRegisterService,
    )
  }

  public landing: RequestHandler = async (req, res): Promise<void> => {
    const urlParameters = req.params as unknown as UrlParameters
    const { hmctsHearingId, nomsId } = urlParameters
    const appearance = await this.remandAndSentencingService.getHmctsCourtData(hmctsHearingId, req.user.username)
    return res.render('pages/courtDataIngestion/start', {
      appearance,
      hmctsHearingId,
      nomsId,
    })
  }

  public start: RequestHandler = async (req, res): Promise<void> => {
    const urlParameters = req.params as unknown as UrlParameters
    const { hmctsHearingId, nomsId } = urlParameters
    let appearance = await this.remandAndSentencingService.getHmctsCourtData(hmctsHearingId, req.user.username)

    const newCourtCaseId = crypto.randomUUID()
    const newAppearanceId = crypto.randomUUID()
    appearance = {
      ...appearance,
      appearanceUuid: newAppearanceId,
    }
    this.courtAppearanceService.clearSessionCourtAppearance(req.session, nomsId)
    this.offenceService.clearAllOffences(req.session, nomsId, newCourtCaseId)
    this.courtAppearanceService.setSessionCourtAppearance(
      req.session,
      nomsId,
      pageCourtCaseAppearanceToCourtAppearance(appearance),
    )
    const addOrEditCourtCase = 'add-court-case'
    const addOrEditCourtAppearance = 'add-court-appearance'

    if (appearance.outcome) {
      return res.redirect(
        JourneyUrls.taskList(nomsId, addOrEditCourtCase, newCourtCaseId, addOrEditCourtAppearance, newAppearanceId),
      )
    }
    return res.redirect(
      JourneyUrls.overallCaseOutcome(
        nomsId,
        addOrEditCourtCase,
        newCourtCaseId,
        addOrEditCourtAppearance,
        newAppearanceId,
      ),
    )
  }
}
