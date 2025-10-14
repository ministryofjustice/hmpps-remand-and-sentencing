import { RequestHandler } from 'express'
import type {
  FirstSentenceConsecutiveToForm,
  CorrectManyPeriodLengthsForm,
  SentenceConsecutiveToForm,
  SentenceIsSentenceConsecutiveToForm,
  CorrectAlternativeManyPeriodLengthsForm,
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
  extractKeyValue,
  getUiDocumentType,
  offencesToOffenceDescriptions,
  orderOffences,
  sentencesToChainToResponseToOffenceDescriptions,
  sortByDateDesc,
} from '../utils/utils'
import RemandAndSentencingService from '../services/remandAndSentencingService'
import CourtRegisterService from '../services/courtRegisterService'

import { pageCourtCaseAppearanceToCourtAppearance } from '../utils/mappingUtils'
import CalculateReleaseDatesService from '../services/calculateReleaseDatesService'
import {
  AppearanceToChainTo,
  SentencesToChainToResponse,
  SentenceToChainTo,
} from '../@types/remandAndSentencingApi/remandAndSentencingClientTypes'
import documentTypes from '../resources/documentTypes'
import RefDataService from '../services/refDataService'
import periodLengthTypeHeadings from '../resources/PeriodLengthTypeHeadings'
import config from '../config'

