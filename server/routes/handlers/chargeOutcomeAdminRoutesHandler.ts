import type { Request, Response } from 'express'
import RefDataService from '../../services/refDataService'

export default class ChargeOutcomeAdminRoutesHandler {
  constructor(private readonly refDataService: RefDataService) {}

  index = async (req: Request, res: Response) => {
    const chargeOutcomes = await this.refDataService.getAllChargeOutcomes(req.user.username)
    return res.render('pages/referenceData/chargeOutcome/index', {
      chargeOutcomes,
    })
  }

  add = async (req: Request, res: Response) => {
    const chargeOutcomes = await this.refDataService.getAllChargeOutcomes(req.user.username)
    const types = new Set(chargeOutcomes.map(outcome => outcome.outcomeType))
    const dispositionCodes = new Set(chargeOutcomes.map(outcome => outcome.dispositionCode))

    return res.render('pages/referenceData/chargeOutcome/add', {
      types,
      dispositionCodes,
    })
  }

  edit = async (req: Request, res: Response) => {
    const { outcomeUuid } = req.params as { outcomeUuid: string }
    const chargeOutcome = await this.refDataService.getChargeOutcomeById(outcomeUuid, res.locals.user.username)
    const chargeOutcomes = await this.refDataService.getAllChargeOutcomes(req.user.username)
    const types = new Set(chargeOutcomes.map(outcome => outcome.outcomeType))
    const dispositionCodes = new Set(chargeOutcomes.map(outcome => outcome.dispositionCode))
    return res.render('pages/referenceData/chargeOutcome/edit', {
      chargeOutcome,
      types,
      dispositionCodes,
    })
  }
}
