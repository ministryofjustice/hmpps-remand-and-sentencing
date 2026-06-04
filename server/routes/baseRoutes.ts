import type { Offence, UrlParameters } from 'models'
import { ConsecutiveToDetails } from '@ministryofjustice/hmpps-court-cases-release-dates-design/hmpps/@types'
import dayjs from 'dayjs'
import { SessionData } from 'express-session'
import fs from 'fs'
import type { UploadedDocumentForm } from 'forms'
import CourtAppearanceService from '../services/courtAppearanceService'
import OffenceService from '../services/offenceService'
import ManageOffencesService from '../services/manageOffencesService'
import RemandAndSentencingService from '../services/remandAndSentencingService'
import {
  MergedFromCase,
  OffenceOutcome,
  SentenceConsecutiveToDetailsResponse,
  SentencesAfterOnOtherCourtAppearanceDetailsResponse,
  UploadedDocument,
} from '../@types/remandAndSentencingApi/remandAndSentencingClientTypes'
import {
  offenceToConsecutiveToDetails,
  pageCourtCaseAppearanceToCourtAppearance,
  sentenceConsecutiveToDetailsToConsecutiveToDetails,
} from '../utils/mappingUtils'
import { formatDate } from '../utils/utils'
import periodLengthTypeHeadings from '../resources/PeriodLengthTypeHeadings'
import { GroupedPeriodLengths } from './data/GroupedPeriodLengths'
import config from '../config'
import JourneyUrls from './data/JourneyUrls'
import AuditService from '../services/auditService'
import FullPageError from '../model/FullPageError'
import trimForm from '../utils/trim'
import DocumentManagementService from '../services/documentManagementService'
import logger from '../../logger'
import type { Offence as ApiOffence } from '../@types/manageOffencesApi/manageOffencesClientTypes'
import CourtRegisterService from '../services/courtRegisterService'
import AppealsJourneyUrls from './data/AppealsJourneyUrls'

export default abstract class BaseRoutes {
  courtAppearanceService: CourtAppearanceService

  offenceService: OffenceService

  remandAndSentencingService: RemandAndSentencingService

  manageOffencesService: ManageOffencesService

  auditService: AuditService

  documentManagementService: DocumentManagementService

  courtRegisterService: CourtRegisterService

  constructor(
    courtAppearanceService: CourtAppearanceService,
    offenceService: OffenceService,
    remandAndSentencingService: RemandAndSentencingService,
    manageOffencesService: ManageOffencesService,
    auditService: AuditService,
    documentManagementService: DocumentManagementService,
    courtRegisterService: CourtRegisterService,
  ) {
    this.courtAppearanceService = courtAppearanceService
    this.offenceService = offenceService
    this.remandAndSentencingService = remandAndSentencingService
    this.manageOffencesService = manageOffencesService
    this.auditService = auditService
    this.documentManagementService = documentManagementService
    this.courtRegisterService = courtRegisterService
  }

  protected isAddJourney(addOrEditCourtCase: string, addOrEditCourtAppearance: string): boolean {
    return addOrEditCourtCase === 'add-court-case' && addOrEditCourtAppearance === 'add-court-appearance'
  }

  protected isRepeatJourney(addOrEditCourtCase: string, addOrEditCourtAppearance: string): boolean {
    return addOrEditCourtCase === 'edit-court-case' && addOrEditCourtAppearance === 'add-court-appearance'
  }

  protected isEditJourney(addOrEditCourtCase: string, addOrEditCourtAppearance: string): boolean {
    return addOrEditCourtCase === 'edit-court-case' && addOrEditCourtAppearance === 'edit-court-appearance'
  }

  protected saveAllOffencesToAppearance(
    session: Partial<SessionData>,
    nomsId: string,
    appearanceReference: string,
    courtCaseReference: string,
  ) {
    const allOffencesData = this.offenceService.getAllOffences(session, nomsId, courtCaseReference)
    allOffencesData.forEach(offence => {
      this.courtAppearanceService.addOffence(session, nomsId, offence.chargeUuid, offence, appearanceReference)
    })
    this.offenceService.clearAllOffences(session, nomsId, appearanceReference)
  }

