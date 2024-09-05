import { RequestHandler } from 'express'
import CourtAppearanceService from '../services/courtAppearanceService'
import CourtRegisterService from '../services/courtRegisterService'
import logger from '../../logger'

export default function setupCurrentCourtAppearance(
  courtAppearanceService: CourtAppearanceService,
  courtRegisterService: CourtRegisterService,
): RequestHandler {
  return async (req, res, next) => {
    const { nomsId, addOrEditCourtAppearance } = req.params
    const courtAppearance = courtAppearanceService.getSessionCourtAppearance(req.session, nomsId)

    res.locals.courtAppearance = courtAppearance
    res.locals.offences = courtAppearance.offences.filter(offence => !offence.sentence)
    res.locals.sentences = courtAppearance.offences.filter(offence => offence.sentence)
    res.locals.isAddCourtAppearance = addOrEditCourtAppearance === 'add-court-appearance'
    if (courtAppearance.courtCode) {
      try {
        const court = await courtRegisterService.findCourtById(courtAppearance.courtCode, req.user.username)
        res.locals.courtAppearanceCourtName = court.courtName
      } catch (e) {
        logger.error(e)
        res.locals.courtAppearanceCourtName = courtAppearance.courtCode
      }
    }
    next()
  }
}
