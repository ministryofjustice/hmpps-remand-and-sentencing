import { RequestHandler } from 'express'
import type {
  CancelCourtCaseForm,
  CourtCaseCaseOutcomeAppliedAllForm,
  CourtCaseCourtNameForm,
  CourtCaseNextAppearanceCourtNameForm,
  CourtCaseNextAppearanceCourtSelectForm,
  CourtCaseNextAppearanceDateForm,
  CourtCaseNextAppearanceSelectForm,
  CourtCaseNextAppearanceTypeForm,
  CourtCaseOverallCaseOutcomeForm,
  CourtCaseReferenceForm,
  CourtCaseSelectCourtNameForm,
  CourtCaseSelectReferenceForm,
  CourtCaseWarrantDateForm,
  DeleteDocumentForm,
  DeleteHearingForm,
  ReceivedCustodialSentenceForm,
  UploadedDocumentForm,
} from 'forms'
import type { CourtCase, UploadedDocument } from 'models'
import dayjs from 'dayjs'
import { ConsecutiveToDetails } from '@ministryofjustice/hmpps-court-cases-release-dates-design/hmpps/@types'
import fs from 'fs'
import { Readable } from 'stream'
import { firstNameSpaceLastName } from '@ministryofjustice/hmpps-court-cases-release-dates-design/hmpps/utils/utils'
import trimForm from '../utils/trim'
import CourtAppearanceService from '../services/courtAppearanceService'
import RemandAndSentencingService from '../services/remandAndSentencingService'
import CourtCasesDetailsModel from './data/CourtCasesDetailsModel'
import CourtCaseDetailsModel from './data/CourtCaseDetailsModel'
import ManageOffencesService from '../services/manageOffencesService'
import {
  getAsStringOrDefault,
  outcomeValueOrLegacy,
  sortByDateDesc,
  getUiDocumentType,
  formatDate,
  orderOffences,
  consecutiveToSentenceDetailsToOffenceDescriptions,
} from '../utils/utils'
import DocumentManagementService from '../services/documentManagementService'
import { chargeToOffence } from '../utils/mappingUtils'
import { PrisonUser } from '../interfaces/hmppsUser'
import logger from '../../logger'
import CourtCasesReleaseDatesService from '../services/courtCasesReleaseDatesService'
import { govukPaginationFromPagePagedCourtCase, getPaginationResults } from './data/pagination'
import config from '../config'
import BaseRoutes from './baseRoutes'
import OffenceService from '../services/offenceService'
import CourtRegisterService from '../services/courtRegisterService'
import {
  MergedFromCase,
  PageCourtCaseContent,
  PagePagedCourtCase,
  SearchDocuments,
  SentenceConsecutiveToDetailsResponse,
} from '../@types/remandAndSentencingApi/remandAndSentencingClientTypes'
import documentTypes from '../resources/documentTypes'
import RefDataService from '../services/refDataService'
import SentencingTaskListModel from './data/SentencingTaskListModel'
import JourneyUrls, { buildReturnUrlFromKey } from './data/JourneyUrls'
import NonSentencingTaskListModel from './data/NonSentencingTaskListModel'
import AuditService, { Page } from '../services/auditService'

export default class CourtCaseRoutes extends BaseRoutes {
  constructor(
    offenceService: OffenceService,
    courtAppearanceService: CourtAppearanceService,
    remandAndSentencingService: RemandAndSentencingService,
    manageOffencesService: ManageOffencesService,
    private readonly documentManagementService: DocumentManagementService,
    private readonly courtRegisterService: CourtRegisterService,
    private readonly courtCasesReleaseDatesService: CourtCasesReleaseDatesService,
    private readonly refDataService: RefDataService,
    private readonly auditService: AuditService,
  ) {
    super(courtAppearanceService, offenceService, remandAndSentencingService, manageOffencesService)
  }