  protected saveSessionOffenceInAppearance(
    req,
    res,
    nomsId: string,
    addOrEditCourtCase: string,
    courtCaseReference: string,
    addOrEditCourtAppearance: string,
    appearanceReference: string,
    chargeUuid: string,
  ) {
    const offence = this.offenceService.getSessionOffence(req.session, nomsId, courtCaseReference, chargeUuid)
    if (offence.onFinishGoToEdit) {
      return res.redirect(
        JourneyUrls.editOffence(
          nomsId,
          addOrEditCourtCase,
          courtCaseReference,
          addOrEditCourtAppearance,
          appearanceReference,
          chargeUuid,
        ),
      )
    }
    this.saveAllOffencesToAppearance(req.session, nomsId, appearanceReference, courtCaseReference)
    if (this.isAddJourney(addOrEditCourtCase, addOrEditCourtAppearance)) {
      return res.redirect(
        JourneyUrls.checkOffenceAnswers(
          nomsId,
          addOrEditCourtCase,
          courtCaseReference,
          addOrEditCourtAppearance,
          appearanceReference,
        ),
      )
    }
    const warrantType = this.courtAppearanceService.getWarrantType(req.session, nomsId, appearanceReference)
    if (this.isEditJourney(addOrEditCourtCase, addOrEditCourtAppearance)) {
      if (warrantType === 'SENTENCING') {
        return res.redirect(
          JourneyUrls.sentencingHearing(
            nomsId,
            addOrEditCourtCase,
            courtCaseReference,
            addOrEditCourtAppearance,
            appearanceReference,
          ),
        )
      }
      if (warrantType === 'APPEAL') {
        return res.redirect(
          AppealsJourneyUrls.hearingDetails({
            nomsId,
            addOrEditCourtCase,
            courtCaseReference,
            addOrEditCourtAppearance,
            appearanceReference,
          }),
        )
      }
      return res.redirect(
        JourneyUrls.nonSentencingHearing(
          nomsId,
          addOrEditCourtCase,
          courtCaseReference,
          addOrEditCourtAppearance,
          appearanceReference,
        ),
      )
    }
    if (warrantType === 'SENTENCING') {
      return res.redirect(
        JourneyUrls.updateOffenceOutcomes(
          nomsId,
          addOrEditCourtCase,
          courtCaseReference,
          addOrEditCourtAppearance,
          appearanceReference,
        ),
      )
    }
    return res.redirect(
      JourneyUrls.reviewOffences(
        nomsId,
        addOrEditCourtCase,
        courtCaseReference,
        addOrEditCourtAppearance,
        appearanceReference,
      ),
    )
  }

  protected async getConsecutiveToFromApi(
    req,
    nomsId: string,
    appearanceReference: string,
  ): Promise<SentenceConsecutiveToDetailsResponse> {
    const appearance = this.courtAppearanceService.getSessionCourtAppearance(req.session, nomsId, appearanceReference)

    const sentenceUuidsInSession = appearance.offences.filter(o => o.sentence).map(o => o.sentence.sentenceUuid)
    const consecutiveToSentenceUuidsNotInSession = appearance.offences
      .filter(
        o =>
          o.sentence?.consecutiveToSentenceUuid &&
          !sentenceUuidsInSession.some(uuid => uuid === o.sentence?.consecutiveToSentenceUuid),
      )
      .map(o => o.sentence?.consecutiveToSentenceUuid)
    return this.remandAndSentencingService.getConsecutiveToDetails(
      consecutiveToSentenceUuidsNotInSession,
      req.user.username,
    )
  }

  protected getConsecutiveToSentenceDetailsMap(
    allSentenceUuids: string[],
    consecutiveToSentenceDetails: SentenceConsecutiveToDetailsResponse,
    offenceMap: { [key: string]: string },
    courtMap: { [key: string]: string },
  ): {
    [key: string]: ConsecutiveToDetails
  } {
    return Object.fromEntries(
      consecutiveToSentenceDetails.sentences.map(consecutiveToDetails => {
        const consecutiveToDetailsEntry = sentenceConsecutiveToDetailsToConsecutiveToDetails(
          consecutiveToDetails,
          offenceMap,
          courtMap,
          allSentenceUuids.includes(consecutiveToDetails.sentenceUuid),
        )
        return [consecutiveToDetails.sentenceUuid, consecutiveToDetailsEntry]
      }),
    )
  }

