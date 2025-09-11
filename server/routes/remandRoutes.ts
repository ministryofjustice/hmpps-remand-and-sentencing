import { RequestHandler } from 'express'
import OffenceService from '../services/offenceService'
import BaseRoutes from './baseRoutes'
import CourtAppearanceService from '../services/courtAppearanceService'
import ManageOffencesService from '../services/manageOffencesService'

import { pageCourtCaseAppearanceToCourtAppearance } from '../utils/mappingUtils'
import RemandAndSentencingService from '../services/remandAndSentencingService'
import AppearanceOutcomeService from '../services/appearanceOutcomeService'
import CourtRegisterService from '../services/courtRegisterService'
import OffenceOutcomeService from '../services/offenceOutcomeService'
import { getUiDocumentType, offencesToOffenceDescriptions, orderOffences } from '../utils/utils'

export default class RemandRoutes extends BaseRoutes {
  constructor(
    courtAppearanceService: CourtAppearanceService,
    offenceService: OffenceService,
    remandAndSentencingService: RemandAndSentencingService,
    private readonly courtRegisterService: CourtRegisterService,
    private readonly manageOffencesService: ManageOffencesService,
    private readonly appearanceOutcomeService: AppearanceOutcomeService,
    private readonly offenceOutcomeService: OffenceOutcomeService,
  ) {
    super(courtAppearanceService, offenceService, remandAndSentencingService)
  }

