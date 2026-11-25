import { RequestHandler } from 'express'
import createError from 'http-errors'
import type { UrlParameters } from 'models'
import config from '../config'
import BaseRoutes from './baseRoutes'
import JourneyUrls from './data/JourneyUrls'

export default class MissedHearingRoutes extends BaseRoutes {
  public newJourney: RequestHandler = async (req, res, next): Promise<void> => {
    const { nomsId, courtCaseReference, appearanceReference, addOrEditCourtCase, addOrEditCourtAppearance } =
      req.params as unknown as UrlParameters
    if (!config.featureToggles.missedHearing || res.locals.isAddCourtCase) {
      return next(createError(404, 'Not found'))
    }
    this.courtAppearanceService.clearSessionCourtAppearance(req.session, nomsId)
    this.offenceService.clearAllOffences(req.session, nomsId, courtCaseReference)
    this.courtAppearanceService.startMissedHearing(req.session, nomsId, appearanceReference)
    return res.redirect(
      JourneyUrls.taskList(
        nomsId,
        addOrEditCourtCase,
        courtCaseReference,
        addOrEditCourtAppearance,
        appearanceReference,
      ),
    )
  }
}
