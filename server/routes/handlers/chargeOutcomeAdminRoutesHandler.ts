import type { Request, Response } from 'express'
import { SanitisedError } from '@ministryofjustice/hmpps-rest-client'
import RefDataService from '../../services/refDataService'
import type {
  CreateChargeOutcome,
  FieldErrorErrorResponse,
} from '../../@types/remandAndSentencingApi/remandAndSentencingClientTypes'
import trimForm from '../../utils/trim'

export default class ChargeOutcomeAdminRoutesHandler {
  constructor(private readonly refDataService: RefDataService) {}

  index = async (req: Request, res: Response) => {
    const chargeOutcomes = await this.refDataService.getAllUncachedChargeOutcomes(req.user.username)
    return res.render('pages/referenceData/chargeOutcome/index', {
      chargeOutcomes,
      successMessage: req.flash('successMessage')[0],
    })
  }

  add = async (req: Request, res: Response) => {
    const chargeOutcomes = await this.refDataService.getAllUncachedChargeOutcomes(req.user.username)
    const types = new Set(chargeOutcomes.map(outcome => outcome.outcomeType))
    const dispositionCodes = new Set(chargeOutcomes.map(outcome => outcome.dispositionCode))
    const statuses: CreateChargeOutcome['status'][] = ['ACTIVE', 'INACTIVE']
    const createChargeOutcome = (req.flash('createChargeOutcome')[0] || {}) as CreateChargeOutcome
    return res.render('pages/referenceData/chargeOutcome/add', {
      types,
      dispositionCodes,
      statuses,
      createChargeOutcome,
      errors: req.flash('errors') || [],
    })
  }

  submitAdd = async (req: Request, res: Response) => {
    const createChargeOutcome = trimForm<CreateChargeOutcome>(req.body)
    try {
      await this.refDataService.createChargeOutcome(createChargeOutcome, req.user.username)
      req.flash('successMessage', 'charge outcome successfully created')
      return res.redirect('/admin/charge-outcomes')
    } catch (e) {
      if (e instanceof SanitisedError) {
        const sanitisedError = e as SanitisedError
        if (sanitisedError.responseStatus === 400) {
          const fieldErrors = e.data as FieldErrorErrorResponse
          req.flash(
            'errors',
            fieldErrors.fieldErrors?.map(fieldError => {
              return { href: `#${fieldError.field}`, text: fieldError.message ?? '' }
            }) ?? [],
          )
          req.flash('createChargeOutcome', { ...createChargeOutcome })
          return res.redirect('/admin/charge-outcomes/add')
        }
      }
      throw e
    }
  }
}
