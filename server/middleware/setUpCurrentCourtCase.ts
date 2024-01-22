import { RequestHandler } from 'express'
import CourtCaseService from '../services/courtCaseService'

export default function setupCurrentCourtCase(courtCaseService: CourtCaseService): RequestHandler {
  return async (req, res, next) => {
    const { nomsId, courtCaseReference, addOrEditCourtCase } = req.params
    res.locals.courtCaseUniqueIdentifier = courtCaseService.getUniqueIdentifier(req.session, nomsId, courtCaseReference)
    res.locals.isAddCourtCase = addOrEditCourtCase === 'add-court-case'
    next()
  }
}
