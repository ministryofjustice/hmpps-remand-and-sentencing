import { RequestHandler } from 'express'
import CourtAppearanceService from '../services/courtAppearanceService'

export default function setupCurrentCourtAppearance(courtAppearanceService: CourtAppearanceService): RequestHandler {
  return async (req, res, next) => {
    const { nomsId, courtCaseReference } = req.params
    const courtAppearance = courtAppearanceService.getSessionCourtAppearance(req.session, nomsId, courtCaseReference)
    res.locals.courtAppearance = courtAppearance
    next()
  }
}
