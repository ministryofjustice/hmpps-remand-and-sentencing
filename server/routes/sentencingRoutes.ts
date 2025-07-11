import { RequestHandler } from 'express'
import type {
  FirstSentenceConsecutiveToForm,
  SentenceConsecutiveToForm,
  SentenceIsSentenceConsecutiveToForm,
} from 'forms'
import dayjs from 'dayjs'
import OffenceService from '../services/offenceService'
import sentenceTypePeriodLengths from '../resources/sentenceTypePeriodLengths'
import BaseRoutes from './baseRoutes'
import CourtAppearanceService from '../services/courtAppearanceService'
import ManageOffencesService from '../services/manageOffencesService'
import trimForm from '../utils/trim'
import sentenceServeTypes from '../resources/sentenceServeTypes'
import { extractKeyValue } from '../utils/utils'
import RemandAndSentencingService from '../services/remandAndSentencingService'
import CourtRegisterService from '../services/courtRegisterService'

import { pageCourtCaseAppearanceToCourtAppearance } from '../utils/mappingUtils'
import AppearanceOutcomeService from '../services/appearanceOutcomeService'
import OffenceOutcomeService from '../services/offenceOutcomeService'
import CalculateReleaseDatesService from '../services/calculateReleaseDatesService'
import SameCaseSentenceToChainTo from './data/SameCaseSentenceToChainTo'

export default class SentencingRoutes extends BaseRoutes {
  constructor(
    courtAppearanceService: CourtAppearanceService,
    offenceService: OffenceService,
    remandAndSentencingService: RemandAndSentencingService,
    private readonly manageOffencesService: ManageOffencesService,
    private readonly appearanceOutcomeService: AppearanceOutcomeService,
    private readonly courtRegisterService: CourtRegisterService,
    private readonly calculateReleaseDatesService: CalculateReleaseDatesService,
    private readonly offenceOutcomeService: OffenceOutcomeService,
  ) {
    super(courtAppearanceService, offenceService, remandAndSentencingService)
  }

