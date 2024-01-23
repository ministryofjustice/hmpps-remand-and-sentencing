import { RequestHandler } from 'express'

export default function setupCurrentCourtCase(): RequestHandler {
  return async (req, res, next) => {
    const { courtCaseReference, addOrEditCourtCase } = req.params
    res.locals.courtCaseUniqueIdentifier = courtCaseReference
    res.locals.isAddCourtCase = addOrEditCourtCase === 'add-court-case'
    next()
  }
}
