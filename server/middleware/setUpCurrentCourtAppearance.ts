import { RequestHandler } from 'express'
import CourtAppearanceService from '../services/courtAppearanceService'
import CourtRegisterService from '../services/courtRegisterService'
import logger from '../../logger'
import ManageOffencesService from '../services/manageOffencesService'
import { offencesToOffenceDescriptions } from '../utils/utils'
import RefDataService from '../services/refDataService'

export default function setupCurrentCourtAppearance(
  courtAppearanceService: CourtAppearanceService,
  courtRegisterService: CourtRegisterService,
  manageOffenceService: ManageOffencesService,
  refDataService: RefDataService,
): RequestHandler {
  return async (req, res, next) => {
    const { nomsId, addOrEditCourtCase, addOrEditCourtAppearance, appearanceReference } = req.params
    const courtAppearance = courtAppearanceService.getSessionCourtAppearance(req.session, nomsId, appearanceReference)

    res.locals.courtAppearance = courtAppearance
    res.locals.offences = courtAppearance.offences
    res.locals.isAddCourtAppearance = addOrEditCourtAppearance === 'add-court-appearance'
    res.locals.isNonSentencingToSentencingJourney =
      addOrEditCourtCase === 'edit-court-case' &&
      addOrEditCourtAppearance === 'add-court-appearance' &&
      courtAppearance.warrantType === 'SENTENCING'

    res.locals.warrantOrHearing = courtAppearance.warrantType === 'SENTENCING' ? 'warrant' : 'hearing'
    const offenceCodes = Array.from(new Set(courtAppearance.offences.map(offence => offence.offenceCode)))
    res.locals.offenceNameMap = await manageOffenceService.getOffenceMap(
      offenceCodes,
      req.user.username,
      offencesToOffenceDescriptions(courtAppearance.offences, []),
    )
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
      ? (await refDataService.getAppearanceOutcomeByUuid(courtAppearance.appearanceOutcomeUuid, req.user.username))
          .outcomeName
      : 'Not entered'
    res.locals.showHearingDetails = true
    next()
  }
}
