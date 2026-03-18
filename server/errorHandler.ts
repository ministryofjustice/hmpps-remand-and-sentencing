import type { Request, Response, NextFunction } from 'express'
import type { HTTPError } from 'superagent'
import logger from '../logger'
import FullPageError from './model/FullPageError'

export default function createErrorHandler(production: boolean) {
  return (error: HTTPError | FullPageError, req: Request, res: Response, _next: NextFunction): void => {
    logger.error(`Error handling request for '${req.originalUrl}', user '${res.locals.user?.username}'`, error)

    // Auth errors → log user out
    if (error.status === 401 || error.status === 403) {
      return res.redirect('/sign-out')
    }

    // --- FullPageError branch ---
    if (error instanceof FullPageError) {
      res.locals.errorKey = error.errorKey
      res.locals.status = error.status
      res.locals.message = error.message

      if (error.nomsId) {
        res.locals.nomsId = error.nomsId
      }

      res.locals.stack = production ? null : error.stack

      res.status(error.status)
      return res.render('pages/error')
    }

    // --- Non-FullPageError (eg. HTTPError from superagent) ---
    res.locals.status = error.status ?? 500
    res.locals.message = production
      ? 'Something went wrong. The error has been logged. Please try again'
      : error.message

    res.locals.stack = production ? null : error.stack

    res.status(res.locals.status)
    return res.render('pages/error')
  }
}
