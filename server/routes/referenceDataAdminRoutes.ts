import { Router } from 'express'
import ReferenceDataAdminRoutesHandler from './handlers/referenceDataAdminRoutesHandler'
import authorisationMiddleware from '../middleware/authorisationMiddleware'

export default function referenceDataAdminRoutes(): Router {
  const router = Router()
  const routes = new ReferenceDataAdminRoutesHandler()
  router.use(authorisationMiddleware(['ROLE_RAS_REFERENCE_ADMIN']))
  router.get('/', routes.index)

  return router
}