export default class SentencingRoutes extends BaseRoutes {
  constructor(
    courtAppearanceService: CourtAppearanceService,
    offenceService: OffenceService,
    remandAndSentencingService: RemandAndSentencingService,
    private readonly manageOffencesService: ManageOffencesService,
    private readonly courtRegisterService: CourtRegisterService,
    private readonly calculateReleaseDatesService: CalculateReleaseDatesService,
    private readonly refDataService: RefDataService,
  ) {
    super(courtAppearanceService, offenceService, remandAndSentencingService)
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
    const offence = this.offenceService.getSessionOffence(req.session, nomsId, courtCaseReference)
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
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/sentencing/offences/${chargeUuid}/is-sentence-consecutive-to${submitToEditOffence ? '?submitToEditOffence=true' : ''}`,
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
      `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/sentencing/appearance-details`,
    )
  }

  public getAppearanceDetails: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, appearanceReference, addOrEditCourtCase, addOrEditCourtAppearance } = req.params
    const { username } = res.locals.user
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
    const consecutiveToSentenceDetailsFromApi = await this.getConsecutiveToFromApi(req, nomsId, appearanceReference)
    const chargeCodes = appearance.offences
      .map(offences => offences.offenceCode)
      .concat(
        consecutiveToSentenceDetailsFromApi.sentences.map(consecutiveToDetails => consecutiveToDetails.offenceCode),
      )
    const courtIds = [appearance.courtCode, appearance.nextHearingCourtCode]
      .concat(consecutiveToSentenceDetailsFromApi.sentences.map(consecutiveToDetails => consecutiveToDetails.courtCode))
      .concat(appearance.offences.map(offence => offence.mergedFromCase?.courtCode))
      .filter(courtId => courtId !== undefined && courtId !== null)
    const sentenceTypeIds = appearance.offences
      .filter(offence => offence.sentence?.sentenceTypeId)
      .map(offence => offence.sentence?.sentenceTypeId)
    const offenceOutcomeIds = appearance.offences.map(offence => offence.outcomeUuid)
    const outcomePromise = appearance.appearanceOutcomeUuid
      ? this.refDataService
          .getAppearanceOutcomeByUuid(appearance.appearanceOutcomeUuid, req.user.username)
          .then(outcome => outcome.outcomeName)
      : Promise.resolve(appearance.legacyData?.outcomeDescription ?? 'Not entered')
    const appearanceTypePromise = appearance.nextHearingTypeUuid
      ? this.refDataService
          .getAppearanceTypeByUuid(appearance.nextHearingTypeUuid, req.user.username)
          .then(appearanceType => appearanceType.description)
      : Promise.resolve('Not entered')
    const { offences } = appearance
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
        offencesToOffenceDescriptions(appearance.offences, consecutiveToSentenceDetailsFromApi.sentences),
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
    const allSentenceUuids = appearance.offences
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
        documentType: getUiDocumentType(document.documentType, appearance.warrantType),
      }))

    const mergedFromText = this.getMergedFromText(
      appearance.offences?.filter(offence => offence.mergedFromCase != null).map(offence => offence.mergedFromCase),
      courtMap,
    )

    return res.render('pages/sentencing/appearance-details', {
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
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/sentencing/appearance-details`,
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
    const offence = this.offenceService.getSessionOffence(req.session, nomsId, courtCaseReference)
    const { sentence } = offence
    const [offenceDetails, sentencesToChainTo] = await Promise.all([
      this.manageOffencesService.getOffenceByCode(
        offence.offenceCode,
        req.user.username,
        offence.legacyData?.offenceDescription,
      ),
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
    return res.render('pages/sentencing/first-sentence-consecutive-to', {
      nomsId,
      courtCaseReference,
      chargeUuid,
      appearanceReference,
      addOrEditCourtCase,
      addOrEditCourtAppearance,
      offenceDetails,
      offence,
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
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/SENTENCING/offences/${chargeUuid}/first-sentence-consecutive-to${submitToEditOffence ? '?submitToEditOffence=true' : ''}`,
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
    const offence = this.offenceService.getSessionOffence(req.session, nomsId, courtCaseReference)
    const { sentence } = offence
    const [offenceDetails, sentencesToChainTo] = await Promise.all([
      this.manageOffencesService.getOffenceByCode(
        offence.offenceCode,
        req.user.username,
        offence.legacyData?.offenceDescription,
      ),
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
      offenceDetails,
      offence,
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
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/SENTENCING/offences/${chargeUuid}/sentence-consecutive-to${submitQuery}`,
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

  public getMakingSentenceConcurrent: RequestHandler = async (req, res): Promise<void> => {
    const {
      nomsId,
      courtCaseReference,
      chargeUuid,
      appearanceReference,
      addOrEditCourtCase,
      addOrEditCourtAppearance,
    } = req.params
    const { submitToEditOffence } = req.query
    const offence = this.offenceService.getSessionOffence(req.session, nomsId, courtCaseReference)
    const offenceDetails = await this.manageOffencesService.getOffenceByCode(
      offence.offenceCode,
      req.user.username,
      offence.legacyData?.offenceDescription,
    )
    const backLink = `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/offences/${chargeUuid}/sentence-serve-type${submitToEditOffence ? '?submitToEditOffence=true' : ''}`
    return res.render('pages/sentencing/making-sentence-concurrent', {
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
    })
  }

  public getMakingSentenceForthwith: RequestHandler = async (req, res): Promise<void> => {
    const {
      nomsId,
      courtCaseReference,
      chargeUuid,
      appearanceReference,
      addOrEditCourtCase,
      addOrEditCourtAppearance,
    } = req.params
    const { submitToEditOffence } = req.query
    const offence = this.offenceService.getSessionOffence(req.session, nomsId, courtCaseReference)
    const offenceDetails = await this.manageOffencesService.getOffenceByCode(
      offence.offenceCode,
      req.user.username,
      offence.legacyData?.offenceDescription,
    )
    const backLink = `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/offences/${chargeUuid}/sentence-serve-type${submitToEditOffence ? '?submitToEditOffence=true' : ''}`
    return res.render('pages/sentencing/making-sentence-forthwith', {
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
    })
  }

  public getMakingSentenceConsecutive: RequestHandler = async (req, res): Promise<void> => {
    const {
      nomsId,
      courtCaseReference,
      chargeUuid,
      appearanceReference,
      addOrEditCourtCase,
      addOrEditCourtAppearance,
    } = req.params
    const { submitToEditOffence } = req.query
    const offence = this.offenceService.getSessionOffence(req.session, nomsId, courtCaseReference)
    const offenceDetails = await this.manageOffencesService.getOffenceByCode(
      offence.offenceCode,
      req.user.username,
      offence.legacyData?.offenceDescription,
    )
    const backLink = `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/offences/${chargeUuid}/sentence-serve-type${submitToEditOffence ? '?submitToEditOffence=true' : ''}`
    return res.render('pages/sentencing/making-sentence-consecutive', {
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
    })
  }

  public continueMakingSentenceConcurrent: RequestHandler = async (req, res): Promise<void> => {
    const {
      nomsId,
      courtCaseReference,
      chargeUuid,
      appearanceReference,
      addOrEditCourtCase,
      addOrEditCourtAppearance,
    } = req.params
    this.offenceService.setSentenceToConcurrent(req.session, nomsId, courtCaseReference, chargeUuid)
    return res.redirect(
      `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/offences/${chargeUuid}/edit-offence`,
    )
  }

  public continueMakingSentenceForthwith: RequestHandler = async (req, res): Promise<void> => {
    const {
      nomsId,
      courtCaseReference,
      chargeUuid,
      appearanceReference,
      addOrEditCourtCase,
      addOrEditCourtAppearance,
    } = req.params
    this.offenceService.setSentenceToForthwith(req.session, nomsId, courtCaseReference, chargeUuid)
    return res.redirect(
      `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/offences/${chargeUuid}/edit-offence`,
    )
  }

  public continueMakingSentenceConsecutive: RequestHandler = async (req, res): Promise<void> => {
    const {
      nomsId,
      courtCaseReference,
      chargeUuid,
      appearanceReference,
      addOrEditCourtCase,
      addOrEditCourtAppearance,
    } = req.params
    this.offenceService.setSentenceToConsecutive(req.session, nomsId, courtCaseReference, chargeUuid)
    return res.redirect(
      `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/sentencing/offences/${chargeUuid}/sentence-consecutive-to?submitToEditOffence=true`,
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
        ? `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/sentencing/appearance-details`
        : `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/task-list`,
    })
  }

  public submitCourtDocuments: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, appearanceReference, addOrEditCourtCase, addOrEditCourtAppearance } = req.params
    this.courtAppearanceService.setDocumentUploadedTrue(req.session, nomsId, appearanceReference)
    return res.redirect(
      this.isEditJourney(addOrEditCourtCase, addOrEditCourtAppearance)
        ? `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/sentencing/appearance-details`
        : `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/task-list`,
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
      backLink: `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/sentencing/appearance-details`,
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
        goBackLink = `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/sentencing/appearance-details`
      } else {
        goBackLink = `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/remand/appearance-details`
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
          `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/sentencing/appearance-details`,
        )
      }
      return res.redirect(
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/remand/appearance-details`,
      )
    }
    return res.redirect(
      `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/offences/check-offence-answers`,
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
    const backLink = `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/sentencing/appearance-details`
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
    const offence = this.offenceService.getSessionOffence(req.session, nomsId, courtCaseReference)
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
    const offence = this.offenceService.getSessionOffence(req.session, nomsId, courtCaseReference)
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
      backLink: `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/sentencing/appearance-details`,
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
    const offence = this.offenceService.getSessionOffence(req.session, nomsId, courtCaseReference)
    const offenceDetails = await this.manageOffencesService.getOffenceByCode(
      offence.offenceCode,
      req.user.username,
      offence.legacyData?.offenceDescription,
    )
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
      offenceCode: offence.offenceCode,
      offenceDescription: offenceDetails.description,
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
    )
    if (errors.length > 0) {
      req.flash('errors', errors)
      req.flash('correctManyPeriodLengthsForm', { ...correctManyPeriodLengthsForm })
      return res.redirect(
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/offences/${chargeUuid}/correct-many-period-length${submitQuery}`,
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
    const { sentence } = this.offenceService.getSessionOffence(req.session, nomsId, courtCaseReference)

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
    )
    if (errors.length > 0) {
      req.flash('errors', errors)
      req.flash('correctAlternativeManyPeriodLengthsForm', { ...correctAlternativeManyPeriodLengthsForm })
      return res.redirect(
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/offences/${chargeUuid}/correct-many-alternative-period-length${submitQuery}`,
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

  public getSentenceEnvelopes: RequestHandler = async (req, res): Promise<void> => {
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
      .map(sentence => sentence.courtCode)
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
              offenceCode: sentence.offenceCode,
              offenceDescription: offenceMap[sentence.offenceCode],
              courtCaseReference: sentence.caseReference,
              courtName: courtMap[sentence.courtCode],
              warrantDate: sentence.appearanceDate,
              offenceStartDate: sentence.offenceStartDate && dayjs(sentence.offenceStartDate).format(config.dateFormat),
              offenceEndDate: sentence.offenceEndDate && dayjs(sentence.offenceEndDate).format(config.dateFormat),
            } as ConsecutiveToDetails,
          ]
        }),
    )
    const sortedSentenceEnvelopes = sentenceEnvelopes.sentenceEnvelopes
      .map(sentenceEnvelope => {
        return {
          ...sentenceEnvelope,
          sentences: sentenceEnvelope.sentences.sort((a, b) => a.orderInChain - b.orderInChain),
        }
      })
      .sort((a, b) => sortByDateDesc(a.envelopeStartDate, b.envelopeStartDate))

    return res.render('pages/sentenceEnvelopes', {
      nomsId,
      offenceMap,
      courtMap,
      sentenceEnvelopes: sortedSentenceEnvelopes,
      consecutiveToSentenceDetailsMap,
    })
  }
}