  public getIsSentenceConsecutiveTo: RequestHandler = async (req, res): Promise<void> => {
    const {
      nomsId,
      courtCaseReference,
      offenceReference,
      appearanceReference,
      addOrEditCourtCase,
      addOrEditCourtAppearance,
    } = req.params
    const { submitToEditOffence } = req.query
    const offence = this.getSessionOffenceOrAppearanceOffence(req, nomsId, courtCaseReference, offenceReference)
    const offenceDetails = await this.manageOffencesService.getOffenceByCode(offence.offenceCode, req.user.token)
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

    let backLink = `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/offences/${offenceReference}/sentence-type`
    if (submitToEditOffence) {
      backLink = `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/offences/${offenceReference}/edit-offence`
    } else if (sentence?.sentenceTypeClassification === 'FINE') {
      backLink = `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/offences/${offenceReference}/fine-amount`
    } else if (expectedPeriodLengthsSize) {
      backLink = `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/offences/${offenceReference}/period-length?periodLengthType=${
        sentenceTypePeriodLengths[sentence.sentenceTypeClassification].periodLengths[expectedPeriodLengthsSize - 1].type
      }`
    }
    return res.render('pages/sentencing/is-sentence-consecutive-to', {
      nomsId,
      courtCaseReference,
      offenceReference,
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
      offenceReference,
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
      offenceReference,
      sentenceIsSentenceConsecutiveToForm,
    )

    if (errors.length > 0) {
      req.flash('errors', errors)
      req.flash('sentenceIsSentenceConsecutiveToForm', { ...sentenceIsSentenceConsecutiveToForm })
      return res.redirect(
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/sentencing/offences/${offenceReference}/is-sentence-consecutive-to${submitToEditOffence ? '?submitToEditOffence=true' : ''}`,
      )
    }

    if (sentenceIsSentenceConsecutiveToForm.isSentenceConsecutiveToAnotherCase === 'true') {
      this.offenceService.setSentenceServeType(
        req.session,
        nomsId,
        courtCaseReference,
        offenceReference,
        {
          sentenceServeType: extractKeyValue(sentenceServeTypes, sentenceServeTypes.CONSECUTIVE),
        },
        null,
        false,
      )
      return res.redirect(
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/sentencing/offences/${offenceReference}/first-sentence-consecutive-to${submitToEditOffence ? '?submitToEditOffence=true' : ''}`,
      )
    }

    this.offenceService.setSentenceServeType(
      req.session,
      nomsId,
      courtCaseReference,
      offenceReference,
      {
        sentenceServeType: extractKeyValue(sentenceServeTypes, sentenceServeTypes.FORTHWITH),
      },
      null,
      false,
    )
    if (submitToEditOffence) {
      return res.redirect(
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/offences/${offenceReference}/edit-offence`,
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
      offenceReference,
    )
  }

  public loadAppearanceDetails: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, appearanceReference, addOrEditCourtCase, addOrEditCourtAppearance } = req.params
    const { token } = res.locals.user
    const storedAppearance = await this.remandAndSentencingService.getCourtAppearanceByAppearanceUuid(
      appearanceReference,
      token,
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
    const { token } = res.locals.user
    if (!this.courtAppearanceService.sessionCourtAppearanceExists(req.session, nomsId, appearanceReference)) {
      const storedAppearance = await this.remandAndSentencingService.getCourtAppearanceByAppearanceUuid(
        appearanceReference,
        token,
      )
      this.offenceService.clearOffence(req.session, nomsId, courtCaseReference)
      this.courtAppearanceService.setSessionCourtAppearance(
        req.session,
        nomsId,
        pageCourtCaseAppearanceToCourtAppearance(storedAppearance),
      )
    }

    const appearance = this.courtAppearanceService.getSessionCourtAppearance(req.session, nomsId)
    const consecutiveToSentenceDetails = await this.getSessionConsecutiveToSentenceDetails(req, nomsId)
    const chargeCodes = appearance.offences
      .map(offences => offences.offenceCode)
      .concat(consecutiveToSentenceDetails.sentences.map(consecutiveToDetails => consecutiveToDetails.offenceCode))
    const courtIds = [appearance.courtCode, appearance.nextHearingCourtCode]
      .concat(consecutiveToSentenceDetails.sentences.map(consecutiveToDetails => consecutiveToDetails.courtCode))
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
    const { offences } = appearance
    const [
      offenceMap,
      courtMap,
      sentenceTypeMap,
      overallCaseOutcome,
      outcomeMap,
      appearanceTypeDescription,
      overallSentenceLengthComparison,
    ] = await Promise.all([
      this.manageOffencesService.getOffenceMap(Array.from(new Set(chargeCodes)), req.user.token),
      this.courtRegisterService.getCourtMap(Array.from(new Set(courtIds)), req.user.username),
      this.remandAndSentencingService.getSentenceTypeMap(Array.from(new Set(sentenceTypeIds)), req.user.username),
      outcomePromise,
      this.offenceOutcomeService.getOutcomeMap(Array.from(new Set(offenceOutcomeIds)), req.user.username),
      appearanceTypePromise,
      this.calculateReleaseDatesService.compareOverallSentenceLength(appearance, req.user.username),
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
      consecutiveToSentenceDetails,
      offenceMap,
      courtMap,
    )

    const sessionConsecutiveToSentenceDetailsMap = this.getSessionConsecutiveToSentenceDetailsMap(
      req,
      nomsId,
      offenceMap,
    )
    return res.render('pages/sentencing/appearance-details', {
      nomsId,
      courtCaseReference,
      appearanceReference,
      addOrEditCourtCase,
      addOrEditCourtAppearance,
      appearance,
      offenceMap,
      courtMap,
      sentenceTypeMap,
      overallCaseOutcome,
      outcomeMap,
      appearanceTypeDescription,
      overallSentenceLengthComparison,
      custodialOffences,
      nonCustodialOffences,
      consecutiveToSentenceDetailsMap,
      sessionConsecutiveToSentenceDetailsMap,
      backLink: `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/details`,
    })
  }

  public submitAppearanceDetailsEdit: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, appearanceReference, addOrEditCourtCase, addOrEditCourtAppearance } = req.params
    const courtAppearance = this.courtAppearanceService.getSessionCourtAppearance(req.session, nomsId)
    if (courtAppearance.hasOverallSentenceLength === 'true') {
      const overallSentenceComparison = await this.calculateReleaseDatesService.compareOverallSentenceLength(
        courtAppearance,
        req.user.username,
      )
      if (
        overallSentenceComparison.custodialLengthMatches === false ||
        overallSentenceComparison.licenseLengthMatches === false
      ) {
        return res.redirect(
          `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/sentencing/sentence-length-mismatch`,
        )
      }
    }
    return this.updateCourtAppearance(req, res, nomsId, addOrEditCourtCase, courtCaseReference, appearanceReference)
  }

  public getFirstSentenceConsecutiveTo: RequestHandler = async (req, res): Promise<void> => {
    const {
      nomsId,
      courtCaseReference,
      offenceReference,
      appearanceReference,
      addOrEditCourtCase,
      addOrEditCourtAppearance,
    } = req.params
    const { submitToEditOffence } = req.query
    const courtAppearance = this.courtAppearanceService.getSessionCourtAppearance(req.session, nomsId)
    const offence = this.getSessionOffenceOrAppearanceOffence(req, nomsId, courtCaseReference, offenceReference)
    const { sentence } = offence
    const [offenceDetails, sentencesToChainTo] = await Promise.all([
      this.manageOffencesService.getOffenceByCode(offence.offenceCode, req.user.token),
      this.remandAndSentencingService.getSentencesToChainTo(
        nomsId,
        dayjs(courtAppearance.warrantDate),
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
      this.manageOffencesService.getOffenceMap(offenceCodes, req.user.token),
      this.courtRegisterService.getCourtMap(courtCodes, req.user.username),
    ])

    let backLink = `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/sentencing/offences/${offenceReference}/is-sentence-consecutive-to`
    if (submitToEditOffence) {
      backLink = `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/offences/${offenceReference}/edit-offence`
    }
    return res.render('pages/sentencing/first-sentence-consecutive-to', {
      nomsId,
      courtCaseReference,
      offenceReference,
      appearanceReference,
      addOrEditCourtCase,
      addOrEditCourtAppearance,
      offenceDetails,
      offence,
      firstSentenceConsecutiveToForm,
      sentencesToChainTo,
      offenceMap,
      courtMap,
      errors: req.flash('errors') || [],
      isAddOffences: this.isAddJourney(addOrEditCourtCase, addOrEditCourtAppearance),
      submitToEditOffence,
      backLink,
    })
  }

  public submitFirstSentenceConsecutiveTo: RequestHandler = async (req, res): Promise<void> => {
    const {
      nomsId,
      courtCaseReference,
      offenceReference,
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
      offenceReference,
      firstSentenceConsecutiveToForm,
    )

    if (errors.length > 0) {
      req.flash('errors', errors)
      req.flash('firstSentenceConsecutiveToForm', { ...firstSentenceConsecutiveToForm })
      return res.redirect(
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/SENTENCING/offences/${offenceReference}/first-sentence-consecutive-to${submitToEditOffence ? '?submitToEditOffence=true' : ''}`,
      )
    }
    if (submitToEditOffence) {
      return res.redirect(
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/offences/${offenceReference}/edit-offence`,
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
      offenceReference,
    )
  }

  public getSentenceConsecutiveTo: RequestHandler = async (req, res): Promise<void> => {
    const {
      nomsId,
      courtCaseReference,
      offenceReference,
      appearanceReference,
      addOrEditCourtCase,
      addOrEditCourtAppearance,
    } = req.params
    const { submitToEditOffence, invalidatedFrom } = req.query
    const courtAppearance = this.courtAppearanceService.getSessionCourtAppearance(req.session, nomsId)
    const offence = this.getSessionOffenceOrAppearanceOffence(req, nomsId, courtCaseReference, offenceReference)
    const { sentence } = offence
    const [offenceDetails, sentencesToChainTo] = await Promise.all([
      this.manageOffencesService.getOffenceByCode(offence.offenceCode, req.user.token),
      this.remandAndSentencingService.getSentencesToChainTo(
        nomsId,
        dayjs(courtAppearance.warrantDate),
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
      this.manageOffencesService.getOffenceMap(offenceCodes, req.user.token),
      this.courtRegisterService.getCourtMap(courtCodes, req.user.username),
    ])

    const sentencesOnSameCase = courtAppearance.offences
      .filter((sessionOffence, index) => index !== parseInt(offenceReference, 10) && sessionOffence.sentence)
      .map(sessionOffence => {
        return {
          countNumber: sessionOffence.sentence.countNumber,
          offenceStartDate: sessionOffence.offenceStartDate,
          offenceEndDate: sessionOffence.offenceEndDate,
          offenceCode: sessionOffence.offenceCode,
          sentenceUuid: sessionOffence.sentence.sentenceUuid,
          sentenceReference: sessionOffence.sentence.sentenceReference,
        } as unknown as SameCaseSentenceToChainTo
      })
    const submitQuery = this.queryParametersToString(submitToEditOffence, invalidatedFrom)
    let backLink = `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/offences/${offenceReference}/sentence-serve-type${submitQuery}`
    if (submitToEditOffence) {
      backLink = `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/offences/${offenceReference}/edit-offence`
    }
    return res.render('pages/sentencing/sentence-consecutive-to', {
      nomsId,
      courtCaseReference,
      offenceReference,
      appearanceReference,
      addOrEditCourtCase,
      addOrEditCourtAppearance,
      offenceDetails,
      offence,
      sentenceConsecutiveToForm,
      sentencesToChainTo,
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
      offenceReference,
      appearanceReference,
      addOrEditCourtCase,
      addOrEditCourtAppearance,
    } = req.params
    const { submitToEditOffence, invalidatedFrom } = req.query
    const submitQuery = this.queryParametersToString(submitToEditOffence, invalidatedFrom)
    const sentenceConsecutiveToForm = trimForm<SentenceConsecutiveToForm>(req.body)
    const errors = this.offenceService.setSentenceConsecutiveTo(
      req.session,
      nomsId,
      courtCaseReference,
      offenceReference,
      sentenceConsecutiveToForm,
    )

    if (errors.length > 0) {
      req.flash('errors', errors)
      req.flash('sentenceConsecutiveToForm', { ...sentenceConsecutiveToForm })
      return res.redirect(
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/SENTENCING/offences/${offenceReference}/sentence-consecutive-to${submitQuery}`,
      )
    }
    if (submitToEditOffence) {
      return res.redirect(
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/offences/${offenceReference}/edit-offence`,
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
      offenceReference,
    )
  }

  public getMakingSentenceConcurrent: RequestHandler = async (req, res): Promise<void> => {
    const {
      nomsId,
      courtCaseReference,
      offenceReference,
      appearanceReference,
      addOrEditCourtCase,
      addOrEditCourtAppearance,
    } = req.params
    const { submitToEditOffence } = req.query
    const offence = this.getSessionOffenceOrAppearanceOffence(req, nomsId, courtCaseReference, offenceReference)
    const offenceDetails = await this.manageOffencesService.getOffenceByCode(offence.offenceCode, req.user.token)
    const backLink = `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/offences/${offenceReference}/sentence-serve-type${submitToEditOffence ? '?submitToEditOffence=true' : ''}`
    return res.render('pages/sentencing/making-sentence-concurrent', {
      nomsId,
      courtCaseReference,
      offenceReference,
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
      offenceReference,
      appearanceReference,
      addOrEditCourtCase,
      addOrEditCourtAppearance,
    } = req.params
    const { submitToEditOffence } = req.query
    const offence = this.getSessionOffenceOrAppearanceOffence(req, nomsId, courtCaseReference, offenceReference)
    const offenceDetails = await this.manageOffencesService.getOffenceByCode(offence.offenceCode, req.user.token)
    const backLink = `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/offences/${offenceReference}/sentence-serve-type${submitToEditOffence ? '?submitToEditOffence=true' : ''}`
    return res.render('pages/sentencing/making-sentence-forthwith', {
      nomsId,
      courtCaseReference,
      offenceReference,
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
      offenceReference,
      appearanceReference,
      addOrEditCourtCase,
      addOrEditCourtAppearance,
    } = req.params
    const { submitToEditOffence } = req.query
    const offence = this.getSessionOffenceOrAppearanceOffence(req, nomsId, courtCaseReference, offenceReference)
    const offenceDetails = await this.manageOffencesService.getOffenceByCode(offence.offenceCode, req.user.token)
    const backLink = `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/offences/${offenceReference}/sentence-serve-type${submitToEditOffence ? '?submitToEditOffence=true' : ''}`
    return res.render('pages/sentencing/making-sentence-consecutive', {
      nomsId,
      courtCaseReference,
      offenceReference,
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
      offenceReference,
      appearanceReference,
      addOrEditCourtCase,
      addOrEditCourtAppearance,
    } = req.params
    this.offenceService.setSentenceToConcurrent(req.session, nomsId, courtCaseReference, offenceReference)
    this.courtAppearanceService.setSentenceToConcurrent(req.session, nomsId, parseInt(offenceReference, 10))
    return res.redirect(
      `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/offences/${offenceReference}/edit-offence`,
    )
  }

  public continueMakingSentenceForthwith: RequestHandler = async (req, res): Promise<void> => {
    const {
      nomsId,
      courtCaseReference,
      offenceReference,
      appearanceReference,
      addOrEditCourtCase,
      addOrEditCourtAppearance,
    } = req.params
    this.offenceService.setSentenceToForthwith(req.session, nomsId, courtCaseReference, offenceReference)
    this.courtAppearanceService.setSentenceToForthwith(req.session, nomsId, parseInt(offenceReference, 10))
    return res.redirect(
      `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/offences/${offenceReference}/edit-offence`,
    )
  }

  public continueMakingSentenceConsecutive: RequestHandler = async (req, res): Promise<void> => {
    const {
      nomsId,
      courtCaseReference,
      offenceReference,
      appearanceReference,
      addOrEditCourtCase,
      addOrEditCourtAppearance,
    } = req.params
    this.offenceService.setSentenceToConsecutive(req.session, nomsId, courtCaseReference, offenceReference)
    this.courtAppearanceService.setSentenceToConsecutive(req.session, nomsId, parseInt(offenceReference, 10))
    return res.redirect(
      `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/sentencing/offences/${offenceReference}/sentence-consecutive-to?submitToEditOffence=true`,
    )
  }

  public getCourtDocumentsPage: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, appearanceReference, addOrEditCourtCase, addOrEditCourtAppearance } = req.params
    const courtAppearance = this.courtAppearanceService.getSessionCourtAppearance(req.session, nomsId)
    const uploadedDocuments = this.courtAppearanceService.getUploadedDocuments(req.session, nomsId)
    return res.render('pages/sentencing/upload-court-documents', {
      nomsId,
      courtCaseReference,
      appearanceReference,
      addOrEditCourtCase,
      addOrEditCourtAppearance,
      courtAppearance,
      uploadedDocuments,
      backLink: `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/task-list`,
    })
  }

  public submitCourtDocuments: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, appearanceReference, addOrEditCourtCase, addOrEditCourtAppearance } = req.params
    this.courtAppearanceService.setDocumentUploadedTrue(req.session, nomsId)
    return res.redirect(
      `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/task-list`,
    )
  }

  public getSentenceLengthMismatch: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, appearanceReference, addOrEditCourtCase, addOrEditCourtAppearance } = req.params
    const courtAppearance = this.courtAppearanceService.getSessionCourtAppearance(req.session, nomsId)

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
      offenceReference,
      appearanceReference,
      addOrEditCourtCase,
      addOrEditCourtAppearance,
    } = req.params
    const { submitToEditOffence } = req.query
    const offence = this.getSessionOffenceOrAppearanceOffence(req, nomsId, courtCaseReference, offenceReference)
    const offenceDetails = await this.manageOffencesService.getOffenceByCode(offence.offenceCode, req.user.token)
    const backLink = `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/offences/${offenceReference}/delete-offence`
    return res.render('pages/sentencing/delete-sentence-in-chain', {
      nomsId,
      courtCaseReference,
      offenceReference,
      appearanceReference,
      addOrEditCourtCase,
      addOrEditCourtAppearance,
      offenceDetails,
      offence,
      submitToEditOffence,
      backLink,
    })
  }

  public continueDeleteSentenceInChain: RequestHandler = async (req, res): Promise<void> => {
    const {
      nomsId,
      courtCaseReference,
      offenceReference,
      appearanceReference,
      addOrEditCourtCase,
      addOrEditCourtAppearance,
    } = req.params
    this.courtAppearanceService.deleteSentenceInChain(req.session, nomsId, parseInt(offenceReference, 10))

    if (this.isEditJourney(addOrEditCourtCase, addOrEditCourtAppearance)) {
      const warrantType = this.courtAppearanceService.getWarrantType(req.session, nomsId)
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
      offenceReference,
      appearanceReference,
      addOrEditCourtCase,
      addOrEditCourtAppearance,
    } = req.params
    const courtAppearance = this.courtAppearanceService.getSessionCourtAppearance(req.session, nomsId)
    const offence = courtAppearance.offences[parseInt(offenceReference, 10)]
    if (offence.sentence?.sentenceUuid) {
      const hasSentencesAfter = await this.remandAndSentencingService.hasSentenceAfterOnOtherCourtAppearance(
        offence.sentence.sentenceUuid,
        req.user.username,
      )
      if (hasSentencesAfter.hasSentenceAfterOnOtherCourtAppearance) {
        return res.redirect(
          `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/sentencing/offences/${offenceReference}/cannot-delete`,
        )
      }
    }
    return res.redirect(
      `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/offences/${offenceReference}/delete-offence`,
    )
  }

  public getCannotDeleteOffence: RequestHandler = async (req, res): Promise<void> => {
    const {
      nomsId,
      courtCaseReference,
      offenceReference,
      appearanceReference,
      addOrEditCourtCase,
      addOrEditCourtAppearance,
    } = req.params
    const { username, token } = req.user
    const courtAppearance = this.courtAppearanceService.getSessionCourtAppearance(req.session, nomsId)
    const offence = courtAppearance.offences[parseInt(offenceReference, 10)]
    const sentencesAfterDetails = await this.remandAndSentencingService.getSentencesAfterOnOtherCourtAppearanceDetails(
      offence.sentence.sentenceUuid,
      username,
    )
    const courtIds = Array.from(new Set(sentencesAfterDetails.appearances.map(appearance => appearance.courtCode)))
    const [courtMap, offenceDetails] = await Promise.all([
      this.courtRegisterService.getCourtMap(courtIds, username),
      this.manageOffencesService.getOffenceByCode(offence.offenceCode, token),
    ])
    const backLink = `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/sentencing/appearance-details`
    return res.render('pages/sentencing/cannot-delete-offence', {
      nomsId,
      courtCaseReference,
      offenceReference,
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
