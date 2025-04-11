import { RequestHandler } from 'express'
import type { CourtCaseCaseOutcomeAppliedAllForm, CourtCaseOverallConvictionDateForm, SentenceLengthForm } from 'forms'
import trimForm from '../utils/trim'
import CourtAppearanceService from '../services/courtAppearanceService'
import { sentenceLengthToSentenceLengthForm } from '../utils/mappingUtils'
import AppearanceOutcomeService from '../services/appearanceOutcomeService'

export default class SentencingRoutes {
  constructor(
    private readonly courtAppearanceService: CourtAppearanceService,
    private readonly appearanceOutcomeService: AppearanceOutcomeService,
  ) {}

  public getOverallSentenceLength: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, appearanceReference, addOrEditCourtCase, addOrEditCourtAppearance } = req.params
    const { submitToCheckAnswers } = req.query
    let overallSentenceLengthForm = (req.flash('overallSentenceLengthForm')[0] || {}) as SentenceLengthForm
    if (Object.keys(overallSentenceLengthForm).length === 0) {
      overallSentenceLengthForm = sentenceLengthToSentenceLengthForm(
        this.courtAppearanceService.getOverallCustodialSentenceLength(req.session, nomsId),
        this.courtAppearanceService.getHasOverallSentenceLength(req.session, nomsId),
      )
    }
    return res.render('pages/sentencing/overall-sentence-length', {
      nomsId,
      courtCaseReference,
      appearanceReference,
      addOrEditCourtCase,
      addOrEditCourtAppearance,
      submitToCheckAnswers,
      overallSentenceLengthForm,
      errors: req.flash('errors') || [],
      backLink: submitToCheckAnswers
        ? `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/check-overall-answers`
        : `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/task-list`,
    })
  }

  public submitOverallSentenceLength: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, appearanceReference, addOrEditCourtCase, addOrEditCourtAppearance } = req.params
    const { submitToCheckAnswers } = req.query
    const overallSentenceLengthForm = trimForm<SentenceLengthForm>(req.body)
    const errors = this.courtAppearanceService.setOverallSentenceLength(req.session, nomsId, overallSentenceLengthForm)
    if (errors.length > 0) {
      req.flash('errors', errors)
      req.flash('overallSentenceLengthForm', { ...overallSentenceLengthForm })
      return res.redirect(
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/SENTENCING/overall-sentence-length${submitToCheckAnswers ? '?submitToCheckAnswers=true' : ''}`,
      )
    }
    if (addOrEditCourtAppearance === 'edit-court-appearance') {
      // TODO what replaces deails?
      return res.redirect(
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/SENTENCING/details`,
      )
    }
    if (submitToCheckAnswers) {
      // TODO is this the correct check your answers?
      return res.redirect(
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/SENTENCING/check-overall-answers`,
      )
    }
    return res.redirect(
      `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/SENTENCING/overall-conviction-date`,
    )
  }

  public getOverallConvictionDate: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, appearanceReference, addOrEditCourtCase, addOrEditCourtAppearance } = req.params
    const { submitToCheckAnswers } = req.query
    const overallConvictionDateForm = (req.flash('overallConvictionDateForm')[0] ||
      {}) as CourtCaseOverallConvictionDateForm
    let overallConvictionDateDay: number | string = overallConvictionDateForm['overallConvictionDate-day']
    let overallConvictionDateMonth: number | string = overallConvictionDateForm['overallConvictionDate-month']
    let overallConvictionDateYear: number | string = overallConvictionDateForm['overallConvictionDate-year']
    let { overallConvictionDateAppliedAll } = overallConvictionDateForm
    const {
      overallConvictionDate: overallConvictionDateValue,
      overallConvictionDateAppliedAll: overallConvictionDateAppliedAllValue,
    } = this.courtAppearanceService.getSessionCourtAppearance(req.session, nomsId)
    if (overallConvictionDateValue && Object.keys(overallConvictionDateForm).length === 0) {
      const overallConvictionDate = new Date(overallConvictionDateValue)
      overallConvictionDateDay = overallConvictionDate.getDate()
      overallConvictionDateMonth = overallConvictionDate.getMonth() + 1
      overallConvictionDateYear = overallConvictionDate.getFullYear()
      overallConvictionDateAppliedAll = overallConvictionDateAppliedAllValue
    }

    let backLink = `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/SENTENCING/overall-sentence-length`
    if (addOrEditCourtAppearance === 'edit-court-appearance') {
      // TODO check
      backLink = `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/SENTENCING/details`
    } else if (submitToCheckAnswers) {
      // TODO check
      backLink = `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/SENTENCING/check-overall-answers`
    }

    return res.render('pages/sentencing/overall-conviction-date', {
      nomsId,
      submitToCheckAnswers,
      overallConvictionDateDay,
      overallConvictionDateMonth,
      overallConvictionDateYear,
      courtCaseReference,
      appearanceReference,
      addOrEditCourtCase,
      addOrEditCourtAppearance,
      overallConvictionDateAppliedAll,
      errors: req.flash('errors') || [],
      backLink,
    })
  }

  public submitOverallConvictionDate: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, appearanceReference, addOrEditCourtCase, addOrEditCourtAppearance } = req.params
    const { submitToCheckAnswers } = req.query
    const overallConvictionDateForm = trimForm<CourtCaseOverallConvictionDateForm>(req.body)
    const errors = this.courtAppearanceService.setOverallConvictionDate(req.session, nomsId, overallConvictionDateForm)
    if (errors.length > 0) {
      req.flash('errors', errors)
      req.flash('overallConvictionDateForm', { ...overallConvictionDateForm })
      return res.redirect(
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/SENTENCING/overall-conviction-date${submitToCheckAnswers ? '?submitToCheckAnswers=true' : ''}`,
      )
    }
    if (addOrEditCourtAppearance === 'edit-court-appearance') {
      return res.redirect(
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/SENTENCING/details`,
      )
    }
    if (submitToCheckAnswers) {
      return res.redirect(
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/SENTENCING/check-overall-answers`,
      )
    }
    if (this.isAddJourney(addOrEditCourtCase, addOrEditCourtAppearance)) {
      return res.redirect(
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/SENTENCING/case-outcome-applied-all`,
      )
    }
    return res.redirect(
      `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/SENTENCING/check-overall-answers`,
    )
  }

  public getCaseOutcomeAppliedAll: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, appearanceReference, addOrEditCourtCase, addOrEditCourtAppearance } = req.params
    const { submitToCheckAnswers } = req.query
    const appearanceOutcomeUuid = this.courtAppearanceService.getAppearanceOutcomeUuid(req.session, nomsId)
    const overallCaseOutcome = (
      await this.appearanceOutcomeService.getOutcomeByUuid(appearanceOutcomeUuid, req.user.username)
    ).outcomeName

    let caseOutcomeAppliedAllForm = (req.flash('caseOutcomeAppliedAllForm')[0] ||
      {}) as CourtCaseCaseOutcomeAppliedAllForm
    if (Object.keys(caseOutcomeAppliedAllForm).length === 0) {
      caseOutcomeAppliedAllForm = {
        caseOutcomeAppliedAll: this.courtAppearanceService.getCaseOutcomeAppliedAll(req.session, nomsId),
      }
    }

    let backLink = `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/SENTENCING/overall-conviction-date?backNav=true`

    if (submitToCheckAnswers) {
      backLink = `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/SENTENCING/check-overall-answers`
    }

    return res.render('pages/sentencing/case-outcome-applied-all', {
      nomsId,
      submitToCheckAnswers,
      overallCaseOutcome,
      caseOutcomeAppliedAllForm,
      courtCaseReference,
      appearanceReference,
      addOrEditCourtCase,
      addOrEditCourtAppearance,
      isAddOffences: this.isAddJourney(addOrEditCourtCase, addOrEditCourtAppearance),
      errors: req.flash('errors') || [],
      backLink,
    })
  }

  public submitCaseOutcomeAppliedAll: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, appearanceReference, addOrEditCourtCase, addOrEditCourtAppearance } = req.params
    const caseOutcomeAppliedAllForm = trimForm<CourtCaseCaseOutcomeAppliedAllForm>(req.body)
    const { submitToCheckAnswers } = req.query
    const errors = this.courtAppearanceService.setCaseOutcomeAppliedAll(req.session, nomsId, caseOutcomeAppliedAllForm)
    if (errors.length > 0) {
      req.flash('errors', errors)
      req.flash('caseOutcomeAppliedAllForm', { ...caseOutcomeAppliedAllForm })
      return res.redirect(
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/SENTENCING/case-outcome-applied-all${submitToCheckAnswers ? '?submitToCheckAnswers=true' : ''}`,
      )
    }
    return res.redirect(
      `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/SENTENCING/check-overall-answers`,
    )
  }

  public getCheckOverallAnswers: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, appearanceReference, addOrEditCourtCase, addOrEditCourtAppearance } = req.params
    const courtAppearance = this.courtAppearanceService.getSessionCourtAppearance(req.session, nomsId)
    const appearanceOutcomeUuid = this.courtAppearanceService.getAppearanceOutcomeUuid(req.session, nomsId)
    const overallCaseOutcome = (
      await this.appearanceOutcomeService.getOutcomeByUuid(appearanceOutcomeUuid, req.user.username)
    ).outcomeName
    const isAddJourney = this.isAddJourney(addOrEditCourtCase, addOrEditCourtAppearance)
    let backLink = `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/sentencing/overall-conviction-date`
    if (isAddJourney) {
      backLink = `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/sentencing/case-outcome-applied-sentencing`
    }
    return res.render('pages/sentencing/check-overall-answers', {
      nomsId,
      courtAppearance,
      courtCaseReference,
      appearanceReference,
      overallCaseOutcome,
      addOrEditCourtCase,
      addOrEditCourtAppearance,
      isAddJourney,
      backLink,
    })
  }

  // TODO change urls
  public submitCheckOverallAnswers: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, appearanceReference, addOrEditCourtCase, addOrEditCourtAppearance } = req.params
    const courtAppearance = this.courtAppearanceService.getSessionCourtAppearance(req.session, nomsId)
    if (courtAppearance.offences.length) {
      if (res.locals.isAddCourtCase) {
        return res.redirect(
          `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/offences/check-offence-answers`,
        )
      }
      return res.redirect(
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/review-offences`,
      )
    }
    return res.redirect(
      `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/offences/0/add-another-offence`,
    )
  }

  private isAddJourney(addOrEditCourtCase: string, addOrEditCourtAppearance: string): boolean {
    return addOrEditCourtCase === 'add-court-case' && addOrEditCourtAppearance === 'add-court-appearance'
  }
}
