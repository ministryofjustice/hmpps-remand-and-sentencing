import { RequestHandler } from 'express'
import type {
  CourtCaseAlternativeSentenceLengthForm,
  CourtCaseCaseOutcomeAppliedAllForm,
  CourtCaseOverallConvictionDateForm,
  SentenceLengthForm,
} from 'forms'
import trimForm from '../utils/trim'
import CourtAppearanceService from '../services/courtAppearanceService'
import {
  sentenceLengthToAlternativeSentenceLengthForm,
  sentenceLengthToSentenceLengthForm,
} from '../utils/mappingUtils'
import AppearanceOutcomeService from '../services/appearanceOutcomeService'

export default class OverallSentencingRoutes {
  constructor(
    private readonly courtAppearanceService: CourtAppearanceService,
    private readonly appearanceOutcomeService: AppearanceOutcomeService,
  ) {}

  public getOverallSentenceLength: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, appearanceReference, addOrEditCourtCase, addOrEditCourtAppearance } = req.params
    const { submitToCheckAnswers } = req.query
    const { warrantType } = this.courtAppearanceService.getSessionCourtAppearance(req.session, nomsId)
    let overallSentenceLengthForm = (req.flash('overallSentenceLengthForm')[0] || {}) as SentenceLengthForm
    if (Object.keys(overallSentenceLengthForm).length === 0) {
      overallSentenceLengthForm = sentenceLengthToSentenceLengthForm(
        this.courtAppearanceService.getOverallCustodialSentenceLength(req.session, nomsId),
        this.courtAppearanceService.getHasOverallSentenceLength(req.session, nomsId),
      )
    }
    let backLink = `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/task-list`

    if (submitToCheckAnswers) {
      backLink = `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/sentencing/check-overall-answers`
    }

    if (addOrEditCourtAppearance === 'edit-court-appearance') {
      if (warrantType === 'SENTENCING') {
        backLink = `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/sentencing/appearance-details`
      } else {
        backLink = `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/remand/appearance-details`
      }
    }

    return res.render('pages/overallSentencing/overall-sentence-length', {
      nomsId,
      courtCaseReference,
      appearanceReference,
      addOrEditCourtCase,
      addOrEditCourtAppearance,
      submitToCheckAnswers,
      overallSentenceLengthForm,
      errors: req.flash('errors') || [],
      backLink,
    })
  }

  public submitOverallSentenceLength: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, appearanceReference, addOrEditCourtCase, addOrEditCourtAppearance } = req.params
    const { submitToCheckAnswers } = req.query
    const { warrantType } = this.courtAppearanceService.getSessionCourtAppearance(req.session, nomsId)
    const overallSentenceLengthForm = trimForm<SentenceLengthForm>(req.body)
    const errors = this.courtAppearanceService.setOverallSentenceLength(req.session, nomsId, overallSentenceLengthForm)
    if (errors.length > 0) {
      req.flash('errors', errors)
      req.flash('overallSentenceLengthForm', { ...overallSentenceLengthForm })
      return res.redirect(
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/sentencing/overall-sentence-length${submitToCheckAnswers ? '?submitToCheckAnswers=true' : ''}`,
      )
    }

    if (submitToCheckAnswers) {
      return res.redirect(
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/sentencing/check-overall-answers`,
      )
    }

    if (addOrEditCourtAppearance === 'edit-court-appearance') {
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
      `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/sentencing/overall-conviction-date`,
    )
  }

  public getAlternativeSentenceLength: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, appearanceReference, addOrEditCourtCase, addOrEditCourtAppearance } = req.params
    const { submitToCheckAnswers } = req.query
    let courtCaseAlternativeSentenceLengthForm = (req.flash('courtCaseAlternativeSentenceLengthForm')[0] ||
      {}) as CourtCaseAlternativeSentenceLengthForm

    if (Object.keys(courtCaseAlternativeSentenceLengthForm).length === 0) {
      courtCaseAlternativeSentenceLengthForm =
        sentenceLengthToAlternativeSentenceLengthForm<CourtCaseAlternativeSentenceLengthForm>(
          this.courtAppearanceService.getOverallCustodialSentenceLength(req.session, nomsId),
        )
    }
    this.courtAppearanceService.setHasOverallSentenceLengthTrue(req.session, nomsId)
    return res.render('pages/overallSentencing/alternative-sentence-length', {
      nomsId,
      courtCaseReference,
      appearanceReference,
      addOrEditCourtCase,
      addOrEditCourtAppearance,
      submitToCheckAnswers,
      courtCaseAlternativeSentenceLengthForm,
      isAddOffences: this.isAddJourney(addOrEditCourtCase, addOrEditCourtAppearance),
      errors: req.flash('errors') || [],
      backLink: `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/sentencing/overall-sentence-length${submitToCheckAnswers ? '?submitToCheckAnswers=true' : ''}`,
    })
  }

  public submitAlternativeSentenceLength: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, appearanceReference, addOrEditCourtCase, addOrEditCourtAppearance } = req.params
    const { submitToCheckAnswers } = req.query
    const courtCaseAlternativeSentenceLengthForm = trimForm<CourtCaseAlternativeSentenceLengthForm>(req.body)
    const errors = this.courtAppearanceService.setOverallAlternativeSentenceLength(
      req.session,
      nomsId,
      courtCaseAlternativeSentenceLengthForm,
    )
    if (errors.length > 0) {
      req.flash('errors', errors)
      req.flash('courtCaseAlternativeSentenceLengthForm', { ...courtCaseAlternativeSentenceLengthForm })
      return res.redirect(
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/sentencing/alternative-overall-sentence-length${submitToCheckAnswers ? '?submitToCheckAnswers=true' : ''}`,
      )
    }
    if (submitToCheckAnswers) {
      return res.redirect(
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/sentencing/check-overall-answers`,
      )
    }
    return res.redirect(
      `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/sentencing/overall-conviction-date`,
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

    let backLink = `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/sentencing/overall-sentence-length`
    if (submitToCheckAnswers) {
      backLink = `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/sentencing/check-overall-answers`
    }

    return res.render('pages/overallSentencing/overall-conviction-date', {
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
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/sentencing/overall-conviction-date${submitToCheckAnswers ? '?submitToCheckAnswers=true' : ''}`,
      )
    }

    if (this.isAddJourney(addOrEditCourtCase, addOrEditCourtAppearance) && !submitToCheckAnswers) {
      return res.redirect(
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/sentencing/case-outcome-applied-all`,
      )
    }
    return res.redirect(
      `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/sentencing/check-overall-answers`,
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

    let backLink = `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/sentencing/overall-conviction-date?backNav=true`

    if (submitToCheckAnswers) {
      backLink = `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/sentencing/check-overall-answers`
    }

    return res.render('pages/overallSentencing/case-outcome-applied-all', {
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
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/sentencing/case-outcome-applied-all${submitToCheckAnswers ? '?submitToCheckAnswers=true' : ''}`,
      )
    }
    return res.redirect(
      `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/sentencing/check-overall-answers`,
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
      backLink = `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/sentencing/case-outcome-applied-all`
    }
    return res.render('pages/overallSentencing/check-overall-answers', {
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

  public submitCheckOverallAnswers: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, appearanceReference, addOrEditCourtCase, addOrEditCourtAppearance } = req.params
    this.courtAppearanceService.setWarrantInformationAccepted(req.session, nomsId)
    return res.redirect(
      `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/task-list`,
    )
  }

  private isAddJourney(addOrEditCourtCase: string, addOrEditCourtAppearance: string): boolean {
    return addOrEditCourtCase === 'add-court-case' && addOrEditCourtAppearance === 'add-court-appearance'
  }
}
