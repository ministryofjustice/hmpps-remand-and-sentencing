import { RequestHandler } from 'express'
import type {
  AppealCourtNameForm,
  AppealDateForm,
  AppealOffenceOutcomeForm,
  AppealOverallCaseOutcomeForm,
  CriminalOfficeReferenceForm,
  DeleteDocumentForm,
  FinishedRecordingAppealsForm,
} from 'forms'
import type { UrlParameters } from 'models'
import AuditService from '../services/auditService'
import CourtAppearanceService from '../services/courtAppearanceService'
import ManageOffencesService from '../services/manageOffencesService'
import OffenceService from '../services/offenceService'
import RemandAndSentencingService from '../services/remandAndSentencingService'
import BaseRoutes from './baseRoutes'
import AppealsJourneyUrls from './data/AppealsJourneyUrls'
import AppealsTaskListModel from './data/AppealsTaskListModel'
import JourneyUrls from './data/JourneyUrls'
import trimForm from '../utils/trim'
import CourtRegisterService from '../services/courtRegisterService'
import logger from '../../logger'
import RefDataService from '../services/refDataService'
import {
  getUiDocumentType,
  offencesToOffenceDescriptions,
  orderOffences,
  outcomeValueOrLegacy,
  sortByDateDesc,
} from '../utils/utils'
import { chargeToOffence, pageCourtCaseAppearanceToCourtAppearance } from '../utils/mappingUtils'
import DocumentManagementService from '../services/documentManagementService'
import documentTypes from '../resources/documentTypes'

export default class AppealsRoutes extends BaseRoutes {
  constructor(
    courtAppearanceService: CourtAppearanceService,
    offenceService: OffenceService,
    remandAndSentencingService: RemandAndSentencingService,
    manageOffencesService: ManageOffencesService,
    auditService: AuditService,
    documentManagementService: DocumentManagementService,
    courtRegisterService: CourtRegisterService,
    private readonly refDataService: RefDataService,
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
    const courtAppearanceUuid = urlParameters.appearanceReference
    const sentencedCharges = await this.remandAndSentencingService.getSentencedCharges(
      urlParameters.courtCaseReference,
      req.user.username,
    )
    const sessionOffences = sentencedCharges.charges
      .sort((a, b) => {
        return sortByDateDesc(b.createdAt, a.createdAt)
      })
      .map((sentencedCharge, index) => chargeToOffence(sentencedCharge, index))
    this.courtAppearanceService.initialiseAppeals(
      req.session,
      urlParameters.nomsId,
      courtAppearanceUuid,
      sessionOffences,
    )
    return res.redirect(AppealsJourneyUrls.taskList(urlParameters))
  }

