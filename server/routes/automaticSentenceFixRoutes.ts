import { RequestHandler } from 'express'
import AuditService from '../services/auditService'
import CourtAppearanceService from '../services/courtAppearanceService'
import CourtRegisterService from '../services/courtRegisterService'
import DocumentManagementService from '../services/documentManagementService'
import ManageOffencesService from '../services/manageOffencesService'
import OffenceService from '../services/offenceService'
import RemandAndSentencingService from '../services/remandAndSentencingService'
import BaseRoutes from './baseRoutes'

export default class AutomaticSentenceFixRoutes extends BaseRoutes {
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

  public checkUpdatesInterrupt: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId } = req.params
    const { username } = res.locals.user
    const unconfirmedCourtCases = await this.remandAndSentencingService.getUnconfirmedSentenceFixCourtCases(
      nomsId,
      username,
    )
    const sentences = unconfirmedCourtCases.courtCases.flatMap(courtCase => courtCase.sentences)
    const offenceCodes = sentences.map(sentence => sentence.offenceCode)
    const chargeDescriptions: [string, string][] = Array.from(
      new Set(
        sentences
          .filter(sentence => sentence.chargeLegacyOffenceDescription)
          .map(sentence => [sentence.offenceCode, sentence.chargeLegacyOffenceDescription]) as [string, string][],
      ),
    )
    const courtCodes = unconfirmedCourtCases.courtCases.map(courtCase => courtCase.courtCode)
    const [offenceMap, courtMap] = await Promise.all([
      this.manageOffencesService.getOffenceMap(offenceCodes, username, chargeDescriptions),
      this.courtRegisterService.getCourtMap(courtCodes, username),
    ])
    return res.render('pages/automaticSentenceFix/checkUpdatesInterrupt', {
      nomsId,
      unconfirmedCourtCases: unconfirmedCourtCases.courtCases,
      sentences,
      offenceMap,
      courtMap,
    })
  }
}
