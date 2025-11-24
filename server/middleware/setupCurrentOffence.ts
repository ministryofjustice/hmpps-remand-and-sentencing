import { RequestHandler } from 'express'
import OffenceService from '../services/offenceService'

export default function setupCurrentOffence(offenceService: OffenceService): RequestHandler {
  return async (req, res, next) => {
    const { nomsId, courtCaseReference } = req.params
    const offence = offenceService.getSessionOffence(req.session, nomsId, courtCaseReference, req.params.chargeUuid)
    res.locals.offence = offence
    next()
  }
}
