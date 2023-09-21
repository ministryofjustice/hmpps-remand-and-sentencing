import { RequestHandler } from 'express'
import type { CourtCaseReferenceForm } from 'forms'
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
}
