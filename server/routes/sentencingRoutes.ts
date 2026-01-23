import { RequestHandler } from 'express'
import type {
  CorrectAlternativeManyPeriodLengthsForm,
  CorrectManyPeriodLengthsForm,
  FirstSentenceConsecutiveToForm,
  SentenceConsecutiveToForm,
  SentenceIsSentenceConsecutiveToForm,
} from 'forms'
import dayjs from 'dayjs'
import type { CourtAppearance } from 'models'
import { ConsecutiveToDetails } from '@ministryofjustice/hmpps-court-cases-release-dates-design/hmpps/@types'
import OffenceService from '../services/offenceService'
import sentenceTypePeriodLengths from '../resources/sentenceTypePeriodLengths'
import BaseRoutes from './baseRoutes'
import CourtAppearanceService from '../services/courtAppearanceService'
import ManageOffencesService from '../services/manageOffencesService'
import trimForm from '../utils/trim'
import sentenceServeTypes from '../resources/sentenceServeTypes'
import {
  convertToTitleCase,
  extractKeyValue,
  getUiDocumentType,
  offencesToOffenceDescriptions,
  orderOffences,
  sentencesToChainToResponseToOffenceDescriptions,
  sortByDateDesc,
} from '../utils/utils'
import RemandAndSentencingService from '../services/remandAndSentencingService'
import CourtRegisterService from '../services/courtRegisterService'

import { pageCourtCaseAppearanceToCourtAppearance, periodLengthToSentenceLength } from '../utils/mappingUtils'
import CalculateReleaseDatesService from '../services/calculateReleaseDatesService'
import {
  AppearanceToChainTo,
  PrisonerSentenceEnvelopeSentence,
  SentenceConsecutiveToDetails,
  SentencesToChainToResponse,
  SentenceToChainTo,
} from '../@types/remandAndSentencingApi/remandAndSentencingClientTypes'
import documentTypes from '../resources/documentTypes'
import RefDataService from '../services/refDataService'
import periodLengthTypeHeadings from '../resources/PeriodLengthTypeHeadings'
import config from '../config'
import JourneyUrls from './data/JourneyUrls'
import AuditService, { Page } from '../services/auditService'

export default class SentencingRoutes extends BaseRoutes {
  constructor(
    courtAppearanceService: CourtAppearanceService,
    offenceService: OffenceService,
    remandAndSentencingService: RemandAndSentencingService,
    manageOffencesService: ManageOffencesService,
    private readonly courtRegisterService: CourtRegisterService,
    private readonly calculateReleaseDatesService: CalculateReleaseDatesService,
    private readonly refDataService: RefDataService,
    private readonly auditService: AuditService,
  ) {
    super(courtAppearanceService, offenceService, remandAndSentencingService, manageOffencesService)
  }

  public getIsSentenceConsecutiveTo: RequestHandler = async (req, res): Promise<void> => {
    const {
      nomsId,
      courtCaseReference,
      chargeUuid,
      appearanceReference,
      addOrEditCourtCase,
      addOrEditCourtAppearance,
    } = req.params
    const { submitToEditOffence } = req.query
    const offence = this.offenceService.getSessionOffence(req.session, nomsId, courtCaseReference, chargeUuid)
    const offenceDetails = await this.manageOffencesService.getOffenceByCode(
      offence.offenceCode,
      req.user.username,
      offence.legacyData?.offenceDescription,
    )
    const { sentence } = offence
    const expectedPeriodLengthsSize =
      sentenceTypePeriodLengths[sentence?.sentenceTypeClassification]?.periodLengths?.length

    let sentenceIsSentenceConsecutiveToForm = (req.flash('sentenceIsSentenceConsecutiveToForm')[0] ||
      {}) as SentenceIsSentenceConsecutiveToForm

    if (Object.keys(sentenceIsSentenceConsecutiveToForm).length === 0) {
      sentenceIsSentenceConsecutiveToForm = {
        isSentenceConsecutiveToAnotherCase: sentence?.isSentenceConsecutiveToAnotherCase,
      }
    }

    let backLink = `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/offences/${chargeUuid}/sentence-type`
    if (submitToEditOffence) {
      backLink = `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/offences/${chargeUuid}/edit-offence`
    } else if (sentence?.sentenceTypeClassification === 'FINE') {
      backLink = `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/offences/${chargeUuid}/fine-amount`
    } else if (expectedPeriodLengthsSize) {
      backLink = `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/offences/${chargeUuid}/period-length?periodLengthType=${
        sentenceTypePeriodLengths[sentence.sentenceTypeClassification].periodLengths[expectedPeriodLengthsSize - 1].type
      }`
    }
    return res.render('pages/sentencing/is-sentence-consecutive-to', {
      nomsId,
      courtCaseReference,
      chargeUuid,
      appearanceReference,
      addOrEditCourtCase,
      addOrEditCourtAppearance,
      offenceDetails,
      offence,
      sentenceIsSentenceConsecutiveToForm,
      errors: req.flash('errors') || [],
      isAddOffences: this.isAddJourney(addOrEditCourtCase, addOrEditCourtAppearance),
      submitToEditOffence,
      backLink,
    })
  }