  public loadAppearanceDetails: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, appearanceReference, addOrEditCourtCase, addOrEditCourtAppearance } = req.params
    const { username } = res.locals.user
    const storedAppearance = await this.remandAndSentencingService.getCourtAppearanceByAppearanceUuid(
      appearanceReference,
      username,
    )
    this.courtAppearanceService.clearSessionCourtAppearance(req.session, nomsId)
    this.offenceService.clearOffence(req.session, nomsId, courtCaseReference)
    this.courtAppearanceService.setSessionCourtAppearance(
      req.session,
      nomsId,
      pageCourtCaseAppearanceToCourtAppearance(storedAppearance),
    )
    return res.redirect(
      `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/remand/appearance-details`,
    )
  }

  public getAppearanceDetails: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, appearanceReference, addOrEditCourtCase, addOrEditCourtAppearance } = req.params
    const { username } = res.locals.user
    if (req.session.offenceEditCompleted === false) {
      this.courtAppearanceService.resetSessionCourtAppearances(req.session, nomsId)
      this.offenceService.clearOffence(req.session, nomsId, courtCaseReference)
      req.session.offenceEditCompleted = true
    }
    if (!this.courtAppearanceService.sessionCourtAppearanceExists(req.session, nomsId, appearanceReference)) {
      const storedAppearance = await this.remandAndSentencingService.getCourtAppearanceByAppearanceUuid(
        appearanceReference,
        username,
      )
      this.offenceService.clearOffence(req.session, nomsId, courtCaseReference)
      this.courtAppearanceService.setSessionCourtAppearance(
        req.session,
        nomsId,
        pageCourtCaseAppearanceToCourtAppearance(storedAppearance),
      )
    }

    const appearance = this.courtAppearanceService.getSessionCourtAppearance(req.session, nomsId, appearanceReference)
    const consecutiveToSentenceDetails = await this.getSessionConsecutiveToSentenceDetails(
      req,
      nomsId,
      appearanceReference,
    )
    const chargeCodes = appearance.offences
      .map(offences => offences.offenceCode)
      .concat(consecutiveToSentenceDetails.sentences.map(consecutiveToDetails => consecutiveToDetails.offenceCode))
    const courtIds = [appearance.courtCode, appearance.nextHearingCourtCode]
      .concat(consecutiveToSentenceDetails.sentences.map(consecutiveToDetails => consecutiveToDetails.courtCode))
      .concat(appearance.offences.map(offence => offence.mergedFromCase?.courtCode))
      .filter(courtId => courtId !== undefined && courtId !== null)
    const sentenceTypeIds = appearance.offences
      .filter(offence => offence.sentence?.sentenceTypeId)
      .map(offence => offence.sentence?.sentenceTypeId)
    const offenceOutcomeIds = appearance.offences.map(offence => offence.outcomeUuid)
    const outcomePromise = appearance.appearanceOutcomeUuid
      ? this.appearanceOutcomeService
          .getOutcomeByUuid(appearance.appearanceOutcomeUuid, req.user.username)
          .then(outcome => outcome.outcomeName)
      : Promise.resolve(appearance.legacyData?.outcomeDescription ?? 'Not entered')
    const appearanceTypePromise = appearance.nextHearingTypeUuid
      ? this.remandAndSentencingService
          .getAppearanceTypeByUuid(appearance.nextHearingTypeUuid, req.user.username)
          .then(appearanceType => appearanceType.description)
      : Promise.resolve('Not entered')

    const [offenceMap, courtMap, sentenceTypeMap, overallCaseOutcome, outcomeMap, appearanceTypeDescription] =
      await Promise.all([
        this.manageOffencesService.getOffenceMap(
          Array.from(new Set(chargeCodes)),
          req.user.username,
          offencesToOffenceDescriptions(appearance.offences, consecutiveToSentenceDetails.sentences),
        ),
        this.courtRegisterService.getCourtMap(Array.from(new Set(courtIds)), req.user.username),
        this.remandAndSentencingService.getSentenceTypeMap(Array.from(new Set(sentenceTypeIds)), req.user.username),
        outcomePromise,
        this.offenceOutcomeService.getOutcomeMap(Array.from(new Set(offenceOutcomeIds)), req.user.username),
        appearanceTypePromise,
      ])
    const allSentenceUuids = appearance.offences
      .map(offence => offence.sentence?.sentenceUuid)
      .filter(sentenceUuid => sentenceUuid)
    const consecutiveToSentenceDetailsMap = this.getConsecutiveToSentenceDetailsMap(
      allSentenceUuids,
      consecutiveToSentenceDetails,
      offenceMap,
      courtMap,
    )
    const documentsWithUiType = this.courtAppearanceService
      .getUploadedDocuments(req.session, nomsId, appearanceReference)
      .map(document => ({
        ...document,
        documentType: getUiDocumentType(document.documentType, appearance.warrantType),
      }))

    const mergedFromText = this.getMergedFromText(
      appearance.offences?.filter(offence => offence.mergedFromCase != null).map(offence => offence.mergedFromCase),
      courtMap,
    )

    return res.render('pages/courtAppearance/appearance-details', {
      nomsId,
      courtCaseReference,
      appearanceReference,
      addOrEditCourtCase,
      addOrEditCourtAppearance,
      appearance: { ...appearance, offences: orderOffences(appearance.offences) },
      offenceMap,
      courtMap,
      sentenceTypeMap,
      overallCaseOutcome,
      outcomeMap,
      appearanceTypeDescription,
      consecutiveToSentenceDetailsMap,
      documentsWithUiType,
      mergedFromText,
      errors: req.flash('errors') || [],
      backLink: `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/details`,
    })
  }

  public submitAppearanceDetailsEdit: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, appearanceReference, addOrEditCourtCase, addOrEditCourtAppearance } = req.params
    const errors = this.courtAppearanceService.checkOffencesHaveMandatoryFields(
      req.session,
      nomsId,
      appearanceReference,
    )
    if (errors.length > 0) {
      req.flash('errors', errors)
      return res.redirect(
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/remand/appearance-details`,
      )
    }
    return this.updateCourtAppearance(req, res, nomsId, addOrEditCourtCase, courtCaseReference, appearanceReference)
  }

  public checkDeleteOffence: RequestHandler = async (req, res): Promise<void> => {
    const {
      nomsId,
      courtCaseReference,
      chargeUuid,
      appearanceReference,
      addOrEditCourtCase,
      addOrEditCourtAppearance,
    } = req.params
    const courtAppearance = this.courtAppearanceService.getSessionCourtAppearance(
      req.session,
      nomsId,
      appearanceReference,
    )
    const offence = courtAppearance.offences.find(o => o.chargeUuid === chargeUuid)
    if (offence.sentence?.sentenceUuid) {
      const hasSentencesAfter = await this.remandAndSentencingService.hasSentenceAfterOnOtherCourtAppearance(
        offence.sentence.sentenceUuid,
        req.user.username,
      )
      if (hasSentencesAfter.hasSentenceAfterOnOtherCourtAppearance) {
        return res.redirect(
          `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/remand/offences/${chargeUuid}/cannot-delete-offence`,
        )
      }
    }
    return res.redirect(
      `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/offences/${chargeUuid}/delete-offence`,
    )
  }

  public getCannotDeleteOffence: RequestHandler = async (req, res): Promise<void> => {
    const {
      nomsId,
      courtCaseReference,
      chargeUuid,
      appearanceReference,
      addOrEditCourtCase,
      addOrEditCourtAppearance,
    } = req.params
    const { username } = req.user
    const courtAppearance = this.courtAppearanceService.getSessionCourtAppearance(
      req.session,
      nomsId,
      appearanceReference,
    )
    const offence = courtAppearance.offences.find(o => o.chargeUuid === chargeUuid)
    const sentencesAfterDetails = await this.remandAndSentencingService.getSentencesAfterOnOtherCourtAppearanceDetails(
      offence.sentence.sentenceUuid,
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
    const backLink = `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/remand/appearance-details`
    return res.render('pages/courtAppearance/cannot-delete-offence', {
      nomsId,
      courtCaseReference,
      appearanceReference,
      addOrEditCourtCase,
      addOrEditCourtAppearance,
      offence,
      offenceDetails,
      courtMap,
      backLink,
      sentencesAfterDetails,
    })
  }
}
