import type { Request, Response } from 'express'
import dayjs from 'dayjs'
import { SanitisedError } from '@ministryofjustice/hmpps-rest-client'
import RefDataService from '../../services/refDataService'
import config from '../../config'
import {
  CreateSentenceType,
  FieldErrorErrorResponse,
} from '../../@types/remandAndSentencingApi/remandAndSentencingClientTypes'
import trimForm from '../../utils/trim'

export default class SentenceTypeAdminRoutesHandler {
  constructor(private readonly refDataService: RefDataService) {}

  index = async (req: Request, res: Response) => {
    const allSentenceTypes = await this.refDataService.getAllUncachedSentenceTypes(req.user.username)
    return res.render('pages/referenceData/sentenceType/index', {
      sentenceTypes: allSentenceTypes.sentenceTypes
        .map(sentenceTypeDetails => {
          return {
            ...sentenceTypeDetails,
            sentenceTypeUuid: sentenceTypeDetails.sentenceTypeUuid.slice(0, 7),
            minAgeInclusive: sentenceTypeDetails.minAgeInclusive ?? 0,
            maxAgeExclusive: sentenceTypeDetails.maxAgeExclusive ?? 999,
            minDateInclusive: this.formatDateElse(sentenceTypeDetails.minDateInclusive, '01/01/0001'),
            maxDateExclusive: this.formatDateElse(sentenceTypeDetails.maxDateExclusive, '31/12/9999'),
            minOffenceDateInclusive: this.formatDateElse(sentenceTypeDetails.minOffenceDateInclusive, '01/01/0001'),
            maxOffenceDateExclusive: this.formatDateElse(sentenceTypeDetails.maxOffenceDateExclusive, '31/12/9999'),
          }
        })
        .sort((a, b) => a.description.localeCompare(b.description)),
      successMessage: req.flash('successMessage')[0],
    })
  }

  add = async (req: Request, res: Response) => {
    const createSentenceType = (req.flash('createSentenceType')[0] || {}) as CreateSentenceType
    const statuses: CreateSentenceType['status'][] = ['ACTIVE', 'INACTIVE']
    const classifications: CreateSentenceType['classification'][] = [
      'BOTUS',
      'CIVIL',
      'DTO',
      'EXTENDED',
      'FINE',
      'INDETERMINATE',
      'LEGACY',
      'LEGACY_RECALL',
      'NON_CUSTODIAL',
      'SOPC',
      'STANDARD',
      'UNKNOWN',
    ]
    return res.render('pages/referenceData/sentenceType/add', {
      statuses,
      classifications,
      createSentenceType,
      errors: req.flash('errors') || [],
    })
  }

  submitAdd = async (req: Request, res: Response) => {
    const createSentenceType = trimForm<CreateSentenceType>(req.body)
    const createSentenceTypeRequest = {
      ...createSentenceType,
      ...(createSentenceType.minDateInclusive
        ? { minDateInclusive: dayjs(createSentenceType.minDateInclusive, 'D/M/YYYY').format('YYYY-MM-DD') }
        : {}),
      ...(createSentenceType.maxDateExclusive
        ? { maxDateExclusive: dayjs(createSentenceType.maxDateExclusive, 'D/M/YYYY').format('YYYY-MM-DD') }
        : {}),
      ...(createSentenceType.minOffenceDateInclusive
        ? {
            minOffenceDateInclusive: dayjs(createSentenceType.minOffenceDateInclusive, 'D/M/YYYY').format('YYYY-MM-DD'),
          }
        : {}),
      ...(createSentenceType.maxOffenceDateExclusive
        ? {
            maxOffenceDateExclusive: dayjs(createSentenceType.maxOffenceDateExclusive, 'D/M/YYYY').format('YYYY-MM-DD'),
          }
        : {}),
    }
    try {
      await this.refDataService.createSentenceType(createSentenceTypeRequest, req.user.username)
      req.flash('successMessage', 'sentence type successfully created')
      return res.redirect('/admin/sentence-type')
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
          req.flash('createSentenceType', { ...createSentenceType })
          return res.redirect('/admin/sentence-type/add')
        }
      }
      throw e
    }
  }

  private formatDateElse(date: string, fallback: string): string {
    return date ? dayjs(date).format(config.dateFormat) : fallback
  }
}