  protected getSessionConsecutiveToSentenceDetailsMap(
    req,
    nomsId: string,
    offenceMap: { [key: string]: string },
    appearanceReference: string,
  ): {
    [key: string]: ConsecutiveToDetails
  } {
    const appearance = this.courtAppearanceService.getSessionCourtAppearance(req.session, nomsId, appearanceReference)
    const sentenceUuidsInSession = appearance.offences.filter(o => o.sentence).map(o => o.sentence.sentenceUuid)
    const { offences } = appearance
    return Object.fromEntries(
      offences
        .filter(
          offence =>
            offence.sentence?.consecutiveToSentenceUuid &&
            sentenceUuidsInSession.some(uuid => uuid === offence.sentence?.consecutiveToSentenceUuid),
        )
        .map(consecutiveOffence => {
          const consecutiveToOffence = offences.find(
            offence => offence.sentence?.sentenceUuid === consecutiveOffence.sentence.consecutiveToSentenceUuid,
          )
          return [
            consecutiveOffence.sentence.consecutiveToSentenceUuid,
            offenceToConsecutiveToDetails(consecutiveToOffence, offenceMap),
          ]
        }),
    )
  }

  protected async updateCourtAppearance(
    req,
    res,
    next,
    nomsId: string,
    addOrEditCourtCase: string,
    courtCaseReference: string,
    appearanceReference: string,
  ) {
    const courtAppearance = this.courtAppearanceService.getSessionCourtAppearance(
      req.session,
      nomsId,
      appearanceReference,
    )
    const { username } = res.locals.user
    const { prisonId } = res.locals.prisoner
    try {
      await this.remandAndSentencingService.updateCourtAppearance(
        username,
        courtCaseReference,
        appearanceReference,
        courtAppearance,
        prisonId,
      )
    } catch (e) {
      const status = e?.responseStatus ?? e?.data?.status ?? e?.status
      if (status === 409) {
        throw FullPageError.appearanceDeletedError(nomsId)
      }
      return next(e)
    }
    const auditDetails = {
      courtCaseUuids: [courtCaseReference],
      courtAppearanceUuids: [appearanceReference],
      chargeUuids: courtAppearance.offences?.map(offence => offence.chargeUuid),
      sentenceUuids: courtAppearance.offences?.map(offence => offence.sentence?.sentenceUuid),
      periodLengthUuids: courtAppearance.offences?.flatMap(
        offence => offence.sentence?.periodLengths?.map(periodLength => periodLength.uuid) ?? [],
      ),
      documentUuids: courtAppearance.uploadedDocuments?.map(document => document.documentUUID),
    }
    await this.auditService.logEditHearing({
      who: username,
      subjectId: nomsId,
      subjectType: 'PRISONER_ID',
      correlationId: req.id,
      details: auditDetails,
    })
    this.courtAppearanceService.clearSessionCourtAppearance(req.session, nomsId)
    return res.redirect(`/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/appearance-updated-confirmation`)
  }

  protected queryParametersToString(submitToEditOffence, invalidatedFrom): string {
    const submitQueries: string[] = []
    if (submitToEditOffence) {
      submitQueries.push('submitToEditOffence=true')
    }
    if (invalidatedFrom) {
      submitQueries.push(`invalidatedFrom=${invalidatedFrom}`)
    }
    return submitQueries.length ? `?${submitQueries.join('&')}` : ''
  }

  protected getMergedFromText(mergedFromCases: MergedFromCase[], courtMap: { [key: string]: string }): string {
    const parts = new Set<string>()
    for (const mergedFromCase of mergedFromCases) {
      const formattedDate = formatDate(mergedFromCase.mergedFromDate)
      if (mergedFromCase.caseReference != null) {
        parts.add(`offences from ${mergedFromCase.caseReference} that were merged with this case on ${formattedDate}`)
      } else {
        const courtName = courtMap[mergedFromCase.courtCode!]
        const formattedWarrantDate = formatDate(mergedFromCase.warrantDate)
        parts.add(
          `offences from ${courtName} on ${formattedWarrantDate} that were merged with this case on ${formattedDate}`,
        )
      }
    }
    if (parts.size === 0) return ''
    return `This appearance includes ${Array.from(parts).join(' and ')}`
  }