  public submitIsSentenceConsecutiveTo: RequestHandler = async (req, res): Promise<void> => {
    const {
      nomsId,
      courtCaseReference,
      chargeUuid,
      appearanceReference,
      addOrEditCourtCase,
      addOrEditCourtAppearance,
    } = req.params
    const { submitToEditOffence } = req.query
    const sentenceIsSentenceConsecutiveToForm = trimForm<SentenceIsSentenceConsecutiveToForm>(req.body)
    const errors = this.offenceService.setIsSentenceConsecutiveTo(
      req.session,
      nomsId,
      courtCaseReference,
      chargeUuid,
      sentenceIsSentenceConsecutiveToForm,
    )

    if (errors.length > 0) {
      req.flash('errors', errors)
      req.flash('sentenceIsSentenceConsecutiveToForm', { ...sentenceIsSentenceConsecutiveToForm })
      return res.redirect(
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/sentencing/offences/${chargeUuid}/is-sentence-consecutive-to?hasErrors=true${submitToEditOffence ? '&submitToEditOffence=true' : ''}`,
      )
    }

    if (sentenceIsSentenceConsecutiveToForm.isSentenceConsecutiveToAnotherCase === 'true') {
      this.offenceService.setSentenceServeType(
        req.session,
        nomsId,
        courtCaseReference,
        chargeUuid,
        {
          sentenceServeType: extractKeyValue(sentenceServeTypes, sentenceServeTypes.CONSECUTIVE),
        },
        null,
        false,
      )
      return res.redirect(
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/sentencing/offences/${chargeUuid}/first-sentence-consecutive-to${submitToEditOffence ? '?submitToEditOffence=true' : ''}`,
      )
    }

    this.offenceService.setSentenceServeType(
      req.session,
      nomsId,
      courtCaseReference,
      chargeUuid,
      {
        sentenceServeType: extractKeyValue(sentenceServeTypes, sentenceServeTypes.FORTHWITH),
      },
      null,
      false,
    )
    if (submitToEditOffence) {
      return res.redirect(
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/offences/${chargeUuid}/edit-offence`,
      )
    }
    return this.saveSessionOffenceInAppearance(
      req,
      res,
      nomsId,
      addOrEditCourtCase,
      courtCaseReference,
      addOrEditCourtAppearance,
      appearanceReference,
      chargeUuid,
    )
  }

  public loadHearingDetails: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, appearanceReference, addOrEditCourtCase, addOrEditCourtAppearance } = req.params
    const { username } = res.locals.user
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
    const consecutiveToSentenceDetailsFromApi = await this.getConsecutiveToFromApi(req, nomsId, appearanceReference)
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
        offencesToOffenceDescriptions(hearing.offences, consecutiveToSentenceDetailsFromApi.sentences),
      ),
      this.courtRegisterService.getCourtMap(Array.from(new Set(courtIds)), req.user.username),
      this.refDataService.getSentenceTypeMap(Array.from(new Set(sentenceTypeIds)), req.user.username),
      outcomePromise,
      this.refDataService.getChargeOutcomeMap(Array.from(new Set(offenceOutcomeIds)), req.user.username),
      appearanceTypePromise,
      hasSentenceAfterOnOtherCourtAppearancePromise,
    ])
    const [custodialOffences, nonCustodialOffences] = offences
      .map((offence, index) => ({ ...offence, index })) // Add an index to each offence
      .reduce(
        ([custodialList, nonCustodialList], offence) => {
          const outcome = outcomeMap[offence.outcomeUuid]
          if (
            outcome?.outcomeType === 'SENTENCING' ||
            (offence.legacyData?.outcomeConvictionFlag === true && offence.sentence)
          ) {
            return [[...custodialList, offence], nonCustodialList]
          }
          return [custodialList, [...nonCustodialList, offence]]
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
      nomsId,
      offenceMap,
      appearanceReference,
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

    return res.render('pages/sentencing/hearing-details', {
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
      custodialOffences: orderOffences(custodialOffences),
      nonCustodialOffences: orderOffences(nonCustodialOffences),
      consecutiveToSentenceMap: {
        ...consecutiveToSentenceDetailsMap,
        ...sessionConsecutiveToSentenceDetailsMap,
      },
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
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/sentencing/hearing-details?hasErrors=true`,
      )
    }
    return this.updateCourtAppearance(req, res, nomsId, addOrEditCourtCase, courtCaseReference, appearanceReference)
  }

