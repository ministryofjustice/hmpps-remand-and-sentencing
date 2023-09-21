import { RequestHandler } from 'express'
import path from 'path'
import PrisonerService from '../services/prisonerService'

const placeHolderImage = path.join(process.cwd(), '/assets/images/prisoner-profile-image.png')
export default class ApiRoutes {
  constructor(private readonly prisonerService: PrisonerService) {}

  public personImage: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId } = req.params
    return this.prisonerService
      .getPrisonerImage(nomsId, res.locals.user.token)
      .then(data => {
        res.set('Cache-control', 'private, max-age=86400')
        res.removeHeader('pragma')
        res.type('image/jpeg')
        data.pipe(res)
      })
      .catch(_error => {
        res.sendFile(placeHolderImage)
      })
  }
}
