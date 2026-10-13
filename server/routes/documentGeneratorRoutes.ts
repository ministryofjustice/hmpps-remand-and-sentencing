import { RequestHandler } from 'express'
import dayjs from 'dayjs'
import type { ViewGeneratedDocumentForm } from 'forms'
import BaseRoutes from './baseRoutes'
import { F986_ELIGIBLE } from './data/CourtCasesDetailsModel'
import { sortByDateDesc } from '../utils/utils'
import config from '../config'
import CourtAppearanceService from '../services/courtAppearanceService'
import OffenceService from '../services/offenceService'
import RemandAndSentencingService from '../services/remandAndSentencingService'
import ManageOffencesService from '../services/manageOffencesService'
import AuditService from '../services/auditService'
import DocumentManagementService from '../services/documentManagementService'
import CourtRegisterService from '../services/courtRegisterService'
import trimForm from '../utils/trim'

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

    const courtCasesPage = await this.remandAndSentencingService.searchCourtCases(
      nomsId,
      username,
      'STATUS_APPEARANCE_DATE_DESC',
      undefined,
      undefined,
      '',
      0,
    )

    const eligibleCases = (courtCasesPage.content ?? [])
      .filter(courtCase => courtCase.latestCourtAppearance?.outcome === F986_ELIGIBLE)
      .sort((a, b) => sortByDateDesc(a.latestCourtAppearance.warrantDate, b.latestCourtAppearance.warrantDate))

    const courtMap = await this.courtRegisterService.getCourtMap(
      Array.from(new Set(eligibleCases.map(courtCase => courtCase.latestCourtAppearance.courtCode))),
      username,
    )

    const offenceCodes = eligibleCases.flatMap(courtCase =>
      courtCase.latestCourtAppearance.charges.map(charge => charge.offenceCode),
    )

    const offenceMap = await this.manageOffencesService.getOffenceMap(Array.from(new Set(offenceCodes)), username, [])

    function getOffenceDescriptions(courtCase) {
      let titleValue = courtMap[courtCase.latestCourtAppearance?.courtCode]
      if (courtCase.latestCourtAppearance?.caseReference) {
        titleValue = `${courtCase.latestCourtAppearance.caseReference} at ${titleValue}`
      }

      const charges = courtCase.latestCourtAppearance.charges
        .map(charge => {
          return `<br/>${offenceMap[charge.offenceCode]}`
        })
        .join('')
      return titleValue + charges
    }

    const courtAppearancesWithFines = eligibleCases.map(courtCase => ({
      appearanceUuid: courtCase.latestCourtAppearance.appearanceUuid,
      courtName: courtMap[courtCase.latestCourtAppearance.courtCode] ?? courtCase.latestCourtAppearance.courtCode,
      appearanceDate: dayjs(courtCase.latestCourtAppearance.warrantDate).format(config.dateFormat),
      caseReference: courtCase.latestCourtAppearance.caseReference,
      offenceDescriptions: getOffenceDescriptions(courtCase),
    }))

    return res.render('pages/documents/generatedDocuments/f986-documents', {
      nomsId,
      courtAppearancesWithFines,
      backLink: `/person/${nomsId}`,
      errors: req.flash('errors') || [],
    })
  }
}
