import { RequestHandler } from 'express'
import {
  AggravatingFactorsFinishedAddingForm,
  OffenceWithAggravatingFactorsForm,
  SelectWhichAggravatingFactorsForm,
  // eslint-disable-next-line import/no-unresolved
} from 'forms'
import BaseRoutes from './baseRoutes'
import CourtAppearanceService from '../services/courtAppearanceService'
import OffenceService from '../services/offenceService'
import RemandAndSentencingService from '../services/remandAndSentencingService'
import ManageOffencesService from '../services/manageOffencesService'
import AuditService from '../services/auditService'
import { offencesToOffenceDescriptions, orderOffences } from '../utils/utils'
import trimForm, { normaliseToArray } from '../utils/trim'
import JourneyUrls from './data/JourneyUrls'
import AggravatingFactorsJourneyUrls from './data/AggravatingFactorsJourneyUrls'
import AggravatingFactorsService from '../services/aggravatingFactorsService'

export default class AggravatingFactorsRoutes extends BaseRoutes {
  constructor(
    courtAppearanceService: CourtAppearanceService,
    offenceService: OffenceService,
    remandAndSentencingService: RemandAndSentencingService,
    manageOffencesService: ManageOffencesService,
    auditService: AuditService,
    private readonly aggravatingFactorsService: AggravatingFactorsService,
  ) {
    super(courtAppearanceService, offenceService, remandAndSentencingService, manageOffencesService, auditService)
  }

