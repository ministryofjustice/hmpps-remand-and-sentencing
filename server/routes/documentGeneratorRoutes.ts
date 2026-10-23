import { RequestHandler } from 'express'
import type { ViewGeneratedDocumentForm } from 'forms'
import BaseRoutes from './baseRoutes'
import CourtAppearanceService from '../services/courtAppearanceService'
import OffenceService from '../services/offenceService'
import RemandAndSentencingService from '../services/remandAndSentencingService'
import ManageOffencesService from '../services/manageOffencesService'
import AuditService from '../services/auditService'
import DocumentManagementService from '../services/documentManagementService'
import CourtRegisterService from '../services/courtRegisterService'
import trimForm from '../utils/trim'
import logger from '../../logger'

export default class DocumentGeneratorRoutes extends BaseRoutes {
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

  public viewGeneratedDocuments: RequestHandler = async (req, res, next): Promise<void> => {
    const { documentType } = req.params

    switch (documentType) {
      case 'f986':
        await this.getF986EligibleCourtAppearances(req, res, next)
        return
      default:
        next()
    }
  }

  public submitViewGeneratedDocuments: RequestHandler = async (req, res, next): Promise<void> => {
    const viewGeneratedDocumentForm: ViewGeneratedDocumentForm = trimForm<ViewGeneratedDocumentForm>(req.body)

    if (!viewGeneratedDocumentForm.documentSelected) {
      req.flash('errors', [{ text: 'Select which document to view', href: '#documentSelected' }])
      return res.redirect(req.originalUrl)
    }

    return res.redirect(viewGeneratedDocumentForm.documentSelected)
  }

  private getF986EligibleCourtAppearances: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId } = req.params
    const { username } = res.locals.user

    const appearances = await this.remandAndSentencingService.getF986EligibleAppearances(nomsId, username)
    const appearancesWithOffences = appearances.map(appearance => {
      if (Array.isArray(appearance.offences)) {
        return appearance
      }

      const legacyOffenceCodes = (appearance as typeof appearance & { offenceCodes?: string[] }).offenceCodes ?? []
      logger.warn(
        `F986 eligible appearance ${appearance.appearanceUuid} has no offences array; using legacy offence codes if available`,
      )
      return {
        ...appearance,
        offences: legacyOffenceCodes.map(offenceCode => ({ offenceCode })),
      }
    })

    const courtMap = await this.courtRegisterService.getCourtMap(
      Array.from(new Set(appearancesWithOffences.map(appearance => appearance.courtCode))),
      username,
    )

    const offenceMap = await this.manageOffencesService.getOffenceMap(
      Array.from(
        new Set(appearancesWithOffences.flatMap(appearance => appearance.offences.map(offence => offence.offenceCode))),
      ),
      username,
      [],
    )

    const courtAppearancesWithFines = appearancesWithOffences.map(appearance => {
      const courtName = courtMap[appearance.courtCode] ?? appearance.courtCode
      const title = appearance.caseReference ? `${appearance.caseReference} at ${courtName}` : courtName
      return {
        appearanceUuid: appearance.appearanceUuid,
        title,
        offences: appearance.offences,
      }
    })

    return res.render('pages/documents/generatedDocuments/f986-documents', {
      nomsId,
      offenceMap,
      courtAppearancesWithFines,
      backLink: `/person/${nomsId}`,
      errors: req.flash('errors') || [],
    })
  }
}
