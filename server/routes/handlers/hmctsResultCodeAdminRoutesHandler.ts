import type { Request, Response } from 'express'
import { SanitisedError } from '@ministryofjustice/hmpps-rest-client'
import RefDataService from '../../services/refDataService'
import ReferenceDataJourneyUrls from '../data/ReferenceDataJourneyUrls'
import {
  CreateChargeOutcome,
  CreateHmctsResultCode,
  FieldErrorErrorResponse,
} from '../../@types/remandAndSentencingApi/remandAndSentencingClientTypes'
import trimForm from '../../utils/trim'

export default class HmctsResultCodeAdminRoutesHandler {
  constructor(private readonly refDataService: RefDataService) {}

  index = async (req: Request, res: Response) => {
    const hmctsResultCodes = await this.refDataService.getAllUncachedHmctsResultCodes(req.user.username)
    return res.render('pages/referenceData/hmctsResultCode/index', {
      hmctsResultCodes,
      successMessage: req.flash('successMessage')[0],
      backLink: ReferenceDataJourneyUrls.home(),
    })
  }

  add = async (req: Request, res: Response) => {
    const chargeOutcomes = await this.getRelatedChargeOutcomes(req)
    const statuses: CreateHmctsResultCode['status'][] = ['ACTIVE', 'INACTIVE']
    const createHmctsResultCode = (req.flash('createHmctsResultCode')[0] || {}) as CreateHmctsResultCode

    return res.render('pages/referenceData/hmctsResultCode/add', {
      chargeOutcomes,
      statuses,
      createHmctsResultCode,
      errors: req.flash('errors') || [],
      backLink: ReferenceDataJourneyUrls.viewHmctsResultCodes(),
    })
  }

  submitAdd = async (req: Request, res: Response) => {
    const createHmctsResultCode = trimForm<CreateHmctsResultCode>(req.body)

    try {
      await this.refDataService.createHmctsResultCode(createHmctsResultCode, req.user.username)
      await this.refDataService.clearHmctsResultCodeCache()
      req.flash('successMessage', 'HMCTS result code successfully created')
      return res.redirect(ReferenceDataJourneyUrls.viewHmctsResultCodes())
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
          req.flash('createHmctsResultCode', { ...createHmctsResultCode })
          return res.redirect('/admin/hmcts-result-codes/add')
        }

        if (this.isRelatedOutComeInputError(sanitisedError)) {
          req.flash('errors', [
            {
              href: '#outcomeUuid',
              text: 'Related Charge Outcome must be selected. Other inputs might still need to be checked',
            },
          ])
          req.flash('createHmctsResultCode', { ...createHmctsResultCode })
          return res.redirect('/admin/hmcts-result-codes/add')
        }

        if (this.isResultCodeUuidError(sanitisedError)) {
          req.flash('errors', [{ href: '#resultUuid', text: 'Result Code Uuid already exists' }])
          req.flash('createHmctsResultCode', { ...createHmctsResultCode })
          return res.redirect('/admin/hmcts-result-codes/add')
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
    const updateChargeOutcome = (req.flash('updateHmctsResultCode')[0] || {
      ...existingChargeOutcome,
    }) as CreateChargeOutcome
    return res.render('pages/referenceData/hmctsResultCode/edit', {
      types,
      dispositionCodes,
      statuses,
      updateChargeOutcome,
      errors: req.flash('errors') || [],
      backLink: ReferenceDataJourneyUrls.viewHmctsResultCodes(),
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
      return res.redirect(ReferenceDataJourneyUrls.viewHmctsResultCodes())
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
          req.flash('updateHmctsResultCode', { ...updateChargeOutcome })
          return res.redirect(`/admin/charge-outcomes/edit/${chargeOutcomeUuid}`)
        }
      }
      throw e
    }
  }

  private async getRelatedChargeOutcomes(req: Request) {
    const chargeOutcomes = await this.refDataService.getAllUncachedChargeOutcomes(req.user.username)
    return chargeOutcomes.sort((a, b) => a.outcomeName.localeCompare(b.outcomeName))
  }

  private isRelatedOutComeInputError(e: SanitisedError): boolean {
    if (e.responseStatus !== 500) return false

    const fieldErrors = e.data as FieldErrorErrorResponse
    return fieldErrors.userMessage.lastIndexOf('JSON property outcomeUuid due to missing') > 0
  }

  private isResultCodeUuidError(e: SanitisedError): boolean {
    if (e.responseStatus !== 500) return false

    const fieldErrors = e.data as FieldErrorErrorResponse

    return (
      fieldErrors.userMessage.lastIndexOf('idx_hmcts_result_code_identifier') > 0 &&
      fieldErrors.userMessage.lastIndexOf('already exists') > 0
    )
  }
}
