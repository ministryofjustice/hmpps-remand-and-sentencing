import type { Request, Response } from 'express'

export default class ReferenceDataAdminRoutesHandler {
  index = async (req: Request, res: Response) => {
    return res.render('pages/referenceData/index')
  }
}