  public taskList: RequestHandler = async (req, res): Promise<void> => {
    const urlParameters = req.params as unknown as UrlParameters
    const courtAppearance = this.courtAppearanceService.getSessionCourtAppearance(
      req.session,
      urlParameters.nomsId,
      urlParameters.appearanceReference,
    )
    let caseReferenceSet = !!courtAppearance.caseReferenceNumber
    if (!caseReferenceSet) {
      const latestCourtAppearance = await this.remandAndSentencingService.getLatestCourtAppearanceByCourtCaseUuid(
        req.user.username,
        urlParameters.courtCaseReference,
      )
      caseReferenceSet = !!latestCourtAppearance.courtCaseReference
    }
    return res.render('pages/appeals/task-list', {
      ...urlParameters,
      model: new AppealsTaskListModel(urlParameters, courtAppearance, caseReferenceSet),
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
    const courtAppearanceWithoutSentences = {
      ...courtAppearance,
      offences: courtAppearance.offences.map(offence => {
        const { sentence: _, ...offenceWithoutSentence } = offence
        return offenceWithoutSentence
      }),
    }
    const courtAppearanceResponse = await this.remandAndSentencingService.createCourtAppearance(
      username,
      urlParameters.courtCaseReference,
      urlParameters.appearanceReference,
      courtAppearanceWithoutSentences,
      prisonId,
    )
    const auditDetails = {
      courtCaseUuids: [urlParameters.courtCaseReference],
      courtAppearanceUuids: [courtAppearanceResponse.appearanceUuid],
      chargesUuids: courtAppearance.offences?.map(offence => offence.chargeUuid),
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
    return res.redirect(AppealsJourneyUrls.confirmation(urlParameters))
  }

  public getCriminalOfficeReference: RequestHandler = async (req, res): Promise<void> => {
    const urlParameters = req.params as unknown as UrlParameters
    const { submitToCheckAnswers } = req.query
    let criminalOfficeReferenceForm = (req.flash('criminalOfficeReferenceForm')[0] || {}) as CriminalOfficeReferenceForm
    const { criminalAppealOfficeReference, referenceNumberSelect } =
      this.courtAppearanceService.getSessionCourtAppearance(
        req.session,
        urlParameters.nomsId,
        urlParameters.appearanceReference,
      )
    if (Object.keys(criminalOfficeReferenceForm).length === 0) {
      criminalOfficeReferenceForm = {
        referenceNumber: criminalAppealOfficeReference,
      }
    }
    let backLink = JourneyUrls.reference(
      urlParameters.nomsId,
      urlParameters.addOrEditCourtCase,
      urlParameters.courtCaseReference,
      urlParameters.addOrEditCourtAppearance,
      urlParameters.appearanceReference,
    )
    if (submitToCheckAnswers) {
      backLink = AppealsJourneyUrls.checkHearingAnswers(urlParameters)
    } else if (this.isEditJourney(urlParameters.addOrEditCourtCase, urlParameters.addOrEditCourtAppearance)) {
      backLink = AppealsJourneyUrls.hearingDetails(urlParameters)
    } else if (referenceNumberSelect !== undefined) {
      backLink = JourneyUrls.selectReference(
        urlParameters.nomsId,
        urlParameters.addOrEditCourtCase,
        urlParameters.courtCaseReference,
        urlParameters.addOrEditCourtAppearance,
        urlParameters.appearanceReference,
      )
    }
    return res.render('pages/appeals/criminal-office-reference', {
      ...urlParameters,
      criminalOfficeReferenceForm,
      errors: req.flash('errors') || [],
      backLink,
      showHearingDetails: this.isEditJourney(urlParameters.addOrEditCourtCase, urlParameters.addOrEditCourtAppearance),
    })
  }

  public submitCriminalOfficeReference: RequestHandler = async (req, res): Promise<void> => {
    const urlParameters = req.params as unknown as UrlParameters
    const { submitToCheckAnswers } = req.query as { submitToCheckAnswers: string }
    const criminalOfficeReferenceForm = trimForm<CriminalOfficeReferenceForm>(req.body)
    const errors = this.courtAppearanceService.setCriminalOfficeReference(
      req.session,
      urlParameters,
      criminalOfficeReferenceForm,
    )
    if (errors.length > 0) {
      req.flash('errors', errors)
      req.flash('criminalOfficeReferenceForm', { ...criminalOfficeReferenceForm })
      return res.redirect(AppealsJourneyUrls.criminalOfficeReference(urlParameters, 'true', submitToCheckAnswers))
    }
    return this.submitRedirect(res, urlParameters, submitToCheckAnswers, AppealsJourneyUrls.appealDate(urlParameters))
  }

  public getAppealDate: RequestHandler = async (req, res): Promise<void> => {
    const urlParameters = req.params as unknown as UrlParameters
    const { submitToCheckAnswers } = req.query
    const appealDateForm = (req.flash('appealDateForm')[0] || {}) as AppealDateForm
    let appealDateDay: number | string = appealDateForm['appealDate-day']
    let appealDateMonth: number | string = appealDateForm['appealDate-month']
    let appealDateYear: number | string = appealDateForm['appealDate-year']
    const warrantDateValue = this.courtAppearanceService.getWarrantDate(
      req.session,
      urlParameters.nomsId,
      urlParameters.appearanceReference,
    )
    if (warrantDateValue && Object.keys(appealDateForm).length === 0) {
      const appealDate = new Date(warrantDateValue)
      appealDateDay = appealDate.getDate()
      appealDateMonth = appealDate.getMonth() + 1
      appealDateYear = appealDate.getFullYear()
    }
    let backLink = AppealsJourneyUrls.criminalOfficeReference(urlParameters)
    if (this.isEditJourney(urlParameters.addOrEditCourtCase, urlParameters.addOrEditCourtAppearance)) {
      backLink = AppealsJourneyUrls.hearingDetails(urlParameters)
    } else if (submitToCheckAnswers) {
      backLink = AppealsJourneyUrls.checkHearingAnswers(urlParameters)
    }
    return res.render('pages/appeals/appeal-date', {
      ...urlParameters,
      appealDateDay,
      appealDateMonth,
      appealDateYear,
      errors: req.flash('errors') || [],
      backLink,
      showHearingDetails: this.isEditJourney(urlParameters.addOrEditCourtCase, urlParameters.addOrEditCourtAppearance),
    })
  }

  public submitAppealDate: RequestHandler = async (req, res): Promise<void> => {
    const urlParameters = req.params as unknown as UrlParameters
    const { submitToCheckAnswers } = req.query as { submitToCheckAnswers: string }
    const appealDateForm = trimForm<AppealDateForm>(req.body)
    const { username } = res.locals.user
    const errors = await this.courtAppearanceService.setAppealDate(req.session, urlParameters, appealDateForm, username)
    if (errors.length) {
      req.flash('errors', errors)
      req.flash('appealDateForm', { ...appealDateForm })
      return res.redirect(AppealsJourneyUrls.appealDate(urlParameters, 'true', submitToCheckAnswers))
    }
    return this.submitRedirect(res, urlParameters, submitToCheckAnswers, AppealsJourneyUrls.appealCourt(urlParameters))
  }

  public getAppealCourt: RequestHandler = async (req, res): Promise<void> => {
    const urlParameters = req.params as unknown as UrlParameters
    const { submitToCheckAnswers } = req.query
    let appealCourtNameForm = (req.flash('courtNameForm')[0] || {}) as AppealCourtNameForm
    if (Object.keys(appealCourtNameForm).length === 0) {
      appealCourtNameForm = {
        courtCode: this.courtAppearanceService.getCourtCode(
          req.session,
          urlParameters.nomsId,
          urlParameters.appearanceReference,
        ),
      }
    }
    if (appealCourtNameForm.courtCode && appealCourtNameForm.courtName === undefined) {
      try {
        const court = await this.courtRegisterService.findCourtById(appealCourtNameForm.courtCode, req.user.username)
        appealCourtNameForm.courtName = court.courtName
      } catch (e) {
        logger.error(e)
      }
    }
    let backLink = AppealsJourneyUrls.appealDate(urlParameters)
    if (this.isEditJourney(urlParameters.addOrEditCourtCase, urlParameters.addOrEditCourtAppearance)) {
      backLink = AppealsJourneyUrls.hearingDetails(urlParameters)
    } else if (submitToCheckAnswers) {
      backLink = AppealsJourneyUrls.checkHearingAnswers(urlParameters)
    }
    return res.render('pages/appeals/appeal-court', {
      ...urlParameters,
      appealCourtNameForm,
      errors: req.flash('errors') || [],
      backLink,
      showHearingDetails: this.isEditJourney(urlParameters.addOrEditCourtCase, urlParameters.addOrEditCourtAppearance),
    })
  }

  public submitAppealCourt: RequestHandler = async (req, res): Promise<void> => {
    const urlParameters = req.params as unknown as UrlParameters
    const { submitToCheckAnswers } = req.query as { submitToCheckAnswers: string }
    const appealCourtNameForm = trimForm<AppealCourtNameForm>(req.body)
    const errors = this.courtAppearanceService.setAppealCourtName(req.session, urlParameters, appealCourtNameForm)
    if (errors.length > 0) {
      req.flash('errors', errors)
      req.flash('appealCourtNameForm', { ...appealCourtNameForm })
      return res.redirect(AppealsJourneyUrls.appealCourt(urlParameters, 'true', submitToCheckAnswers))
    }
    return this.submitRedirect(
      res,
      urlParameters,
      submitToCheckAnswers,
      AppealsJourneyUrls.overallCaseOutcome(urlParameters),
    )
  }

  public getOverallCaseOutcome: RequestHandler = async (req, res): Promise<void> => {
    const urlParameters = req.params as unknown as UrlParameters
    const { submitToCheckAnswers } = req.query
    let overallCaseOutcomeForm = (req.flash('overallCaseOutcomeForm')[0] || {}) as AppealOverallCaseOutcomeForm
    const courtAppearance = this.courtAppearanceService.getSessionCourtAppearance(
      req.session,
      urlParameters.nomsId,
      urlParameters.appearanceReference,
    )
    if (Object.keys(overallCaseOutcomeForm).length === 0) {
      overallCaseOutcomeForm = {
        overallCaseOutcome: `${courtAppearance.appearanceOutcomeUuid}`,
      }
    }
    const { appearanceOutcomeUuid } = courtAppearance
    const caseOutcomes = await this.refDataService.getAllAppearanceOutcomes(req.user.username)
    const outcomes = caseOutcomes
      .filter(caseOutcome => caseOutcome.outcomeType === 'APPEAL')
      .sort((a, b) => a.displayOrder - b.displayOrder)
    let legacyCaseOutcome
    if (appearanceOutcomeUuid && !outcomes.map(outcome => outcome.outcomeUuid).includes(appearanceOutcomeUuid)) {
      const outcome = await this.refDataService.getAppearanceOutcomeByUuid(appearanceOutcomeUuid, req.user.username)
      legacyCaseOutcome = outcome.outcomeName
    } else if (!appearanceOutcomeUuid && !res.locals.isAddCourtAppearance) {
      legacyCaseOutcome = outcomeValueOrLegacy(undefined, courtAppearance.legacyData)
    }
    let backLink = AppealsJourneyUrls.appealCourt(urlParameters)
    if (this.isEditJourney(urlParameters.addOrEditCourtCase, urlParameters.addOrEditCourtAppearance)) {
      backLink = AppealsJourneyUrls.hearingDetails(urlParameters)
    } else if (submitToCheckAnswers) {
      backLink = AppealsJourneyUrls.checkHearingAnswers(urlParameters)
    }
    return res.render('pages/appeals/overall-case-outcome', {
      ...urlParameters,
      overallCaseOutcomeForm,
      legacyCaseOutcome,
      outcomes,
      errors: req.flash('errors') || [],
      backLink,
      showHearingDetails: this.isEditJourney(urlParameters.addOrEditCourtCase, urlParameters.addOrEditCourtAppearance),
    })
  }

  public submitOverallCaseOutcome: RequestHandler = async (req, res): Promise<void> => {
    const urlParameters = req.params as unknown as UrlParameters
    const { submitToCheckAnswers } = req.query as { submitToCheckAnswers: string }
    const overallCaseOutcomeForm = trimForm<AppealOverallCaseOutcomeForm>(req.body)
    const errors = this.courtAppearanceService.setAppealAppearanceOutcome(
      req.session,
      urlParameters,
      overallCaseOutcomeForm,
    )

    if (errors.length > 0) {
      req.flash('errors', errors)
      req.flash('overallCaseOutcomeForm', { ...overallCaseOutcomeForm })
      return res.redirect(AppealsJourneyUrls.overallCaseOutcome(urlParameters, 'true', submitToCheckAnswers))
    }
    return this.submitRedirect(
      res,
      urlParameters,
      submitToCheckAnswers,
      AppealsJourneyUrls.checkHearingAnswers(urlParameters),
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
    const [courtDetails, appearanceOutcome] = await Promise.all([
      this.courtRegisterService.findCourtById(courtAppearance.courtCode, username),
      this.refDataService.getAppearanceOutcomeByUuid(courtAppearance.appearanceOutcomeUuid, username),
    ])

    return res.render('pages/appeals/check-hearing-answers', {
      ...urlParameters,
      courtName: courtDetails.courtName,
      overallCaseOutcome: appearanceOutcome.outcomeName,
    })
  }

  public submitCheckHearingAnswers: RequestHandler = async (req, res): Promise<void> => {
    const urlParameters = req.params as unknown as UrlParameters
    this.courtAppearanceService.setAppearanceInformationAcceptedTrue(
      req.session,
      urlParameters.nomsId,
      urlParameters.appearanceReference,
    )
    return res.redirect(AppealsJourneyUrls.taskList(urlParameters))
  }

  public getRecordAppeals: RequestHandler = async (req, res): Promise<void> => {
    const urlParameters = req.params as unknown as UrlParameters
    const { username } = res.locals.user
    const courtAppearance = this.courtAppearanceService.getSessionCourtAppearance(
      req.session,
      urlParameters.nomsId,
      urlParameters.appearanceReference,
    )
    const consecutiveToSentenceDetails = await this.getConsecutiveToFromApi(
      req,
      urlParameters.nomsId,
      urlParameters.appearanceReference,
    )
    const sentenceTypeIds = [
      ...new Set(
        courtAppearance.offences
          .filter(offence => offence.sentence?.sentenceTypeId)
          .map(offence => offence.sentence?.sentenceTypeId),
      ),
    ]
    const offenceCodes = [
      ...new Set(
        courtAppearance.offences
          .map(offence => offence.offenceCode)
          .concat(consecutiveToSentenceDetails.sentences.map(consecutiveToDetails => consecutiveToDetails.offenceCode)),
      ),
    ]
    const outcomeIds = [...new Set(courtAppearance.offences.map(offence => offence.outcomeUuid))]
    const courtIds = [
      ...new Set(consecutiveToSentenceDetails.sentences.map(consecutiveToDetails => consecutiveToDetails.courtCode)),
    ]
    const [offenceMap, sentenceTypeMap, outcomeMap, courtMap] = await Promise.all([
      this.manageOffencesService.getOffenceMap(
        offenceCodes,
        username,
        offencesToOffenceDescriptions(courtAppearance.offences, consecutiveToSentenceDetails.sentences),
      ),
      this.refDataService.getSentenceTypeMap(sentenceTypeIds, username),
      this.refDataService.getChargeOutcomeMap(outcomeIds, username),
      this.courtRegisterService.getCourtMap(courtIds, username),
    ])

    const offences = orderOffences(
      courtAppearance.offences.map((offence, index) => {
        return { ...offence, index }
      }),
    )

    const [appealedOffences, otherOffences] = offences.reduce(
      ([appealedList, otherList], offence) => {
        return outcomeMap[offence.outcomeUuid].outcomeType === 'APPEAL'
          ? [[...appealedList, offence], otherList]
          : [appealedList, [...otherList, offence]]
      },
      [[], []],
    )
    const allSentenceUuids = offences
      .map(offence => offence.sentence?.sentenceUuid)
      .filter(sentenceUuid => sentenceUuid)
    const consecutiveToSentenceDetailsMap = this.getConsecutiveToSentenceDetailsMap(
      allSentenceUuids,
      consecutiveToSentenceDetails,
      offenceMap,
      courtMap,
    )
    const sessionConsecutiveToSentenceDetailsMap = this.getSessionConsecutiveToSentenceDetailsMap(
      req,
      urlParameters.nomsId,
      offenceMap,
      urlParameters.appearanceReference,
    )
    return res.render('pages/appeals/record-appeal', {
      ...urlParameters,
      offenceMap,
      sentenceTypeMap,
      outcomeMap,
      otherOffences,
      appealedOffences,
      courtMap,
      consecutiveToSentenceMap: {
        ...consecutiveToSentenceDetailsMap,
        ...sessionConsecutiveToSentenceDetailsMap,
      },
      errors: req.flash('errors') || [],
    })
  }

  public submitRecordAppeals: RequestHandler = async (req, res): Promise<void> => {
    const urlParameters = req.params as unknown as UrlParameters
    const finishedRecordingAppealsForm = trimForm<FinishedRecordingAppealsForm>(req.body)
    const errors = this.courtAppearanceService.finishRecordingAppeals(
      req.session,
      urlParameters,
      finishedRecordingAppealsForm,
    )
    if (errors.length > 0) {
      req.flash('errors', errors)
      req.flash('finishedRecordingAppealsForm', { ...finishedRecordingAppealsForm })
      return res.redirect(AppealsJourneyUrls.recordAppeal(urlParameters, 'true'))
    }
    return res.redirect(AppealsJourneyUrls.taskList(urlParameters))
  }

  public getSelectOffenceAppealOutcome: RequestHandler = async (req, res): Promise<void> => {
    const urlParameters = req.params as unknown as UrlParameters
    const { username } = res.locals.user
    const { appearanceOutcomeUuid, warrantType } = this.courtAppearanceService.getSessionCourtAppearance(
      req.session,
      urlParameters.nomsId,
      urlParameters.appearanceReference,
    )
    const offence = this.courtAppearanceService.getOffence(
      req.session,
      urlParameters.nomsId,
      urlParameters.chargeUuid,
      urlParameters.appearanceReference,
    )
    let appealOffenceOutcomeForm = (req.flash('appealOffenceOutcomeForm')[0] || {}) as AppealOffenceOutcomeForm
    if (Object.keys(appealOffenceOutcomeForm).length === 0) {
      appealOffenceOutcomeForm = {
        offenceOutcome: offence.outcomeUuid,
      }
    }
    const [offenceHint, primaryNonCustodialChargeOutcomes] = await Promise.all([
      this.getOffenceHint(offence, username),
      this.refDataService.getPrimaryNonCustodialChargeOutcomes(appearanceOutcomeUuid, warrantType, username),
    ])
    const appealOutcomes = primaryNonCustodialChargeOutcomes.allOutcomes
    let backLink = AppealsJourneyUrls.recordAppeal(urlParameters)
    if (this.isEditJourney(urlParameters.addOrEditCourtCase, urlParameters.addOrEditCourtAppearance)) {
      backLink = AppealsJourneyUrls.hearingDetails(urlParameters)
    }

    return res.render('pages/appeals/select-offence-appeal-outcome', {
      ...urlParameters,
      appealOffenceOutcomeForm,
      offenceHint,
      appealOutcomes,
      backLink,
      errors: req.flash('errors') || [],
    })
  }

  public subtmitSelectOffenceAppealOutcome: RequestHandler = async (req, res): Promise<void> => {
    const urlParameters = req.params as unknown as UrlParameters
    const appealOffenceOutcomeForm = trimForm<AppealOffenceOutcomeForm>(req.body)
    const errors = this.courtAppearanceService.setOffenceAppealOutcome(
      req.session,
      urlParameters,
      appealOffenceOutcomeForm,
    )
    if (errors.length > 0) {
      req.flash('errors', errors)
      req.flash('appealOffenceOutcomeForm', { ...appealOffenceOutcomeForm })
      return res.redirect(AppealsJourneyUrls.selectOffenceAppealOutcome(urlParameters, 'true'))
    }
    if (this.isEditJourney(urlParameters.addOrEditCourtCase, urlParameters.addOrEditCourtAppearance)) {
      return res.redirect(AppealsJourneyUrls.hearingDetails(urlParameters))
    }
    return res.redirect(AppealsJourneyUrls.recordAppeal(urlParameters))
  }

  public getUploadAppealOrder: RequestHandler = async (req, res) => {
    const urlParameters = req.params as unknown as UrlParameters
    return res.render('pages/appeals/upload-appeal-order', {
      ...urlParameters,
      backLink: AppealsJourneyUrls.taskList(urlParameters),
      errors: req.flash('errors') || [],
    })
  }

  public submitUploadAppealOrder: RequestHandler = async (req, res) => {
    const urlParameters = req.params as unknown as UrlParameters
    return this.uploadTemporaryDocument(
      req,
      res,
      urlParameters,
      'APPEAL_ORDER',
      AppealsJourneyUrls.uploadAppealsOrder(urlParameters, 'true'),
      AppealsJourneyUrls.viewAppealsOrder(urlParameters, 'true'),
    )
  }

  public getViewAppealOrder: RequestHandler = async (req, res) => {
    const urlParameters = req.params as unknown as UrlParameters
    const { backToUpload } = req.query
    const uploadedDocuments = this.courtAppearanceService.getUploadedDocuments(
      req.session,
      urlParameters.nomsId,
      urlParameters.appearanceReference,
    )
    const expectedDocumentTypes = documentTypes.APPEAL
    const documentRows = expectedDocumentTypes.map(expectedType => {
      const uploadedDocument = uploadedDocuments.find(document => document.documentType === expectedType.type) ?? {}
      return { ...expectedType, ...uploadedDocument }
    })
    const isEditJourney = this.isEditJourney(urlParameters.addOrEditCourtCase, urlParameters.addOrEditCourtAppearance)
    let backLink = AppealsJourneyUrls.taskList(urlParameters)
    if (backToUpload) {
      backLink = AppealsJourneyUrls.uploadAppealsOrder(urlParameters)
    } else if (isEditJourney) {
      backLink = AppealsJourneyUrls.hearingDetails(urlParameters)
    }
    return res.render('pages/appeals/view-appeal-order', {
      ...urlParameters,
      documentRows,
      backLink,
      isEditJourney,
    })
  }

  public confirmViewAppealOrder: RequestHandler = async (req, res) => {
    const urlParameters = req.params as unknown as UrlParameters
    this.courtAppearanceService.setDocumentUploadedTrue(
      req.session,
      urlParameters.nomsId,
      urlParameters.appearanceReference,
    )
    return res.redirect(
      this.isEditJourney(urlParameters.addOrEditCourtCase, urlParameters.addOrEditCourtAppearance)
        ? AppealsJourneyUrls.hearingDetails(urlParameters)
        : AppealsJourneyUrls.taskList(urlParameters),
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
      backLink: AppealsJourneyUrls.viewAppealsOrder(urlParameters),
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
      return res.redirect(AppealsJourneyUrls.deleteDocument(urlParameters, 'true'))
    }
    return res.redirect(AppealsJourneyUrls.uploadAppealsOrder(urlParameters))
  }

  public getConfirmation: RequestHandler = async (req, res) => {
    const urlParameters = req.params as unknown as UrlParameters
    return res.render('pages/appeals/confirmation', urlParameters)
  }

  public loadHearingDetails: RequestHandler = async (req, res): Promise<void> => {
    const urlParameters = req.params as unknown as UrlParameters
    const { username } = res.locals.user
    const storedAppearance = await this.remandAndSentencingService.getCourtAppearanceByAppearanceUuid(
      urlParameters.appearanceReference,
      username,
    )
    this.courtAppearanceService.clearSessionCourtAppearance(req.session, urlParameters.nomsId)
    this.offenceService.clearAllOffences(req.session, urlParameters.nomsId, urlParameters.courtCaseReference)
    this.courtAppearanceService.setSessionCourtAppearance(
      req.session,
      urlParameters.nomsId,
      pageCourtCaseAppearanceToCourtAppearance(storedAppearance),
    )
    return res.redirect(AppealsJourneyUrls.hearingDetails(urlParameters))
  }

  public getHearingDetails: RequestHandler = async (req, res): Promise<void> => {
    const urlParameters = req.params as unknown as UrlParameters
    const { username } = res.locals.user
    if (
      !this.courtAppearanceService.sessionCourtAppearanceExists(
        req.session,
        urlParameters.nomsId,
        urlParameters.appearanceReference,
      )
    ) {
      const storedAppearance = await this.remandAndSentencingService.getCourtAppearanceByAppearanceUuid(
        urlParameters.appearanceReference,
        username,
      )
      this.offenceService.clearAllOffences(req.session, urlParameters.nomsId, urlParameters.courtCaseReference)
      this.courtAppearanceService.setSessionCourtAppearance(
        req.session,
        urlParameters.nomsId,
        pageCourtCaseAppearanceToCourtAppearance(storedAppearance),
      )
    }
    const hearing = this.courtAppearanceService.getSessionCourtAppearance(
      req.session,
      urlParameters.nomsId,
      urlParameters.appearanceReference,
    )
    const consecutiveToSentenceDetailsFromApi = await this.getConsecutiveToFromApi(
      req,
      urlParameters.nomsId,
      urlParameters.appearanceReference,
    )
    const chargeCodes = hearing.offences
      .map(offences => offences.offenceCode)
      .concat(
        consecutiveToSentenceDetailsFromApi.sentences.map(consecutiveToDetails => consecutiveToDetails.offenceCode),
      )
    const courtIds = [hearing.courtCode, hearing.nextAppearanceCourtCode]
      .concat(consecutiveToSentenceDetailsFromApi.sentences.map(consecutiveToDetails => consecutiveToDetails.courtCode))
      .concat(hearing.offences.map(offence => offence.mergedFromCase?.courtCode))
      .filter(courtId => courtId !== undefined && courtId !== null)
    const sentenceTypeIds = hearing.offences
      .filter(offence => offence.sentence?.sentenceTypeId)
      .map(offence => offence.sentence?.sentenceTypeId)
    const offenceOutcomeIds = hearing.offences.map(offence => offence.outcomeUuid)
    const outcomePromise = hearing.appearanceOutcomeUuid
      ? this.refDataService
          .getAppearanceOutcomeByUuid(hearing.appearanceOutcomeUuid, req.user.username)
          .then(outcome => outcome.outcomeName)
      : Promise.resolve(hearing.legacyData?.outcomeDescription ?? 'Not entered')
    const appearanceTypePromise = hearing.nextAppearanceTypeUuid
      ? this.refDataService
          .getAppearanceTypeByUuid(hearing.nextAppearanceTypeUuid, req.user.username)
          .then(appearanceType => appearanceType.description)
      : Promise.resolve('Not entered')
    const { offences } = hearing
    const sentenceUuids = offences
      .filter(offence => offence.sentence?.sentenceUuid)
      .map(offence => offence.sentence.sentenceUuid)
    const hasSentenceAfterOnOtherCourtAppearancePromise = sentenceUuids.length
      ? this.remandAndSentencingService.hasSentenceAfterOnOtherCourtAppearance(sentenceUuids, username)
      : Promise.resolve({ hasSentenceAfterOnOtherCourtAppearance: false })
    const [
      offenceMap,
      courtMap,
      sentenceTypeMap,
      overallCaseOutcome,
      outcomeMap,
      appearanceTypeDescription,
      hasSentenceAfterOnOtherCourtAppearance,
    ] = await Promise.all([
      this.manageOffencesService.getOffenceMap(
        Array.from(new Set(chargeCodes)),
        req.user.username,
        offencesToOffenceDescriptions(hearing.offences, consecutiveToSentenceDetailsFromApi.sentences),
      ),
      this.courtRegisterService.getCourtMap(Array.from(new Set(courtIds)), username),
      this.refDataService.getSentenceTypeMap(Array.from(new Set(sentenceTypeIds)), username),
      outcomePromise,
      this.refDataService.getChargeOutcomeMap(Array.from(new Set(offenceOutcomeIds)), username),
      appearanceTypePromise,
      hasSentenceAfterOnOtherCourtAppearancePromise,
    ])
    const [appealedOffences, nonAppealedOffences] = offences
      .map((offence, index) => ({ ...offence, index })) // Add an index to each offence
      .reduce(
        ([appealedList, nonAppealedList], offence) => {
          const outcome = outcomeMap[offence.outcomeUuid]
          if (outcome?.outcomeType === 'APPEAL') {
            return [[...appealedList, offence], nonAppealedList]
          }
          return [appealedList, [...nonAppealedList, offence]]
        },
        [[], []] as [typeof offences, typeof offences],
      )
    const allSentenceUuids = hearing.offences
      .map(offence => offence.sentence?.sentenceUuid)
      .filter(sentenceUuid => sentenceUuid)
    const consecutiveToSentenceDetailsMap = this.getConsecutiveToSentenceDetailsMap(
      allSentenceUuids,
      consecutiveToSentenceDetailsFromApi,
      offenceMap,
      courtMap,
    )

    const sessionConsecutiveToSentenceDetailsMap = this.getSessionConsecutiveToSentenceDetailsMap(
      req,
      urlParameters.nomsId,
      offenceMap,
      urlParameters.appearanceReference,
    )

    const documentsWithUiType = this.courtAppearanceService
      .getUploadedDocuments(req.session, urlParameters.nomsId, urlParameters.appearanceReference)
      .map(document => ({
        ...document,
        documentType: getUiDocumentType(document.documentType, hearing.warrantType),
      }))

    const mergedFromText = this.getMergedFromText(
      hearing.offences?.filter(offence => offence.mergedFromCase != null).map(offence => offence.mergedFromCase),
      courtMap,
    )

    const showEditHearingDate = !hearing.offences?.some(offence => offence.sentence)

    return res.render('pages/appeals/hearing-details', {
      ...urlParameters,
      hearing,
      offenceMap,
      courtMap,
      sentenceTypeMap,
      overallCaseOutcome,
      outcomeMap,
      appearanceTypeDescription,
      appealedOffences: orderOffences(appealedOffences),
      nonAppealedOffences: orderOffences(nonAppealedOffences),
      consecutiveToSentenceMap: {
        ...consecutiveToSentenceDetailsMap,
        ...sessionConsecutiveToSentenceDetailsMap,
      },
      documentsWithUiType,
      mergedFromText,
      hasSentenceAfterOnOtherCourtAppearance:
        hasSentenceAfterOnOtherCourtAppearance.hasSentenceAfterOnOtherCourtAppearance,
      errors: req.flash('errors') || [],
      deleteOffenceDetails: req.flash('deleteOffenceDetails')[0],
      showEditHearingDate,
      backLink: JourneyUrls.courtCaseDetails(urlParameters),
    })
  }

  public submitHearingDetails: RequestHandler = async (req, res, next): Promise<void> => {
    const urlParameters = req.params as unknown as UrlParameters
    const errors = this.courtAppearanceService.checkOffencesHaveMandatoryFields(
      req.session,
      urlParameters.nomsId,
      urlParameters.appearanceReference,
    )
    if (errors.length > 0) {
      req.flash('errors', errors)
      return res.redirect(AppealsJourneyUrls.hearingDetails(urlParameters, 'true'))
    }
    return this.updateCourtAppearance(
      req,
      res,
      next,
      urlParameters.nomsId,
      urlParameters.addOrEditCourtCase,
      urlParameters.courtCaseReference,
      urlParameters.appearanceReference,
    )
  }

  public checkDeleteOffence: RequestHandler = async (req, res): Promise<void> => {
    const urlParameters = req.params as unknown as UrlParameters
    return this.canDeleteOffence(
      req,
      res,
      urlParameters,
      AppealsJourneyUrls.cannotDeleteOffence(urlParameters),
      JourneyUrls.deleteOffence(urlParameters),
    )
  }

  public getCannotDeleteOffence: RequestHandler = async (req, res): Promise<void> => {
    const urlParameters = req.params as unknown as UrlParameters
    const cannotDeleteInformation = await this.getCannotDeleteOffenceData(req, res)
    const backLink = AppealsJourneyUrls.hearingDetails(urlParameters)
    return res.render('pages/appeals/cannot-delete-offence', {
      ...urlParameters,
      backLink,
      ...cannotDeleteInformation,
    })
  }

  private submitRedirect(res, urlParameters: UrlParameters, submitToCheckAnswers, fallbackUrl) {
    if (this.isEditJourney(urlParameters.addOrEditCourtCase, urlParameters.addOrEditCourtAppearance)) {
      return res.redirect(AppealsJourneyUrls.hearingDetails(urlParameters))
    }
    if (submitToCheckAnswers) {
      return res.redirect(AppealsJourneyUrls.checkHearingAnswers(urlParameters))
    }
    return res.redirect(fallbackUrl)
  }
}
