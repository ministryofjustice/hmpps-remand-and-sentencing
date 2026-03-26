import { RequestHandler } from 'express'
import BaseRoutes from './baseRoutes'
import CourtAppearanceService from '../services/courtAppearanceService'
import OffenceService from '../services/offenceService'
import RemandAndSentencingService from '../services/remandAndSentencingService'
import ManageOffencesService from '../services/manageOffencesService'
import AuditService from '../services/auditService'

export default class AggravatingFactorsRoutes extends BaseRoutes {
  constructor(
    courtAppearanceService: CourtAppearanceService,
    offenceService: OffenceService,
    remandAndSentencingService: RemandAndSentencingService,
    manageOffencesService: ManageOffencesService,
    auditService: AuditService,
  ) {
    super(courtAppearanceService, offenceService, remandAndSentencingService, manageOffencesService, auditService)
  }

  public getCheckAggravateFactorsAnswers: RequestHandler = async (req, res): Promise<void> => {
    return res.render('pages/sentencing/check-aggravate-factors-answers', {})
  }

  public getSelectOffenceWithAggravatedFactors: RequestHandler = async (req, res): Promise<void> => {
    return res.render('pages/sentencing/select-offence-with-aggravated-factors', {})
  }
}
