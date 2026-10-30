import type { Request, Response } from 'express'
import RefDataService from '../../services/refDataService'
import ReferenceDataJourneyUrls from '../data/ReferenceDataJourneyUrls'

export default class HmctsChargeOutcomeAdminRoutesHandler {
  constructor(private readonly refDataService: RefDataService) {}

  // TODO (CDIA-490): port this logic for HMCTS ResultCode (use ChargeOutcomeAdminRoutesHandler.index as reference)
  index = async (req: Request, res: Response) => {
    const chargeOutcomes = await this.refDataService.getAllUncachedChargeOutcomes(req.user.username)
    return res.render('pages/referenceData/chargeOutcome/index', {
      chargeOutcomes,
      successMessage: req.flash('successMessage')[0],
      backLink: ReferenceDataJourneyUrls.home(),
    })
  }

  // TODO (CDIA-490): port this logic for HMCTS ResultCode (use ChargeOutcomeAdminRoutesHandler.add as reference)
  add = async (req: Request, res: Response) => {}

  // TODO (CDIA-490): port this logic for HMCTS ResultCode (use ChargeOutcomeAdminRoutesHandler.submitAdd as reference)
  submitAdd = async (req: Request, res: Response) => {}

  // TODO (CDIA-490): port this logic for HMCTS ResultCode (use ChargeOutcomeAdminRoutesHandler.edit as reference)
  edit = async (req: Request, res: Response) => {}

  // TODO (CDIA-490): port this logic for HMCTS ResultCode (use ChargeOutcomeAdminRoutesHandler.submitEdit as reference)
  submitEdit = async (req: Request, res: Response) => {}
}