  public getFirstSentenceConsecutiveTo: RequestHandler = async (req, res): Promise<void> => {
    const {
      nomsId,
      courtCaseReference,
      chargeUuid,
      appearanceReference,
      addOrEditCourtCase,
      addOrEditCourtAppearance,
    } = req.params
    const { submitToEditOffence } = req.query
    const courtAppearance = this.courtAppearanceService.getSessionCourtAppearance(
      req.session,
      nomsId,
      appearanceReference,
    )
    const offence = this.offenceService.getSessionOffence(req.session, nomsId, courtCaseReference, chargeUuid)
    const { sentence } = offence
    const [offenceHint, sentencesToChainTo] = await Promise.all([
      this.getOffenceHint(offence, req.user.username),
      this.remandAndSentencingService.getSentencesToChainTo(
        nomsId,
        dayjs(courtAppearance.warrantDate),
        sentence?.legacyData?.bookingId ?? res.locals.prisoner.bookingId,
        req.user.username,
      ),
    ])

    let firstSentenceConsecutiveToForm = (req.flash('firstSentenceConsecutiveToForm')[0] ||
      {}) as FirstSentenceConsecutiveToForm
    if (Object.keys(firstSentenceConsecutiveToForm).length === 0) {
      firstSentenceConsecutiveToForm = {
        consecutiveToSentenceUuid: sentence?.consecutiveToSentenceUuid,
      }
    }

    const offenceCodes = Array.from(
      new Set(
        sentencesToChainTo.appearances
          .flatMap(appearance => appearance.sentences)
          .map(chainToSentence => chainToSentence.offenceCode),
      ),
    )
    const courtCodes = Array.from(new Set(sentencesToChainTo.appearances.map(appearance => appearance.courtCode)))

    const [offenceMap, courtMap] = await Promise.all([
      this.manageOffencesService.getOffenceMap(
        offenceCodes,
        req.user.username,
        offencesToOffenceDescriptions(courtAppearance.offences, []).concat(
          sentencesToChainToResponseToOffenceDescriptions(sentencesToChainTo),
        ),
      ),
      this.courtRegisterService.getCourtMap(courtCodes, req.user.username),
    ])

    const sentencedAppearancesOnOtherCases = this.getAppearancesToChainToOnOtherCases(
      courtAppearance,
      sentencesToChainTo,
    )

    let backLink = `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/sentencing/offences/${chargeUuid}/is-sentence-consecutive-to`
    if (submitToEditOffence) {
      backLink = `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/offences/${chargeUuid}/edit-offence`
    }
    const auditDetails = {
      courtCaseUuids: [],
      courtAppearanceUuids: sentencesToChainTo.appearances.map(appearance => appearance.appearanceUuid),
      chargeUuids: sentencesToChainTo.appearances
        .flatMap(appearance => appearance.sentences)
        .map(sentenceDetails => sentenceDetails.chargeUuid),
      sentenceUuids: sentencesToChainTo.appearances
        .flatMap(appearance => appearance.sentences)
        .map(sentenceDetails => sentenceDetails.sentenceUuid),
      periodLengthUuids: [],
    }

    await this.auditService.logPageView(Page.SENT_CONSEC_TO, {
      who: res.locals.user.username,
      subjectId: nomsId,
      subjectType: 'PRISONER_ID',
      correlationId: req.id,
      details: auditDetails,
    })
    return res.render('pages/sentencing/first-sentence-consecutive-to', {
      nomsId,
      courtCaseReference,
      chargeUuid,
      appearanceReference,
      addOrEditCourtCase,
      addOrEditCourtAppearance,
      offenceHint,
      firstSentenceConsecutiveToForm,
      sentencedAppearancesOnOtherCases,
      offenceMap,
      courtMap,
      errors: req.flash('errors') || [],
      isAddOffences: this.isAddJourney(addOrEditCourtCase, addOrEditCourtAppearance),
      submitToEditOffence,
      backLink,
    })
  }

  public getAppearancesToChainToOnOtherCases(
    sessionAppearance: CourtAppearance,
    sentencesToChainTo: SentencesToChainToResponse,
  ): AppearanceToChainTo[] {
    const sessionSentenceUuids = sessionAppearance.offences
      .filter(sessionOffence => sessionOffence.sentence)
      .map(sessionOffence => sessionOffence.sentence.sentenceUuid)
    return sentencesToChainTo.appearances.filter(chainToAppearances =>
      chainToAppearances.sentences.every(
        sentenceToChainTo => !sessionSentenceUuids.includes(sentenceToChainTo.sentenceUuid),
      ),
    )
  }

  public submitFirstSentenceConsecutiveTo: RequestHandler = async (req, res): Promise<void> => {
    const {
      nomsId,
      courtCaseReference,
      chargeUuid,
      appearanceReference,
      addOrEditCourtCase,
      addOrEditCourtAppearance,
    } = req.params
    const { submitToEditOffence } = req.query
    const firstSentenceConsecutiveToForm = trimForm<FirstSentenceConsecutiveToForm>(req.body)
    const errors = this.offenceService.setFirstSentenceConsecutiveTo(
      req.session,
      nomsId,
      courtCaseReference,
      chargeUuid,
      firstSentenceConsecutiveToForm,
    )

    if (errors.length > 0) {
      req.flash('errors', errors)
      req.flash('firstSentenceConsecutiveToForm', { ...firstSentenceConsecutiveToForm })
      return res.redirect(
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/SENTENCING/offences/${chargeUuid}/first-sentence-consecutive-to?hasErrors=true${submitToEditOffence ? '&submitToEditOffence=true' : ''}`,
      )
    }
    if (submitToEditOffence) {
      return res.redirect(
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/offences/${chargeUuid}/edit-offence`,
      )
    }
    return this.saveSessionOffenceInAppearance(
      req,
      res,
      nomsId,
      addOrEditCourtCase,
      courtCaseReference,
      addOrEditCourtAppearance,
      appearanceReference,
      chargeUuid,
    )
  }

