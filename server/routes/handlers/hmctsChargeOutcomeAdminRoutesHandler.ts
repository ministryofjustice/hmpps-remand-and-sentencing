import type { Request, Response } from 'express'
import { SanitisedError } from '@ministryofjustice/hmpps-rest-client'
import RefDataService from '../../services/refDataService'
import ReferenceDataJourneyUrls from '../data/ReferenceDataJourneyUrls'
import type {
  CreateChargeOutcome,
  FieldErrorErrorResponse,
} from '../../@types/remandAndSentencingApi/remandAndSentencingClientTypes'
import trimForm from '../../utils/trim'

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
      backLink: ReferenceDataJourneyUrls.viewHmctsChargeOutcomes(),
    })
  }

  // TODO (CDIA-490): port this logic for HMCTS ResultCode (use ChargeOutcomeAdminRoutesHandler.submitAdd as reference)
  submitAdd = async (req: Request, res: Response) => {
    const createChargeOutcome = trimForm<CreateChargeOutcome>(req.body)
    try {
      // await this.refDataService.createChargeOutcome(createChargeOutcome, req.user.username)
      // await this.refDataService.clearChargeOutcomeCache()
      req.flash('successMessage', 'charge outcome successfully created')
      return res.redirect(ReferenceDataJourneyUrls.viewHmctsChargeOutcomes())
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

  // TODO (CDIA-490): port this logic for HMCTS ResultCode (use ChargeOutcomeAdminRoutesHandler.edit as reference)
  edit = async (req: Request, res: Response) => {
    const chargeOutcomes = await this.refDataService.getAllUncachedChargeOutcomes(req.user.username)
    const { chargeOutcomeUuid } = req.params as { chargeOutcomeUuid: string }
    const existingChargeOutcome = chargeOutcomes.find(chargeOutcome => chargeOutcome.outcomeUuid === chargeOutcomeUuid)
    const types = new Set(chargeOutcomes.map(outcome => outcome.outcomeType))
    const dispositionCodes = new Set(chargeOutcomes.map(outcome => outcome.dispositionCode))
    const statuses: CreateChargeOutcome['status'][] = ['ACTIVE', 'INACTIVE']
    const updateChargeOutcome = (req.flash('updateChargeOutcome')[0] || {
      ...existingChargeOutcome,
    }) as CreateChargeOutcome
    return res.render('pages/referenceData/chargeOutcome/edit', {
      types,
      dispositionCodes,
      statuses,
      updateChargeOutcome,
      errors: req.flash('errors') || [],
      backLink: ReferenceDataJourneyUrls.viewHmctsChargeOutcomes(),
    })
  }

  // TODO (CDIA-490): port this logic for HMCTS ResultCode (use ChargeOutcomeAdminRoutesHandler.submitEdit as reference)
  submitEdit = async (req: Request, res: Response) => {
    const { chargeOutcomeUuid } = req.params as { chargeOutcomeUuid: string }
    const updateChargeOutcome = trimForm<CreateChargeOutcome>(req.body)
    try {
      // await this.refDataService.updateChargeOutcome(chargeOutcomeUuid, updateChargeOutcome, req.user.username)
      // await this.refDataService.clearChargeOutcomeCache()
      req.flash('successMessage', 'charge outcome successfully updated')
      return res.redirect(ReferenceDataJourneyUrls.viewHmctsChargeOutcomes())
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
          req.flash('updateChargeOutcome', { ...updateChargeOutcome })
          return res.redirect(`/admin/charge-outcomes/edit/${chargeOutcomeUuid}`)
        }
      }
      throw e
    }
  }
}
