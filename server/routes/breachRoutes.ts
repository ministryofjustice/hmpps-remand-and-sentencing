import type { UrlParameters } from 'models'
import { RequestHandler } from 'express'
import type { BreachTypeForm } from 'forms'
import AuditService from '../services/auditService'
import CourtAppearanceService from '../services/courtAppearanceService'
import CourtRegisterService from '../services/courtRegisterService'
import DocumentManagementService from '../services/documentManagementService'
import ManageOffencesService from '../services/manageOffencesService'
import OffenceService from '../services/offenceService'
import RemandAndSentencingService from '../services/remandAndSentencingService'
import BaseRoutes from './baseRoutes'
import BreachJourneyUrls from './data/BreachJourneyUrls'
import JourneyUrls from './data/JourneyUrls'

export default class BreachRoutes extends BaseRoutes {
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

  public newJourney: RequestHandler = async (req, res): Promise<void> => {
    const urlParameters = req.params as unknown as UrlParameters
    this.courtAppearanceService.clearSessionCourtAppearance(req.session, urlParameters.nomsId)
    this.offenceService.clearAllOffences(req.session, urlParameters.nomsId, urlParameters.courtCaseReference)
    return res.redirect(BreachJourneyUrls.breachType(urlParameters))
  }

  public getBreachType: RequestHandler = async (req, res): Promise<void> => {
    const urlParameters = req.params as unknown as UrlParameters
    let breachTypeForm = (req.flash('breachTypeForm')[0] || {}) as BreachTypeForm
    const { warrantType } = this.courtAppearanceService.getSessionCourtAppearance(
      req.session,
      urlParameters.nomsId,
      urlParameters.appearanceReference,
    )
    if (Object.keys(breachTypeForm).length === 0) {
      breachTypeForm = {
        breachType: warrantType,
      }
    }
    const backLink = JourneyUrls.courtCases(urlParameters.nomsId)
    return res.render('pages/breach/breach-type', {
      ...urlParameters,
      breachTypeForm,
      backLink,
    })
  }

  public submitBreachType: RequestHandler = async (req, res): Promise<void> => {
    const urlParameters = req.params as unknown as UrlParameters
    const breachTypeForm = (req.flash('breachTypeForm')[0] || {}) as BreachTypeForm
    const errors = this.courtAppearanceService.setBreachType(req.session, urlParameters, breachTypeForm)
    if (errors.length > 0) {
      req.flash('errors', errors)
      req.flash('breachTypeForm', { ...breachTypeForm })
      return res.redirect(BreachJourneyUrls.breachType(urlParameters, 'true'))
    }
    return res.redirect(BreachJourneyUrls.taskList(urlParameters))
  }

  public getTaskList: RequestHandler = async (req, res): Promise<void> => {
    return res.render('pages/breach/task-list')
  }
}
