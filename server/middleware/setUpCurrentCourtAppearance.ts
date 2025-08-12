import { RequestHandler } from 'express'
import CourtAppearanceService from '../services/courtAppearanceService'
import CourtRegisterService from '../services/courtRegisterService'
import logger from '../../logger'
import ManageOffencesService from '../services/manageOffencesService'
import AppearanceOutcomeService from '../services/appearanceOutcomeService'

export default function setupCurrentCourtAppearance(
  courtAppearanceService: CourtAppearanceService,
  courtRegisterService: CourtRegisterService,
  manageOffenceService: ManageOffencesService,
  appearanceOutcomeService: AppearanceOutcomeService,
): RequestHandler {
  return async (req, res, next) => {
    const { nomsId, addOrEditCourtAppearance, appearanceReference } = req.params
    const courtAppearance = courtAppearanceService.getSessionCourtAppearance(req.session, nomsId, appearanceReference)

    res.locals.courtAppearance = courtAppearance
    res.locals.offences = courtAppearance.offences
    res.locals.isAddCourtAppearance = addOrEditCourtAppearance === 'add-court-appearance'
    const offenceCodes = Array.from(new Set(courtAppearance.offences.map(offence => offence.offenceCode)))
    res.locals.offenceNameMap = await manageOffenceService.getOffenceMap(offenceCodes, req.user.username)
    if (courtAppearance.courtCode) {
      try {
        const court = await courtRegisterService.findCourtById(courtAppearance.courtCode, req.user.username)
        res.locals.courtAppearanceCourtName = court.courtName
      } catch (e) {
        logger.error(e)
        res.locals.courtAppearanceCourtName = courtAppearance.courtCode
      }
    }

    res.locals.overallCaseOutcome = courtAppearance.appearanceOutcomeUuid
      ? (await appearanceOutcomeService.getOutcomeByUuid(courtAppearance.appearanceOutcomeUuid, req.user.username))
          .outcomeName
      : 'Not entered'
    next()
  }
}
