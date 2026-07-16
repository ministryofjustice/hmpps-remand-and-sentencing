import type { UrlParameters } from 'models'
import { RequestHandler } from 'express'
import type { BreachCourtNameForm, BreachDateForm, BreachTypeForm, DeleteDocumentForm } from 'forms'
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
import trimForm from '../utils/trim'
import BreachTaskListModel from './data/BreachTaskListModel'
import logger from '../../logger'
import documentTypes from '../resources/documentTypes'
import { sortByDateDesc } from '../utils/utils'
import { chargeToOffence } from '../utils/mappingUtils'

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
    const sentencedCharges = await this.remandAndSentencingService.getSentencedCharges(
      urlParameters.courtCaseReference,
      ['ACTIVE', 'INACTIVE'],
      req.user.username,
    )
    const sessionOffences = sentencedCharges.charges
      .filter(charge => charge.sentence?.sentenceType?.classification === 'DTO')
      .sort((a, b) => {
        return sortByDateDesc(b.createdAt, a.createdAt)
      })
      .map((sentencedCharge, index) => {
        // eslint-disable-next-line no-param-reassign
        delete sentencedCharge.sentence
        // eslint-disable-next-line no-param-reassign
        delete sentencedCharge.aggravatingFactors
        return chargeToOffence(sentencedCharge, index)
      })
    this.courtAppearanceService.initialiseBreach(req.session, urlParameters, sessionOffences)
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
    const breachTypeForm = trimForm<BreachTypeForm>(req.body)
    const errors = this.courtAppearanceService.setBreachType(req.session, urlParameters, breachTypeForm)
    if (errors.length > 0) {
      req.flash('errors', errors)
      req.flash('breachTypeForm', { ...breachTypeForm })
      return res.redirect(BreachJourneyUrls.breachType(urlParameters, 'true'))
    }
    return res.redirect(BreachJourneyUrls.taskList(urlParameters))
  }

  public getTaskList: RequestHandler = async (req, res): Promise<void> => {
    const urlParameters = req.params as unknown as UrlParameters
    const courtAppearance = this.courtAppearanceService.getSessionCourtAppearance(
      req.session,
      urlParameters.nomsId,
      urlParameters.appearanceReference,
    )
    const caseReferenceSet = await this.getCaseReferenceSet(courtAppearance, req.user.username, urlParameters)
    const courtDataIngestedDocumentUuids = this.courtAppearanceService.getSessionCourtDataIngestedDocumentUuids(
      req.session,
    )
    return res.render('pages/breach/task-list', {
      ...urlParameters,
      model: new BreachTaskListModel(urlParameters, courtAppearance, caseReferenceSet, courtDataIngestedDocumentUuids),
    })
  }

  public submitTaskList: RequestHandler = async (req, res): Promise<void> => {
    const urlParameters = req.params as unknown as UrlParameters
    const { username } = res.locals.user
    const { prisonId } = res.locals.prisoner
    const courtAppearance = this.courtAppearanceService.getSessionCourtAppearance(
      req.session,
      urlParameters.nomsId,
      urlParameters.appearanceReference,
    )
    const courtAppearanceResponse = await this.remandAndSentencingService.createCourtAppearance(
      username,
      urlParameters.courtCaseReference,
      urlParameters.appearanceReference,
      courtAppearance,
      prisonId,
    )
    const auditDetails = {
      courtCaseUuids: [urlParameters.courtCaseReference],
      courtAppearanceUuids: [courtAppearanceResponse.appearanceUuid],
      chargesUuids: [],
      sentenceUuids: [],
      periodLengthUuids: [],
      documentUuids: (courtAppearance.uploadedDocuments ?? []).map(document => document.documentUUID),
    }
    await this.auditService.logCreateHearing({
      who: username,
      subjectId: urlParameters.nomsId,
      subjectType: 'PRISONER_ID',
      correlationId: req.id,
      details: auditDetails,
    })
    this.courtAppearanceService.clearSessionCourtAppearance(req.session, urlParameters.nomsId)
    return res.redirect(BreachJourneyUrls.confirmation(urlParameters))
  }

  public getHearingDate: RequestHandler = async (req, res): Promise<void> => {
    const urlParameters = req.params as unknown as UrlParameters
    const { submitToCheckAnswers } = req.query
    const breachDateForm = (req.flash('breachDateForm')[0] || {}) as BreachDateForm
    let breachDateDay: number | string = breachDateForm['breachDate-day']
    let breachDateMonth: number | string = breachDateForm['breachDate-month']
    let breachDateYear: number | string = breachDateForm['breachDate-year']
    const { warrantDate, referenceNumberSelect } = this.courtAppearanceService.getSessionCourtAppearance(
      req.session,
      urlParameters.nomsId,
      urlParameters.appearanceReference,
    )
    if (warrantDate && Object.keys(breachDateForm).length === 0) {
      const breachDate = new Date(warrantDate)
      breachDateDay = breachDate.getDate()
      breachDateMonth = breachDate.getMonth() + 1
      breachDateYear = breachDate.getFullYear()
    }
    let backLink = JourneyUrls.reference(
      urlParameters.nomsId,
      urlParameters.addOrEditCourtCase,
      urlParameters.courtCaseReference,
      urlParameters.addOrEditCourtAppearance,
      urlParameters.appearanceReference,
    )
    if (submitToCheckAnswers) {
      backLink = BreachJourneyUrls.checkHearingAnswers(urlParameters)
    } else if (this.isEditJourney(urlParameters.addOrEditCourtCase, urlParameters.addOrEditCourtAppearance)) {
      backLink = BreachJourneyUrls.hearingDetails(urlParameters)
    } else if (referenceNumberSelect !== undefined) {
      backLink = JourneyUrls.selectReference(
        urlParameters.nomsId,
        urlParameters.addOrEditCourtCase,
        urlParameters.courtCaseReference,
        urlParameters.addOrEditCourtAppearance,
        urlParameters.appearanceReference,
      )
    }
    return res.render('pages/breach/hearing-date', {
      ...urlParameters,
      breachDateDay,
      breachDateMonth,
      breachDateYear,
      errors: req.flash('errors') || [],
      backLink,
      showHearingDetails: this.isEditJourney(urlParameters.addOrEditCourtCase, urlParameters.addOrEditCourtAppearance),
    })
  }

  public submitHearingDate: RequestHandler = async (req, res): Promise<void> => {
    const urlParameters = req.params as unknown as UrlParameters
    const { submitToCheckAnswers } = req.query as { submitToCheckAnswers: string }
    const breachDateForm = trimForm<BreachDateForm>(req.body)
    const { username } = res.locals.user
    const errors = await this.courtAppearanceService.setBreachDate(req.session, urlParameters, breachDateForm, username)
    if (errors.length) {
      req.flash('errors', errors)
      req.flash('breachDateForm', { ...breachDateForm })
      return res.redirect(BreachJourneyUrls.hearingDate(urlParameters, 'true', submitToCheckAnswers))
    }
    return this.submitRedirect(res, urlParameters, submitToCheckAnswers, BreachJourneyUrls.breachCourt(urlParameters))
  }

  public getBreachCourt: RequestHandler = async (req, res): Promise<void> => {
    const urlParameters = req.params as unknown as UrlParameters
    const { submitToCheckAnswers } = req.query
    let breachCourtNameForm = (req.flash('courtNameForm')[0] || {}) as BreachCourtNameForm
    if (Object.keys(breachCourtNameForm).length === 0) {
      breachCourtNameForm = {
        courtCode: this.courtAppearanceService.getCourtCode(
          req.session,
          urlParameters.nomsId,
          urlParameters.appearanceReference,
        ),
      }
    }
    if (breachCourtNameForm.courtCode && breachCourtNameForm.courtName === undefined) {
      try {
        const court = await this.courtRegisterService.findCourtById(breachCourtNameForm.courtCode, req.user.username)
        breachCourtNameForm.courtName = court.courtName
      } catch (e) {
        logger.error(e)
      }
    }
    let backLink = BreachJourneyUrls.hearingDate(urlParameters)
    if (this.isEditJourney(urlParameters.addOrEditCourtCase, urlParameters.addOrEditCourtAppearance)) {
      backLink = BreachJourneyUrls.hearingDetails(urlParameters)
    } else if (submitToCheckAnswers) {
      backLink = BreachJourneyUrls.checkHearingAnswers(urlParameters)
    }
    return res.render('pages/breach/breach-court', {
      ...urlParameters,
      breachCourtNameForm,
      errors: req.flash('errors') || [],
      backLink,
      showHearingDetails: this.isEditJourney(urlParameters.addOrEditCourtCase, urlParameters.addOrEditCourtAppearance),
    })
  }

  public submitBreachCourt: RequestHandler = async (req, res): Promise<void> => {
    const urlParameters = req.params as unknown as UrlParameters
    const { submitToCheckAnswers } = req.query as { submitToCheckAnswers: string }
    const breachCourtNameForm = trimForm<BreachCourtNameForm>(req.body)
    const errors = this.courtAppearanceService.setBreachCourtName(req.session, urlParameters, breachCourtNameForm)
    if (errors.length > 0) {
      req.flash('errors', errors)
      req.flash('breachCourtNameForm', { ...breachCourtNameForm })
      return res.redirect(BreachJourneyUrls.breachCourt(urlParameters, 'true', submitToCheckAnswers))
    }
    return this.submitRedirect(
      res,
      urlParameters,
      submitToCheckAnswers,
      BreachJourneyUrls.checkHearingAnswers(urlParameters),
    )
  }

  public getCheckHearingAnswers: RequestHandler = async (req, res): Promise<void> => {
    const urlParameters = req.params as unknown as UrlParameters
    const { username } = res.locals.user
    const courtAppearance = this.courtAppearanceService.getSessionCourtAppearance(
      req.session,
      urlParameters.nomsId,
      urlParameters.appearanceReference,
    )
    const courtDetails = await this.courtRegisterService.findCourtById(courtAppearance.courtCode, username)

    return res.render('pages/breach/check-hearing-answers', {
      ...urlParameters,
      courtName: courtDetails.courtName,
    })
  }

  public submitCheckHearingAnswers: RequestHandler = async (req, res): Promise<void> => {
    const urlParameters = req.params as unknown as UrlParameters
    this.courtAppearanceService.setAppearanceInformationAcceptedTrue(
      req.session,
      urlParameters.nomsId,
      urlParameters.appearanceReference,
    )
    return res.redirect(BreachJourneyUrls.taskList(urlParameters))
  }

  public getUploadBreachOrder: RequestHandler = async (req, res) => {
    const urlParameters = req.params as unknown as UrlParameters
    return res.render('pages/breach/upload-breach-order', {
      ...urlParameters,
      backLink: BreachJourneyUrls.taskList(urlParameters),
      errors: req.flash('errors') || [],
    })
  }

  public submitUploadBreachOrder: RequestHandler = async (req, res) => {
    const urlParameters = req.params as unknown as UrlParameters
    return this.uploadTemporaryDocument(
      req,
      res,
      urlParameters,
      'BREACH_ORDER',
      BreachJourneyUrls.uploadBreachOrder(urlParameters, 'true'),
      BreachJourneyUrls.viewBreachOrder(urlParameters, 'true'),
    )
  }

  public getViewBreachOrder: RequestHandler = async (req, res) => {
    const urlParameters = req.params as unknown as UrlParameters
    const { backToUpload } = req.query
    const uploadedDocuments = this.courtAppearanceService.getUploadedDocuments(
      req.session,
      urlParameters.nomsId,
      urlParameters.appearanceReference,
    )
    const expectedDocumentTypes = documentTypes.BREACH_OF_SUPERVISION_REQUIREMENTS
    const documentRows = expectedDocumentTypes.map(expectedType => {
      const uploadedDocument = uploadedDocuments.find(document => document.documentType === expectedType.type) ?? {}
      return { ...expectedType, ...uploadedDocument }
    })
    const isEditJourney = this.isEditJourney(urlParameters.addOrEditCourtCase, urlParameters.addOrEditCourtAppearance)
    let backLink = BreachJourneyUrls.taskList(urlParameters)
    if (backToUpload) {
      backLink = BreachJourneyUrls.uploadBreachOrder(urlParameters)
    } else if (isEditJourney) {
      backLink = BreachJourneyUrls.hearingDetails(urlParameters)
    }
    return res.render('pages/breach/view-breach-order', {
      ...urlParameters,
      documentRows,
      backLink,
      isEditJourney,
    })
  }

  public confirmViewBreachOrder: RequestHandler = async (req, res) => {
    const urlParameters = req.params as unknown as UrlParameters
    this.courtAppearanceService.setDocumentUploadedTrue(
      req.session,
      urlParameters.nomsId,
      urlParameters.appearanceReference,
    )
    return res.redirect(
      this.isEditJourney(urlParameters.addOrEditCourtCase, urlParameters.addOrEditCourtAppearance)
        ? BreachJourneyUrls.hearingDetails(urlParameters)
        : BreachJourneyUrls.taskList(urlParameters),
    )
  }

  public getDeleteDocument: RequestHandler = async (req, res) => {
    const urlParameters = req.params as unknown as UrlParameters
    const document = this.courtAppearanceService.getUploadedDocument(
      req.session,
      urlParameters.nomsId,
      urlParameters.documentUuid,
      urlParameters.appearanceReference,
    )
    const deleteDocumentForm = (req.flash('deleteDocumentForm')[0] || {}) as DeleteDocumentForm
    return res.render('pages/appeals/delete-document', {
      ...urlParameters,
      document,
      deleteDocumentForm,
      errors: req.flash('errors') || [],
      backLink: BreachJourneyUrls.viewBreachOrder(urlParameters),
    })
  }

  public submitDeleteDocument: RequestHandler = async (req, res) => {
    const urlParameters = req.params as unknown as UrlParameters
    const { username } = res.locals.user
    const deleteDocumentForm = trimForm<DeleteDocumentForm>(req.body)
    const errors = await this.courtAppearanceService.removeUploadedDocument(
      req.session,
      urlParameters.nomsId,
      urlParameters.documentUuid,
      deleteDocumentForm,
      username,
      urlParameters.appearanceReference,
    )
    if (errors.length > 0) {
      req.flash('errors', errors)
      req.flash('deleteDocumentForm', { ...deleteDocumentForm })
      return res.redirect(BreachJourneyUrls.deleteDocument(urlParameters, 'true'))
    }
    if (deleteDocumentForm.deleteDocument === 'true') {
      return res.redirect(BreachJourneyUrls.uploadBreachOrder(urlParameters))
    }
    return res.redirect(BreachJourneyUrls.viewBreachOrder(urlParameters))
  }

  public getConfirmation: RequestHandler = async (req, res): Promise<void> => {
    const urlParameters = req.params as unknown as UrlParameters
    return res.render('pages/breach/confirmation', urlParameters)
  }

  private submitRedirect(res, urlParameters: UrlParameters, submitToCheckAnswers, fallbackUrl) {
    if (this.isEditJourney(urlParameters.addOrEditCourtCase, urlParameters.addOrEditCourtAppearance)) {
      return res.redirect(BreachJourneyUrls.hearingDetails(urlParameters))
    }
    if (submitToCheckAnswers) {
      return res.redirect(BreachJourneyUrls.checkHearingAnswers(urlParameters))
    }
    return res.redirect(fallbackUrl)
  }
}
