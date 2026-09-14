import { RequestHandler } from 'express'
import type { UrlParameters } from 'models'
import type { JudicialFindingCheckAnswersForm, JudicialFindingOffenceForm } from 'forms'
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
    const urlParameters = req.params as unknown as UrlParameters
    const { offences } = this.courtAppearanceService.getSessionCourtAppearance(
      req.session,
      urlParameters.nomsId,
      urlParameters.appearanceReference,
    )
    const [judicialFindingsOffences, offencesWithNoJudicialFindings] = offences
      .map((offence, index) => ({ ...offence, index })) // Add an index to each offence
      .reduce(
        ([judicialFindingsList, offencesWithNoJudicialFindingsList], offence) => {
          if (offence.findingOfDomesticAbuse) {
            return [[...judicialFindingsList, offence], offencesWithNoJudicialFindingsList]
          }
          if (offence.sentence) {
            return [judicialFindingsList, [...offencesWithNoJudicialFindingsList, offence]]
          }
          return [judicialFindingsList, offencesWithNoJudicialFindingsList]
        },
        [[], []] as [typeof offences, typeof offences],
      )

    const offenceCodes = judicialFindingsOffences.map(offence => offence.offenceCode)

    const offenceMap = await this.manageOffencesService.getOffenceMap(
      offenceCodes,
      req.user.username,
      offencesToOffenceDescriptions(judicialFindingsOffences, []),
    )

    return res.render('pages/judicialFindings/check-answers', {
      ...urlParameters,
      offenceMap,
      judicialFindingsOffences,
      canSelectAnother: offencesWithNoJudicialFindings.length,
      errors: req.flash('errors') || [],
    })
  }

  public submitCheckAnswers: RequestHandler = async (req, res): Promise<void> => {
    const urlParameters = req.params as unknown as UrlParameters
    const judicialFindingCheckAnswersForm = trimForm<JudicialFindingCheckAnswersForm>(req.body)
    const errors = this.courtAppearanceService.setJudicialFindingsAccepted(
      req.session,
      urlParameters,
      judicialFindingCheckAnswersForm,
    )
    if (errors.length) {
      req.flash('errors', errors)
      req.flash('judicialFindingCheckAnswersForm', { ...judicialFindingCheckAnswersForm })
      return res.redirect(JudicialFindingsJourneyUrls.checkAnswers(urlParameters, 'true'))
    }
    return res.redirect(
      JourneyUrls.taskList(
        urlParameters.nomsId,
        urlParameters.addOrEditCourtCase,
        urlParameters.courtCaseReference,
        urlParameters.addOrEditCourtAppearance,
        urlParameters.appearanceReference,
      ),
    )
  }

  public getOffenceDeleteJudicialFindings: RequestHandler = async (req, res): Promise<void> => {
    const urlParameters = req.params as unknown as UrlParameters
    const offence = this.courtAppearanceService.getOffence(
      req.session,
      urlParameters.nomsId,
      urlParameters.chargeUuid,
      urlParameters.appearanceReference,
    )
    const offenceDetails = await this.manageOffencesService.getOffenceByCode(
      offence.offenceCode,
      req.user.username,
      offence.legacyData?.offenceDescription,
    )
    return res.render('pages/judicialFindings/offence-delete-findings', {
      ...urlParameters,
      offenceDetails,
      offence,
    })
  }

  public submitOffenceDeleteJudicialFindings: RequestHandler = async (req, res): Promise<void> => {
    const urlParameters = req.params as unknown as UrlParameters
    this.courtAppearanceService.deleteOffenceJudicialFindings(req.session, urlParameters)
    return res.redirect(JudicialFindingsJourneyUrls.checkAnswers(urlParameters))
  }
}