  protected async setAppearanceDetailsToSession(
    appearanceReference: string,
    username: string,
    req,
    nomsId: string,
    courtCaseReference: string,
  ) {
    const storedAppearance = await this.remandAndSentencingService.getCourtAppearanceByAppearanceUuid(
      appearanceReference,
      username,
    )
    this.courtAppearanceService.clearSessionCourtAppearance(req.session, nomsId)
    this.offenceService.clearAllOffences(req.session, nomsId, courtCaseReference)
    this.courtAppearanceService.setSessionCourtAppearance(
      req.session,
      nomsId,
      pageCourtCaseAppearanceToCourtAppearance(storedAppearance),
    )
  }

  protected groupPeriodLengthsByType(offence: Offence): GroupedPeriodLengths[] {
    const periodLengthsByType =
      offence.sentence?.periodLengths?.reduce((periodLengthTypes, periodLength) => {
        const [key, legacyCode] = periodLengthTypeHeadings[periodLength.periodLengthType]
          ? [periodLengthTypeHeadings[periodLength.periodLengthType]]
          : [periodLength.legacyData?.sentenceTermDescription, periodLength.legacyData?.sentenceTermCode]
        const existingPeriodLengths = periodLengthTypes[key] ?? {
          key,
          type: periodLength.periodLengthType,
          legacyCode,
          lengths: [],
        }
        existingPeriodLengths.lengths.push(periodLength)
        return { ...periodLengthTypes, [key]: existingPeriodLengths }
      }, {}) ?? {}
    return Object.values(periodLengthsByType)
  }

  protected async getOffenceHint(
    offence: Offence,
    username: string,
  ): Promise<{ text: string; attributes: { [key: string]: string } }> | undefined {
    let hint
    if (offence.offenceCode) {
      const apiOffence = await this.manageOffencesService.getOffenceByCode(
        offence.offenceCode,
        username,
        offence.legacyData?.offenceDescription,
      )
      let dateText = ''
      if (offence.offenceStartDate) {
        dateText = ` committed on ${dayjs(offence.offenceStartDate).format(config.dateFormat)}`
        if (offence.offenceEndDate) {
          dateText += ` to ${dayjs(offence.offenceEndDate).format(config.dateFormat)}`
        }
      }
      hint = {
        text: `${offence.offenceCode} - ${apiOffence.description}${dateText}`,
        attributes: {
          'data-qa': 'offenceParagraph',
        },
      }
    }
    return hint
  }

  protected async autoSetOutcome(
    req,
    nomsId,
    courtCaseReference,
    appearanceReference,
    chargeUuid,
  ): Promise<{
    outcomeAutoApplied: boolean
    outcome?: OffenceOutcome
  }> {
    const caseOutcomeAppliedAll = this.courtAppearanceService.getCaseOutcomeAppliedAll(
      req.session,
      nomsId,
      appearanceReference,
    )
    if (caseOutcomeAppliedAll === 'true') {
      const sentenceUuidsInChain = this.courtAppearanceService.getSentenceUuidsInChain(
        req.session,
        nomsId,
        appearanceReference,
        chargeUuid,
      )
      const { outcome } = await this.offenceService.setOffenceOutcome(
        req.session,
        nomsId,
        courtCaseReference,
        {
          offenceOutcome: this.courtAppearanceService.getRelatedOffenceOutcomeUuid(
            req.session,
            nomsId,
            appearanceReference,
          ),
        },
        sentenceUuidsInChain,
        req.user.username,
        chargeUuid,
      )
      return { outcomeAutoApplied: true, outcome }
    }
    return { outcomeAutoApplied: false }
  }

