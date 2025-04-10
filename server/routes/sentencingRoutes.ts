import { RequestHandler } from 'express'
import type { SentenceLengthForm } from 'forms'
import trimForm from '../utils/trim'
import CourtAppearanceService from '../services/courtAppearanceService'
import { sentenceLengthToSentenceLengthForm } from '../utils/mappingUtils'

export default class SentencingRoutes {
  constructor(private readonly courtAppearanceService: CourtAppearanceService) {}

  public getOverallSentenceLength: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, appearanceReference, addOrEditCourtCase, addOrEditCourtAppearance } = req.params
    const { submitToCheckAnswers } = req.query
    let courtCaseOverallSentenceLengthForm = (req.flash('courtCaseOverallSentenceLengthForm')[0] ||
      {}) as SentenceLengthForm
    if (Object.keys(courtCaseOverallSentenceLengthForm).length === 0) {
      courtCaseOverallSentenceLengthForm = sentenceLengthToSentenceLengthForm(
        this.courtAppearanceService.getOverallCustodialSentenceLength(req.session, nomsId),
        this.courtAppearanceService.getHasOverallSentenceLength(req.session, nomsId),
      )
    }
    return res.render('pages/courtAppearance/overall-sentence-length', {
      nomsId,
      courtCaseReference,
      appearanceReference,
      addOrEditCourtCase,
      addOrEditCourtAppearance,
      submitToCheckAnswers,
      courtCaseOverallSentenceLengthForm,
      errors: req.flash('errors') || [],
      backLink: submitToCheckAnswers
        ? `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/check-overall-answers`
        : `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/task-list`,
    })
  }

  public submitOverallSentenceLength: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, appearanceReference, addOrEditCourtCase, addOrEditCourtAppearance } = req.params
    const { submitToCheckAnswers } = req.query
    const courtCaseOverallSentenceLengthForm = trimForm<SentenceLengthForm>(req.body)
    const errors = this.courtAppearanceService.setOverallSentenceLength(
      req.session,
      nomsId,
      courtCaseOverallSentenceLengthForm,
    )
    if (errors.length > 0) {
      req.flash('errors', errors)
      req.flash('courtCaseOverallSentenceLengthForm', { ...courtCaseOverallSentenceLengthForm })
      return res.redirect(
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/overall-sentence-length${submitToCheckAnswers ? '?submitToCheckAnswers=true' : ''}`,
      )
    }
    if (addOrEditCourtAppearance === 'edit-court-appearance') {
      return res.redirect(
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/details`,
      )
    }
    if (submitToCheckAnswers) {
      return res.redirect(
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/check-overall-answers`,
      )
    }
    return res.redirect(
      `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/overall-conviction-date`,
    )
  }
}
