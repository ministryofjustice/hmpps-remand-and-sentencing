import { RequestHandler } from 'express'
import OffenceService from '../services/offenceService'
import BaseRoutes from './baseRoutes'
import CourtAppearanceService from '../services/courtAppearanceService'
import ManageOffencesService from '../services/manageOffencesService'

import { pageCourtCaseAppearanceToCourtAppearance } from '../utils/mappingUtils'
import RemandAndSentencingService from '../services/remandAndSentencingService'
import CourtRegisterService from '../services/courtRegisterService'
import { getUiDocumentType, offencesToOffenceDescriptions, orderOffences } from '../utils/utils'
import RefDataService from '../services/refDataService'
import JourneyUrls from './data/JourneyUrls'

export default class RemandRoutes extends BaseRoutes {
  constructor(
    courtAppearanceService: CourtAppearanceService,
    offenceService: OffenceService,
    remandAndSentencingService: RemandAndSentencingService,
    private readonly courtRegisterService: CourtRegisterService,
    manageOffencesService: ManageOffencesService,
    private readonly refDataService: RefDataService,
  ) {
    super(courtAppearanceService, offenceService, remandAndSentencingService, manageOffencesService)
  }

  public loadHearingDetails: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, appearanceReference, addOrEditCourtCase, addOrEditCourtAppearance } = req.params
    const { username } = res.locals.user
    await this.setAppearanceDetailsToSession(appearanceReference, username, req, nomsId, courtCaseReference)
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

  public getHearingDetails: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, appearanceReference, addOrEditCourtCase, addOrEditCourtAppearance } = req.params
    const { username } = res.locals.user
    if (!this.courtAppearanceService.sessionCourtAppearanceExists(req.session, nomsId, appearanceReference)) {
      const storedAppearance = await this.remandAndSentencingService.getCourtAppearanceByAppearanceUuid(
        appearanceReference,
        username,
      )
      this.offenceService.clearAllOffences(req.session, nomsId, courtCaseReference)
      this.courtAppearanceService.setSessionCourtAppearance(
        req.session,
        nomsId,
        pageCourtCaseAppearanceToCourtAppearance(storedAppearance),
      )
    }

    const hearing = this.courtAppearanceService.getSessionCourtAppearance(req.session, nomsId, appearanceReference)
    const consecutiveToSentenceDetails = await this.getConsecutiveToFromApi(req, nomsId, appearanceReference)
    const chargeCodes = hearing.offences
      .map(offences => offences.offenceCode)
      .concat(consecutiveToSentenceDetails.sentences.map(consecutiveToDetails => consecutiveToDetails.offenceCode))
    const courtIds = [hearing.courtCode, hearing.nextAppearanceCourtCode]
      .concat(consecutiveToSentenceDetails.sentences.map(consecutiveToDetails => consecutiveToDetails.courtCode))
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
    const sentenceUuids = hearing.offences
      .filter(offence => offence.sentence?.sentenceUuid)
      .map(offence => offence.sentence.sentenceUuid)
    const hasSentenceAfterOnOtherCourtAppearancePromise = sentenceUuids.length
      ? this.remandAndSentencingService.hasSentenceAfterOnOtherCourtAppearance(sentenceUuids, req.user.username)
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
        offencesToOffenceDescriptions(hearing.offences, consecutiveToSentenceDetails.sentences),
      ),
      this.courtRegisterService.getCourtMap(Array.from(new Set(courtIds)), req.user.username),
      this.refDataService.getSentenceTypeMap(Array.from(new Set(sentenceTypeIds)), req.user.username),
      outcomePromise,
      this.refDataService.getChargeOutcomeMap(Array.from(new Set(offenceOutcomeIds)), req.user.username),
      appearanceTypePromise,
      hasSentenceAfterOnOtherCourtAppearancePromise,
    ])
    const allSentenceUuids = hearing.offences
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
        documentType: getUiDocumentType(document.documentType, hearing.warrantType),
      }))

    const mergedFromText = this.getMergedFromText(
      hearing.offences?.filter(offence => offence.mergedFromCase != null).map(offence => offence.mergedFromCase),
      courtMap,
    )

    return res.render('pages/courtAppearance/hearing-details', {
      nomsId,
      courtCaseReference,
      appearanceReference,
      addOrEditCourtCase,
      addOrEditCourtAppearance,
      hearing: { ...hearing, offences: orderOffences(hearing.offences) },
      offenceMap,
      courtMap,
      sentenceTypeMap,
      overallCaseOutcome,
      outcomeMap,
      appearanceTypeDescription,
      consecutiveToSentenceDetailsMap,
      documentsWithUiType,
      mergedFromText,
      hasSentenceAfterOnOtherCourtAppearance:
        hasSentenceAfterOnOtherCourtAppearance.hasSentenceAfterOnOtherCourtAppearance,
      errors: req.flash('errors') || [],
      backLink: `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/details`,
    })
  }

  public submitHearingDetailsEdit: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, appearanceReference, addOrEditCourtCase, addOrEditCourtAppearance } = req.params
    const errors = this.courtAppearanceService.checkOffencesHaveMandatoryFields(
      req.session,
      nomsId,
      appearanceReference,
    )
    if (errors.length > 0) {
      req.flash('errors', errors)
      return res.redirect(
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/non-sentencing/hearing-details?hasErrors=true`,
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
    const sentenceUuidsInChain = this.courtAppearanceService.getSentenceUuidsInChain(
      req.session,
      nomsId,
      appearanceReference,
      chargeUuid,
    )
    if (sentenceUuidsInChain.length) {
      const hasSentencesAfter = await this.remandAndSentencingService.hasSentenceAfterOnOtherCourtAppearance(
        sentenceUuidsInChain,
        req.user.username,
      )
      if (hasSentencesAfter.hasSentenceAfterOnOtherCourtAppearance) {
        return res.redirect(
          `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/non-sentencing/offences/${chargeUuid}/cannot-delete-offence`,
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
    const sentenceUuidsInChain = this.courtAppearanceService.getSentenceUuidsInChain(
      req.session,
      nomsId,
      appearanceReference,
      chargeUuid,
    )
    const courtAppearance = this.courtAppearanceService.getSessionCourtAppearance(
      req.session,
      nomsId,
      appearanceReference,
    )
    const offence = courtAppearance.offences.find(o => o.chargeUuid === chargeUuid)
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
    const backLink = JourneyUrls.nonSentencingHearing(
      nomsId,
      addOrEditCourtCase,
      courtCaseReference,
      addOrEditCourtAppearance,
      appearanceReference,
    )
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
