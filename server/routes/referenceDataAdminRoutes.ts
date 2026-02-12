import { Router } from 'express'
import ReferenceDataAdminRoutesHandler from './handlers/referenceDataAdminRoutesHandler'

export default function referenceDataAdminRoutes(): Router {
  const router = Router()
  const routes = new ReferenceDataAdminRoutesHandler()

  router.get('/', routes.index)

  return router
}
