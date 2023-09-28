import { RequestHandler } from 'express'
import type {
  CourtCaseCourtNameForm,
  CourtCaseNextCourtDateQuestionForm,
  CourtCaseReferenceForm,
  CourtCaseWarrantDateForm,
  CourtCaseNextCourtDateForm,
} from 'forms'
import createError from 'http-errors'
import trimForm from '../utils/trim'
import CourtCaseService from '../services/courtCaseService'

export default class RemandAndSentencingRoutes {
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
    return res.redirect(`/person/${nomsId}/court-cases/next-court-date-question`)
  }

  public getNextCourtDateQuestion: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId } = req.params
    return res.render('pages/courtCase/next-court-date-question', {
      nomsId,
    })
  }

  public submitNextCourtDateQuestion: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId } = req.params
    const nextCourtDateQuestionForm = trimForm<CourtCaseNextCourtDateQuestionForm>(req.body)

    if (nextCourtDateQuestionForm.nextCourtDateKnown === 'yes') {
      return res.redirect(`/person/${nomsId}/court-cases/next-court-date`)
    }
    this.courtCaseService.deleteNextCourtDate(req.session, nomsId)
    return res.redirect(`/person/${nomsId}/court-cases/check-answers`)
  }

  public getNextCourtDate: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId } = req.params
    return res.render('pages/courtCase/next-court-date', {
      nomsId,
    })
  }

  public submitNextCourtDate: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId } = req.params
    const nextCourtDateForm = trimForm<CourtCaseNextCourtDateForm>(req.body)
    const [nextCourtHour, nextCourtMinute] = nextCourtDateForm.nextCourtTime.split(':')
    const nextCourtDate = new Date(
      nextCourtDateForm['nextCourtDate-year'],
      nextCourtDateForm['nextCourtDate-month'] - 1,
      nextCourtDateForm['nextCourtDate-day'],
    )
    if (nextCourtHour && nextCourtMinute) {
      nextCourtDate.setHours(parseInt(nextCourtHour, 10), parseInt(nextCourtMinute, 10), 0)
    }
    this.courtCaseService.setNextCourtDate(req.session, nomsId, nextCourtDate)

    return res.redirect(`/person/${nomsId}/court-cases/check-answers`)
  }

  public getCheckAnswers: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId } = req.params
    const courtCase = this.courtCaseService.getSessionCourtCase(req.session, nomsId)
    return res.render('pages/courtCase/check-answers', {
      nomsId,
      courtCase,
    })
  }

  public submitCheckAnswers: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId } = req.params
    const courtCaseReference = this.courtCaseService.saveCourtCase(req.session, nomsId)

    return res.redirect(`/person/${nomsId}/court-cases/${courtCaseReference}/overview`)
  }

  public getCourtCaseOverview: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference } = req.params
    const courtCase = this.courtCaseService.getSessionSavedCourtCase(req.session, nomsId, courtCaseReference)
    if (courtCase) {
      return res.render('pages/courtCase/overview', {
        nomsId,
        courtCaseReference,
        courtCase,
      })
    }
    throw createError(404, 'Not found')
  }
}