  public getSelectOffenceWithAggravatedFactors: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, appearanceReference, addOrEditCourtCase, addOrEditCourtAppearance } = req.params
    const fromCheckAnswers = req.query.fromCheckAnswers === 'true'

    const courtAppearance = this.courtAppearanceService.getSessionCourtAppearance(
      req.session,
      nomsId,
      appearanceReference,
    )

    this.offenceService.setSessionOffences(req.session, nomsId, courtCaseReference, courtAppearance.offences)
    const allOffences = this.offenceService.getAllOffences(req.session, nomsId, courtCaseReference)

    const orderedOffences = orderOffences(allOffences)

    const consecutiveToSentenceDetails = await this.getConsecutiveToFromApi(req, nomsId, appearanceReference)
    const offenceCodes = Array.from(
      new Set(
        orderedOffences
          .map(offence => offence.offenceCode)
          .concat(consecutiveToSentenceDetails.sentences.map(consecutiveToDetails => consecutiveToDetails.offenceCode)),
      ),
    )

    const aggravatingOffenceFactorForm = req.flash('aggravatingOffenceFactorForm')[0] || {}

    const offenceMap = await this.manageOffencesService.getOffenceMap(
      offenceCodes,
      req.user.username,
      offencesToOffenceDescriptions(courtAppearance.offences, consecutiveToSentenceDetails.sentences),
    )

    const selectedChargeUuids = this.aggravatingFactorsService
      .getAggravatingOffenceQueue(req.session)
      .map(entry => entry.chargeUuid)

    const offences = fromCheckAnswers
      ? orderedOffences.filter(offence => !selectedChargeUuids.includes(offence.chargeUuid))
      : orderedOffences

    const backLink = JourneyUrls.taskList(
      nomsId,
      addOrEditCourtCase,
      courtCaseReference,
      addOrEditCourtAppearance,
      appearanceReference,
    )

    return res.render('pages/offenceWithAggravatingFactors/select-offence-with-aggravating-factors', {
      nomsId,
      courtCaseReference,
      appearanceReference,
      addOrEditCourtCase,
      addOrEditCourtAppearance,
      aggravatingOffenceFactorForm,
      offences,
      offenceMap,
      selectedOffenceUuids: selectedChargeUuids,
      backLink,
      errors: req.flash('errors') || [],
    })
  }

  public submitSelectOffenceWithAggravatedFactors: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, appearanceReference, addOrEditCourtCase, addOrEditCourtAppearance } = req.params
    const normalised = normaliseToArray(req.body.aggravatedOffenceUuids ?? req.body.aggravatedOffenceUuids)
    const offenceWithAggravatingFactorsForm = trimForm<OffenceWithAggravatingFactorsForm>({
      aggravatedOffenceUuids: normalised,
    } as unknown as Record<string, unknown>)

    const errors = this.aggravatingFactorsService.setAggravatingOffenceIds(
      req.session,
      offenceWithAggravatingFactorsForm,
    )
    if (errors.length > 0) {
      req.flash('errors', errors)
      req.flash('offenceWithAggravatingFactorsForm', { ...offenceWithAggravatingFactorsForm })
      return res.redirect(
        AggravatingFactorsJourneyUrls.selectOffenceWithAggravatingFactors(
          nomsId,
          addOrEditCourtCase,
          courtCaseReference,
          addOrEditCourtAppearance,
          appearanceReference,
          'true',
        ),
      )
    }
    const chargeUuid = this.aggravatingFactorsService.getNextUnprocessedAggravatingOffenceId(req.session, null)
    if (chargeUuid) {
      return res.redirect(
        AggravatingFactorsJourneyUrls.selectWhichAggravatingFactorsApply(
          nomsId,
          addOrEditCourtCase,
          courtCaseReference,
          addOrEditCourtAppearance,
          appearanceReference,
          chargeUuid,
        ),
      )
    }
    // No unprocessed offences — go to check answers
    return res.redirect(
      AggravatingFactorsJourneyUrls.checkAggravatingFactorsAnswers(
        nomsId,
        addOrEditCourtCase,
        courtCaseReference,
        addOrEditCourtAppearance,
        appearanceReference,
      ),
    )
  }

  public getSelectWhichAggravatingFactorsApply: RequestHandler = async (req, res): Promise<void> => {
    const {
      nomsId,
      courtCaseReference,
      appearanceReference,
      addOrEditCourtCase,
      addOrEditCourtAppearance,
      chargeUuid,
    } = req.params
    const isEditing = req.query.isEditing === 'true'
    const returnTo = (req.query.returnTo as string) || undefined
    const offenceHint = await this.getOffenceHint(
      this.offenceService.getSessionOffence(req.session, nomsId, courtCaseReference, chargeUuid),
      req.user.username,
    )
    const selectWhichAggravatingFactorsForm = req.flash('selectWhichAggravatingFactorsForm')[0] || {}
    let backLink = AggravatingFactorsJourneyUrls.selectOffenceWithAggravatingFactors(
      nomsId,
      addOrEditCourtCase,
      courtCaseReference,
      addOrEditCourtAppearance,
      appearanceReference,
    )

    if (this.aggravatingFactorsService.anyAggravatingOffencesProcessed(req.session)) {
      const lastProcessedChargeUuid = this.aggravatingFactorsService.getLastProcessedAggravatingOffenceId(
        req.session,
        chargeUuid,
      )
      backLink = AggravatingFactorsJourneyUrls.selectWhichAggravatingFactorsApply(
        nomsId,
        addOrEditCourtCase,
        courtCaseReference,
        addOrEditCourtAppearance,
        appearanceReference,
        lastProcessedChargeUuid,
      )
    }

    // If a specific return target was provided, prefer that for the back link
    if (returnTo === 'editOffence') {
      backLink = `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/offences/${chargeUuid}/load-edit-offence`
    } else if (returnTo === 'checkAnswers') {
      backLink = AggravatingFactorsJourneyUrls.checkAggravatingFactorsAnswers(
        nomsId,
        addOrEditCourtCase,
        courtCaseReference,
        addOrEditCourtAppearance,
        appearanceReference,
      )
    } else if (isEditing) {
      backLink = AggravatingFactorsJourneyUrls.checkAggravatingFactorsAnswers(
        nomsId,
        addOrEditCourtCase,
        courtCaseReference,
        addOrEditCourtAppearance,
        appearanceReference,
      )
    }

    const offence = this.offenceService.getSessionOffence(req.session, nomsId, courtCaseReference, chargeUuid)
    const { terrorRelated, foreignPowerRelated } = offence

    return res.render('pages/offenceWithAggravatingFactors/select-which-aggravating-factors-apply', {
      nomsId,
      courtCaseReference,
      appearanceReference,
      addOrEditCourtCase,
      addOrEditCourtAppearance,
      offenceHint,
      chargeUuid,
      backLink,
      selectWhichAggravatingFactorsForm,
      terrorRelated,
      foreignPowerRelated,
      isEditing,
      returnTo,
      errors: req.flash('errors') || [],
    })
  }

  public submitSelectWhichAggravatingFactorsApply: RequestHandler = async (req, res): Promise<void> => {
    const {
      nomsId,
      courtCaseReference,
      appearanceReference,
      addOrEditCourtCase,
      addOrEditCourtAppearance,
      chargeUuid,
    } = req.params
    const isEditing = req.query.isEditing === 'true'
    const returnTo = (req.query.returnTo as string) || undefined
    const selected = normaliseToArray(req.body.aggravatedFactors)

    const selectWhichAggravatingFactorsForm = trimForm<SelectWhichAggravatingFactorsForm>({
      aggravatedFactors: selected,
    } as unknown as Record<string, unknown>)

    const errors = this.aggravatingFactorsService.setAggravatingFactors(
      req.session,
      nomsId,
      courtCaseReference,
      selectWhichAggravatingFactorsForm,
      chargeUuid,
      isEditing,
    )

    if (errors.length > 0) {
      req.flash('errors', errors)
      req.flash('selectWhichAggravatingFactorsForm', { ...selectWhichAggravatingFactorsForm })
      // build redirect preserving hasErrors plus returnTo and isEditing if present
      let redirectUrl = AggravatingFactorsJourneyUrls.selectWhichAggravatingFactorsApply(
        nomsId,
        addOrEditCourtCase,
        courtCaseReference,
        addOrEditCourtAppearance,
        appearanceReference,
        chargeUuid,
        'true',
      )
      if (returnTo) {
        redirectUrl += `&returnTo=${returnTo}`
      }
      if (isEditing) {
        redirectUrl += `&isEditing=true`
      }
      return res.redirect(redirectUrl)
    }

    const nextChargeUuid = this.aggravatingFactorsService.getNextUnprocessedAggravatingOffenceId(
      req.session,
      chargeUuid,
    )

    if (!nextChargeUuid || isEditing) {
      // If we were asked to return to the edit offence screen, go straight
      // to the edit-offence page. Previously we redirected to the
      // load-edit-offence route which clears session.offences and copies
      // the court appearance offences back in; that overwrote the
      // changes we just stored on the session (eg. terrorRelated/foreignPowerRelated).
      // Redirecting directly to the edit page preserves the updated
      // session.offences so the newly selected aggravating factors are shown.
      if (returnTo === 'editOffence') {
        return res.redirect(
          `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/offences/${chargeUuid}/edit-offence?submitToEditOffence=true`,
        )
      }
      return res.redirect(
        AggravatingFactorsJourneyUrls.checkAggravatingFactorsAnswers(
          nomsId,
          addOrEditCourtCase,
          courtCaseReference,
          addOrEditCourtAppearance,
          appearanceReference,
        ),
      )
    }

    return res.redirect(
      AggravatingFactorsJourneyUrls.selectWhichAggravatingFactorsApply(
        nomsId,
        addOrEditCourtCase,
        courtCaseReference,
        addOrEditCourtAppearance,
        appearanceReference,
        nextChargeUuid,
      ),
    )
  }

  public getCheckAggravatingFactorsAnswers: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, appearanceReference, addOrEditCourtCase, addOrEditCourtAppearance } = req.params
    const courtAppearance = this.courtAppearanceService.getSessionCourtAppearance(
      req.session,
      nomsId,
      appearanceReference,
    )
    const offences = orderOffences(
      this.offenceService
        .getAllOffences(req.session, nomsId, courtCaseReference)
        .filter(offence => offence.terrorRelated === true || offence.foreignPowerRelated === true),
    )

    const consecutiveToSentenceDetails = await this.getConsecutiveToFromApi(req, nomsId, appearanceReference)

    const offenceCodes = Array.from(
      new Set(
        offences
          .map(offence => offence.offenceCode)
          .concat(consecutiveToSentenceDetails.sentences.map(consecutiveToDetails => consecutiveToDetails.offenceCode)),
      ),
    )

    const offenceMap = await this.manageOffencesService.getOffenceMap(
      offenceCodes,
      req.user.username,
      offencesToOffenceDescriptions(courtAppearance.offences, consecutiveToSentenceDetails.sentences),
    )

    return res.render('pages/offenceWithAggravatingFactors/check-aggravating-factors-answers', {
      nomsId,
      courtCaseReference,
      appearanceReference,
      addOrEditCourtCase,
      addOrEditCourtAppearance,
      offences,
      offenceMap,
      errors: req.flash('errors') || [],
    })
  }

  public submitCheckAggravatingFactorsAnswers: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, appearanceReference, addOrEditCourtCase, addOrEditCourtAppearance } = req.params
    const aggravatingFactorsFinishedAddingForm = trimForm<AggravatingFactorsFinishedAddingForm>(req.body)
    const errors = this.aggravatingFactorsService.checkFinishingAggravatingFactors(aggravatingFactorsFinishedAddingForm)
    if (errors.length > 0) {
      req.flash('errors', errors)
      return res.redirect(
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/aggravating-factors/check-aggravating-factors-answers?hasErrors=true`,
      )
    }

    const finishedAddingAggravatingFactors =
      aggravatingFactorsFinishedAddingForm.finishedAddingAggravatingFactors === 'true'

    if (finishedAddingAggravatingFactors) {
      await this.saveAllOffencesToAppearance(req.session, nomsId, appearanceReference, courtCaseReference)
      this.aggravatingFactorsService.clearAggravatingFactors(req.session)
    }

    this.courtAppearanceService.setAggravatingFactors(
      req.session,
      nomsId,
      finishedAddingAggravatingFactors,
      appearanceReference,
    )
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

  public getDeleteAggravatingFactor: RequestHandler = async (req, res): Promise<void> => {
    const {
      nomsId,
      courtCaseReference,
      appearanceReference,
      addOrEditCourtCase,
      addOrEditCourtAppearance,
      chargeUuid,
    } = req.params

    const offence = this.offenceService.getSessionOffence(req.session, nomsId, courtCaseReference, chargeUuid)

    const cancelLink = AggravatingFactorsJourneyUrls.checkAggravatingFactorsAnswers(
      nomsId,
      addOrEditCourtCase,
      courtCaseReference,
      addOrEditCourtAppearance,
      appearanceReference,
    )

    return res.render('pages/offenceWithAggravatingFactors/delete-aggravating-factor', {
      nomsId,
      courtCaseReference,
      appearanceReference,
      addOrEditCourtCase,
      addOrEditCourtAppearance,
      chargeUuid,
      terrorRelated: offence?.terrorRelated,
      foreignPowerRelated: offence?.foreignPowerRelated,
      cancelLink,
      errors: req.flash('errors') || [],
    })
  }

  public submitDeleteAggravatingFactor: RequestHandler = async (req, res): Promise<void> => {
    const {
      nomsId,
      courtCaseReference,
      appearanceReference,
      addOrEditCourtCase,
      addOrEditCourtAppearance,
      chargeUuid,
    } = req.params

    const offence = this.offenceService.getSessionOffence(req.session, nomsId, courtCaseReference, chargeUuid)
    if (offence) {
      offence.terrorRelated = null
      offence.foreignPowerRelated = null
      this.offenceService.setSessionOffence(req.session, nomsId, courtCaseReference, offence)
    }

    return res.redirect(
      AggravatingFactorsJourneyUrls.checkAggravatingFactorsAnswers(
        nomsId,
        addOrEditCourtCase,
        courtCaseReference,
        addOrEditCourtAppearance,
        appearanceReference,
      ),
    )
  }
}