  protected async uploadTemporaryDocument(
    req,
    res,
    urlParameters: UrlParameters,
    documentTypeName: string,
    redirectErrorsToPath: string,
    redirectSuccessToPath: string,
  ): Promise<void> {
    const { username } = req.user
    const { nomsId, appearanceReference } = urlParameters
    const uploadedDocumentForm = trimForm<UploadedDocumentForm>(req.body)
    const uploadedFile = (req.files as Express.Multer.File[])?.[0]
    try {
      if (!uploadedFile) {
        req.flash('errors', [{ text: 'Select a document to upload.', href: '#document-upload' }])
        req.flash('uploadedDocumentForm', { ...uploadedDocumentForm })
        return res.redirect(redirectErrorsToPath)
      }

      const documentUuid = await this.documentManagementService.uploadDocument(
        nomsId,
        uploadedFile,
        username,
        documentTypeName,
      )

      const uploadedDocument: UploadedDocument = {
        documentUUID: documentUuid,
        documentType: documentTypeName,
        fileName: uploadedFile.originalname,
      }
      await this.remandAndSentencingService.createUploadDocument(uploadedDocument, username)
      this.courtAppearanceService.addUploadedDocument(req.session, nomsId, uploadedDocument, appearanceReference)
    } catch (error) {
      logger.error(`Error uploading document: ${error.message}`)
      req.flash('errors', [{ text: this.getDocumentErrorMessage(error.message), href: '#document-upload' }])
      return res.redirect(redirectErrorsToPath)
    } finally {
      if (req.file && req.file.path) {
        fs.unlink(req.file.path, err => {
          if (err) logger.error('Error deleting temp file:', err)
        })
      }
    }
    return res.redirect(redirectSuccessToPath)
  }

  protected async canDeleteOffence(
    req,
    res,
    urlParameters: UrlParameters,
    cannotDeletePath,
    canDeletePath,
  ): Promise<void> {
    const sentenceUuidsInChain = this.courtAppearanceService.getSentenceUuidsInChain(
      req.session,
      urlParameters.nomsId,
      urlParameters.appearanceReference,
      urlParameters.chargeUuid,
    )
    if (sentenceUuidsInChain.length) {
      const hasSentencesAfter = await this.remandAndSentencingService.hasSentenceAfterOnOtherCourtAppearance(
        sentenceUuidsInChain,
        req.user.username,
      )
      if (hasSentencesAfter.hasSentenceAfterOnOtherCourtAppearance) {
        return res.redirect(cannotDeletePath)
      }
    }
    return res.redirect(canDeletePath)
  }

  protected async getCannotDeleteOffenceData(
    req,
    res,
  ): Promise<{
    offence: Offence
    courtMap: { [key: string]: string }
    offenceDetails: ApiOffence
    sentencesAfterDetails: SentencesAfterOnOtherCourtAppearanceDetailsResponse
  }> {
    const urlParameters = req.params as unknown as UrlParameters
    const { username } = req.user
    const sentenceUuidsInChain = this.courtAppearanceService.getSentenceUuidsInChain(
      req.session,
      urlParameters.nomsId,
      urlParameters.appearanceReference,
      urlParameters.chargeUuid,
    )
    const offence = this.courtAppearanceService.getOffence(
      req.session,
      urlParameters.nomsId,
      urlParameters.chargeUuid,
      urlParameters.appearanceReference,
    )
    const sentencesAfterDetails = await this.remandAndSentencingService.getSentencesAfterOnOtherCourtAppearanceDetails(
      sentenceUuidsInChain,
      username,
    )
    const courtIds = Array.from(new Set(sentencesAfterDetails.appearances.map(appearance => appearance.courtCode)))
    const [courtMap, offenceDetails] = await Promise.all([
      this.courtRegisterService.getCourtMap(courtIds, username),
      this.manageOffencesService.getOffenceByCode(
        offence.offenceCode,
        username,
        offence.legacyData?.offenceDescription,
      ),
    ])
    return {
      offence,
      courtMap,
      offenceDetails,
      sentencesAfterDetails,
    }
  }

  private getDocumentErrorMessage(errorMessage: string): string {
    const match = Object.keys(BaseRoutes.documentErrorMessages).find(key => errorMessage.includes(key))
    if (match) {
      return BaseRoutes.documentErrorMessages[match]
    }
    return 'The selected file could not be uploaded - try again.'
  }

  private static readonly documentErrorMessages: Record<string, string> = {
    'Payload Too Large': 'The selected document must be smaller than 50MB.',
    'virus scan': 'The selected file contains a virus',
  }
}
