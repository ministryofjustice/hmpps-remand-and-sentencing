import { RequestHandler } from 'express'
import CourtAppearanceService from '../services/courtAppearanceService'

export default function setupCurrentCourtAppearance(courtAppearanceService: CourtAppearanceService): RequestHandler {
  return async (req, res, next) => {
    const { nomsId } = req.params
    const courtAppearance = courtAppearanceService.getSessionCourtAppearance(req.session, nomsId)
    res.locals.courtAppearance = courtAppearance
    next()
  }
}
