import { RequestHandler } from 'express'
import AuditService from '../services/auditService'
import CourtAppearanceService from '../services/courtAppearanceService'
import ManageOffencesService from '../services/manageOffencesService'
import OffenceService from '../services/offenceService'
import RemandAndSentencingService from '../services/remandAndSentencingService'
import BaseRoutes from './baseRoutes'
import AppealsJourneyUrls from './data/AppealsJourneyUrls'
import AppealsTaskListModel from './data/AppealsTaskListModel'

export default class AppealsRoutes extends BaseRoutes {
  constructor(
    courtAppearanceService: CourtAppearanceService,
    offenceService: OffenceService,
    remandAndSentencingService: RemandAndSentencingService,
    manageOffencesService: ManageOffencesService,
    auditService: AuditService,
  ) {
    super(courtAppearanceService, offenceService, remandAndSentencingService, manageOffencesService, auditService)
  }

  public newJourney: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, appearanceReference, addOrEditCourtCase, addOrEditCourtAppearance } = req.params
    this.courtAppearanceService.clearSessionCourtAppearance(req.session, nomsId)
    this.offenceService.clearAllOffences(req.session, nomsId, courtCaseReference)
    const courtAppearanceUuid = appearanceReference
    this.courtAppearanceService.initialiseAppeals(req.session, nomsId, courtAppearanceUuid)
    return res.redirect(
      AppealsJourneyUrls.taskList(
        nomsId,
        addOrEditCourtCase,
        courtCaseReference,
        addOrEditCourtAppearance,
        courtAppearanceUuid,
      ),
    )
  }

  public taskList: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, appearanceReference, addOrEditCourtCase, addOrEditCourtAppearance } = req.params
    const courtAppearance = this.courtAppearanceService.getSessionCourtAppearance(
      req.session,
      nomsId,
      appearanceReference,
    )
    let caseReferenceSet = !!courtAppearance.caseReferenceNumber
    if (!caseReferenceSet) {
      const latestCourtAppearance = await this.remandAndSentencingService.getLatestCourtAppearanceByCourtCaseUuid(
        req.user.username,
        courtCaseReference,
      )
      caseReferenceSet = !!latestCourtAppearance.courtCaseReference
    }
    return res.render('pages/appeals/task-list', {
      model: new AppealsTaskListModel(
        nomsId,
        addOrEditCourtCase,
        addOrEditCourtAppearance,
        courtCaseReference,
        appearanceReference,
        courtAppearance,
        caseReferenceSet,
      ),
    })
  }
}
