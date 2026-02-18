import type { Request, Response } from 'express'
import RefDataService from '../../services/refDataService'

export default class AppearanceOutcomeAdminRoutesHandler {
  constructor(private readonly refDataService: RefDataService) {}

  index = async (req: Request, res: Response) => {
    const [appearanceOutcomes, chargeOutcomes] = await Promise.all([
      this.refDataService.getAllUncachedAppearanceOutcomes(req.user.username),
      this.refDataService.getAllUncachedChargeOutcomes(req.user.username),
    ])
    const chargeOutcomeNames = Object.fromEntries(
      chargeOutcomes.map(outcome => [outcome.outcomeUuid, outcome.outcomeName]),
    )
    return res.render('pages/referenceData/appearanceOutcome/index', {
      appearanceOutcomes,
      chargeOutcomeNames,
      successMessage: req.flash('successMessage')[0],
    })
  }
}
