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
            minDateInclusive: dayjs(sentenceTypeDetails.minDateInclusive ?? '1000-01-01').format(config.dateFormat),
            maxDateExclusive: dayjs(sentenceTypeDetails.maxDateExclusive ?? '9999-12-31').format(config.dateFormat),
            minOffenceDateInclusive: dayjs(sentenceTypeDetails.minOffenceDateInclusive ?? '1000-01-01').format(
              config.dateFormat,
            ),
            maxOffenceDateExclusive: dayjs(sentenceTypeDetails.maxOffenceDateExclusive ?? '9999-12-31').format(
              config.dateFormat,
            ),
          }
        })
        .sort((a, b) => a.description.localeCompare(b.description)),
      successMessage: req.flash('successMessage')[0],
    })
  }
}
