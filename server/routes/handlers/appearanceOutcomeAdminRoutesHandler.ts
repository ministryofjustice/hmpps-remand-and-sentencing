import type { Request, Response } from 'express'
import RefDataService from '../../services/refDataService'
import { CreateAppearanceOutcome } from '../../@types/remandAndSentencingApi/remandAndSentencingClientTypes'

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

  add = async (req: Request, res: Response) => {
    const [appearanceOutcomes, chargeOutcomes] = await Promise.all([
      this.refDataService.getAllUncachedAppearanceOutcomes(req.user.username),
      this.refDataService.getAllUncachedChargeOutcomes(req.user.username),
    ])
    const types = new Set(appearanceOutcomes.map(outcome => outcome.outcomeType))
    const dispositionCodes = new Set(appearanceOutcomes.map(outcome => outcome.dispositionCode))
    const warrantTypes = new Set(appearanceOutcomes.map(outcome => outcome.warrantType))
    const sortedChargeOutcomes = chargeOutcomes.sort((a, b) => a.outcomeName.localeCompare(b.outcomeName))
    const statuses: CreateAppearanceOutcome['status'][] = ['ACTIVE', 'INACTIVE']
    const createAppearanceOutcome = (req.flash('createAppearanceOutcome')[0] || {}) as CreateAppearanceOutcome
    return res.render('pages/referenceData/appearanceOutcome/add', {
      types,
      dispositionCodes,
      statuses,
      warrantTypes,
      sortedChargeOutcomes,
      createAppearanceOutcome,
      errors: req.flash('errors') || [],
    })
  }

  submitAdd = async (req: Request, res: Response) => {
    const createChargeOutcome = trimForm<CreateChargeOutcome>(req.body)
    try {
      await this.refDataService.createChargeOutcome(createChargeOutcome, req.user.username)
      await this.refDataService.clearChargeOutcomeCache()
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
