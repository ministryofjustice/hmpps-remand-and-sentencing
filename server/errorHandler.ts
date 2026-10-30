import type { Request, Response, NextFunction } from 'express'
import type { HTTPError } from 'superagent'
import type { SanitisedError } from '@ministryofjustice/hmpps-rest-client'
import logger from '../logger'
import FullPageError from './model/FullPageError'
import { saveSession } from './data/sessionRecoveryStore'

function extractStatus(error: HTTPError | FullPageError | SanitisedError): number | undefined {
  const sanitisedError = error as SanitisedError<{ status?: number }>
  return (error as HTTPError).status ?? sanitisedError.responseStatus ?? sanitisedError.data?.status
}

function extractNomsIdFromUrl(originalUrl: string): string | undefined {
  return originalUrl.match(/^\/person\/([^/?]+)/)?.[1]
}

export async function snapshotSessionForRecovery(res: Response, req: Request) {
  const username = res.locals.user?.username ?? req.user?.username
  const nomsId = req.params?.nomsId ?? extractNomsIdFromUrl(req.originalUrl)
  if (username && nomsId) {
    await saveSession(username, nomsId, req.session)
  }
}

export default function createErrorHandler(production: boolean) {
  return async (error: HTTPError | FullPageError, req: Request, res: Response, _next: NextFunction): Promise<void> => {
    logger.error(`Error handling request for '${req.originalUrl}', user '${res.locals.user?.username}'`, error)
    await snapshotSessionForRecovery(res, req)

    const status = extractStatus(error)
    if (status === 401 || status === 403) {
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
