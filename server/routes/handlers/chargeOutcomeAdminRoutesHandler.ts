import type { Request, Response } from 'express'
import RefDataService from '../../services/refDataService'

export default class ChargeOutcomeAdminRoutesHandler {
  constructor(private readonly refDataService: RefDataService) {}

  index = async (req: Request, res: Response) => {
    const chargeOutcomes = await this.refDataService.getAllUncachedChargeOutcomes(req.user.username)
    return res.render('pages/referenceData/chargeOutcome/index', {
      chargeOutcomes,
    })
  }
}