  public getSentenceConsecutiveTo: RequestHandler = async (req, res): Promise<void> => {
    const {
      nomsId,
      courtCaseReference,
      chargeUuid,
      appearanceReference,
      addOrEditCourtCase,
      addOrEditCourtAppearance,
    } = req.params
    const { submitToEditOffence, invalidatedFrom } = req.query
    const courtAppearance = this.courtAppearanceService.getSessionCourtAppearance(
      req.session,
      nomsId,
      appearanceReference,
    )
    const offence = this.offenceService.getSessionOffence(req.session, nomsId, courtCaseReference, chargeUuid)
    const { sentence } = offence
    const [offenceHint, sentencesToChainTo] = await Promise.all([
      this.getOffenceHint(offence, req.user.username),
      this.remandAndSentencingService.getSentencesToChainTo(
        nomsId,
        dayjs(courtAppearance.warrantDate),
        sentence?.legacyData?.bookingId ?? res.locals.prisoner.bookingId,
        req.user.username,
      ),
    ])

    let sentenceConsecutiveToForm = (req.flash('sentenceConsecutiveToForm')[0] || {}) as SentenceConsecutiveToForm
    if (Object.keys(sentenceConsecutiveToForm).length === 0) {
      sentenceConsecutiveToForm = {
        consecutiveToSentenceUuid: sentence?.consecutiveToSentenceUuid,
      }
    }

    const offenceCodes = Array.from(
      new Set(
        sentencesToChainTo.appearances
          .flatMap(appearance => appearance.sentences)
          .map(chainToSentence => chainToSentence.offenceCode)
          .concat(
            courtAppearance.offences
              .filter(sessionOffence => sessionOffence.sentence)
              .map(sessionOffence => sessionOffence.offenceCode),
          ),
      ),
    )
    const courtCodes = Array.from(new Set(sentencesToChainTo.appearances.map(appearance => appearance.courtCode)))

    const [offenceMap, courtMap] = await Promise.all([
      this.manageOffencesService.getOffenceMap(
        offenceCodes,
        req.user.username,
        offencesToOffenceDescriptions(courtAppearance.offences, []).concat(
          sentencesToChainToResponseToOffenceDescriptions(sentencesToChainTo),
        ),
      ),
      this.courtRegisterService.getCourtMap(courtCodes, req.user.username),
    ])

    const sentencesOnSameCase = courtAppearance.offences
      .filter(sessionOffence => sessionOffence.chargeUuid !== chargeUuid && sessionOffence.sentence)
      .map(sessionOffence => {
        return {
          countNumber: sessionOffence.sentence.countNumber,
          offenceStartDate: sessionOffence.offenceStartDate,
          offenceEndDate: sessionOffence.offenceEndDate,
          offenceCode: sessionOffence.offenceCode,
          sentenceUuid: sessionOffence.sentence.sentenceUuid,
        } as unknown as SentenceToChainTo
      })
    const sentencedAppearancesOnOtherCases = this.getAppearancesToChainToOnOtherCases(
      courtAppearance,
      sentencesToChainTo,
    )
    const submitQuery = this.queryParametersToString(submitToEditOffence, invalidatedFrom)
    let backLink = `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/offences/${chargeUuid}/sentence-serve-type${submitQuery}`
    if (submitToEditOffence) {
      backLink = `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/offences/${chargeUuid}/edit-offence`
    }
    return res.render('pages/sentencing/sentence-consecutive-to', {
      nomsId,
      courtCaseReference,
      chargeUuid,
      appearanceReference,
      addOrEditCourtCase,
      addOrEditCourtAppearance,
      offenceHint,
      sentenceConsecutiveToForm,
      sentencedAppearancesOnOtherCases,
      sentencesOnSameCase,
      offenceMap,
      courtMap,
      errors: req.flash('errors') || [],
      isAddOffences: this.isAddJourney(addOrEditCourtCase, addOrEditCourtAppearance),
      submitQuery,
      backLink,
    })
  }

  public submitSentenceConsecutiveTo: RequestHandler = async (req, res): Promise<void> => {
    const {
      nomsId,
      courtCaseReference,
      chargeUuid,
      appearanceReference,
      addOrEditCourtCase,
      addOrEditCourtAppearance,
    } = req.params
    const { submitToEditOffence, invalidatedFrom } = req.query
    const submitQuery = this.queryParametersToString(submitToEditOffence, invalidatedFrom)
    const sentenceConsecutiveToForm = trimForm<SentenceConsecutiveToForm>(req.body)
    const errors = await this.offenceService.setSentenceConsecutiveTo(
      req.session,
      nomsId,
      courtCaseReference,
      chargeUuid,
      sentenceConsecutiveToForm,
      this.courtAppearanceService.getSessionCourtAppearance(req.session, nomsId, appearanceReference),
      req.user.username,
    )

    if (errors.length > 0) {
      req.flash('errors', errors)
      req.flash('sentenceConsecutiveToForm', { ...sentenceConsecutiveToForm })
      return res.redirect(
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/SENTENCING/offences/${chargeUuid}/sentence-consecutive-to${submitQuery.length > 0 ? `${submitQuery}&hasErrors=true` : '?hasErrors=true'}`,
      )
    }
    if (submitToEditOffence) {
      return res.redirect(
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/offences/${chargeUuid}/edit-offence`,
      )
    }
    return this.saveSessionOffenceInAppearance(
      req,
      res,
      nomsId,
      addOrEditCourtCase,
      courtCaseReference,
      addOrEditCourtAppearance,
      appearanceReference,
      chargeUuid,
    )
  }

