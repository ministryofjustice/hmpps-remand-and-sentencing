import { RequestHandler } from 'express'
import type { CourtAppearance, UrlParameters } from 'models'
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
import documentTypes from '../resources/documentTypes'

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
    appearance.documents = appearance.documents.map(it => {
      return {
        ...it,
        documentTypeDescription:
          documentTypes[appearance.warrantType].find(documentType => it.documentType === documentType.type)?.name ||
          'Unknown document type',
      }
    })
    return res.render('pages/courtDataIngestion/landing', {
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
    const sessionAppearance = {
      ...pageCourtCaseAppearanceToCourtAppearance(appearance),
      nextAppearanceSelect: undefined,
      nextAppearanceTimeSet: undefined,
      nextCourtAppearanceAccepted: undefined,
      hasCommonPlatformDocuments: true,
    } as CourtAppearance
    this.courtAppearanceService.setSessionCourtAppearance(req.session, nomsId, sessionAppearance)
    this.courtAppearanceService.setSessionCourtDataIngestedDocumentUuids(
      req.session,
      appearance.documents.map(it => it.documentUUID),
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
