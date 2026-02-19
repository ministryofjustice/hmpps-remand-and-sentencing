import type { Request, Response } from 'express'
import { SanitisedError } from '@ministryofjustice/hmpps-rest-client'
import RefDataService from '../../services/refDataService'
import {
  CreateAppearanceOutcome,
  FieldErrorErrorResponse,
} from '../../@types/remandAndSentencingApi/remandAndSentencingClientTypes'
import trimForm from '../../utils/trim'

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
    const createAppearanceOutcome = trimForm<CreateAppearanceOutcome>(req.body)
    try {
      await this.refDataService.createAppearanceOutcome(createAppearanceOutcome, req.user.username)
      await this.refDataService.clearAppearanceOutcomeCache()
      req.flash('successMessage', 'appearance outcome successfully created')
      return res.redirect('/admin/appearance-outcomes')
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
          req.flash('createAppearanceOutcome', { ...createAppearanceOutcome })
          return res.redirect('/admin/appearance-outcomes/add')
        }
      }
      throw e
    }
  }
}
