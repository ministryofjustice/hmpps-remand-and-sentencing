import type { Request, Response } from 'express'
import dayjs from 'dayjs'
import { SanitisedError } from '@ministryofjustice/hmpps-rest-client'
import type { SentenceTypeSearchForm } from 'forms'
import RefDataService from '../../services/refDataService'
import config from '../../config'
import {
  CreateSentenceType,
  FieldErrorErrorResponse,
  SentenceType,
} from '../../@types/remandAndSentencingApi/remandAndSentencingClientTypes'
import trimForm from '../../utils/trim'
import validate from '../../validation/validation'
import ReferenceDataJourneyUrls from '../data/ReferenceDataJourneyUrls'

export default class SentenceTypeAdminRoutesHandler {
  constructor(private readonly refDataService: RefDataService) {}

  index = async (req: Request, res: Response) => {
    const allSentenceTypes = await this.refDataService.getAllUncachedSentenceTypes(req.user.username)
    return res.render('pages/referenceData/sentenceType/index', {
      sentenceTypes: allSentenceTypes.sentenceTypes
        .map(sentenceTypeDetails => {
          return {
            ...sentenceTypeDetails,
            shortSentenceTypeUuid: sentenceTypeDetails.sentenceTypeUuid.slice(0, 7),
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
      backLink: ReferenceDataJourneyUrls.home(),
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
      backLink: ReferenceDataJourneyUrls.viewSentenceTypes(),
    })
  }

  submitAdd = async (req: Request, res: Response) => {
    const createSentenceType = trimForm<CreateSentenceType>(req.body)
    const createSentenceTypeRequest = this.formatCreateSentenceTypeDates(createSentenceType, 'D/M/YYYY', 'YYYY-MM-DD')
    try {
      await this.refDataService.createSentenceType(createSentenceTypeRequest, req.user.username)
      req.flash('successMessage', 'sentence type successfully created')
      return res.redirect(ReferenceDataJourneyUrls.viewSentenceTypes())
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

  edit = async (req: Request, res: Response) => {
    const { sentenceTypeUuid } = req.params as { sentenceTypeUuid: string }
    const existingSentenceType = await this.refDataService.getSentenceTypeDetailsById(
      sentenceTypeUuid,
      req.user.username,
    )
    const updateSentenceType = (req.flash('updateSentenceType')[0] ||
      this.formatCreateSentenceTypeDates(existingSentenceType, 'YYYY-MM-DD', 'D/M/YYYY')) as CreateSentenceType
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
    return res.render('pages/referenceData/sentenceType/edit', {
      statuses,
      classifications,
      updateSentenceType,
      errors: req.flash('errors') || [],
      backLink: ReferenceDataJourneyUrls.viewSentenceTypes(),
    })
  }

  submitEdit = async (req: Request, res: Response) => {
    const { sentenceTypeUuid } = req.params as { sentenceTypeUuid: string }
    const updateSentenceType = trimForm<CreateSentenceType>(req.body)
    const updateSentenceTypeRequest = this.formatCreateSentenceTypeDates(updateSentenceType, 'D/M/YYYY', 'YYYY-MM-DD')
    try {
      await this.refDataService.updateSentenceType(sentenceTypeUuid, updateSentenceTypeRequest, req.user.username)
      req.flash('successMessage', 'sentence type successfully updated')
      return res.redirect(ReferenceDataJourneyUrls.viewSentenceTypes())
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
          req.flash('updateSentenceType', { ...updateSentenceType })
          return res.redirect(`/admin/sentence-type/edit/${sentenceTypeUuid}`)
        }
      }
      throw e
    }
  }

  search = async (req: Request, res: Response) => {
    const searchParameters = trimForm<SentenceTypeSearchForm>(req.query)
    let sentenceTypesPromise: Promise<SentenceType[]> = Promise.resolve([])
    const errors = []
    if (searchParameters.searchSubmitted) {
      errors.push(...this.validateSearchParameters(searchParameters))
      if (!errors.length) {
        const age = parseInt(searchParameters.ageAtConviction, 10)
        const convictionDate = dayjs(searchParameters.convictionDate, 'D/M/YYYY')
        const offenceDate = dayjs(searchParameters.offenceDate, 'D/M/YYYY')
        sentenceTypesPromise = this.refDataService.getSentenceTypes(
          age,
          convictionDate,
          offenceDate,
          searchParameters.chargeOutcomeUuid,
          req.user.username,
        )
      }
    }

    const [sentenceTypes, chargeOutcomes] = await Promise.all([
      sentenceTypesPromise,
      this.refDataService.getAllSentenceTypeChargeOutcomes(req.user.username),
    ])
    return res.render('pages/referenceData/sentenceType/search', {
      searchParameters,
      sentenceTypes: sentenceTypes.sort((a, b) => a.displayOrder - b.displayOrder),
      chargeOutcomes: chargeOutcomes.chargeOutcomes,
      errors,
      backLink: ReferenceDataJourneyUrls.viewSentenceTypes(),
    })
  }

  private validateSearchParameters(searchParameters: SentenceTypeSearchForm): {
    text?: string
    html?: string
    href: string
  }[] {
    const errors = validate(
      searchParameters,
      {
        convictionDate: 'required',
        offenceDate: 'required',
        ageAtConviction: 'required|minWholeNumber:0',
      },
      {
        'required.convictionDate': 'You must select a conviction date',
        'required.offenceDate': 'You must select an offence date',
        'required.ageAtConviction': 'You must supply an age at conviction',
        'minWholeNumber.ageAtConviction': 'The number must be a whole number, or 0',
      },
    )
    return errors
  }

  private formatCreateSentenceTypeDates(
    createSentenceType: CreateSentenceType,
    fromDateFormat: string,
    toDateFormat: string,
  ): CreateSentenceType {
    const mapped = this.stripEmptyStringToNull(createSentenceType)
    return {
      ...mapped,
      ...(mapped.minDateInclusive
        ? { minDateInclusive: dayjs(mapped.minDateInclusive, fromDateFormat).format(toDateFormat) }
        : {}),
      ...(mapped.maxDateExclusive
        ? { maxDateExclusive: dayjs(mapped.maxDateExclusive, fromDateFormat).format(toDateFormat) }
        : {}),
      ...(mapped.minOffenceDateInclusive
        ? {
            minOffenceDateInclusive: dayjs(mapped.minOffenceDateInclusive, fromDateFormat).format(toDateFormat),
          }
        : {}),
      ...(mapped.maxOffenceDateExclusive
        ? {
            maxOffenceDateExclusive: dayjs(mapped.maxOffenceDateExclusive, fromDateFormat).format(toDateFormat),
          }
        : {}),
    }
  }

  private stripEmptyStringToNull(createSentenceType: CreateSentenceType): CreateSentenceType {
    return Object.keys(createSentenceType).reduce((acc, key) => {
      const value = createSentenceType[key]
      if (typeof value !== 'string' || value !== '') {
        acc[key] = value
      }
      return acc
    }, {} as CreateSentenceType)
  }

  private formatDateElse(date: string, fallback: string): string {
    return date ? dayjs(date).format(config.dateFormat) : fallback
  }
}
