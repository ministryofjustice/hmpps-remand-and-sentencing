import { RequestHandler } from 'express'
import CourtAppearanceService from '../services/courtAppearanceService'

export default function setupCurrentCourtAppearance(courtAppearanceService: CourtAppearanceService): RequestHandler {
  return async (req, res, next) => {
    const { nomsId, addOrEditCourtAppearance } = req.params
    const courtAppearance = courtAppearanceService.getSessionCourtAppearance(req.session, nomsId)
    res.locals.courtAppearance = courtAppearance
    res.locals.offences = courtAppearance.offences.filter(offence => !offence.sentence)
    res.locals.sentences = courtAppearance.offences.filter(offence => offence.sentence)
    res.locals.isAddCourtAppearance = addOrEditCourtAppearance === 'add-court-appearance'
    next()
  }
}