  public getCourtDocumentsPage: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, appearanceReference, addOrEditCourtCase, addOrEditCourtAppearance } = req.params
    const courtAppearance = this.courtAppearanceService.getSessionCourtAppearance(
      req.session,
      nomsId,
      appearanceReference,
    )
    const uploadedDocuments = this.courtAppearanceService.getUploadedDocuments(req.session, nomsId, appearanceReference)
    const expectedDocumentTypes = documentTypes.SENTENCING
    const documentRows = expectedDocumentTypes.map(expectedType => {
      const uploadedDocument = uploadedDocuments.find(document => document.documentType === expectedType.type) ?? {}
      return { ...expectedType, ...uploadedDocument }
    })
    return res.render('pages/sentencing/upload-court-documents', {
      nomsId,
      courtCaseReference,
      appearanceReference,
      addOrEditCourtCase,
      addOrEditCourtAppearance,
      courtAppearance,
      documentRows,
      isEditJourney: this.isEditJourney(addOrEditCourtCase, addOrEditCourtAppearance),
      backLink: this.isEditJourney(addOrEditCourtCase, addOrEditCourtAppearance)
        ? JourneyUrls.sentencingHearing(
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
        ? JourneyUrls.sentencingHearing(
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

  public getSentenceLengthMismatch: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, appearanceReference, addOrEditCourtCase, addOrEditCourtAppearance } = req.params
    const courtAppearance = this.courtAppearanceService.getSessionCourtAppearance(
      req.session,
      nomsId,
      appearanceReference,
    )

    const overallSentenceLengthComparison = await this.calculateReleaseDatesService.compareOverallSentenceLength(
      courtAppearance,
      req.user.username,
    )

    return res.render('pages/sentencing/sentence-length-mismatch', {
      nomsId,
      courtCaseReference,
      courtAppearance,
      appearanceReference,
      addOrEditCourtCase,
      addOrEditCourtAppearance,
      overallSentenceLengthComparison,
      backLink: JourneyUrls.sentencingHearing(
        nomsId,
        addOrEditCourtCase,
        courtCaseReference,
        addOrEditCourtAppearance,
        appearanceReference,
      ),
    })
  }

  public continueSentenceLengthMismatch: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, appearanceReference, addOrEditCourtCase } = req.params
    return this.updateCourtAppearance(req, res, nomsId, addOrEditCourtCase, courtCaseReference, appearanceReference)
  }

  public getDeleteSentenceInChain: RequestHandler = async (req, res): Promise<void> => {
    const {
      nomsId,
      courtCaseReference,
      chargeUuid,
      appearanceReference,
      addOrEditCourtCase,
      addOrEditCourtAppearance,
    } = req.params
    const { submitToEditOffence } = req.query
    const offence = this.courtAppearanceService.getOffence(req.session, nomsId, chargeUuid, appearanceReference)
    const offenceDetails = await this.manageOffencesService.getOffenceByCode(
      offence.offenceCode,
      req.user.username,
      offence.legacyData?.offenceDescription,
    )
    const backLink = `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/offences/${chargeUuid}/delete-offence`
    let goBackLink = backLink
    if (this.isEditJourney(addOrEditCourtCase, addOrEditCourtAppearance)) {
      const warrantType = this.courtAppearanceService.getWarrantType(req.session, nomsId, appearanceReference)
      if (warrantType === 'SENTENCING') {
        goBackLink = JourneyUrls.sentencingHearing(
          nomsId,
          addOrEditCourtCase,
          courtCaseReference,
          addOrEditCourtAppearance,
          appearanceReference,
        )
      } else {
        goBackLink = JourneyUrls.nonSentencingHearing(
          nomsId,
          addOrEditCourtCase,
          courtCaseReference,
          addOrEditCourtAppearance,
          appearanceReference,
        )
      }
    }
    return res.render('pages/sentencing/delete-sentence-in-chain', {
      nomsId,
      courtCaseReference,
      chargeUuid,
      appearanceReference,
      addOrEditCourtCase,
      addOrEditCourtAppearance,
      offenceDetails,
      offence,
      submitToEditOffence,
      backLink,
      goBackLink,
    })
  }

  public continueDeleteSentenceInChain: RequestHandler = async (req, res): Promise<void> => {
    const {
      nomsId,
      courtCaseReference,
      chargeUuid,
      appearanceReference,
      addOrEditCourtCase,
      addOrEditCourtAppearance,
    } = req.params
    this.courtAppearanceService.deleteSentenceInChain(req.session, nomsId, chargeUuid, appearanceReference)

    if (this.isEditJourney(addOrEditCourtCase, addOrEditCourtAppearance)) {
      const warrantType = this.courtAppearanceService.getWarrantType(req.session, nomsId, appearanceReference)
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
      JourneyUrls.checkOffenceAnswers(
        nomsId,
        addOrEditCourtCase,
        courtCaseReference,
        addOrEditCourtAppearance,
        appearanceReference,
      ),
    )
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
          `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/sentencing/offences/${chargeUuid}/cannot-delete-offence`,
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
    const offence = this.courtAppearanceService.getOffence(req.session, nomsId, chargeUuid, appearanceReference)
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
    const backLink = JourneyUrls.sentencingHearing(
      nomsId,
      addOrEditCourtCase,
      courtCaseReference,
      addOrEditCourtAppearance,
      appearanceReference,
    )
    return res.render('pages/sentencing/cannot-delete-offence', {
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

  public getCannotRemoveSentenceOutcome: RequestHandler = async (req, res): Promise<void> => {
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
    const offence = this.offenceService.getSessionOffence(req.session, nomsId, courtCaseReference, chargeUuid)
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
    const backLink = `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/offences/${chargeUuid}/offence-outcome?submitToEditOffence=true`
    return res.render('pages/sentencing/cannot-remove-sentence-outcome', {
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

  public getConfirmationPage: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId } = req.params

    return res.render('pages/sentencing/confirmation', {
      nomsId,
    })
  }

  public getCorrectManyPeriodLengthInterrupt: RequestHandler = async (req, res): Promise<void> => {
    const {
      nomsId,
      courtCaseReference,
      chargeUuid,
      appearanceReference,
      addOrEditCourtCase,
      addOrEditCourtAppearance,
    } = req.params
    const offence = this.offenceService.getSessionOffence(req.session, nomsId, courtCaseReference, chargeUuid)
    const offenceDetails = await this.manageOffencesService.getOffenceByCode(
      offence.offenceCode,
      req.user.username,
      offence.legacyData?.offenceDescription,
    )
    return res.render('pages/sentencing/correct-many-period-length-interrupt', {
      nomsId,
      courtCaseReference,
      chargeUuid,
      appearanceReference,
      addOrEditCourtCase,
      addOrEditCourtAppearance,
      countNumber: offence.sentence?.countNumber,
      lineNumber: offence.sentence?.legacyData?.nomisLineReference,
      offenceCode: offence.offenceCode,
      offenceDescription: offenceDetails.description,
      backLink: JourneyUrls.sentencingHearing(
        nomsId,
        addOrEditCourtCase,
        courtCaseReference,
        addOrEditCourtAppearance,
        appearanceReference,
      ),
    })
  }

  public getCorrectManyPeriodLength: RequestHandler = async (req, res): Promise<void> => {
    const {
      nomsId,
      courtCaseReference,
      chargeUuid,
      appearanceReference,
      addOrEditCourtCase,
      addOrEditCourtAppearance,
    } = req.params
    const { periodLengthType, legacyCode } = req.query
    const submitQuery = this.correctManyPeriodLengthSubmitQuery(periodLengthType, legacyCode)
    const offence = this.offenceService.getSessionOffence(req.session, nomsId, courtCaseReference, chargeUuid)
    const currentPeriodLengths = offence.sentence.periodLengths?.filter(
      periodLength =>
        periodLength.periodLengthType === periodLengthType ||
        (legacyCode && periodLength.legacyData?.sentenceTermCode === legacyCode),
    )
    const correctManyPeriodLengthsForm = (req.flash('correctManyPeriodLengthsForm')[0] ||
      {}) as CorrectManyPeriodLengthsForm

    const periodLengthHeader =
      periodLengthTypeHeadings[periodLengthType as string]?.toLowerCase() ??
      currentPeriodLengths.at(0)?.legacyData?.sentenceTermDescription
    const backLink = `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/offences/${chargeUuid}/edit-offence`
    const offenceHint = await this.getOffenceHint(offence, req.user.username)
    return res.render('pages/sentencing/correct-many-period-length', {
      nomsId,
      courtCaseReference,
      chargeUuid,
      appearanceReference,
      addOrEditCourtCase,
      addOrEditCourtAppearance,
      submitQuery,
      legacyCode,
      periodLengthHeader,
      currentPeriodLengths,
      errors: req.flash('errors') || [],
      correctManyPeriodLengthsForm,
      backLink,
      offenceHint,
    })
  }

  public submitCorrectManyPeriodLength: RequestHandler = async (req, res): Promise<void> => {
    const {
      nomsId,
      courtCaseReference,
      chargeUuid,
      appearanceReference,
      addOrEditCourtCase,
      addOrEditCourtAppearance,
    } = req.params
    const { periodLengthType, legacyCode } = req.query
    const submitQuery = this.correctManyPeriodLengthSubmitQuery(periodLengthType, legacyCode)
    const correctManyPeriodLengthsForm = trimForm<CorrectManyPeriodLengthsForm>(req.body)
    const errors = this.offenceService.correctManyPeriodLengths(
      req.session,
      nomsId,
      courtCaseReference,
      correctManyPeriodLengthsForm,
      periodLengthType as string,
      legacyCode as string,
      chargeUuid,
    )
    if (errors.length > 0) {
      req.flash('errors', errors)
      req.flash('correctManyPeriodLengthsForm', { ...correctManyPeriodLengthsForm })
      return res.redirect(
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/offences/${chargeUuid}/correct-many-period-length${submitQuery.length > 0 ? `${submitQuery}&hasErrors=true` : '?hasErrors=true'}`,
      )
    }

    return res.redirect(
      `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/offences/${chargeUuid}/edit-offence`,
    )
  }

  public getAlternativeCorrectManyPeriodLength: RequestHandler = async (req, res): Promise<void> => {
    const {
      nomsId,
      courtCaseReference,
      chargeUuid,
      appearanceReference,
      addOrEditCourtCase,
      addOrEditCourtAppearance,
    } = req.params
    const { periodLengthType, legacyCode } = req.query
    const submitQuery = this.correctManyPeriodLengthSubmitQuery(periodLengthType, legacyCode)
    const { sentence } = this.offenceService.getSessionOffence(req.session, nomsId, courtCaseReference, chargeUuid)

    const correctAlternativeManyPeriodLengthsForm = (req.flash('correctAlternativeManyPeriodLengthsForm')[0] ||
      {}) as CorrectAlternativeManyPeriodLengthsForm

    const currentPeriodLength = sentence.periodLengths?.find(
      periodLength =>
        periodLength.periodLengthType === periodLengthType ||
        (legacyCode && periodLength.legacyData?.sentenceTermCode === legacyCode),
    )
    const periodLengthHeader =
      periodLengthTypeHeadings[periodLengthType as string]?.toLowerCase() ??
      currentPeriodLength?.legacyData?.sentenceTermDescription

    return res.render('pages/sentencing/correct-many-alternative-period-length', {
      nomsId,
      courtCaseReference,
      chargeUuid,
      appearanceReference,
      addOrEditCourtCase,
      addOrEditCourtAppearance,
      correctAlternativeManyPeriodLengthsForm,
      errors: req.flash('errors') || [],
      backLink: `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/offences/${chargeUuid}/correct-many-period-length${submitQuery}`,
      submitQuery,
      periodLengthHeader,
    })
  }

  public submitAlternativeCorrectManyPeriodLength: RequestHandler = async (req, res): Promise<void> => {
    const {
      nomsId,
      courtCaseReference,
      chargeUuid,
      appearanceReference,
      addOrEditCourtCase,
      addOrEditCourtAppearance,
    } = req.params
    const { periodLengthType, legacyCode } = req.query
    const submitQuery = this.correctManyPeriodLengthSubmitQuery(periodLengthType, legacyCode)
    const correctAlternativeManyPeriodLengthsForm = trimForm<CorrectAlternativeManyPeriodLengthsForm>(req.body)
    const errors = this.offenceService.correctManyAlternativePeriodLength(
      req.session,
      nomsId,
      courtCaseReference,
      correctAlternativeManyPeriodLengthsForm,
      periodLengthType as string,
      legacyCode as string,
      chargeUuid,
    )
    if (errors.length > 0) {
      req.flash('errors', errors)
      req.flash('correctAlternativeManyPeriodLengthsForm', { ...correctAlternativeManyPeriodLengthsForm })
      return res.redirect(
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/offences/${chargeUuid}/correct-many-alternative-period-length${submitQuery.length > 0 ? `${submitQuery}&hasErrors=true` : '?hasErrors=true'}`,
      )
    }
    return res.redirect(
      `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/offences/${chargeUuid}/edit-offence`,
    )
  }

  private correctManyPeriodLengthSubmitQuery(periodLengthType, legacyCode): string {
    const submitQueries: string[] = [`periodLengthType=${periodLengthType}`]
    if (legacyCode) {
      submitQueries.push(`legacyCode=${legacyCode}`)
    }
    return `?${submitQueries.join('&')}`
  }

  public getSentences: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId } = req.params
    const sentenceEnvelopes = await this.remandAndSentencingService.getSentenceEnvelopes(nomsId, req.user.username)
    const chargeDescriptions: [string, string][] = Array.from(
      new Set(
        sentenceEnvelopes.sentenceEnvelopes
          .flatMap(sentenceEnvelope => sentenceEnvelope.sentences)
          .map(sentence => [sentence.offenceCode, sentence.offenceDescription]),
      ),
    )
    const chargeCodes = chargeDescriptions.map(([offenceCode]) => offenceCode)
    const courtIds = sentenceEnvelopes.sentenceEnvelopes
      .flatMap(sentenceEnvelope => sentenceEnvelope.sentences)
      .flatMap(sentence => [sentence.courtCode, sentence.mergedFromCase?.courtCode])
    const [offenceMap, courtMap] = await Promise.all([
      this.manageOffencesService.getOffenceMap(Array.from(new Set(chargeCodes)), req.user.username, chargeDescriptions),
      this.courtRegisterService.getCourtMap(Array.from(new Set(courtIds)), req.user.username),
    ])

    const consecutiveToSentenceDetailsMap = Object.fromEntries(
      sentenceEnvelopes.sentenceEnvelopes
        .flatMap(sentenceEnvelope => sentenceEnvelope.sentences)
        .map(sentence => {
          return [
            sentence.sentenceUuid,
            {
              countNumber: sentence.countNumber,
              lineNumber: sentence.lineNumber,
            },
          ]
        }),
    )
    const sentenceRows = sentenceEnvelopes.sentenceEnvelopes
      .sort((a, b) => sortByDateDesc(a.envelopeStartDate, b.envelopeStartDate))
      .flatMap(sentenceEnvelope => {
        return sentenceEnvelope.sentences
          .sort((a, b) => a.orderInChain - b.orderInChain)
          .map(sentence => [
            {
              text: dayjs(sentence.appearanceDate).format(config.dateFormat),
            },
            {
              text: sentence.caseReference ?? 'Not entered',
            },
            {
              text: sentence.countNumber ? `Count ${sentence.countNumber}` : `Line ${sentence.lineNumber}`,
            },
            {
              text: sentence.sentenceTypeDescription,
            },
            {
              text: this.consecutiveOrConcurrentDescription(sentence, consecutiveToSentenceDetailsMap),
            },
            {
              html: `<a href="/person/${nomsId}/view-sentence/${sentence.sentenceUuid}" class="govuk-link--no-visited-state">View details</a>`,
            },
          ])
      })

    return res.render('pages/sentenceEnvelopes', {
      nomsId,
      offenceMap,
      courtMap,
      sentenceRows,
      consecutiveToSentenceDetailsMap,
    })
  }

  public getSentenceDetails: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, sentenceUuid } = req.params
    const sentenceDetails = await this.remandAndSentencingService.getSentenceDetails(sentenceUuid, req.user.username)
    const offenceDescriptions: [string, string][] = [
      [sentenceDetails.charge.offenceCode, sentenceDetails.charge.legacyData?.offenceDescription],
    ]
    let sentenceConsecutiveToDetails: SentenceConsecutiveToDetails
    const courtCodes = [sentenceDetails.charge.mergedFromCase?.courtCode]
    const offenceCodes = [sentenceDetails.charge.offenceCode]
    if (sentenceDetails.consecutiveToSentenceUuid) {
      sentenceConsecutiveToDetails = (
        await this.remandAndSentencingService.getConsecutiveToDetails(
          [sentenceDetails.consecutiveToSentenceUuid],
          req.user.username,
        )
      ).sentences.find(
        consecutiveToSentence => consecutiveToSentence.sentenceUuid === sentenceDetails.consecutiveToSentenceUuid,
      )
      offenceDescriptions.push([
        sentenceConsecutiveToDetails.offenceCode,
        sentenceConsecutiveToDetails.chargeLegacyData?.offenceDescription,
      ])
      courtCodes.push(sentenceConsecutiveToDetails.courtCode)
      offenceCodes.push(sentenceConsecutiveToDetails.offenceCode)
    }
    const [offenceMap, courtMap] = await Promise.all([
      this.manageOffencesService.getOffenceMap(offenceCodes, req.user.username, offenceDescriptions),
      this.courtRegisterService.getCourtMap(courtCodes, req.user.username),
    ])
    let consecutiveToDetails: ConsecutiveToDetails
    if (sentenceConsecutiveToDetails) {
      consecutiveToDetails = {
        countNumber: sentenceConsecutiveToDetails.countNumber,
        offenceCode: sentenceConsecutiveToDetails.offenceCode,
        offenceDescription: offenceMap[sentenceConsecutiveToDetails.offenceCode],
        courtCaseReference: sentenceConsecutiveToDetails.courtCaseReference,
        courtName: courtMap[sentenceConsecutiveToDetails.courtCode],
        warrantDate: dayjs(sentenceConsecutiveToDetails.appearanceDate).format(config.dateFormat),
        offenceStartDate:
          sentenceConsecutiveToDetails.offenceStartDate &&
          dayjs(sentenceConsecutiveToDetails.offenceStartDate).format(config.dateFormat),
        offenceEndDate:
          sentenceConsecutiveToDetails.offenceEndDate &&
          dayjs(sentenceConsecutiveToDetails.offenceEndDate).format(config.dateFormat),
      }
    }
    return res.render('pages/sentence/details', {
      nomsId,
      offenceMap,
      courtMap,
      consecutiveToDetails,
      sentenceDetails,
      periodLengths: sentenceDetails.periodLengths.map(periodLength => periodLengthToSentenceLength(periodLength)),
      backLink: `/person/${nomsId}/view-sentences`,
    })
  }

  private consecutiveOrConcurrentDescription(
    sentence: PrisonerSentenceEnvelopeSentence,
    consecutiveToSentenceDetailsMap: { [sentenceUuid: string]: { countNumber?: string; lineNumber?: string } },
  ): string {
    let description
    if (sentence.sentenceServeType === 'CONSECUTIVE' && sentence.consecutiveToSentenceUuid) {
      const consecutiveSentence = consecutiveToSentenceDetailsMap[sentence.consecutiveToSentenceUuid]
      description = consecutiveSentence.countNumber
        ? `Count ${consecutiveSentence.countNumber}`
        : `Line ${consecutiveSentence.lineNumber}`
    } else {
      description = `(${convertToTitleCase(sentence.sentenceServeType)})`
    }
    return description
  }
}
