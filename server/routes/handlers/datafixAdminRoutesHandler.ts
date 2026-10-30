import type { Request, Response } from 'express'
import RemandAndSentencingService from '../../services/remandAndSentencingService'
import DatafixJourneyUrls from '../data/DatafixJourneyUrls'

export default class DatafixAdminRoutesHandler {
  constructor(private readonly remandAndSentencingService: RemandAndSentencingService) {}

  index = async (req: Request, res: Response) => {
    const { success } = req.query as { success: string }
    return res.render('pages/datafix/index', {
      success,
    })
  }

  submitDatafix = async (req: Request, res: Response) => {
    const { username } = res.locals.user
    const { prisonerIds } = req.body

    const nomsIds = (prisonerIds as string).split(/\r?\n/)
    await this.remandAndSentencingService.fixPrisonersManyChargesToSentence(nomsIds, username)
    const path = DatafixJourneyUrls.home('true')
    return res.redirect(path)
  }
}
