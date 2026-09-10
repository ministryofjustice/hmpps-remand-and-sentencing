import { RequestHandler } from 'express'
import type { UrlParameters } from 'models'
import type { JudicialFindingOffenceForm } from 'forms'
import { error } from 'console'
import AuditService from '../services/auditService'
import CourtAppearanceService from '../services/courtAppearanceService'
import CourtRegisterService from '../services/courtRegisterService'
import DocumentManagementService from '../services/documentManagementService'
import ManageOffencesService from '../services/manageOffencesService'
import OffenceService from '../services/offenceService'
import RemandAndSentencingService from '../services/remandAndSentencingService'
import BaseRoutes from './baseRoutes'
import { offencesToOffenceDescriptions } from '../utils/utils'
import JourneyUrls from './data/JourneyUrls'
import JudicialFindingsJourneyUrls from './data/JudicialFindingsJourneyUrls'
import trimForm from '../utils/trim'

export default class AggravatingFactorsRoutes extends BaseRoutes {
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

  public selectOffenceWithJudicialFindings: RequestHandler = async (req, res): Promise<void> => {
    const { fromCheckAnswers } = req.query
    const urlParameters = req.params as unknown as UrlParameters
    const { offences } = this.courtAppearanceService.getSessionCourtAppearance(
      req.session,
      urlParameters.nomsId,
      urlParameters.appearanceReference,
    )

    const selectableOffences = offences.filter(offence => offence.sentence && !offence.findingOfDomesticAbuse)
    const offenceCodes = selectableOffences.map(offence => offence.offenceCode)

    const offenceMap = await this.manageOffencesService.getOffenceMap(
      offenceCodes,
      req.user.username,
      offencesToOffenceDescriptions(selectableOffences, []),
    )
    let backLink = JourneyUrls.taskList(
      urlParameters.nomsId,
      urlParameters.addOrEditCourtCase,
      urlParameters.courtCaseReference,
      urlParameters.addOrEditCourtAppearance,
      urlParameters.appearanceReference,
    )
    if (fromCheckAnswers) {
      backLink = JudicialFindingsJourneyUrls.checkAnswers(urlParameters)
    }
    return res.render('pages/judicialFindings/select-offences', {
      ...urlParameters,
      selectableOffences,
      offenceMap,
      backLink,
      errors: req.flash('errors') || [],
    })
  }

  public submitOffenceWithJudicialFindings: RequestHandler = async (req, res): Promise<void> => {
    const { fromCheckAnswers } = req.query as { fromCheckAnswers: string }
    const urlParameters = req.params as unknown as UrlParameters
    const judicialFindingOffenceForm = trimForm<JudicialFindingOffenceForm>(req.body)
    const errors = this.courtAppearanceService.setFindingsOfDomesticAbuse(
      req.session,
      urlParameters,
      judicialFindingOffenceForm,
    )
    if (errors.length) {
      req.flash('errors', errors)
      req.flash('judicialFindingOffenceForm', { ...judicialFindingOffenceForm })
      return res.redirect(
        JudicialFindingsJourneyUrls.selectOffenceWithJudicialFindings(urlParameters, 'true', fromCheckAnswers),
      )
    }
    return res.redirect(JudicialFindingsJourneyUrls.checkAnswers(urlParameters))
  }

  public getCheckAnswers: RequestHandler = async (req, res): Promise<void> => {
    return res.render('pages/judicialFindings/check-answers')
  }
}
