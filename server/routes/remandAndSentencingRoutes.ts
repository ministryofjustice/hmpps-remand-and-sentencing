import { RequestHandler } from 'express'
import type {
  CourtCaseCourtNameForm,
  CourtCaseNextCourtDateQuestionForm,
  CourtCaseReferenceForm,
  CourtCaseWarrantDateForm,
  CourtCaseNextCourtDateForm,
} from 'forms'
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
    return res.render('pages/courtCase/reference', {
      nomsId,
    })
  }

  public submitReference: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId } = req.params
    const referenceForm = trimForm<CourtCaseReferenceForm>(req.body)
    this.courtCaseService.setCourtCaseReference(req.session, nomsId, referenceForm.referenceNumber)

    return res.redirect(`/person/${nomsId}/court-cases/warrant-date`)
  }

  public getWarrantDate: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId } = req.params
    return res.render('pages/courtCase/warrant-date', {
      nomsId,
    })
  }

  public submitWarrantDate: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId } = req.params
    const warrantDateForm = trimForm<CourtCaseWarrantDateForm>(req.body)
    const warrantDate = new Date(
      warrantDateForm['warrantDate-year'],
      warrantDateForm['warrantDate-month'],
      warrantDateForm['warrantDate-day'],
    )
    this.courtCaseService.setWarrantDate(req.session, nomsId, warrantDate)

    return res.redirect(`/person/${nomsId}/court-cases/court-name`)
  }

  public getCourtName: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId } = req.params
    return res.render('pages/courtCase/court-name', {
      nomsId,
    })
  }

  public submitCourtName: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId } = req.params
    const courtNameForm = trimForm<CourtCaseCourtNameForm>(req.body)

    this.courtCaseService.setCourtName(req.session, nomsId, courtNameForm.courtName)

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
      nextCourtDateForm['nextCourtDate-month'],
      nextCourtDateForm['nextCourtDate-day'],
      parseInt(nextCourtHour, 10),
      parseInt(nextCourtMinute, 10),
    )
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
}
