import { RequestHandler } from 'express'
import type {
  CourtCaseCourtNameForm,
  CourtCaseReferenceForm,
  CourtCaseWarrantDateForm,
  CourtCaseOverallCaseOutcomeForm,
  CourtCaseCaseOutcomeAppliedAllForm,
  CourtCaseLookupCaseOutcomeForm,
  CourtCaseNextHearingSelectForm,
  CourtCaseNextHearingTypeForm,
  CourtCaseNextHearingCourtSelectForm,
  CourtCaseNextHearingCourtNameForm,
  CourtCaseNextHearingDateForm,
} from 'forms'
import dayjs from 'dayjs'
import trimForm from '../utils/trim'
import CourtCaseService from '../services/courtCaseService'
import CourtAppearanceService from '../services/courtAppearanceService'

export default class CourtCaseRoutes {
  constructor(
    private readonly courtCaseService: CourtCaseService,
    private readonly courtAppearanceService: CourtAppearanceService,
  ) {}

  public start: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId } = req.params
    return res.render('pages/start', {
      nomsId,
    })
  }

  public getReference: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId } = req.params
    const { submitToCheckAnswers } = req.query
    let caseReferenceNumber: string
    if (submitToCheckAnswers) {
      caseReferenceNumber = this.courtAppearanceService.getCaseReferenceNumber(req.session, nomsId)
    }
    return res.render('pages/courtAppearance/reference', {
      nomsId,
      submitToCheckAnswers,
      caseReferenceNumber,
      backLink: `/person/${nomsId}`,
    })
  }

  public submitReference: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId } = req.params
    const referenceForm = trimForm<CourtCaseReferenceForm>(req.body)
    this.courtAppearanceService.setCaseReferenceNumber(req.session, nomsId, referenceForm.referenceNumber)
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
      const warrantDate = this.courtAppearanceService.getWarrantDate(req.session, nomsId)
      if (warrantDate) {
        warrantDateDay = warrantDate.getDate()
        warrantDateMonth = warrantDate.getMonth() + 1
        warrantDateYear = warrantDate.getFullYear()
      }
    }
    return res.render('pages/courtAppearance/warrant-date', {
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
    const warrantDate = dayjs({
      year: warrantDateForm['warrantDate-year'],
      month: warrantDateForm['warrantDate-month'] - 1,
      day: warrantDateForm['warrantDate-day'],
    })
    this.courtAppearanceService.setWarrantDate(req.session, nomsId, warrantDate.toDate())
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
      courtName = this.courtAppearanceService.getCourtName(req.session, nomsId)
    }
    return res.render('pages/courtAppearance/court-name', {
      nomsId,
      submitToCheckAnswers,
      courtName,
      backLink: `/person/${nomsId}/court-cases/warrant-date`,
    })
  }

  public submitCourtName: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId } = req.params
    const courtNameForm = trimForm<CourtCaseCourtNameForm>(req.body)

    this.courtAppearanceService.setCourtName(req.session, nomsId, courtNameForm.courtName)
    const { submitToCheckAnswers } = req.query
    if (submitToCheckAnswers) {
      return res.redirect(`/person/${nomsId}/court-cases/check-answers`)
    }
    return res.redirect(`/person/${nomsId}/court-cases/overall-case-outcome`)
  }

  public getOverallCaseOutcome: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId } = req.params
    const { submitToCheckAnswers } = req.query
    const overallCaseOutcome: string = this.courtAppearanceService.getOverallCaseOutcome(req.session, nomsId)
    return res.render('pages/courtAppearance/overall-case-outcome', {
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
    this.courtAppearanceService.setOverallCaseOutcome(req.session, nomsId, overallCaseOutcomeForm.overallCaseOutcome)
    const { submitToCheckAnswers } = req.query
    if (submitToCheckAnswers) {
      return res.redirect(`/person/${nomsId}/court-cases/check-answers`)
    }
    return res.redirect(`/person/${nomsId}/court-cases/case-outcome-applied-all`)
  }

  public getLookupCaseOutcome: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId } = req.params
    return res.render('pages/courtAppearance/lookup-case-outcome', {
      nomsId,
      backLink: `/person/${nomsId}/court-cases/overall-case-outcome`,
    })
  }

  public submitLookupCaseOutcome: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId } = req.params
    const lookupCaseOutcomeForm = trimForm<CourtCaseLookupCaseOutcomeForm>(req.body)
    this.courtAppearanceService.setOverallCaseOutcome(req.session, nomsId, lookupCaseOutcomeForm.caseOutcome)
    return res.redirect(`/person/${nomsId}/court-cases/case-outcome-applied-all`)
  }

  public getCaseOutcomeAppliedAll: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId } = req.params
    const { submitToCheckAnswers } = req.query
    const overallCaseOutcome: string = this.courtAppearanceService.getOverallCaseOutcome(req.session, nomsId)
    const caseOutcomeAppliedAll: boolean = this.courtAppearanceService.getCaseOutcomeAppliedAll(req.session, nomsId)
    return res.render('pages/courtAppearance/case-outcome-applied-all', {
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

    this.courtAppearanceService.setCaseOutcomeAppliedAll(
      req.session,
      nomsId,
      caseOutcomeAppliedAllForm.caseOutcomeAppliedAll === 'true',
    )
    return res.redirect(`/person/${nomsId}/court-cases/check-answers`)
  }

  public getCheckAnswers: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId } = req.params
    const courtCase = this.courtCaseService.getSessionCourtCase(req.session, nomsId)
    const courtAppearance = this.courtAppearanceService.getSessionCourtAppearance(req.session, nomsId)
    return res.render('pages/courtAppearance/check-answers', {
      nomsId,
      courtCase,
      courtAppearance,
      backLink: `/person/${nomsId}/court-cases/case-outcome-applied-all`,
    })
  }

  public submitCheckAnswers: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId } = req.params
    const courtAppearance = this.courtAppearanceService.getSessionCourtAppearance(req.session, nomsId)
    const courtCaseReference = this.courtCaseService.saveSessionCourtCase(req.session, nomsId, courtAppearance)

    return res.redirect(`/person/${nomsId}/court-cases/${courtCaseReference}/offence-code`)
  }

  public getNextHearingSelect: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference } = req.params
    const nextHearingSelect = this.courtAppearanceService.getNextHearingSelect(req.session, nomsId)
    return res.render('pages/courtAppearance/next-hearing-select', {
      nomsId,
      nextHearingSelect,
      courtCaseReference,
      backLink: `/person/${nomsId}/court-cases/${courtCaseReference}/check-offence-answers`,
    })
  }

  public submitNextHearingSelect: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference } = req.params
    const nextHearingSelectForm = trimForm<CourtCaseNextHearingSelectForm>(req.body)
    const nextHearingSelect = nextHearingSelectForm.nextHearingSelect === 'true'
    this.courtAppearanceService.setNextHearingSelect(req.session, nomsId, nextHearingSelect)
    if (nextHearingSelect) {
      return res.redirect(`/person/${nomsId}/court-cases/${courtCaseReference}/next-hearing-type`)
    }
    // this would be where we save which we don't currently have and then redirect to all court cases page
    return res.redirect(`/person/${nomsId}`)
  }

  public getNextHearingType: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference } = req.params
    const { submitToCheckAnswers } = req.query
    const nextHearingType = this.courtAppearanceService.getNextHearingType(req.session, nomsId)
    return res.render('pages/courtAppearance/next-hearing-type', {
      nomsId,
      nextHearingType,
      courtCaseReference,
      submitToCheckAnswers,
      backLink: `/person/${nomsId}/court-cases/${courtCaseReference}/next-hearing-select`,
    })
  }

  public submitNextHearingType: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference } = req.params
    const nextHearingTypeForm = trimForm<CourtCaseNextHearingTypeForm>(req.body)
    this.courtAppearanceService.setNextHearingType(req.session, nomsId, nextHearingTypeForm.nextHearingType)
    const { submitToCheckAnswers } = req.query
    if (submitToCheckAnswers) {
      return res.redirect(`/person/${nomsId}/court-cases/${courtCaseReference}/check-next-hearing-answers`)
    }
    return res.redirect(`/person/${nomsId}/court-cases/${courtCaseReference}/next-hearing-date`)
  }

  public getNextHearingDate: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference } = req.params
    const { submitToCheckAnswers } = req.query
    const nextHearingDate = this.courtAppearanceService.getNextHearingDate(req.session, nomsId)
    return res.render('pages/courtAppearance/next-hearing-date', {
      nomsId,
      nextHearingDate,
      courtCaseReference,
      submitToCheckAnswers,
      backLink: `/person/${nomsId}/court-cases/${courtCaseReference}/next-hearing-type`,
    })
  }

  public submitNextHearingDate: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference } = req.params
    const nextHearingDateForm = trimForm<CourtCaseNextHearingDateForm>(req.body)
    const nextHearingDate = dayjs({
      year: nextHearingDateForm['nextHearingDate-year'],
      month: parseInt(nextHearingDateForm['nextHearingDate-month'], 10) - 1,
      day: nextHearingDateForm['nextHearingDate-day'],
    })
    if (nextHearingDateForm.nextHearingTime) {
      const [nextHearingHour, nextHearingMinute] = nextHearingDateForm.nextHearingTime.split(':')
      nextHearingDate.set('hour', parseInt(nextHearingHour, 10))
      nextHearingDate.set('minute', parseInt(nextHearingMinute, 10))
    }
    this.courtAppearanceService.setNextHearingDate(req.session, nomsId, nextHearingDate.toDate())
    const { submitToCheckAnswers } = req.query
    if (submitToCheckAnswers) {
      return res.redirect(`/person/${nomsId}/court-cases/${courtCaseReference}/check-next-hearing-answers`)
    }
    return res.redirect(`/person/${nomsId}/court-cases/${courtCaseReference}/next-hearing-court-select`)
  }

  public getNextHearingCourtSelect: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference } = req.params
    const nextHearingCourtSelect = this.courtAppearanceService.getNextHearingCourtSelect(req.session, nomsId)
    const courtName = this.courtAppearanceService.getCourtName(req.session, nomsId)
    return res.render('pages/courtAppearance/next-hearing-court-select', {
      nomsId,
      nextHearingCourtSelect,
      courtName,
      courtCaseReference,
      backLink: `/person/${nomsId}/court-cases/${courtCaseReference}/next-hearing-date`,
    })
  }

  public submitNextHearingCourtSelect: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference } = req.params
    const nextHearingCourtSelectForm = trimForm<CourtCaseNextHearingCourtSelectForm>(req.body)
    const nextHearingCourtSelect = nextHearingCourtSelectForm.nextHearingCourtSelect === 'true'
    this.courtAppearanceService.setNextHearingCourtSelect(req.session, nomsId, nextHearingCourtSelect)
    if (nextHearingCourtSelect) {
      return res.redirect(`/person/${nomsId}/court-cases/${courtCaseReference}/check-next-hearing-answers`)
    }
    return res.redirect(`/person/${nomsId}/court-cases/${courtCaseReference}/next-hearing-court-name`)
  }

  public getNextHearingCourtName: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference } = req.params
    const nextHearingCourtName = this.courtAppearanceService.getNextHearingCourtName(req.session, nomsId)
    return res.render('pages/courtAppearance/next-hearing-court-name', {
      nomsId,
      nextHearingCourtName,
      courtCaseReference,
      backLink: `/person/${nomsId}/court-cases/${courtCaseReference}/next-hearing-court-select`,
    })
  }

  public submitNextHearingCourtName: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference } = req.params
    const nextHearingCourtNameForm = trimForm<CourtCaseNextHearingCourtNameForm>(req.body)
    this.courtAppearanceService.setNextHearingCourtName(
      req.session,
      nomsId,
      nextHearingCourtNameForm.nextHearingCourtName,
    )
    return res.redirect(`/person/${nomsId}/court-cases/${courtCaseReference}/check-next-hearing-answers`)
  }

  public getCheckNextHearingAnswers: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference } = req.params
    const courtAppearance = this.courtAppearanceService.getSessionCourtAppearance(req.session, nomsId)
    return res.render('pages/courtAppearance/check-next-hearing-answers', {
      nomsId,
      courtAppearance,
      courtCaseReference,
      backLink: `/person/${nomsId}/court-cases/${courtCaseReference}/next-hearing-court-name`,
    })
  }

  public submiCheckNextHearingAnswers: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId } = req.params
    return res.redirect(`/person/${nomsId}`)
  }
}
