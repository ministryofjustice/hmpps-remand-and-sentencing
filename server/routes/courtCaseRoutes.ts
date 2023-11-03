import { RequestHandler } from 'express'
import type {
  CourtCaseCourtNameForm,
  CourtCaseReferenceForm,
  CourtCaseWarrantDateForm,
  CourtCaseOverallCaseOutcomeForm,
  CourtCaseCaseOutcomeAppliedAllForm,
  CourtCaseLookupCaseOutcomeForm,
} from 'forms'
import trimForm from '../utils/trim'
import CourtCaseService from '../services/courtCaseService'

export default class CourtCaseRoutes {
  constructor(private readonly courtCaseService: CourtCaseService) {}

  public start: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId } = req.params
    return res.render('pages/start', {
      nomsId,
    })
  }

  public getReference: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId } = req.params
    const { submitToCheckAnswers } = req.query
    let courtCaseReference: string
    if (submitToCheckAnswers) {
      courtCaseReference = this.courtCaseService.getCourtCaseReference(req.session, nomsId)
    }
    return res.render('pages/courtCase/reference', {
      nomsId,
      submitToCheckAnswers,
      courtCaseReference,
      backLink: `/person/${nomsId}`,
    })
  }

  public submitReference: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId } = req.params
    const referenceForm = trimForm<CourtCaseReferenceForm>(req.body)
    this.courtCaseService.setCourtCaseReference(req.session, nomsId, referenceForm.referenceNumber)
    const { submitToCheckAnswers } = req.query
    if (submitToCheckAnswers) {
      return res.redirect(`/person/${nomsId}/court-cases/check-answers`)
    }
    return res.redirect(`/person/${nomsId}/court-cases/warrant-date`)
  }

  public getWarrantDate: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId } = req.params
    const { submitToCheckAnswers } = req.query
    let warrantDateDay: number
    let warrantDateMonth: number
    let warrantDateYear: number
    if (submitToCheckAnswers) {
      const warrantDate = this.courtCaseService.getWarrantDate(req.session, nomsId)
      if (warrantDate) {
        warrantDateDay = warrantDate.getDate()
        warrantDateMonth = warrantDate.getMonth() + 1
        warrantDateYear = warrantDate.getFullYear()
      }
    }
    return res.render('pages/courtCase/warrant-date', {
      nomsId,
      submitToCheckAnswers,
      warrantDateDay,
      warrantDateMonth,
      warrantDateYear,
      backLink: `/person/${nomsId}/court-cases/reference`,
    })
  }

  public submitWarrantDate: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId } = req.params
    const warrantDateForm = trimForm<CourtCaseWarrantDateForm>(req.body)
    const warrantDate = new Date(
      warrantDateForm['warrantDate-year'],
      warrantDateForm['warrantDate-month'] - 1,
      warrantDateForm['warrantDate-day'],
    )
    this.courtCaseService.setWarrantDate(req.session, nomsId, warrantDate)
    const { submitToCheckAnswers } = req.query
    if (submitToCheckAnswers) {
      return res.redirect(`/person/${nomsId}/court-cases/check-answers`)
    }
    return res.redirect(`/person/${nomsId}/court-cases/court-name`)
  }

  public getCourtName: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId } = req.params
    const { submitToCheckAnswers } = req.query
    let courtName: string
    if (submitToCheckAnswers) {
      courtName = this.courtCaseService.getCourtName(req.session, nomsId)
    }
    return res.render('pages/courtCase/court-name', {
      nomsId,
      submitToCheckAnswers,
      courtName,
      backLink: `/person/${nomsId}/court-cases/warrant-date`,
    })
  }

  public submitCourtName: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId } = req.params
    const courtNameForm = trimForm<CourtCaseCourtNameForm>(req.body)

    this.courtCaseService.setCourtName(req.session, nomsId, courtNameForm.courtName)
    const { submitToCheckAnswers } = req.query
    if (submitToCheckAnswers) {
      return res.redirect(`/person/${nomsId}/court-cases/check-answers`)
    }
    return res.redirect(`/person/${nomsId}/court-cases/overall-case-outcome`)
  }

  public getOverallCaseOutcome: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId } = req.params
    const { submitToCheckAnswers } = req.query
    const overallCaseOutcome: string = this.courtCaseService.getOverallCaseOutcome(req.session, nomsId)
    return res.render('pages/courtCase/overall-case-outcome', {
      nomsId,
      submitToCheckAnswers,
      overallCaseOutcome,
      backLink: `/person/${nomsId}/court-cases/court-name`,
    })
  }

  public submitOverallCaseOutcome: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId } = req.params
    const overallCaseOutcomeForm = trimForm<CourtCaseOverallCaseOutcomeForm>(req.body)
    if (overallCaseOutcomeForm.overallCaseOutcome === 'LOOKUPDIFFERENT') {
      return res.redirect(`/person/${nomsId}/court-cases/lookup-case-outcome`)
    }
    this.courtCaseService.setOverallCaseOutcome(req.session, nomsId, overallCaseOutcomeForm.overallCaseOutcome)
    const { submitToCheckAnswers } = req.query
    if (submitToCheckAnswers) {
      return res.redirect(`/person/${nomsId}/court-cases/check-answers`)
    }
    return res.redirect(`/person/${nomsId}/court-cases/case-outcome-applied-all`)
  }

  public getLookupCaseOutcome: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId } = req.params
    return res.render('pages/courtCase/lookup-case-outcome', {
      nomsId,
      backLink: `/person/${nomsId}/court-cases/overall-case-outcome`,
    })
  }

  public submitLookupCaseOutcome: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId } = req.params
    const lookupCaseOutcomeForm = trimForm<CourtCaseLookupCaseOutcomeForm>(req.body)
    this.courtCaseService.setOverallCaseOutcome(req.session, nomsId, lookupCaseOutcomeForm.caseOutcome)
    return res.redirect(`/person/${nomsId}/court-cases/case-outcome-applied-all`)
  }

  public getCaseOutcomeAppliedAll: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId } = req.params
    const { submitToCheckAnswers } = req.query
    const overallCaseOutcome: string = this.courtCaseService.getOverallCaseOutcome(req.session, nomsId)
    const caseOutcomeAppliedAll: boolean = this.courtCaseService.getCaseOutcomeAppliedAll(req.session, nomsId)
    return res.render('pages/courtCase/case-outcome-applied-all', {
      nomsId,
      submitToCheckAnswers,
      overallCaseOutcome,
      caseOutcomeAppliedAll,
      backLink: `/person/${nomsId}/court-cases/overall-case-outcome`,
    })
  }

  public submitCaseOutcomeAppliedAll: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId } = req.params
    const caseOutcomeAppliedAllForm = trimForm<CourtCaseCaseOutcomeAppliedAllForm>(req.body)

    this.courtCaseService.setCaseOutcomeAppliedAll(
      req.session,
      nomsId,
      caseOutcomeAppliedAllForm.caseOutcomeAppliedAll === 'true',
    )
    return res.redirect(`/person/${nomsId}/court-cases/check-answers`)
  }

  public getCheckAnswers: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId } = req.params
    const courtCase = this.courtCaseService.getSessionCourtCase(req.session, nomsId)
    return res.render('pages/courtCase/check-answers', {
      nomsId,
      courtCase,
      backLink: `/person/${nomsId}/court-cases/case-outcome-applied-all`,
    })
  }

  public submitCheckAnswers: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId } = req.params
    const courtCaseReference = this.courtCaseService.saveCourtCase(req.session, nomsId)

    return res.redirect(`/person/${nomsId}/court-cases/${courtCaseReference}/offence-code`)
  }
}
