import { RequestHandler } from 'express'

export default class RemandAndSentencingRoutes {
  constructor() {}

  public start: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId } = req.params
    return res.render('pages/start', {
      nomsId,
    })
  }
}
