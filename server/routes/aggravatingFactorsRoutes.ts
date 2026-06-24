import { RequestHandler } from 'express'
import {
  AggravatingFactorsFinishedAddingForm,
  OffenceWithAggravatingFactorsForm,
  SelectWhichAggravatingFactorsForm,
  // eslint-disable-next-line import/no-unresolved
} from 'forms'
// eslint-disable-next-line import/no-unresolved
import { Offence } from 'models'
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
import DocumentManagementService from '../services/documentManagementService'
import CourtRegisterService from '../services/courtRegisterService'

export default class AggravatingFactorsRoutes extends BaseRoutes {
  constructor(
    courtAppearanceService: CourtAppearanceService,
    offenceService: OffenceService,
    remandAndSentencingService: RemandAndSentencingService,
    manageOffencesService: ManageOffencesService,
    auditService: AuditService,
    documentManagementService: DocumentManagementService,
    courtRegisterService: CourtRegisterService,
    private readonly aggravatingFactorsService: AggravatingFactorsService,
  ) {
    super(
      courtAppearanceService,
      offenceService,
      remandAndSentencingService,
      manageOffencesService,
      auditService,
      documentManagementService,
      courtRegisterService,
    )
  }

  public getSelectOffenceWithAggravatedFactors: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, appearanceReference, addOrEditCourtCase, addOrEditCourtAppearance } = req.params
    const fromCheckAnswers = req.query.fromCheckAnswers === 'true'

    const courtAppearance = this.courtAppearanceService.getSessionCourtAppearance(
      req.session,
      nomsId,
      appearanceReference,
    )

    if (this.aggravatingFactorsService.getAggravatingOffenceQueue(req.session).length === 0)
      this.offenceService.setSessionOffences(req.session, nomsId, courtCaseReference, courtAppearance.offences)

    const allOffences = this.offenceService
      .getAllOffences(req.session, nomsId, courtCaseReference)
      .filter(offence => offence.sentence)

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
      .filter(entry => entry.processed)
      .map(entry => entry.chargeUuid)

    const offences = fromCheckAnswers
      ? orderedOffences.filter(
          offence =>
            !selectedChargeUuids.includes(offence.chargeUuid) && !offence.terrorRelated && !offence.foreignPowerRelated,
        )
      : orderedOffences.filter(offence => !offence.terrorRelated && !offence.foreignPowerRelated)

    let backLink = JourneyUrls.taskList(
      nomsId,
      addOrEditCourtCase,
      courtCaseReference,
      addOrEditCourtAppearance,
      appearanceReference,
    )

    if (fromCheckAnswers) {
      backLink = AggravatingFactorsJourneyUrls.checkAggravatingFactorsAnswers(
        nomsId,
        addOrEditCourtCase,
        courtCaseReference,
        addOrEditCourtAppearance,
        appearanceReference,
      )
    }

    return res.render('pages/offenceWithAggravatingFactors/select-offence-with-aggravating-factors', {
      nomsId,
      courtCaseReference,
      appearanceReference,
      addOrEditCourtCase,
      addOrEditCourtAppearance,
      aggravatingOffenceFactorForm,
      offences,
      offenceMap,
      fromCheckAnswers,
      selectedOffenceUuids: selectedChargeUuids,
      backLink,
      errors: req.flash('errors') || [],
    })
  }

  public submitSelectOffenceWithAggravatedFactors: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, appearanceReference, addOrEditCourtCase, addOrEditCourtAppearance } = req.params
    const fromCheckAnswers = req.query.fromCheckAnswers === 'true'
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
          fromCheckAnswers ? 'true' : undefined,
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
    const fromCheckAnswers: string | undefined = req.query.fromCheckAnswers === 'true' && 'true'

    const selectWhichAggravatingFactorsForm = req.flash('selectWhichAggravatingFactorsForm')[0] || {}

    let backLink = AggravatingFactorsJourneyUrls.selectOffenceWithAggravatingFactors(
      nomsId,
      addOrEditCourtCase,
      courtCaseReference,
      addOrEditCourtAppearance,
      appearanceReference,
      undefined,
      fromCheckAnswers,
    )

    const queue = this.aggravatingFactorsService.getAggravatingOffenceQueue(req.session)
    const currentIndex = queue.findIndex(e => e.chargeUuid === chargeUuid)

    if (currentIndex > 0) {
      const previousChargeUuid = queue[currentIndex - 1]?.chargeUuid
      if (previousChargeUuid) {
        backLink = AggravatingFactorsJourneyUrls.selectWhichAggravatingFactorsApply(
          nomsId,
          addOrEditCourtCase,
          courtCaseReference,
          addOrEditCourtAppearance,
          appearanceReference,
          previousChargeUuid,
          fromCheckAnswers,
        )
      }
    }

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
        undefined,
        fromCheckAnswers,
      )
    }

    if (isEditing) {
      const offenceToEdit = this.courtAppearanceService
        .getSessionCourtAppearance(req.session, nomsId, appearanceReference)
        .offences.find(o => o.chargeUuid === chargeUuid)

      if (offenceToEdit) {
        this.offenceService.setSessionOffence(req.session, nomsId, courtCaseReference, offenceToEdit)
      }
    }

    const offence = this.offenceService.getSessionOffence(req.session, nomsId, courtCaseReference, chargeUuid)

    const offenceHint = await this.getOffenceHint(offence, req.user.username)

    const { terrorRelated, foreignPowerRelated, aggravatingFactors } = offence || {}

    const aggravatingFactorsOptions = await this.remandAndSentencingService.getAllAggravatingFactors(req.user.username)

    /**
     * TEMPORARY COMPATIBILITY LOGIC
     * -----------------------------------------
     * We currently support BOTH:
     *  - legacy booleans (terrorRelated, foreignPowerRelated)
     *  - new aggravatingFactors join table
     *
     * These booleans will be removed after:
     *  - migration script moves existing data into join table
     *  - API fully supports list-based AFs
     *
     * TODO: Remove this mapping and rely ONLY on aggravatingFactors list
     */
    const selectedCodesSet = new Set<string>()

    if (terrorRelated) selectedCodesSet.add('OATC')
    if (foreignPowerRelated) selectedCodesSet.add('OAFPC')

    if (aggravatingFactors?.length) {
      aggravatingFactors.forEach(f => {
        if (f?.code) selectedCodesSet.add(f.code)
      })
    }

    const selectedFactors = Array.from(selectedCodesSet)

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
      selectedFactors, // ✅ unified source of truth
      aggravatingFactorsOptions,
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

    // ✅ Always normalise input to array
    let selected = normaliseToArray(req.body.aggravatedFactors)

    // ✅ Deduplicate using Set
    const selectedSet = new Set<string>(selected)
    selected = Array.from(selectedSet)

    console.log('selected', selected)

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
      this.isEditJourney(addOrEditCourtCase, addOrEditCourtAppearance),
    )

    if (errors.length > 0) {
      req.flash('errors', errors)
      req.flash('selectWhichAggravatingFactorsForm', { ...selectWhichAggravatingFactorsForm })

      let redirectUrl = AggravatingFactorsJourneyUrls.selectWhichAggravatingFactorsApply(
        nomsId,
        addOrEditCourtCase,
        courtCaseReference,
        addOrEditCourtAppearance,
        appearanceReference,
        chargeUuid,
        undefined,
        'true',
      )

      if (returnTo) redirectUrl += `&returnTo=${returnTo}`
      if (isEditing) redirectUrl += `&isEditing=true`

      return res.redirect(redirectUrl)
    }

    const aggravatingFactorsOptions = await this.remandAndSentencingService.getAllAggravatingFactors(req.user.username)

    const offence = this.offenceService.getSessionOffence(req.session, nomsId, courtCaseReference, chargeUuid)

    if (offence) {
      /**
       * TEMPORARY COMPATIBILITY LOGIC
       * -----------------------------------------
       * We currently support:
       *  - legacy booleans (terrorRelated, foreignPowerRelated)
       *  - new aggravatingFactors join table
       *
       * IMPORTANT:
       * - OATC and OAFPC must be stored in BOTH:
       *    1. boolean fields (for legacy support)
       *    2. aggravatingFactors list (for new model)
       *
       * This ensures smooth migration when booleans are removed.
       *
       * TODO:
       * - Remove booleans once migration script is complete
       * - Remove special handling for OATC / OAFPC
       */

      // ✅ Derive booleans
      offence.terrorRelated = selectedSet.has('OATC')
      offence.foreignPowerRelated = selectedSet.has('OAFPC')

      // ✅ Store ALL selected codes in list (INCLUDING OATC / OAFPC)
      offence.aggravatingFactors = (aggravatingFactorsOptions || []).filter(opt => selectedSet.has(opt.code))

      this.offenceService.setSessionOffence(req.session, nomsId, courtCaseReference, offence)
    }

    const nextChargeUuid = this.aggravatingFactorsService.getNextUnprocessedAggravatingOffenceId(
      req.session,
      chargeUuid,
    )

    if (!nextChargeUuid || isEditing) {
      if (returnTo === 'editOffence') {
        return res.redirect(
          `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/offences/${chargeUuid}/edit-offence?submitToEditOffence=true`,
        )
      }

      this.saveAllOffencesToAppearance(req.session, nomsId, appearanceReference, courtCaseReference)
      this.aggravatingFactorsService.clearAggravatingFactors(req.session)
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

    // ✅ Ensure always an array (avoids TS/runtime issues)
    const allOffencesInAppearance = courtAppearance.offences || []

    /**
     * TEMPORARY COMPATIBILITY LOGIC
     * -----------------------------------------
     * We currently support:
     *  - legacy booleans (terrorRelated, foreignPowerRelated)
     *  - new aggravatingFactors join table
     *
     * An offence has aggravating factors if:
     *  - either boolean is true OR
     *  - aggravatingFactors array is non-empty
     *
     * TODO:
     * - Remove boolean checks after migration completes
     * - Use only aggravatingFactors.length > 0
     */
    const hasAggravatingFactors = (o: Offence) => {
      return (
        o.terrorRelated === true ||
        o.foreignPowerRelated === true ||
        (o.aggravatingFactors && o.aggravatingFactors.length > 0)
      )
    }

    // ✅ Filter using correct unified logic
    const orderedOffences = orderOffences(
      allOffencesInAppearance.filter(hasAggravatingFactors),
    )

    const consecutiveToSentenceDetails = await this.getConsecutiveToFromApi(
      req,
      nomsId,
      appearanceReference,
    )

    const offenceCodes = Array.from(
      new Set(
        orderedOffences
          .map(o => o.offenceCode)
          .concat(
            consecutiveToSentenceDetails.sentences.map(s => s.offenceCode),
          ),
      ),
    )

    const offenceMap = await this.manageOffencesService.getOffenceMap(
      offenceCodes,
      req.user.username,
      offencesToOffenceDescriptions(courtAppearance.offences, consecutiveToSentenceDetails.sentences),
    )

    // ✅ Use SAME logic to determine "unprocessed"
    const unprocessedOffenceExists = allOffencesInAppearance.some(o => !hasAggravatingFactors(o))

    const orderedOffencesCount = orderedOffences.length

    let aggravatedFactorsText: string

    if (orderedOffencesCount === 0) {
      aggravatedFactorsText = 'There are no sentences with aggravating factors.'
    } else if (orderedOffencesCount === 1) {
      aggravatedFactorsText = 'There is 1 sentence with aggravating factors.'
    } else {
      aggravatedFactorsText = `There are ${orderedOffencesCount} sentences with aggravating factors.`
    }

    return res.render('pages/offenceWithAggravatingFactors/check-aggravating-factors-answers', {
      nomsId,
      courtCaseReference,
      appearanceReference,
      addOrEditCourtCase,
      addOrEditCourtAppearance,
      offences: orderedOffences,
      offenceMap,
      unprocessedOffenceExists,
      aggravatedFactorsText,
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
      offence,
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

    this.saveAllOffencesToAppearance(req.session, nomsId, appearanceReference, courtCaseReference)
    this.aggravatingFactorsService.clearAggravatingFactors(req.session)

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
