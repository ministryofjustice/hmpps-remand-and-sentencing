import { RequestHandler } from 'express'
import CourtAppearanceService from '../services/courtAppearanceService'
import CourtRegisterService from '../services/courtRegisterService'
import logger from '../../logger'
import ManageOffencesService from '../services/manageOffencesService'

export default function setupCurrentCourtAppearance(
  courtAppearanceService: CourtAppearanceService,
  courtRegisterService: CourtRegisterService,
  manageOffenceService: ManageOffencesService,
): RequestHandler {
  return async (req, res, next) => {
    const { nomsId, addOrEditCourtAppearance } = req.params
    const courtAppearance = courtAppearanceService.getSessionCourtAppearance(req.session, nomsId)

    res.locals.courtAppearance = courtAppearance
    res.locals.offences = courtAppearance.offences.filter(offence => !offence.sentence)
    res.locals.sentences = courtAppearance.offences.filter(offence => offence.sentence)
    res.locals.isAddCourtAppearance = addOrEditCourtAppearance === 'add-court-appearance'
    const offenceCodes = Array.from(new Set(courtAppearance.offences.map(offence => offence.offenceCode)))
    res.locals.offenceNameMap = await manageOffenceService.getOffenceMap(offenceCodes, req.user.token)
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