  public start: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId } = req.params
    const { token, username } = res.locals.user
    const sortBy = getAsStringOrDefault(req.query.sortBy, 'STATUS_APPEARANCE_DATE_DESC')
    const pageNumber = parseInt(getAsStringOrDefault(req.query.pageNumber, '1'), 10) - 1

    const [courtCases, serviceDefinitions] = await Promise.all([
      this.remandAndSentencingService.searchCourtCases(nomsId, username, sortBy, pageNumber),
      this.courtCasesReleaseDatesService.getServiceDefinitions(nomsId, token),
    ])
    const consecutiveToSentenceUuids = courtCases.content
      .flatMap(courtCase => courtCase.latestCourtAppearance.charges)
      .map(charge => charge.sentence?.consecutiveToSentenceUuid)
      .filter(sentenceUuid => sentenceUuid)

    const consecutiveToSentenceDetails = await this.remandAndSentencingService.getConsecutiveToDetails(
      consecutiveToSentenceUuids,
      req.user.username,
    )
    const charges = courtCases.content.flatMap(courtCase => courtCase.latestCourtAppearance.charges)
    const chargeCodes = charges
      .map(charge => charge.offenceCode)
      .concat(consecutiveToSentenceDetails.sentences.map(consecutiveToDetails => consecutiveToDetails.offenceCode))
    const chargeDescriptions: [string, string][] = Array.from(
      new Set(
        charges
          .filter(charge => charge.legacyData?.offenceDescription)
          .map(charge => [charge.offenceCode, charge.legacyData.offenceDescription])
          .concat(consecutiveToSentenceDetailsToOffenceDescriptions(consecutiveToSentenceDetails.sentences)) as [
          string,
          string,
        ][],
      ),
    )
    const courtIds = courtCases.content
      .flatMap(courtCase =>
        [
          courtCase.latestCourtAppearance.courtCode,
          courtCase.latestCourtAppearance.nextCourtAppearance?.courtCode,
          courtCase.mergedToCase?.courtCode,
        ]
          .concat(courtCase.latestCourtAppearance.charges.map(charge => charge.mergedFromCase?.courtCode))
          .filter(courtCode => courtCode !== undefined && courtCode !== null),
      )
      .flat()
      .concat(consecutiveToSentenceDetails.sentences.map(consecutiveToDetails => consecutiveToDetails.courtCode))
    const [offenceMap, courtMap] = await Promise.all([
      this.manageOffencesService.getOffenceMap(Array.from(new Set(chargeCodes)), req.user.username, chargeDescriptions),
      this.courtRegisterService.getCourtMap(Array.from(new Set(courtIds)), req.user.username),
    ])
    const consecutiveToSentenceDetailsMap = Object.fromEntries(
      consecutiveToSentenceDetails.sentences.map(consecutiveToDetails => {
        return [
          consecutiveToDetails.sentenceUuid,
          {
            countNumber: consecutiveToDetails.countNumber,
            offenceCode: consecutiveToDetails.offenceCode,
            offenceDescription: offenceMap[consecutiveToDetails.offenceCode],
            courtCaseReference: consecutiveToDetails.courtCaseReference,
            courtName: courtMap[consecutiveToDetails.courtCode],
            warrantDate: dayjs(consecutiveToDetails.appearanceDate).format(config.dateFormat),
            offenceStartDate: dayjs(consecutiveToDetails.offenceStartDate).format(config.dateFormat),
            offenceEndDate:
              consecutiveToDetails.offenceEndDate &&
              dayjs(consecutiveToDetails.offenceEndDate).format(config.dateFormat),
          } as ConsecutiveToDetails,
        ]
      }),
    )
    const courtCaseDetailModels = courtCases.content.map(
      pageCourtCaseContent => new CourtCasesDetailsModel(pageCourtCaseContent, courtMap),
    )
    const offenceOutcomeMap = Object.fromEntries(
      courtCases.content
        .flatMap(courtCase =>
          courtCase.latestCourtAppearance.charges.filter(charge => charge.outcome).map(charge => charge.outcome),
        )
        .map(outcome => [outcome.outcomeUuid, outcome.outcomeName]),
    )
    const newCourtCaseId = crypto.randomUUID()
    const paginationUrl = new URL(JourneyUrls.courtCases(nomsId), config.domain)
    paginationUrl.searchParams.set('sortBy', sortBy)
    const pagination = govukPaginationFromPagePagedCourtCase(courtCases, paginationUrl)
    const paginationResults = getPaginationResults(courtCases)

    if (!courtCases.empty) {
      const auditDetails = this.getCourtCasesAuditUuids(courtCases, consecutiveToSentenceDetails)
      await this.auditService.logPageView(Page.COURT_CASES, {
        who: res.locals.user.username,
        correlationId: req.id,
        subjectType: 'PRISONER_ID',
        subjectId: nomsId,
        details: auditDetails,
      })
    }
    const successMessage = req.flash('success')[0]
    return res.render('pages/start', {
      nomsId,
      newCourtCaseId,
      courtCaseDetailModels,
      offenceMap,
      courtMap,
      sortBy,
      courtCaseTotal: courtCaseDetailModels.length,
      offenceOutcomeMap,
      serviceDefinitions,
      pagination,
      consecutiveToSentenceDetailsMap,
      appearanceUuid: crypto.randomUUID(),
      paginationResults,
      successMessage,
      viewOnlyEnabled: config.featureToggles.viewOnlyEnabled,
    })
  }

  private getCourtCasesAuditUuids(
    courtCases: PagePagedCourtCase,
    consecutiveToSentenceDetails: SentenceConsecutiveToDetailsResponse,
  ): {
    courtCaseUuids: string[]
    courtAppearanceUuids: string[]
    chargeUuids: string[]
    sentenceUuids: string[]
    periodLengthUuids: string[]
  } {
    const courtCaseUuids = Array.from(new Set(courtCases.content.map(courtCase => courtCase.courtCaseUuid)))
    const courtAppearanceUuids = Array.from(
      new Set(
        courtCases.content
          .flatMap(courtCase =>
            [courtCase.latestCourtAppearance.appearanceUuid, courtCase.mergedToCase?.appearanceUuid].concat(
              courtCase.mergedFromCases.map(mergedFromCase => mergedFromCase.appearanceUuid),
            ),
          )
          .filter(courtAppearanceUuid => courtAppearanceUuid),
      ),
    )
    const chargeUuids = Array.from(
      new Set(
        courtCases.content.flatMap(courtCase =>
          courtCase.latestCourtAppearance.charges.map(charge => charge.chargeUuid),
        ),
      ),
    )
    const sentenceUuids = Array.from(
      new Set(
        courtCases.content
          .flatMap(courtCase => courtCase.latestCourtAppearance.charges.map(charge => charge.sentence?.sentenceUuid))
          .concat(consecutiveToSentenceDetails.sentences.map(sentence => sentence.sentenceUuid))
          .filter(sentenceUuid => sentenceUuid),
      ),
    )
    const periodLengthUuids = Array.from(
      new Set(
        courtCases.content
          .flatMap(courtCase =>
            courtCase.latestCourtAppearance.charges
              .flatMap(charge => charge.sentence?.periodLengths?.map(periodLength => periodLength.periodLengthUuid))
              .concat(courtCase.overallSentenceLength?.periodLengthUuid),
          )
          .filter(periodLengthUuid => periodLengthUuid),
      ),
    )
    return { courtCaseUuids, courtAppearanceUuids, chargeUuids, sentenceUuids, periodLengthUuids }
  }

  public documents: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId } = req.params
    const { username, token } = res.locals.user
    const { searchQuery } = req.query
    const courts = searchQuery ? await this.courtRegisterService.searchCourts(searchQuery.toString(), username) : []
    const searchDocuments: SearchDocuments = {
      warrantTypeDocumentTypes: Object.entries(documentTypes).flatMap(([warrantType, expectedDocumentTypes]) =>
        expectedDocumentTypes
          .filter(documentType =>
            documentType.name.toLocaleLowerCase().includes(searchQuery?.toLocaleString().toLocaleLowerCase()),
          )
          .map(documentType => `${warrantType}|${documentType.type}`),
      ),
      keyword: searchQuery as string,
      courtCodes: courts.map(court => court.courtId),
    }
    const [prisonerCourtCasesDocuments, serviceDefinitions] = await Promise.all([
      this.remandAndSentencingService.getPrisonerDocuments(nomsId, searchDocuments, username),
      this.courtCasesReleaseDatesService.getServiceDefinitions(nomsId, token),
    ])
    const courtCodes = prisonerCourtCasesDocuments.courtCaseDocuments.flatMap(courtCaseDocuments =>
      Object.values(courtCaseDocuments.appearanceDocumentsByType)
        .flatMap(documents => documents.flatMap(document => document.courtCode))
        .concat(courtCaseDocuments.latestAppearance.courtCode),
    )

    const courtMap = await this.courtRegisterService.getCourtMap(courtCodes, username)
    const courtCases = prisonerCourtCasesDocuments.courtCaseDocuments
      .sort((a, b) => sortByDateDesc(a.latestAppearance.appearanceDate, b.latestAppearance.appearanceDate))
      .map(courtCase => {
        return {
          ...courtCase,
          appearanceDocumentsByType: Object.entries(courtCase.appearanceDocumentsByType)
            .flatMap(([type, documents]) => {
              return documents.map(document => {
                return {
                  key:
                    documentTypes[document.warrantType].find(documentType => documentType.type === type).name ??
                    'Unknown document type',
                  val: document,
                }
              })
            })
            .reduce((current, value) => {
              const docs = current[value.key] ?? []
              // eslint-disable-next-line no-param-reassign
              current[value.key] = docs.concat(value.val).sort((a, b) => sortByDateDesc(a.warrantDate, b.warrantDate))
              return current
            }, {}),
        }
      })
    return res.render('pages/documents', {
      nomsId,
      courtCases,
      courtMap,
      serviceDefinitions,
      searchQuery,
    })
  }

  public getCourtCaseDetails: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, addOrEditCourtCase } = req.params
    const { username } = res.locals.user
    const courtCaseDetails = await this.remandAndSentencingService.getCourtCaseDetails(courtCaseReference, username)

    const consecutiveToUuids = courtCaseDetails.appearances
      .flatMap(appearance => appearance.charges.map(charge => charge.sentence?.consecutiveToSentenceUuid))
      .filter(sentenceUuid => sentenceUuid)

    const consecutiveToSentenceDetails = await this.remandAndSentencingService.getConsecutiveToDetails(
      consecutiveToUuids,
      req.user.username,
    )

    const chargeCodes = courtCaseDetails.appearances
      .map(appearance => appearance.charges.map(charge => charge.offenceCode))
      .flat()
      .concat(consecutiveToSentenceDetails.sentences.map(consecutiveToDetails => consecutiveToDetails.offenceCode))

    const courtIds = [courtCaseDetails.latestAppearance?.courtCode]
      .concat(
        courtCaseDetails.appearances.flatMap(appearance => [
          appearance.courtCode,
          appearance.nextCourtAppearance?.courtCode,
          ...appearance.charges.map(charge => charge.mergedFromCase?.courtCode),
        ]),
        consecutiveToSentenceDetails.sentences.map(consecutiveToDetails => consecutiveToDetails.courtCode),
        courtCaseDetails.mergedToCaseDetails?.courtCode ? [courtCaseDetails.mergedToCaseDetails.courtCode] : [],
      )
      .filter(courtId => courtId !== undefined && courtId !== null)
    const chargeDescriptions: [string, string][] = Array.from(
      new Set(
        courtCaseDetails.appearances
          .flatMap(appearance => appearance.charges)
          .filter(charge => charge.legacyData?.offenceDescription)
          .map(charge => [charge.offenceCode, charge.legacyData.offenceDescription])
          .concat(consecutiveToSentenceDetailsToOffenceDescriptions(consecutiveToSentenceDetails.sentences)) as [
          string,
          string,
        ][],
      ),
    )
    const [offenceMap, courtMap] = await Promise.all([
      this.manageOffencesService.getOffenceMap(Array.from(new Set(chargeCodes)), req.user.username, chargeDescriptions),
      this.courtRegisterService.getCourtMap(Array.from(new Set(courtIds)), req.user.username),
    ])
    const allSentenceUuids = courtCaseDetails.appearances
      .flatMap(appearance => appearance.charges.map(charge => charge.sentence?.sentenceUuid))
      .filter(sentenceUuid => sentenceUuid)
    const consecutiveToSentenceDetailsMap = Object.fromEntries(
      consecutiveToSentenceDetails.sentences.map(consecutiveToDetails => {
        let consecutiveToDetailsEntry = {
          countNumber: consecutiveToDetails.countNumber,
          offenceCode: consecutiveToDetails.offenceCode,
          offenceDescription: offenceMap[consecutiveToDetails.offenceCode],
          courtCaseReference: consecutiveToDetails.courtCaseReference,
          courtName: courtMap[consecutiveToDetails.courtCode],
          warrantDate: dayjs(consecutiveToDetails.appearanceDate).format(config.dateFormat),
          offenceStartDate: dayjs(consecutiveToDetails.offenceStartDate).format(config.dateFormat),
          offenceEndDate:
            consecutiveToDetails.offenceEndDate && dayjs(consecutiveToDetails.offenceEndDate).format(config.dateFormat),
        } as ConsecutiveToDetails
        if (allSentenceUuids.includes(consecutiveToDetails.sentenceUuid)) {
          consecutiveToDetailsEntry = {
            countNumber: consecutiveToDetails.countNumber,
            offenceCode: consecutiveToDetails.offenceCode,
            offenceDescription: offenceMap[consecutiveToDetails.offenceCode],
            offenceStartDate: dayjs(consecutiveToDetails.offenceStartDate).format(config.dateFormat),
            offenceEndDate:
              consecutiveToDetails.offenceEndDate &&
              dayjs(consecutiveToDetails.offenceEndDate).format(config.dateFormat),
          }
        }
        return [consecutiveToDetails.sentenceUuid, consecutiveToDetailsEntry]
      }),
    )

    courtCaseDetails.appearances = courtCaseDetails.appearances.map(appearance => ({
      ...appearance,
      canDelete: appearance.charges.every(charge => !charge.sentence),
      mergedFromCases: this.offenceGetMergedFromText(
        appearance.charges.filter(offence => offence.mergedFromCase != null).map(offence => offence.mergedFromCase),
        courtMap,
      ),
      documentsWithUiType: Array.isArray(appearance.documents)
        ? appearance.documents.map(document => ({
            ...document,
            documentType: getUiDocumentType(document.documentType, appearance.warrantType),
          }))
        : [],
    }))
    const successMessage = req.flash('success')[0]
    const auditDetails = this.getCourtCaseAuditUuids(courtCaseDetails, consecutiveToSentenceDetails)
    await this.auditService.logPageView(Page.COURT_CASE, {
      who: res.locals.user.username,
      correlationId: req.id,
      subjectType: 'PRISONER_ID',
      subjectId: nomsId,
      details: auditDetails,
    })
    return res.render('pages/courtCaseDetails', {
      nomsId,
      courtCaseReference,
      addOrEditCourtCase,
      courtCaseDetails: new CourtCaseDetailsModel(courtCaseDetails, courtMap),
      offenceMap,
      courtMap,
      consecutiveToSentenceDetailsMap,
      backLink: JourneyUrls.courtCases(nomsId),
      successMessage,
      viewOnlyEnabled: config.featureToggles.viewOnlyEnabled,
    })
  }

  private getCourtCaseAuditUuids(
    courtCase: PageCourtCaseContent,
    consecutiveToSentenceDetails: SentenceConsecutiveToDetailsResponse,
  ): {
    courtCaseUuids: string[]
    courtAppearanceUuids: string[]
    chargeUuids: string[]
    sentenceUuids: string[]
    periodLengthUuids: string[]
  } {
    const courtCaseUuids = [courtCase.courtCaseUuid]
    const courtAppearanceUuids = courtCase.appearances.map(appearance => appearance.appearanceUuid)
    const chargeUuids = Array.from(
      new Set(courtCase.appearances.flatMap(appearance => appearance.charges).map(charge => charge.chargeUuid)),
    )
    const sentenceUuids = Array.from(
      new Set(
        courtCase.appearances
          .flatMap(appearance => appearance.charges)
          .map(charge => charge.sentence?.sentenceUuid)
          .concat(
            consecutiveToSentenceDetails.sentences
              .map(sentence => sentence.sentenceUuid)
              .filter(sentenceUuid => sentenceUuid),
          ),
      ),
    )
    const periodLengthUuids = Array.from(
      new Set(
        courtCase.appearances
          .flatMap(appearance =>
            appearance.charges
              .flatMap(charge => charge.sentence?.periodLengths)
              .map(periodLength => periodLength?.periodLengthUuid)
              .concat(appearance.overallSentenceLength?.periodLengthUuid),
          )
          .filter(periodLengthUuid => periodLengthUuid),
      ),
    )
    return { courtCaseUuids, courtAppearanceUuids, chargeUuids, sentenceUuids, periodLengthUuids }
  }

  private offenceGetMergedFromText(mergedFromCases: MergedFromCase[], courtMap: { [key: string]: string }): string[] {
    if (!mergedFromCases || mergedFromCases.length === 0) return []
    const parts = new Set<string>()
    for (const mergedFromCase of mergedFromCases) {
      const mergedFromDate = formatDate(mergedFromCase.mergedFromDate)
      if (mergedFromCase.caseReference) {
        parts.add(`Offences from ${mergedFromCase.caseReference} were merged with this appearance on ${mergedFromDate}`)
      } else {
        const courtName = courtMap[mergedFromCase.courtCode!]
        const latestAppearance = formatDate(mergedFromCase.warrantDate)
        parts.add(
          `Offences from the case at ${courtName} on ${latestAppearance} were merged with this appearance on ${mergedFromDate}`,
        )
      }
    }
    return Array.from(parts)
  }

  public getDeleteAppearanceConfirmation: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, appearanceReference, addOrEditCourtCase, addOrEditCourtAppearance } = req.params
    const { username } = res.locals.user
    const appearance = await this.remandAndSentencingService.getCourtAppearanceByAppearanceUuid(
      appearanceReference,
      username,
    )
    const courtDetails = await this.courtRegisterService.findCourtById(appearance.courtCode, req.user.username)
    const description = `${appearance.courtCaseReference ? appearance.courtCaseReference : 'Hearing'} at ${courtDetails.courtName} on ${dayjs(appearance.appearanceDate).format(config.dateFormat)}. All the information for this hearing will be lost.`
    const courtCaseDetails = await this.remandAndSentencingService.getCourtCaseDetails(courtCaseReference, username)
    const lastAppearance = courtCaseDetails.appearances.length === 1
    const backLink = `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/details`
    return res.render('pages/courtAppearance/delete-appearance', {
      nomsId,
      courtCaseReference,
      appearanceReference,
      addOrEditCourtCase,
      addOrEditCourtAppearance,
      appearance,
      description,
      courtDetails,
      lastAppearance,
      backLink,
      errors: req.flash('errors') || [],
    })
  }

  public submitDeleteAppearanceConfirmation: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, appearanceReference, addOrEditCourtCase } = req.params
    const { username } = res.locals.user as PrisonUser
    const deleteHearingForm = trimForm<DeleteHearingForm>(req.body)
    const courtCaseDetails = await this.remandAndSentencingService.getCourtCaseDetails(courtCaseReference, username)
    const appearance = await this.remandAndSentencingService.getCourtAppearanceByAppearanceUuid(
      appearanceReference,
      username,
    )
    const courtDetails = await this.courtRegisterService.findCourtById(appearance.courtCode, username)
    const deletedCourtCaseCourtName = courtDetails?.courtName ?? 'Unknown court'
    const formattedDate = dayjs(appearance.appearanceDate).format(config.dateFormat)

    const errors = await this.remandAndSentencingService.deleteCourtAppearance(
      appearanceReference,
      username,
      deleteHearingForm,
    )

    if (errors.length > 0) {
      req.flash('errors', errors)
      return res.redirect(
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${appearanceReference}/confirm-delete?hasErrors=true`,
      )
    }
    const lastAppearance = courtCaseDetails.appearances.length === 0
    const caseReference = courtCaseDetails.latestAppearance?.courtCaseReference ?? ''

    if (deleteHearingForm.deleteHearing === 'false') {
      return res.redirect(`/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/details`)
    }
    const successMessage = lastAppearance
      ? `Court case ${caseReference ? `${caseReference} ` : ''}at ${deletedCourtCaseCourtName} on ${formattedDate}`
      : `Hearing at ${deletedCourtCaseCourtName} on ${formattedDate}`

    req.flash('success', successMessage)
    if (lastAppearance) {
      return res.redirect(JourneyUrls.courtCases(nomsId))
    }
    return res.redirect(`/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/details`)
  }

  public getCancelCourtCase: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, appearanceReference, addOrEditCourtCase, addOrEditCourtAppearance } = req.params
    const { returnUrl, isHearing } = req.query
    const courtCode = this.courtAppearanceService.getCourtCode(req.session, nomsId, appearanceReference)
    const warrantDate = this.courtAppearanceService.getWarrantDate(req.session, nomsId, appearanceReference)
    const courtDetails =
      courtCode !== undefined ? await this.courtRegisterService.findCourtById(courtCode, req.user.username) : null
    const description = `You have not finished ${addOrEditCourtAppearance === 'add-court-appearance' ? 'adding' : 'editing'} the information${courtCode && warrantDate !== undefined ? ` for the court case at ${courtDetails.courtName} on ${dayjs(warrantDate).format(config.dateFormat)}.` : '.'} Any information you have entered will be lost.`
    const backLink = (returnUrl as string) || `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/details`
    const header = `Are you sure you want to cancel ${addOrEditCourtAppearance === 'add-court-appearance' ? 'adding a' : 'editing the'} court case?`
    const positiveRadioText = `Yes, cancel ${addOrEditCourtAppearance === 'add-court-appearance' ? 'adding a' : 'editing the'} court case`
    return res.render('pages/courtAppearance/cancel-court-case', {
      nomsId,
      courtCaseReference,
      appearanceReference,
      addOrEditCourtCase,
      addOrEditCourtAppearance,
      description,
      courtDetails,
      backLink,
      isHearing,
      header,
      positiveRadioText,
      errors: req.flash('errors') || [],
    })
  }

  public submitCancelCourtCase: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, appearanceReference, addOrEditCourtCase, addOrEditCourtAppearance } = req.params
    const cancelCourtCaseForm = trimForm<CancelCourtCaseForm>(req.body)
    const { returnUrl, isHearing } = req.query

    const errors = await this.remandAndSentencingService.cancelCourtCase(cancelCourtCaseForm)

    if (errors.length > 0) {
      req.flash('errors', errors)
      const errorUrl = `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/confirm-cancel-court-case?hasErrors=true&isHearing=${isHearing}&returnUrl=${returnUrl}`
      return res.redirect(errorUrl)
    }

    if (cancelCourtCaseForm.cancelCourtCase === 'false') {
      return res.redirect(<string>returnUrl || `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/details`)
    }

    return res.redirect(JourneyUrls.courtCases(nomsId))
  }

  public getAppearanceUpdatedConfirmation: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, addOrEditCourtCase } = req.params
    const { username } = res.locals.user
    const latestAppearance = await this.remandAndSentencingService.getLatestCourtAppearanceByCourtCaseUuid(
      username,
      courtCaseReference,
    )
    const courtDetails = await this.courtRegisterService.findCourtById(latestAppearance.courtCode, username)
    return res.render('pages/appearanceUpdatedConfirmation', {
      nomsId,
      courtCaseReference,
      addOrEditCourtCase,
      latestAppearance,
      courtDetails,
    })
  }

  public getReference: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, appearanceReference, addOrEditCourtCase, addOrEditCourtAppearance } = req.params
    const { submitToCheckAnswers } = req.query
    const warrantType = this.courtAppearanceService.getWarrantType(req.session, nomsId, appearanceReference)
    let courtCaseReferenceForm = (req.flash('courtCaseReferenceForm')[0] || {}) as CourtCaseReferenceForm
    const { caseReferenceNumber, referenceNumberSelect, noCaseReference } =
      this.courtAppearanceService.getSessionCourtAppearance(req.session, nomsId, appearanceReference)
    if (Object.keys(courtCaseReferenceForm).length === 0) {
      courtCaseReferenceForm = {
        referenceNumber: caseReferenceNumber,
        noCaseReference,
      }
    }
    let backLink = JourneyUrls.taskList(
      nomsId,
      addOrEditCourtCase,
      courtCaseReference,
      addOrEditCourtAppearance,
      appearanceReference,
    )
    if (this.isEditJourney(addOrEditCourtCase, addOrEditCourtAppearance)) {
      if (warrantType === 'SENTENCING') {
        backLink = JourneyUrls.sentencingHearing(
          nomsId,
          addOrEditCourtCase,
          courtCaseReference,
          addOrEditCourtAppearance,
          appearanceReference,
        )
      } else {
        backLink = JourneyUrls.nonSentencingHearing(
          nomsId,
          addOrEditCourtCase,
          courtCaseReference,
          addOrEditCourtAppearance,
          appearanceReference,
        )
      }
    } else if (submitToCheckAnswers) {
      backLink = JourneyUrls.checkAppearanceAnswers(
        nomsId,
        addOrEditCourtCase,
        courtCaseReference,
        addOrEditCourtAppearance,
        appearanceReference,
      )
    } else if (
      this.isRepeatJourney(addOrEditCourtCase, addOrEditCourtAppearance) &&
      referenceNumberSelect !== undefined
    ) {
      backLink = JourneyUrls.selectReference(
        nomsId,
        addOrEditCourtCase,
        courtCaseReference,
        addOrEditCourtAppearance,
        appearanceReference,
      )
    }

    return res.render('pages/courtAppearance/reference', {
      nomsId,
      submitToCheckAnswers,
      courtCaseReferenceForm,
      courtCaseReference,
      appearanceReference,
      errors: req.flash('errors') || [],
      addOrEditCourtCase,
      addOrEditCourtAppearance,
      backLink,
      showHearingDetails: this.isEditJourney(addOrEditCourtCase, addOrEditCourtAppearance),
    })
  }

  public submitReference: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, appearanceReference, addOrEditCourtCase, addOrEditCourtAppearance } = req.params
    const courtCaseReferenceForm = trimForm<CourtCaseReferenceForm>(req.body)
    const errors = this.courtAppearanceService.setCaseReferenceNumber(
      req.session,
      nomsId,
      courtCaseReferenceForm,
      appearanceReference,
    )
    const warrantType = this.courtAppearanceService.getWarrantType(req.session, nomsId, appearanceReference)
    if (errors.length > 0) {
      req.flash('errors', errors)
      req.flash('courtCaseReferenceForm', { ...courtCaseReferenceForm })
      return res.redirect(
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/reference?hasErrors=true`,
      )
    }
    if (addOrEditCourtAppearance === 'edit-court-appearance') {
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
    const { submitToCheckAnswers } = req.query
    if (submitToCheckAnswers) {
      return res.redirect(
        JourneyUrls.checkAppearanceAnswers(
          nomsId,
          addOrEditCourtCase,
          courtCaseReference,
          addOrEditCourtAppearance,
          appearanceReference,
        ),
      )
    }
    return res.redirect(
      `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/warrant-date`,
    )
  }

  public getSelectReference: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, appearanceReference, addOrEditCourtCase, addOrEditCourtAppearance } = req.params
    const { submitToCheckAnswers } = req.query
    const latestCourtAppearance = await this.remandAndSentencingService.getLatestCourtAppearanceByCourtCaseUuid(
      req.user.username,
      courtCaseReference,
    )
    let referenceForm = (req.flash('referenceForm')[0] || {}) as CourtCaseSelectReferenceForm
    if (Object.keys(referenceForm).length === 0) {
      referenceForm = {
        referenceNumberSelect: this.courtAppearanceService.getSessionCourtAppearance(
          req.session,
          nomsId,
          appearanceReference,
        ).referenceNumberSelect,
      }
    }
    return res.render('pages/courtAppearance/select-reference', {
      nomsId,
      submitToCheckAnswers,
      lastCaseReferenceNumber: latestCourtAppearance.courtCaseReference,
      courtCaseReference,
      appearanceReference,
      addOrEditCourtCase,
      addOrEditCourtAppearance,
      referenceForm,
      errors: req.flash('errors') || [],
      backLink: submitToCheckAnswers
        ? JourneyUrls.checkAppearanceAnswers(
            nomsId,
            addOrEditCourtCase,
            courtCaseReference,
            addOrEditCourtAppearance,
            appearanceReference,
          )
        : JourneyUrls.taskList(
            nomsId,
            addOrEditCourtCase,
            courtCaseReference,
            addOrEditCourtAppearance,
            appearanceReference,
          ),
    })
  }

  public submitSelectReference: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, appearanceReference, addOrEditCourtCase, addOrEditCourtAppearance } = req.params
    const { submitToCheckAnswers } = req.query
    const submitToCheckAnswersQuery = submitToCheckAnswers ? `?submitToCheckAnswers=${submitToCheckAnswers}` : ''
    const referenceForm = trimForm<CourtCaseSelectReferenceForm>(req.body)
    const errors = await this.courtAppearanceService.setCaseReferenceFromSelectCaseReference(
      req.session,
      nomsId,
      courtCaseReference,
      req.user.username,
      referenceForm,
      appearanceReference,
    )

    if (errors.length > 0) {
      req.flash('errors', errors)
      req.flash('referenceForm', { ...referenceForm })
      return res.redirect(
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/select-reference${submitToCheckAnswersQuery.length > 0 ? `${submitToCheckAnswersQuery}&hasErrors=true` : '?hasErrors=true'}`,
      )
    }
    if (referenceForm.referenceNumberSelect === 'true') {
      if (submitToCheckAnswers) {
        return res.redirect(
          JourneyUrls.checkAppearanceAnswers(
            nomsId,
            addOrEditCourtCase,
            courtCaseReference,
            addOrEditCourtAppearance,
            appearanceReference,
          ),
        )
      }
      return res.redirect(
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/warrant-date`,
      )
    }

    return res.redirect(
      `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/reference${submitToCheckAnswersQuery}`,
    )
  }

  public getWarrantDate: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, appearanceReference, addOrEditCourtCase, addOrEditCourtAppearance } = req.params
    const { submitToCheckAnswers } = req.query
    const warrantDateForm = (req.flash('warrantDateForm')[0] || {}) as CourtCaseWarrantDateForm
    const warrantType = this.courtAppearanceService.getWarrantType(req.session, nomsId, appearanceReference)
    let warrantDateDay: number | string = warrantDateForm['warrantDate-day']
    let warrantDateMonth: number | string = warrantDateForm['warrantDate-month']
    let warrantDateYear: number | string = warrantDateForm['warrantDate-year']
    const warrantDateValue = this.courtAppearanceService.getWarrantDate(req.session, nomsId, appearanceReference)
    if (warrantDateValue && Object.keys(warrantDateForm).length === 0) {
      const warrantDate = new Date(warrantDateValue)
      warrantDateDay = warrantDate.getDate()
      warrantDateMonth = warrantDate.getMonth() + 1
      warrantDateYear = warrantDate.getFullYear()
    }

    let backLink = JourneyUrls.reference(
      nomsId,
      addOrEditCourtCase,
      courtCaseReference,
      addOrEditCourtAppearance,
      appearanceReference,
    )
    if (addOrEditCourtAppearance === 'edit-court-appearance') {
      if (warrantType === 'SENTENCING') {
        backLink = JourneyUrls.sentencingHearing(
          nomsId,
          addOrEditCourtCase,
          courtCaseReference,
          addOrEditCourtAppearance,
          appearanceReference,
        )
      } else {
        backLink = JourneyUrls.nonSentencingHearing(
          nomsId,
          addOrEditCourtCase,
          courtCaseReference,
          addOrEditCourtAppearance,
          appearanceReference,
        )
      }
    } else if (submitToCheckAnswers) {
      backLink = JourneyUrls.checkAppearanceAnswers(
        nomsId,
        addOrEditCourtCase,
        courtCaseReference,
        addOrEditCourtAppearance,
        appearanceReference,
      )
    }

    return res.render('pages/courtAppearance/warrant-date', {
      nomsId,
      submitToCheckAnswers,
      warrantDateDay,
      warrantDateMonth,
      warrantDateYear,
      courtCaseReference,
      appearanceReference,
      addOrEditCourtCase,
      addOrEditCourtAppearance,
      errors: req.flash('errors') || [],
      backLink,
      showHearingDetails: this.isEditJourney(addOrEditCourtCase, addOrEditCourtAppearance),
    })
  }

  public submitWarrantDate: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, appearanceReference, addOrEditCourtCase, addOrEditCourtAppearance } = req.params
    const warrantDateForm = trimForm<CourtCaseWarrantDateForm>(req.body)
    const warrantType = this.courtAppearanceService.getWarrantType(req.session, nomsId, appearanceReference)
    const { username } = res.locals.user
    const { warrantOrHearing } = res.locals
    const { submitToCheckAnswers } = req.query
    const submitToCheckAnswersQuery = submitToCheckAnswers ? `&submitToCheckAnswers=${submitToCheckAnswers}` : ''
    const errors = await this.courtAppearanceService.setWarrantDate(
      req.session,
      nomsId,
      warrantDateForm,
      courtCaseReference,
      appearanceReference,
      addOrEditCourtCase,
      username,
      warrantOrHearing,
    )
    if (errors.length > 0) {
      req.flash('errors', errors)
      req.flash('warrantDateForm', { ...warrantDateForm })
      return res.redirect(
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/warrant-date?hasErrors=true${submitToCheckAnswersQuery}`,
      )
    }
    if (addOrEditCourtAppearance === 'edit-court-appearance') {
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
    if (submitToCheckAnswers) {
      return res.redirect(
        JourneyUrls.checkAppearanceAnswers(
          nomsId,
          addOrEditCourtCase,
          courtCaseReference,
          addOrEditCourtAppearance,
          appearanceReference,
        ),
      )
    }
    if (addOrEditCourtCase === 'edit-court-case') {
      try {
        const latestCourtAppearance = await this.remandAndSentencingService.getLatestCourtAppearanceByCourtCaseUuid(
          req.user.username,
          courtCaseReference,
        )
        if (latestCourtAppearance) {
          return res.redirect(
            JourneyUrls.selectCourtName(
              nomsId,
              addOrEditCourtCase,
              courtCaseReference,
              addOrEditCourtAppearance,
              appearanceReference,
            ),
          )
        }
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (e) {
        logger.info(`no latest appearance for ${courtCaseReference}`)
      }
    }
    return res.redirect(
      JourneyUrls.courtName(
        nomsId,
        addOrEditCourtCase,
        courtCaseReference,
        addOrEditCourtAppearance,
        appearanceReference,
      ),
    )
  }

  public getSelectCourtName: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, appearanceReference, addOrEditCourtCase, addOrEditCourtAppearance } = req.params
    const { submitToCheckAnswers } = req.query
    const latestCourtAppearance = await this.remandAndSentencingService.getLatestCourtAppearanceByCourtCaseUuid(
      req.user.username,
      courtCaseReference,
    )
    const sessionAppearance = this.courtAppearanceService.getSessionCourtAppearance(
      req.session,
      nomsId,
      appearanceReference,
    )
    let { courtCode } = latestCourtAppearance
    let nextCourtAppearanceUsed = false
    if (latestCourtAppearance.nextCourtAppearance?.appearanceDate) {
      const nextAppearanceDate = dayjs(latestCourtAppearance.nextCourtAppearance.appearanceDate)
      const currentWarrantDate = dayjs(sessionAppearance.warrantDate)
      if (nextAppearanceDate.isSame(currentWarrantDate)) {
        courtCode = latestCourtAppearance.nextCourtAppearance.courtCode
        nextCourtAppearanceUsed = true
      }
    }
    let selectCourtNameForm = (req.flash('selectCourtNameForm')[0] || {}) as CourtCaseSelectCourtNameForm
    if (Object.keys(selectCourtNameForm).length === 0) {
      const court = this.courtAppearanceService.getCourtCode(req.session, nomsId, appearanceReference)
      if (court) {
        selectCourtNameForm = {
          courtNameSelect: court === courtCode ? 'true' : 'false',
          previousCourtCode: courtCode,
        }
      }
    }

    const lastCourtName = (await this.courtRegisterService.findCourtById(courtCode, req.user.username)).courtName
    return res.render('pages/courtAppearance/select-court-name', {
      nomsId,
      submitToCheckAnswers,
      lastCourtName,
      courtCaseReference,
      appearanceReference,
      addOrEditCourtCase,
      addOrEditCourtAppearance,
      errors: req.flash('errors') || [],
      selectCourtNameForm,
      previousCourtCode: courtCode,
      nextCourtAppearanceUsed,
      backLink: submitToCheckAnswers
        ? JourneyUrls.checkAppearanceAnswers(
            nomsId,
            addOrEditCourtCase,
            courtCaseReference,
            addOrEditCourtAppearance,
            appearanceReference,
          )
        : `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/warrant-date`,
    })
  }

  public submitSelectCourtName: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, appearanceReference, addOrEditCourtCase, addOrEditCourtAppearance } = req.params
    const selectCourtNameForm = trimForm<CourtCaseSelectCourtNameForm>(req.body)
    const errors = this.courtAppearanceService.setCourtNameFromSelect(
      req.session,
      nomsId,
      selectCourtNameForm,
      appearanceReference,
    )

    if (errors.length > 0) {
      req.flash('errors', errors)
      req.flash('selectCourtNameForm', { ...selectCourtNameForm })
      return res.redirect(
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/select-court-name?hasErrors=true`,
      )
    }
    if (selectCourtNameForm.courtNameSelect === 'true') {
      return res.redirect(
        JourneyUrls.checkAppearanceAnswers(
          nomsId,
          addOrEditCourtCase,
          courtCaseReference,
          addOrEditCourtAppearance,
          appearanceReference,
        ),
      )
    }
    const { submitToCheckAnswers } = req.query
    const submitToCheckAnswersQuery = submitToCheckAnswers ? `?submitToCheckAnswers=${submitToCheckAnswers}` : ''
    return res.redirect(
      `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/court-name${submitToCheckAnswersQuery}`,
    )
  }

  public getCourtName: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, appearanceReference, addOrEditCourtCase, addOrEditCourtAppearance } = req.params
    const { submitToCheckAnswers } = req.query
    const warrantType = this.courtAppearanceService.getWarrantType(req.session, nomsId, appearanceReference)
    let courtNameForm = (req.flash('courtNameForm')[0] || {}) as CourtCaseCourtNameForm
    if (Object.keys(courtNameForm).length === 0) {
      courtNameForm = {
        courtCode: this.courtAppearanceService.getCourtCode(req.session, nomsId, appearanceReference),
      }
    }
    if (courtNameForm.courtCode && courtNameForm.courtName === undefined) {
      try {
        const court = await this.courtRegisterService.findCourtById(courtNameForm.courtCode, req.user.username)
        courtNameForm.courtName = court.courtName
      } catch (e) {
        logger.error(e)
      }
    }
    let backLink = `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/warrant-date`

    if (addOrEditCourtAppearance === 'edit-court-appearance') {
      if (warrantType === 'SENTENCING') {
        backLink = JourneyUrls.sentencingHearing(
          nomsId,
          addOrEditCourtCase,
          courtCaseReference,
          addOrEditCourtAppearance,
          appearanceReference,
        )
      } else {
        backLink = JourneyUrls.nonSentencingHearing(
          nomsId,
          addOrEditCourtCase,
          courtCaseReference,
          addOrEditCourtAppearance,
          appearanceReference,
        )
      }
    } else if (submitToCheckAnswers) {
      backLink = JourneyUrls.checkAppearanceAnswers(
        nomsId,
        addOrEditCourtCase,
        courtCaseReference,
        addOrEditCourtAppearance,
        appearanceReference,
      )
    } else if (addOrEditCourtCase === 'edit-court-case') {
      const latestCourtAppearance = await this.remandAndSentencingService.getLatestCourtAppearanceByCourtCaseUuid(
        req.user.username,
        courtCaseReference,
      )
      if (latestCourtAppearance.nextCourtAppearance?.courtCode) {
        backLink = JourneyUrls.selectCourtName(
          nomsId,
          addOrEditCourtCase,
          courtCaseReference,
          addOrEditCourtAppearance,
          appearanceReference,
        )
      }
    }

    return res.render('pages/courtAppearance/court-name', {
      nomsId,
      submitToCheckAnswers,
      courtNameForm,
      courtCaseReference,
      appearanceReference,
      errors: req.flash('errors') || [],
      addOrEditCourtCase,
      addOrEditCourtAppearance,
      backLink,
      showHearingDetails: this.isEditJourney(addOrEditCourtCase, addOrEditCourtAppearance),
    })
  }

  public submitCourtName: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, appearanceReference, addOrEditCourtCase, addOrEditCourtAppearance } = req.params
    const warrantType = this.courtAppearanceService.getWarrantType(req.session, nomsId, appearanceReference)
    const courtNameForm = trimForm<CourtCaseCourtNameForm>(req.body)

    const errors = this.courtAppearanceService.setCourtName(req.session, nomsId, courtNameForm, appearanceReference)
    if (errors.length > 0) {
      req.flash('errors', errors)
      req.flash('courtNameForm', { ...courtNameForm })
      return res.redirect(
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/court-name?hasErrors=true`,
      )
    }
    if (addOrEditCourtAppearance === 'edit-court-appearance') {
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
    return res.redirect(
      JourneyUrls.checkAppearanceAnswers(
        nomsId,
        addOrEditCourtCase,
        courtCaseReference,
        addOrEditCourtAppearance,
        appearanceReference,
      ),
    )
  }

  public newJourney: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, appearanceReference, addOrEditCourtCase, addOrEditCourtAppearance } = req.params
    this.courtAppearanceService.clearSessionCourtAppearance(req.session, nomsId)
    this.offenceService.clearAllOffences(req.session, nomsId, courtCaseReference)
    let courtAppearanceUuid = appearanceReference
    if (!res.locals.isAddCourtCase) {
      const latestCourtAppearance = await this.remandAndSentencingService.getLatestCourtAppearanceByCourtCaseUuid(
        req.user.username,
        courtCaseReference,
      )
      if (latestCourtAppearance.nextCourtAppearance?.futureSkeletonAppearanceUuid) {
        courtAppearanceUuid = latestCourtAppearance.nextCourtAppearance?.futureSkeletonAppearanceUuid
      }
      latestCourtAppearance.charges
        .filter(charge => {
          const dispositionCode = charge.outcome?.dispositionCode ?? charge.legacyData?.outcomeDispositionCode
          return !dispositionCode || dispositionCode === 'INTERIM' || dispositionCode === 'I'
        })
        .sort((a, b) => {
          return sortByDateDesc(a.offenceStartDate, b.offenceStartDate)
        })
        .map(charge => chargeToOffence(charge))
        .forEach(offence =>
          this.courtAppearanceService.addOffence(req.session, nomsId, offence.chargeUuid, offence, courtAppearanceUuid),
        )
    }
    return res.redirect(
      JourneyUrls.receivedCustodialSentence(
        nomsId,
        addOrEditCourtCase,
        courtCaseReference,
        addOrEditCourtAppearance,
        courtAppearanceUuid,
      ),
    )
  }

  public getReceivedCustodialSentence: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, appearanceReference, addOrEditCourtCase, addOrEditCourtAppearance } = req.params

    let receivedCustodialSentenceForm = (req.flash('receivedCustodialSentenceForm')[0] ||
      {}) as ReceivedCustodialSentenceForm
    const warrantType = this.courtAppearanceService.getWarrantType(req.session, nomsId, appearanceReference)
    if (Object.keys(receivedCustodialSentenceForm).length === 0 && warrantType) {
      let receivedCustodialSentence = 'false'
      if (warrantType === 'SENTENCING') {
        receivedCustodialSentence = 'true'
      }
      receivedCustodialSentenceForm = {
        receivedCustodialSentence,
      }
    }
    const { prisoner } = res.locals
    const prisonerName = firstNameSpaceLastName({ firstName: prisoner.firstName, lastName: prisoner.lastName })
    return res.render('pages/courtAppearance/received-custodial-sentence', {
      nomsId,
      receivedCustodialSentenceForm,
      courtCaseReference,
      appearanceReference,
      errors: req.flash('errors') || [],
      addOrEditCourtCase,
      addOrEditCourtAppearance,
      prisonerName,
      backLink: JourneyUrls.courtCases(nomsId),
    })
  }

  public submitReceivedCustodialSentence: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, appearanceReference, addOrEditCourtCase, addOrEditCourtAppearance } = req.params
    const { prisoner } = res.locals
    const receivedCustodialSentenceForm = trimForm<ReceivedCustodialSentenceForm>(req.body)
    const prisonerName = firstNameSpaceLastName({ firstName: prisoner.firstName, lastName: prisoner.lastName })
    const errors = this.courtAppearanceService.setReceivedCustodialSentence(
      req.session,
      nomsId,
      appearanceReference,
      receivedCustodialSentenceForm,
      prisonerName,
    )
    if (errors.length > 0) {
      req.flash('errors', errors)
      req.flash('receivedCustodialSentenceForm', { ...receivedCustodialSentenceForm })
      return res.redirect(
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/received-custodial-sentence?hasErrors=true`,
      )
    }
    if (receivedCustodialSentenceForm.receivedCustodialSentence === 'false') {
      return res.redirect(
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/overall-case-outcome?backTo=receivedCustodialSentence`,
      )
    }
    return res.redirect(
      JourneyUrls.taskList(
        nomsId,
        addOrEditCourtCase,
        courtCaseReference,
        addOrEditCourtAppearance,
        appearanceReference,
      ),
    )
  }

  public getTaskList: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, appearanceReference, addOrEditCourtCase, addOrEditCourtAppearance } = req.params
    const warrantType = this.courtAppearanceService.getWarrantType(req.session, nomsId, appearanceReference)
    const courtAppearance = this.courtAppearanceService.getSessionCourtAppearance(
      req.session,
      nomsId,
      appearanceReference,
    )
    let caseReferenceSet = !!courtAppearance.caseReferenceNumber
    if (!res.locals.isAddCourtCase && !caseReferenceSet) {
      const latestCourtAppearance = await this.remandAndSentencingService.getLatestCourtAppearanceByCourtCaseUuid(
        req.user.username,
        courtCaseReference,
      )
      caseReferenceSet = !!latestCourtAppearance.courtCaseReference
    }
    let appearanceOutcome
    if (warrantType !== 'SENTENCING' && courtAppearance.appearanceOutcomeUuid) {
      appearanceOutcome = await this.refDataService.getAppearanceOutcomeByUuid(
        courtAppearance.appearanceOutcomeUuid,
        req.user.username,
      )
    }
    let model
    switch (courtAppearance.warrantType) {
      case 'SENTENCING':
        model = new SentencingTaskListModel(
          nomsId,
          addOrEditCourtCase,
          addOrEditCourtAppearance,
          courtCaseReference,
          appearanceReference,
          courtAppearance,
          caseReferenceSet,
        )
        break
      default:
        model = new NonSentencingTaskListModel(
          nomsId,
          addOrEditCourtCase,
          addOrEditCourtAppearance,
          courtCaseReference,
          appearanceReference,
          courtAppearance,
          caseReferenceSet,
          appearanceOutcome,
        )
    }
    return res.render('pages/courtAppearance/task-list', {
      nomsId,
      warrantType,
      courtCaseReference,
      appearanceReference,
      addOrEditCourtCase,
      addOrEditCourtAppearance,
      model,
    })
  }

  public submitTaskList: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, appearanceReference, addOrEditCourtCase, addOrEditCourtAppearance } = req.params
    const { username } = res.locals.user
    const { prisonId } = res.locals.prisoner
    const courtAppearance = this.courtAppearanceService.getSessionCourtAppearance(
      req.session,
      nomsId,
      appearanceReference,
    )
    if (addOrEditCourtCase === 'add-court-case') {
      const courtCase = { appearances: [courtAppearance] } as CourtCase
      const courtCaseResponse = await this.remandAndSentencingService.createCourtCase(
        nomsId,
        username,
        courtCase,
        prisonId,
        courtCaseReference,
      )
      const auditDetails = {
        courtCaseUuids: [courtCaseResponse.courtCaseUuid],
        courtAppearanceUuids: (courtCaseResponse.appearances || []).map(appearance => appearance.appearanceUuid),
        chargeUuids: (courtCaseResponse.charges || []).map(charge => charge.chargeUuid),
        sentenceUuids: (courtAppearance.offences ?? []).flatMap(offence =>
          offence.sentence?.sentenceUuid ? [offence.sentence.sentenceUuid] : [],
        ),

        periodLengthUuids: (courtAppearance.offences ?? [])
          .flatMap(offence => offence.sentence?.periodLengths?.map(periodLength => periodLength.uuid) ?? [])
          .concat(courtAppearance.overallSentenceLength?.uuid)
          .filter(uuid => uuid),
      }
      await this.auditService.logCreateCourtCase({
        who: username,
        subjectId: nomsId,
        subjectType: 'PRISONER_ID',
        correlationId: req.id,
        details: auditDetails,
      })
    } else {
      await this.remandAndSentencingService.createCourtAppearance(
        username,
        courtCaseReference,
        appearanceReference,
        courtAppearance,
        prisonId,
      )
    }
    this.courtAppearanceService.clearSessionCourtAppearance(req.session, nomsId)
    if (courtAppearance.warrantType === 'SENTENCING') {
      return res.redirect(
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/sentencing/confirmation`,
      )
    }
    return res.redirect(
      `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/confirmation`,
    )
  }

  public getOverallCaseOutcome: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, appearanceReference, addOrEditCourtCase, addOrEditCourtAppearance } = req.params
    const { backTo, submitToCheckAnswers } = req.query as { backTo: string; submitToCheckAnswers: string }
    const backLink = buildReturnUrlFromKey(
      backTo,
      nomsId,
      addOrEditCourtCase,
      courtCaseReference,
      addOrEditCourtAppearance,
      appearanceReference,
      '',
    )

    let overallCaseOutcomeForm = (req.flash('overallCaseOutcomeForm')[0] || {}) as CourtCaseOverallCaseOutcomeForm
    const courtAppearance = this.courtAppearanceService.getSessionCourtAppearance(
      req.session,
      nomsId,
      appearanceReference,
    )
    if (Object.keys(overallCaseOutcomeForm).length === 0) {
      overallCaseOutcomeForm = {
        overallCaseOutcome: `${courtAppearance.appearanceOutcomeUuid}|${courtAppearance.relatedOffenceOutcomeUuid}`,
      }
    }
    const { appearanceOutcomeUuid } = courtAppearance
    const caseOutcomes = await this.refDataService.getAllAppearanceOutcomes(req.user.username)
    const [subListOutcomes, mainOutcomes] = caseOutcomes
      .filter(caseOutcome =>
        ['REMAND', 'NON_CUSTODIAL'].some(expectedOutcomeType => expectedOutcomeType === caseOutcome.outcomeType),
      )
      .sort((a, b) => a.displayOrder - b.displayOrder)
      .reduce(
        ([subList, mainList], caseOutcome) => {
          return caseOutcome.isSubList ? [[...subList, caseOutcome], mainList] : [subList, [...mainList, caseOutcome]]
        },
        [[], []],
      )
    let legacyCaseOutcome
    if (
      appearanceOutcomeUuid &&
      !mainOutcomes
        .concat(subListOutcomes)
        .map(outcome => outcome.outcomeUuid)
        .includes(appearanceOutcomeUuid)
    ) {
      const outcome = await this.refDataService.getAppearanceOutcomeByUuid(appearanceOutcomeUuid, req.user.username)
      legacyCaseOutcome = outcome.outcomeName
    } else if (!appearanceOutcomeUuid && !res.locals.isAddCourtAppearance) {
      legacyCaseOutcome = outcomeValueOrLegacy(undefined, courtAppearance.legacyData)
    }

    return res.render('pages/courtAppearance/overall-case-outcome', {
      nomsId,
      overallCaseOutcomeForm,
      courtCaseReference,
      appearanceReference,
      addOrEditCourtCase,
      addOrEditCourtAppearance,
      errors: req.flash('errors') || [],
      backLink,
      mainOutcomes,
      subListOutcomes,
      legacyCaseOutcome,
      backTo,
      submitToCheckAnswers,
      showHearingDetails: this.isEditJourney(addOrEditCourtCase, addOrEditCourtAppearance),
    })
  }

  public submitOverallCaseOutcome: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, appearanceReference, addOrEditCourtCase, addOrEditCourtAppearance } = req.params
    const { backTo, submitToCheckAnswers } = req.query
    const overallCaseOutcomeForm = trimForm<CourtCaseOverallCaseOutcomeForm>(req.body)
    const errors = await this.courtAppearanceService.setAppearanceOutcomeUuid(
      req.session,
      nomsId,
      overallCaseOutcomeForm,
      appearanceReference,
      req.user.username,
    )
    if (errors.length > 0) {
      req.flash('errors', errors)
      req.flash('overallCaseOutcomeForm', { ...overallCaseOutcomeForm })
      return res.redirect(
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/overall-case-outcome?hasErrors=true&backTo=${backTo}`,
      )
    }
    if (addOrEditCourtAppearance === 'edit-court-appearance') {
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
    if (submitToCheckAnswers) {
      return res.redirect(
        JourneyUrls.checkAppearanceAnswers(
          nomsId,
          addOrEditCourtCase,
          courtCaseReference,
          addOrEditCourtAppearance,
          appearanceReference,
        ),
      )
    }
    return res.redirect(
      JourneyUrls.taskList(
        nomsId,
        addOrEditCourtCase,
        courtCaseReference,
        addOrEditCourtAppearance,
        appearanceReference,
      ),
    )
  }

  public getCaseOutcomeAppliedAll: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, appearanceReference, addOrEditCourtCase, addOrEditCourtAppearance } = req.params
    const { submitToCheckAnswers, backTo } = req.query as { submitToCheckAnswers: string; backTo: string }
    const appearanceOutcomeUuid = this.courtAppearanceService.getAppearanceOutcomeUuid(
      req.session,
      nomsId,
      appearanceReference,
    )
    const overallCaseOutcome = (
      await this.refDataService.getAppearanceOutcomeByUuid(appearanceOutcomeUuid, req.user.username)
    ).outcomeName

    let caseOutcomeAppliedAllForm = (req.flash('caseOutcomeAppliedAllForm')[0] ||
      {}) as CourtCaseCaseOutcomeAppliedAllForm
    if (Object.keys(caseOutcomeAppliedAllForm).length === 0) {
      caseOutcomeAppliedAllForm = {
        caseOutcomeAppliedAll: this.courtAppearanceService.getCaseOutcomeAppliedAll(
          req.session,
          nomsId,
          appearanceReference,
        ),
      }
    }
    const backLink = buildReturnUrlFromKey(
      backTo,
      nomsId,
      addOrEditCourtCase,
      courtCaseReference,
      addOrEditCourtAppearance,
      appearanceReference,
      '',
    )

    return res.render('pages/courtAppearance/case-outcome-applied-all', {
      nomsId,
      submitToCheckAnswers,
      overallCaseOutcome,
      caseOutcomeAppliedAllForm,
      courtCaseReference,
      appearanceReference,
      addOrEditCourtCase,
      addOrEditCourtAppearance,
      errors: req.flash('errors') || [],
      backLink,
      backTo,
    })
  }

  public submitCaseOutcomeAppliedAll: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, appearanceReference, addOrEditCourtCase, addOrEditCourtAppearance } = req.params
    const caseOutcomeAppliedAllForm = trimForm<CourtCaseCaseOutcomeAppliedAllForm>(req.body)
    const { submitToCheckAnswers, backTo } = req.query
    const errors = this.courtAppearanceService.setCaseOutcomeAppliedAll(
      req.session,
      nomsId,
      caseOutcomeAppliedAllForm,
      appearanceReference,
    )
    if (errors.length > 0) {
      req.flash('errors', errors)
      req.flash('caseOutcomeAppliedAllForm', { ...caseOutcomeAppliedAllForm })
      return res.redirect(
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/appearance/${appearanceReference}/case-outcome-applied-all?hasErrors=true&backTo=${backTo}${submitToCheckAnswers ? '&submitToCheckAnswers=true' : ''}`,
      )
    }
    return res.redirect(
      JourneyUrls.checkAppearanceAnswers(
        nomsId,
        addOrEditCourtCase,
        courtCaseReference,
        addOrEditCourtAppearance,
        appearanceReference,
      ),
    )
  }

  public getCheckAnswers: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, appearanceReference, addOrEditCourtCase, addOrEditCourtAppearance } = req.params
    const courtAppearance = this.courtAppearanceService.getSessionCourtAppearance(
      req.session,
      nomsId,
      appearanceReference,
    )

    let overallCaseOutcome = ''
    if (courtAppearance.warrantType !== 'SENTENCING') {
      overallCaseOutcome = (
        await this.refDataService.getAppearanceOutcomeByUuid(courtAppearance.appearanceOutcomeUuid, req.user.username)
      ).outcomeName
    }

    let courtName
    if (courtAppearance.courtCode) {
      try {
        const court = await this.courtRegisterService.findCourtById(courtAppearance.courtCode, req.user.username)
        courtName = court.courtName
      } catch (e) {
        logger.error(e)
        courtName = courtAppearance.courtCode
      }
    }

    return res.render('pages/courtAppearance/check-answers', {
      nomsId,
      courtAppearance: { ...courtAppearance, offences: orderOffences(courtAppearance.offences) },
      courtName,
      overallCaseOutcome,
      courtCaseReference,
      appearanceReference,
      addOrEditCourtCase,
      addOrEditCourtAppearance,
    })
  }

  public submitCheckAnswers: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, appearanceReference, addOrEditCourtCase, addOrEditCourtAppearance } = req.params
    this.courtAppearanceService.setAppearanceInformationAcceptedTrue(req.session, nomsId, appearanceReference)
    return res.redirect(
      JourneyUrls.taskList(
        nomsId,
        addOrEditCourtCase,
        courtCaseReference,
        addOrEditCourtAppearance,
        appearanceReference,
      ),
    )
  }

  public getNextAppearanceSelect: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, appearanceReference, addOrEditCourtCase, addOrEditCourtAppearance } = req.params
    const { submitToCheckAnswers } = req.query
    const warrantType = this.courtAppearanceService.getWarrantType(req.session, nomsId, appearanceReference)
    let nextAppearanceSelectForm = (req.flash('nextAppearanceSelectForm')[0] || {}) as CourtCaseNextAppearanceSelectForm
    if (Object.keys(nextAppearanceSelectForm).length === 0) {
      nextAppearanceSelectForm = {
        nextAppearanceSelect: this.courtAppearanceService
          .getNextAppearanceSelect(req.session, nomsId, appearanceReference)
          ?.toString(),
      }
    }
    let backLink = JourneyUrls.taskList(
      nomsId,
      addOrEditCourtCase,
      courtCaseReference,
      addOrEditCourtAppearance,
      appearanceReference,
    )
    if (addOrEditCourtAppearance === 'edit-court-appearance') {
      if (warrantType === 'SENTENCING') {
        backLink = JourneyUrls.sentencingHearing(
          nomsId,
          addOrEditCourtCase,
          courtCaseReference,
          addOrEditCourtAppearance,
          appearanceReference,
        )
      } else {
        backLink = JourneyUrls.nonSentencingHearing(
          nomsId,
          addOrEditCourtCase,
          courtCaseReference,
          addOrEditCourtAppearance,
          appearanceReference,
        )
      }
    } else if (submitToCheckAnswers) {
      backLink = JourneyUrls.checkNextAppearanceAnswers(
        nomsId,
        addOrEditCourtCase,
        courtCaseReference,
        addOrEditCourtAppearance,
        appearanceReference,
      )
    }

    return res.render('pages/courtAppearance/next-appearance-select', {
      nomsId,
      nextAppearanceSelectForm,
      courtCaseReference,
      appearanceReference,
      addOrEditCourtCase,
      addOrEditCourtAppearance,
      errors: req.flash('errors') || [],
      backLink,
    })
  }

  public submitNextAppearanceSelect: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, appearanceReference, addOrEditCourtCase, addOrEditCourtAppearance } = req.params
    const { submitToCheckAnswers } = req.query
    const warrantType = this.courtAppearanceService.getWarrantType(req.session, nomsId, appearanceReference)
    const nextAppearanceSelectForm = trimForm<CourtCaseNextAppearanceSelectForm>(req.body)
    const errors = this.courtAppearanceService.setNextAppearanceSelect(
      req.session,
      nomsId,
      nextAppearanceSelectForm,
      appearanceReference,
    )
    if (errors.length > 0) {
      req.flash('errors', errors)
      req.flash('nextAppearanceSelectForm', { ...nextAppearanceSelectForm })
      return res.redirect(
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/next-appearance-select?hasErrors=true${submitToCheckAnswers ? '&submitToCheckAnswers=true' : ''}`,
      )
    }
    if (this.courtAppearanceService.isNextCourtAppearanceAccepted(req.session, nomsId, appearanceReference)) {
      if (addOrEditCourtAppearance === 'edit-court-appearance') {
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
      return res.redirect(
        JourneyUrls.checkNextAppearanceAnswers(
          nomsId,
          addOrEditCourtCase,
          courtCaseReference,
          addOrEditCourtAppearance,
          appearanceReference,
        ),
      )
    }
    return res.redirect(
      `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/next-appearance-type`,
    )
  }

  public getNextAppearanceType: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, appearanceReference, addOrEditCourtCase, addOrEditCourtAppearance } = req.params
    const { submitToCheckAnswers } = req.query
    const warrantType = this.courtAppearanceService.getWarrantType(req.session, nomsId, appearanceReference)
    let nextAppearanceTypeForm = (req.flash('nextAppearanceTypeForm')[0] || {}) as CourtCaseNextAppearanceTypeForm
    const nextAppearanceTypeUuid = this.courtAppearanceService.getNextAppearanceTypeUuid(
      req.session,
      nomsId,
      appearanceReference,
    )
    if (Object.keys(nextAppearanceTypeForm).length === 0) {
      nextAppearanceTypeForm = {
        nextAppearanceType: nextAppearanceTypeUuid,
      }
    }
    let backLink = JourneyUrls.nextAppearanceSelect(
      nomsId,
      addOrEditCourtCase,
      courtCaseReference,
      addOrEditCourtAppearance,
      appearanceReference,
    )
    if (addOrEditCourtAppearance === 'edit-court-appearance') {
      if (warrantType === 'SENTENCING') {
        backLink = JourneyUrls.sentencingHearing(
          nomsId,
          addOrEditCourtCase,
          courtCaseReference,
          addOrEditCourtAppearance,
          appearanceReference,
        )
      } else {
        backLink = JourneyUrls.nonSentencingHearing(
          nomsId,
          addOrEditCourtCase,
          courtCaseReference,
          addOrEditCourtAppearance,
          appearanceReference,
        )
      }
    } else if (submitToCheckAnswers) {
      backLink = JourneyUrls.checkNextAppearanceAnswers(
        nomsId,
        addOrEditCourtCase,
        courtCaseReference,
        addOrEditCourtAppearance,
        appearanceReference,
      )
    }
    const appearanceTypes = (await this.refDataService.getAllAppearanceTypes(req.user.username)).sort(
      (first, second) => first.displayOrder - second.displayOrder,
    )
    let currentlySetTypeDescription
    if (
      nextAppearanceTypeUuid &&
      !appearanceTypes.map(type => type.appearanceTypeUuid).includes(nextAppearanceTypeUuid)
    ) {
      const currentlySetType = await this.refDataService.getAppearanceTypeByUuid(
        nextAppearanceTypeUuid,
        req.user.username,
      )
      currentlySetTypeDescription = currentlySetType.description
    }
    return res.render('pages/courtAppearance/next-appearance-type', {
      nomsId,
      nextAppearanceTypeForm,
      courtCaseReference,
      appearanceReference,
      appearanceTypes,
      submitToCheckAnswers,
      addOrEditCourtCase,
      addOrEditCourtAppearance,
      currentlySetTypeDescription,
      errors: req.flash('errors') || [],
      backLink,
    })
  }

  public submitNextAppearanceType: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, appearanceReference, addOrEditCourtCase, addOrEditCourtAppearance } = req.params
    const { submitToCheckAnswers } = req.query
    const warrantType = this.courtAppearanceService.getWarrantType(req.session, nomsId, appearanceReference)
    const nextAppearanceTypeForm = trimForm<CourtCaseNextAppearanceTypeForm>(req.body)
    const errors = this.courtAppearanceService.setNextAppearanceType(
      req.session,
      nomsId,
      nextAppearanceTypeForm,
      appearanceReference,
    )
    if (errors.length > 0) {
      req.flash('errors', errors)
      req.flash('nextAppearanceTypeForm', { ...nextAppearanceTypeForm })
      return res.redirect(
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/next-appearance-type?hasErrors=true${submitToCheckAnswers ? '&submitToCheckAnswers=true' : ''}`,
      )
    }
    if (
      addOrEditCourtAppearance === 'edit-court-appearance' &&
      this.courtAppearanceService.isNextCourtAppearanceAccepted(req.session, nomsId, appearanceReference)
    ) {
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

    if (submitToCheckAnswers) {
      return res.redirect(
        JourneyUrls.checkNextAppearanceAnswers(
          nomsId,
          addOrEditCourtCase,
          courtCaseReference,
          addOrEditCourtAppearance,
          appearanceReference,
        ),
      )
    }
    return res.redirect(
      `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/next-appearance-date`,
    )
  }

  public getNextAppearanceDate: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, appearanceReference, addOrEditCourtCase, addOrEditCourtAppearance } = req.params
    const { submitToCheckAnswers } = req.query
    const warrantType = this.courtAppearanceService.getWarrantType(req.session, nomsId, appearanceReference)
    const nextAppearanceDateForm = (req.flash('nextAppearanceDateForm')[0] || {}) as CourtCaseNextAppearanceDateForm
    const nextAppearanceDateValue = this.courtAppearanceService.getNextAppearanceDate(
      req.session,
      nomsId,
      appearanceReference,
    )
    let nextAppearanceDateDay: number | string = nextAppearanceDateForm['nextAppearanceDate-day']
    let nextAppearanceDateMonth: number | string = nextAppearanceDateForm['nextAppearanceDate-month']
    let nextAppearanceDateYear: number | string = nextAppearanceDateForm['nextAppearanceDate-year']
    let { nextAppearanceTime } = nextAppearanceDateForm
    if (nextAppearanceDateValue && Object.keys(nextAppearanceDateForm).length === 0) {
      const nextAppearanceDate = new Date(nextAppearanceDateValue)
      nextAppearanceDateDay = nextAppearanceDate.getDate()
      nextAppearanceDateMonth = nextAppearanceDate.getMonth() + 1
      nextAppearanceDateYear = nextAppearanceDate.getFullYear()
      nextAppearanceTime = this.courtAppearanceService.hasNextHearingTimeSet(req.session, nomsId, appearanceReference)
        ? dayjs(nextAppearanceDate).format('HH:mm')
        : ''
    }
    let backLink = `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/next-appearance-type`

    if (this.isEditJourney(addOrEditCourtCase, addOrEditCourtAppearance)) {
      if (warrantType === 'SENTENCING') {
        backLink = JourneyUrls.sentencingHearing(
          nomsId,
          addOrEditCourtCase,
          courtCaseReference,
          addOrEditCourtAppearance,
          appearanceReference,
        )
      } else {
        backLink = JourneyUrls.nonSentencingHearing(
          nomsId,
          addOrEditCourtCase,
          courtCaseReference,
          addOrEditCourtAppearance,
          appearanceReference,
        )
      }
    } else if (submitToCheckAnswers) {
      backLink = JourneyUrls.checkNextAppearanceAnswers(
        nomsId,
        addOrEditCourtCase,
        courtCaseReference,
        addOrEditCourtAppearance,
        appearanceReference,
      )
    }

    return res.render('pages/courtAppearance/next-appearance-date', {
      nomsId,
      nextAppearanceDateDay,
      nextAppearanceDateMonth,
      nextAppearanceDateYear,
      nextAppearanceTime,
      courtCaseReference,
      appearanceReference,
      submitToCheckAnswers,
      addOrEditCourtCase,
      addOrEditCourtAppearance,
      errors: req.flash('errors') || [],
      backLink,
    })
  }

  public submitNextAppearanceDate: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, appearanceReference, addOrEditCourtCase, addOrEditCourtAppearance } = req.params
    const { warrantType } = this.courtAppearanceService.getSessionCourtAppearance(
      req.session,
      nomsId,
      appearanceReference,
    )
    const nextAppearanceDateForm = trimForm<CourtCaseNextAppearanceDateForm>(req.body)
    const errors = this.courtAppearanceService.setNextAppearanceDate(
      req.session,
      nomsId,
      nextAppearanceDateForm,
      appearanceReference,
    )

    if (errors.length > 0) {
      req.flash('errors', errors)
      req.flash('nextAppearanceDateForm', { ...nextAppearanceDateForm })
      return res.redirect(
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/next-appearance-date?hasErrors=true`,
      )
    }
    if (
      addOrEditCourtAppearance === 'edit-court-appearance' &&
      this.courtAppearanceService.isNextCourtAppearanceAccepted(req.session, nomsId, appearanceReference)
    ) {
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
    const { submitToCheckAnswers } = req.query
    if (submitToCheckAnswers) {
      return res.redirect(
        JourneyUrls.checkNextAppearanceAnswers(
          nomsId,
          addOrEditCourtCase,
          courtCaseReference,
          addOrEditCourtAppearance,
          appearanceReference,
        ),
      )
    }
    return res.redirect(
      `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/next-appearance-court-select`,
    )
  }

  public getNextAppearanceCourtSelect: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, appearanceReference, addOrEditCourtCase, addOrEditCourtAppearance } = req.params
    const warrantType = this.courtAppearanceService.getWarrantType(req.session, nomsId, appearanceReference)
    const { submitToCheckAnswers } = req.query
    let nextAppearanceCourtSelectForm = (req.flash('nextAppearanceCourtSelectForm')[0] ||
      {}) as CourtCaseNextAppearanceCourtSelectForm
    if (Object.keys(nextAppearanceCourtSelectForm).length === 0) {
      nextAppearanceCourtSelectForm = {
        nextAppearanceCourtSelect: this.courtAppearanceService.getNextAppearanceCourtSelect(
          req.session,
          nomsId,
          appearanceReference,
        ),
      }
    }
    const courtCode = this.courtAppearanceService.getCourtCode(req.session, nomsId, appearanceReference)
    const court = await this.courtRegisterService.findCourtById(courtCode, res.locals.user.username)
    let backLink
    if (submitToCheckAnswers) {
      backLink = JourneyUrls.checkNextAppearanceAnswers(
        nomsId,
        addOrEditCourtCase,
        courtCaseReference,
        addOrEditCourtAppearance,
        appearanceReference,
      )
    } else if (res.locals.isAddCourtAppearance) {
      backLink = `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/next-appearance-date`
    } else if (addOrEditCourtAppearance === 'edit-court-appearance') {
      if (warrantType === 'SENTENCING') {
        backLink = JourneyUrls.sentencingHearing(
          nomsId,
          addOrEditCourtCase,
          courtCaseReference,
          addOrEditCourtAppearance,
          appearanceReference,
        )
      } else {
        backLink = JourneyUrls.nonSentencingHearing(
          nomsId,
          addOrEditCourtCase,
          courtCaseReference,
          addOrEditCourtAppearance,
          appearanceReference,
        )
      }
    }
    return res.render('pages/courtAppearance/next-appearance-court-select', {
      nomsId,
      nextAppearanceCourtSelectForm,
      courtName: court.courtName,
      courtCaseReference,
      appearanceReference,
      addOrEditCourtCase,
      addOrEditCourtAppearance,
      errors: req.flash('errors') || [],
      backLink,
    })
  }

  public submitNextAppearanceCourtSelect: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, appearanceReference, addOrEditCourtCase, addOrEditCourtAppearance } = req.params
    const { warrantType } = this.courtAppearanceService.getSessionCourtAppearance(
      req.session,
      nomsId,
      appearanceReference,
    )
    const nextAppearanceCourtSelectForm = trimForm<CourtCaseNextAppearanceCourtSelectForm>(req.body)
    const errors = this.courtAppearanceService.setNextAppearanceCourtSelect(
      req.session,
      nomsId,
      nextAppearanceCourtSelectForm,
      appearanceReference,
    )
    if (errors.length > 0) {
      req.flash('errors', errors)
      req.flash('nextAppearanceCourtSelectForm', { ...nextAppearanceCourtSelectForm })
      return res.redirect(
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/next-appearance-court-select?hasErrors=true`,
      )
    }
    if (nextAppearanceCourtSelectForm.nextAppearanceCourtSelect === 'true') {
      if (
        addOrEditCourtAppearance === 'edit-court-appearance' &&
        this.courtAppearanceService.isNextCourtAppearanceAccepted(req.session, nomsId, appearanceReference)
      ) {
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
      return res.redirect(
        JourneyUrls.checkNextAppearanceAnswers(
          nomsId,
          addOrEditCourtCase,
          courtCaseReference,
          addOrEditCourtAppearance,
          appearanceReference,
        ),
      )
    }
    return res.redirect(
      `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/next-appearance-court-name`,
    )
  }

  public getNextAppearanceCourtName: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, appearanceReference, addOrEditCourtCase, addOrEditCourtAppearance } = req.params
    const warrantType = this.courtAppearanceService.getWarrantType(req.session, nomsId, appearanceReference)
    const { submitToCheckAnswers } = req.query
    let nextAppearanceCourtNameForm = (req.flash('nextAppearanceCourtNameForm')[0] ||
      {}) as CourtCaseNextAppearanceCourtNameForm
    if (Object.keys(nextAppearanceCourtNameForm).length === 0) {
      nextAppearanceCourtNameForm = {
        courtCode: this.courtAppearanceService.getNextAppearanceCourtCode(req.session, nomsId, appearanceReference),
      }
    }
    if (nextAppearanceCourtNameForm.courtCode && nextAppearanceCourtNameForm.nextAppearanceCourtName === undefined) {
      try {
        const court = await this.courtRegisterService.findCourtById(
          nextAppearanceCourtNameForm.courtCode,
          req.user.username,
        )
        nextAppearanceCourtNameForm.nextAppearanceCourtName = court.courtName
      } catch (e) {
        logger.error(e)
      }
    }

    let backLink = `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/next-appearance-court-select`

    if (addOrEditCourtAppearance === 'edit-court-appearance') {
      if (warrantType === 'SENTENCING') {
        backLink = JourneyUrls.sentencingHearing(
          nomsId,
          addOrEditCourtCase,
          courtCaseReference,
          addOrEditCourtAppearance,
          appearanceReference,
        )
      } else {
        backLink = JourneyUrls.nonSentencingHearing(
          nomsId,
          addOrEditCourtCase,
          courtCaseReference,
          addOrEditCourtAppearance,
          appearanceReference,
        )
      }
    } else if (submitToCheckAnswers) {
      backLink = JourneyUrls.checkNextAppearanceAnswers(
        nomsId,
        addOrEditCourtCase,
        courtCaseReference,
        addOrEditCourtAppearance,
        appearanceReference,
      )
    }

    return res.render('pages/courtAppearance/next-appearance-court-name', {
      nomsId,
      submitToCheckAnswers,
      nextAppearanceCourtNameForm,
      courtCaseReference,
      appearanceReference,
      errors: req.flash('errors') || [],
      addOrEditCourtCase,
      addOrEditCourtAppearance,
      backLink,
    })
  }

  public submitNextAppearanceCourtName: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, appearanceReference, addOrEditCourtCase, addOrEditCourtAppearance } = req.params
    const warrantType = this.courtAppearanceService.getWarrantType(req.session, nomsId, appearanceReference)
    const nextAppearanceCourtNameForm = trimForm<CourtCaseNextAppearanceCourtNameForm>(req.body)
    const errors = this.courtAppearanceService.setNextAppearanceCourtName(
      req.session,
      nomsId,
      nextAppearanceCourtNameForm,
      appearanceReference,
    )
    if (errors.length > 0) {
      req.flash('errors', errors)
      req.flash('nextAppearanceCourtNameForm', { ...nextAppearanceCourtNameForm })
      return res.redirect(
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/next-appearance-court-name?hasErrors=true`,
      )
    }
    if (
      addOrEditCourtAppearance === 'edit-court-appearance' &&
      this.courtAppearanceService.isNextCourtAppearanceAccepted(req.session, nomsId, appearanceReference)
    ) {
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
    return res.redirect(
      JourneyUrls.checkNextAppearanceAnswers(
        nomsId,
        addOrEditCourtCase,
        courtCaseReference,
        addOrEditCourtAppearance,
        appearanceReference,
      ),
    )
  }

  public getChecknextAppearanceAnswers: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, appearanceReference, addOrEditCourtCase, addOrEditCourtAppearance } = req.params
    const courtAppearance = this.courtAppearanceService.getSessionCourtAppearance(
      req.session,
      nomsId,
      appearanceReference,
    )
    let nextAppearanceCourtName
    let nextAppearanceType
    if (courtAppearance.nextAppearanceSelect) {
      const [court, appearanceType] = await Promise.all([
        this.courtRegisterService.findCourtById(courtAppearance.nextAppearanceCourtCode, req.user.username),
        this.refDataService.getAppearanceTypeByUuid(courtAppearance.nextAppearanceTypeUuid, req.user.username),
      ])
      nextAppearanceCourtName = court.courtName
      nextAppearanceType = appearanceType.description
    }
    return res.render('pages/courtAppearance/check-next-appearance-answers', {
      nomsId,
      courtAppearance,
      nextAppearanceCourtName,
      nextAppearanceType,
      courtCaseReference,
      appearanceReference,
      addOrEditCourtCase,
      addOrEditCourtAppearance,
    })
  }

  public submitChecknextAppearanceAnswers: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, appearanceReference, addOrEditCourtCase, addOrEditCourtAppearance } = req.params
    const warrantType = this.courtAppearanceService.getWarrantType(req.session, nomsId, appearanceReference)
    this.courtAppearanceService.setNextCourtAppearanceAcceptedTrue(req.session, nomsId, appearanceReference)
    if (addOrEditCourtAppearance === 'edit-court-appearance') {
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
    return res.redirect(
      JourneyUrls.taskList(
        nomsId,
        addOrEditCourtCase,
        courtCaseReference,
        addOrEditCourtAppearance,
        appearanceReference,
      ),
    )
  }

  public getConfirmationPage: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId } = req.params

    return res.render('pages/courtAppearance/confirmation', {
      nomsId,
    })
  }

  public getCourtDocumentsPage: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, appearanceReference, addOrEditCourtCase, addOrEditCourtAppearance } = req.params
    const courtAppearance = this.courtAppearanceService.getSessionCourtAppearance(
      req.session,
      nomsId,
      appearanceReference,
    )
    const uploadedDocuments = this.courtAppearanceService.getUploadedDocuments(req.session, nomsId, appearanceReference)
    const expectedDocumentTypes = documentTypes.NON_SENTENCING
    const documentRows = expectedDocumentTypes.map(expectedType => {
      const uploadedDocument = uploadedDocuments.find(document => document.documentType === expectedType.type) ?? {}
      return { ...expectedType, ...uploadedDocument }
    })
    return res.render('pages/courtAppearance/upload-court-documents', {
      nomsId,
      courtCaseReference,
      appearanceReference,
      addOrEditCourtCase,
      addOrEditCourtAppearance,
      courtAppearance,
      documentRows,
      isEditJourney: this.isEditJourney(addOrEditCourtCase, addOrEditCourtAppearance),
      backLink: this.isEditJourney(addOrEditCourtCase, addOrEditCourtAppearance)
        ? JourneyUrls.nonSentencingHearing(
            nomsId,
            addOrEditCourtCase,
            courtCaseReference,
            addOrEditCourtAppearance,
            appearanceReference,
          )
        : JourneyUrls.taskList(
            nomsId,
            addOrEditCourtCase,
            courtCaseReference,
            addOrEditCourtAppearance,
            appearanceReference,
          ),
    })
  }

  public submitCourtDocuments: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, appearanceReference, addOrEditCourtCase, addOrEditCourtAppearance } = req.params
    this.courtAppearanceService.setDocumentUploadedTrue(req.session, nomsId, appearanceReference)
    return res.redirect(
      this.isEditJourney(addOrEditCourtCase, addOrEditCourtAppearance)
        ? JourneyUrls.nonSentencingHearing(
            nomsId,
            addOrEditCourtCase,
            courtCaseReference,
            addOrEditCourtAppearance,
            appearanceReference,
          )
        : JourneyUrls.taskList(
            nomsId,
            addOrEditCourtCase,
            courtCaseReference,
            addOrEditCourtAppearance,
            appearanceReference,
          ),
    )
  }

  public getUploadCourtDocuments: RequestHandler = async (req, res): Promise<void> => {
    const {
      nomsId,
      courtCaseReference,
      appearanceReference,
      addOrEditCourtCase,
      addOrEditCourtAppearance,
      documentType,
    } = req.params
    const courtAppearance = this.courtAppearanceService.getSessionCourtAppearance(
      req.session,
      nomsId,
      appearanceReference,
    )
    const warrantType = this.courtAppearanceService.getWarrantType(req.session, nomsId, appearanceReference)
    const documentName = this.getDocumentName(documentType, warrantType)

    const errors = req.flash('errors')

    return res.render('pages/courtAppearance/document-upload', {
      nomsId,
      courtCaseReference,
      appearanceReference,
      addOrEditCourtCase,
      addOrEditCourtAppearance,
      documentType,
      documentName,
      courtAppearance,
      errors: errors.length > 0 ? errors : undefined,
      backLink:
        warrantType === 'SENTENCING'
          ? JourneyUrls.sentencingUploadCourtDocuments(
              nomsId,
              addOrEditCourtCase,
              courtCaseReference,
              addOrEditCourtAppearance,
              appearanceReference,
            )
          : JourneyUrls.uploadCourtDocuments(
              nomsId,
              addOrEditCourtCase,
              courtCaseReference,
              addOrEditCourtAppearance,
              appearanceReference,
            ),
    })
  }

  public submitUploadDocuments: RequestHandler = async (req, res): Promise<void> => {
    const {
      nomsId,
      courtCaseReference,
      appearanceReference,
      addOrEditCourtCase,
      addOrEditCourtAppearance,
      documentType,
    } = req.params
    const { username } = res.locals.user as PrisonUser
    const uploadedDocumentForm = trimForm<UploadedDocumentForm>(req.body)
    const uploadedFile = (req.files as Express.Multer.File[])?.[0]
    const warrantType = this.courtAppearanceService.getWarrantType(req.session, nomsId, appearanceReference)

    try {
      if (!uploadedFile) {
        req.flash('errors', [{ text: 'Select a document to upload.', href: '#document-upload' }])
        req.flash('uploadedDocumentForm', { ...uploadedDocumentForm })
        return res.redirect(
          `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/${documentType}/upload-documents?hasErrors=true`,
        )
      }

      const documentTypeName = this.getDocumentType(documentType)
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

      return res.redirect(
        warrantType === 'SENTENCING'
          ? JourneyUrls.sentencingUploadCourtDocuments(
              nomsId,
              addOrEditCourtCase,
              courtCaseReference,
              addOrEditCourtAppearance,
              appearanceReference,
            )
          : JourneyUrls.uploadCourtDocuments(
              nomsId,
              addOrEditCourtCase,
              courtCaseReference,
              addOrEditCourtAppearance,
              appearanceReference,
            ),
      )
    } catch (error) {
      logger.error(`Error uploading document: ${error.message}`)

      req.flash('errors', [{ text: this.getErrorMessage(error.message), href: '#document-upload' }])
      return res.redirect(
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/${documentType}/upload-documents?hasErrors=true`,
      )
    } finally {
      if (req.file && req.file.path) {
        fs.unlink(req.file.path, err => {
          if (err) logger.error('Error deleting temp file:', err)
        })
      }
    }
  }

  getErrorMessage(errorMessage: string): string {
    const match = Object.keys(CourtCaseRoutes.errorMessages).find(key => errorMessage.includes(key))
    if (match) {
      return CourtCaseRoutes.errorMessages[match]
    }
    return 'The selected file could not be uploaded - try again.'
  }

  public downloadUploadedDocument: RequestHandler = async (req, res): Promise<void> => {
    const {
      nomsId,
      documentId,
      courtCaseReference,
      appearanceReference,
      addOrEditCourtCase,
      addOrEditCourtAppearance,
    } = req.params
    const { username } = res.locals.user as PrisonUser

    const warrantType = this.courtAppearanceService.getWarrantType(req.session, nomsId, appearanceReference)

    try {
      const result = await this.documentManagementService.downloadDocument(documentId, username)

      let fileStream: Readable
      if (result.body instanceof Readable) {
        fileStream = result.body
      } else if (Buffer.isBuffer(result.body)) {
        fileStream = new Readable()
        fileStream.push(result.body)
        fileStream.push(null)
      } else {
        throw new Error(`Unexpected body type for documentId=${documentId}`)
      }

      // Copy headers from API response
      if (result.header['content-disposition']) {
        res.set('content-disposition', result.header['content-disposition'])
      }
      if (result.header['content-length']) {
        res.set('content-length', result.header['content-length'])
      }
      if (result.header['content-type']) {
        res.set('content-type', result.header['content-type'])
      }

      // Stream to client
      fileStream.pipe(res)

      fileStream.on('end', async () => {
        logger.info(`Successfully streamed document ${documentId} to client.`)
        await this.auditService.logViewDocument({
          who: username,
          subjectId: nomsId,
          subjectType: 'PRISONER_ID',
          correlationId: req.id,
          details: {
            courtCaseUuids: [courtCaseReference],
            courtAppearanceUuids: [appearanceReference],
            documentId,
          },
        })
      })

      fileStream.on('error', err => {
        logger.error(`Stream error during document download ${documentId}: ${err.message}`)
        if (!res.headersSent) {
          this.redirectWithError(res, {
            nomsId,
            courtCaseReference,
            appearanceReference,
            addOrEditCourtCase,
            addOrEditCourtAppearance,
            warrantType,
            message: 'Error transferring document.',
          })
        } else {
          res.end()
        }
      })
    } catch (err) {
      logger.error(`Error downloading document ${documentId}: ${err.message}`)
      if (!res.headersSent) {
        this.redirectWithError(res, {
          nomsId,
          courtCaseReference,
          appearanceReference,
          addOrEditCourtCase,
          addOrEditCourtAppearance,
          warrantType,
          message: 'Error downloading document.',
        })
      } else {
        res.end()
      }
    }
  }

  private redirectWithError(
    res,
    opts: {
      nomsId: string
      courtCaseReference: string
      appearanceReference: string
      addOrEditCourtCase: string
      addOrEditCourtAppearance: string
      warrantType: string
      message: string
    },
  ): void {
    const {
      nomsId,
      courtCaseReference,
      appearanceReference,
      addOrEditCourtCase,
      addOrEditCourtAppearance,
      warrantType,
    } = opts

    let redirectPath: string
    if (addOrEditCourtCase === 'edit-court-case') {
      redirectPath = `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/details`
    } else if (warrantType === 'SENTENCING') {
      redirectPath = JourneyUrls.sentencingUploadCourtDocuments(
        nomsId,
        addOrEditCourtCase,
        courtCaseReference,
        addOrEditCourtAppearance,
        appearanceReference,
      )
    } else {
      redirectPath = JourneyUrls.uploadCourtDocuments(
        nomsId,
        addOrEditCourtCase,
        courtCaseReference,
        addOrEditCourtAppearance,
        appearanceReference,
      )
    }

    res.redirect(redirectPath)
  }

  public confirmDeleteUploadedDocument: RequestHandler = async (req, res): Promise<void> => {
    const {
      nomsId,
      courtCaseReference,
      appearanceReference,
      addOrEditCourtCase,
      addOrEditCourtAppearance,
      documentId,
    } = req.params
    const document = this.courtAppearanceService.getUploadedDocument(
      req.session,
      nomsId,
      documentId,
      appearanceReference,
    )
    const warrantType = this.courtAppearanceService.getWarrantType(req.session, nomsId, appearanceReference)
    return res.render('pages/courtAppearance/delete-document', {
      nomsId,
      courtCaseReference,
      appearanceReference,
      addOrEditCourtCase,
      addOrEditCourtAppearance,
      document,
      errors: req.flash('errors') || [],
      backLink:
        warrantType === 'SENTENCING'
          ? JourneyUrls.sentencingUploadCourtDocuments(
              nomsId,
              addOrEditCourtCase,
              courtCaseReference,
              addOrEditCourtAppearance,
              appearanceReference,
            )
          : JourneyUrls.uploadCourtDocuments(
              nomsId,
              addOrEditCourtCase,
              courtCaseReference,
              addOrEditCourtAppearance,
              appearanceReference,
            ),
    })
  }

  public submitConfirmDeleteUploadedDocument: RequestHandler = async (req, res): Promise<void> => {
    const {
      nomsId,
      courtCaseReference,
      appearanceReference,
      addOrEditCourtCase,
      addOrEditCourtAppearance,
      documentId,
    } = req.params
    const warrantType = this.courtAppearanceService.getWarrantType(req.session, nomsId, appearanceReference)
    const { username } = res.locals.user as PrisonUser
    const deleteDocumentForm = trimForm<DeleteDocumentForm>(req.body)
    const errors = await this.courtAppearanceService.removeUploadedDocument(
      req.session,
      nomsId,
      documentId,
      deleteDocumentForm,
      username,
      appearanceReference,
    )

    if (errors.length > 0) {
      req.flash('errors', errors)
      return res.redirect(
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/${documentId}/delete-document?hasErrors=true`,
      )
    }

    return res.redirect(
      warrantType === 'SENTENCING'
        ? JourneyUrls.sentencingUploadCourtDocuments(
            nomsId,
            addOrEditCourtCase,
            courtCaseReference,
            addOrEditCourtAppearance,
            appearanceReference,
          )
        : JourneyUrls.uploadCourtDocuments(
            nomsId,
            addOrEditCourtCase,
            courtCaseReference,
            addOrEditCourtAppearance,
            appearanceReference,
          ),
    )
  }

  private getDocumentName(documentType: string, warrantType: string): string {
    switch (documentType) {
      case 'warrant':
        return warrantType === 'SENTENCING' ? 'sentencing warrant' : 'remand warrant'
      case 'trial-record-sheet':
        return 'trial record sheet'
      case 'indictment':
        return 'indictment document'
      case 'prison-court-register':
        return 'prison court register'
      case 'bail-order':
        return 'bail order'
      case 'suspended-imprisonment-order':
        return 'suspended imprisonment order'
      case 'notice-of-discontinuance':
        return 'notice of discontinuance'
      case 'community-order':
        return 'community order'
      default:
        return 'court document'
    }
  }

  private getDocumentType(documentName: string): string {
    switch (documentName) {
      case 'sentencing warrant':
        return 'HMCTS_WARRANT'
      case 'trial-record-sheet':
        return 'TRIAL_RECORD_SHEET'
      case 'indictment':
        return 'INDICTMENT'
      case 'prison-court-register':
        return 'PRISON_COURT_REGISTER'
      case 'bail-order':
        return 'BAIL_ORDER'
      case 'suspended-imprisonment-order':
        return 'SUSPENDED_IMPRISONMENT_ORDER'
      case 'notice-of-discontinuance':
        return 'NOTICE_OF_DISCONTINUANCE'
      case 'community-order':
        return 'COMMUNITY_ORDER'
      default:
        return 'HMCTS_WARRANT'
    }
  }

  private static readonly errorMessages: Record<string, string> = {
    'Payload Too Large': 'The selected document must be smaller than 50MB.',
    'virus scan': 'The selected file contains a virus',
  }
}
