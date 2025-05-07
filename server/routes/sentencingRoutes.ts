import { RequestHandler } from 'express'
import type { FirstSentenceConsecutiveToForm, SentenceIsSentenceConsecutiveToForm } from 'forms'
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

export default class SentencingRoutes extends BaseRoutes {
  constructor(
    courtAppearanceService: CourtAppearanceService,
    offenceService: OffenceService,
    private readonly manageOffencesService: ManageOffencesService,
    private readonly remandAndSentencingService: RemandAndSentencingService,
    private readonly courtRegisterService: CourtRegisterService,
  ) {
    super(courtAppearanceService, offenceService)
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
      sentenceIsSentenceConsecutiveToForm,
    )

    if (errors.length > 0) {
      req.flash('errors', errors)
      req.flash('sentenceIsSentenceConsecutiveToForm', { ...sentenceIsSentenceConsecutiveToForm })
      return res.redirect(
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/SENTENCING/offences/${offenceReference}/is-sentence-consecutive-to${submitToEditOffence ? '?submitToEditOffence=true' : ''}`,
      )
    }

    if (sentenceIsSentenceConsecutiveToForm.isSentenceConsecutiveToAnotherCase === 'true') {
      this.offenceService.setSentenceServeType(req.session, nomsId, courtCaseReference, {
        sentenceServeType: extractKeyValue(sentenceServeTypes, sentenceServeTypes.CONSECUTIVE),
      })
      return res.redirect(
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/SENTENCING/offences/${offenceReference}/first-sentence-consecutive-to${submitToEditOffence ? '?submitToEditOffence=true' : ''}`,
      )
    }

    this.offenceService.setSentenceServeType(req.session, nomsId, courtCaseReference, {
      sentenceServeType: extractKeyValue(sentenceServeTypes, sentenceServeTypes.FORTHWITH),
    })
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

    let backLink = `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/SENTENCING/offences/${offenceReference}/is-sentence-consecutive-to`
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
      firstSentenceConsecutiveToForm,
    )

    if (errors.length > 0) {
      req.flash('errors', errors)
      req.flash('firstSentenceConsecutiveToForm', { ...firstSentenceConsecutiveToForm })
      return res.redirect(
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/SENTENCING/offences/${offenceReference}/first-sentence-consecutive-to${submitToEditOffence ? '?submitToEditOffence=true' : ''}`,
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
}
