import { RequestHandler } from 'express'
import type { OffenceWithAggravatingFactorsForm, SelectWhichAggravatingFactorsForm } from 'forms'
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
    const courtAppearance = this.courtAppearanceService.getSessionCourtAppearance(
      req.session,
      nomsId,
      appearanceReference,
    )
    const offences = orderOffences(courtAppearance.offences)
    const consecutiveToSentenceDetails = await this.getConsecutiveToFromApi(req, nomsId, appearanceReference)
    const offenceCodes = Array.from(
      new Set(
        offences
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

    // Get any previously selected offences from session so checkboxes can be preselected
    const selectedChargeUuids = this.aggravatingFactorsService
      .getAggravatingOffenceQueue(req.session)
      .map(entry => entry.chargeUuid)

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
    const offenceHint = await this.getOffenceHint(
      this.courtAppearanceService
        .getSessionCourtAppearance(req.session, nomsId, appearanceReference)
        .offences.find(offence => offence.chargeUuid === chargeUuid),
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
    const selected = normaliseToArray((req.body as Record<string, unknown>).selectedAggravatingFactors)

    const selectWhichAggravatingFactorsForm = trimForm<SelectWhichAggravatingFactorsForm>({
      terroristConnection: selected.includes('terroristConnection'),
      foreignPower: selected.includes('foreignPower'),
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
      return res.redirect(
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/aggravating-factors/${chargeUuid}/select-which-aggravating-factors-apply?hasErrors=true`,
      )
    }

    // Redirect to next unprocessed aggravating offence or the check answers page
    const nextChargeUuid = this.aggravatingFactorsService.getNextUnprocessedAggravatingOffenceId(
      req.session,
      chargeUuid,
    )
    if (nextChargeUuid) {
      return res.redirect(
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/aggravating-factors/${nextChargeUuid}/select-which-aggravating-factors-apply`,
      )
    }
    return res.redirect(
      `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/aggravating-factors/check-aggravating-factors-answers`,
    )
  }

  public getCheckAggravateFactorsAnswers: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, appearanceReference, addOrEditCourtCase, addOrEditCourtAppearance } = req.params
    const courtAppearance = this.courtAppearanceService.getSessionCourtAppearance(
      req.session,
      nomsId,
      appearanceReference,
    )
    const offences = orderOffences(courtAppearance.offences)
    return res.render('pages/offenceWithAggravatingFactors/check-aggravating-factors-answers', {
      nomsId,
      courtCaseReference,
      appearanceReference,
      addOrEditCourtCase,
      addOrEditCourtAppearance,
      offences,
      errors: req.flash('errors') || [],
    })
  }
}
