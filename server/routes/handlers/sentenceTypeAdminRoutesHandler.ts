import type { Request, Response } from 'express'
import dayjs from 'dayjs'
import RefDataService from '../../services/refDataService'
import config from '../../config'

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

  private formatDateElse(date: string, fallback: string): string {
    return date ? dayjs(date).format(config.dateFormat) : fallback
  }
}
