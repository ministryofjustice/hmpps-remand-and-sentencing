import type { Request, Response, NextFunction } from 'express'
import type { HTTPError } from 'superagent'
import type { SanitisedError } from '@ministryofjustice/hmpps-rest-client'
import logger from '../logger'
import FullPageError from './model/FullPageError'
import { saveSession } from './data/sessionRecoveryStore'

// API clients built on @ministryofjustice/hmpps-rest-client throw SanitisedError, which carries
// .responseStatus, not .status — the type below is aspirational, not what's actually thrown at
// runtime. Normalize both shapes here, same as server/routes/baseRoutes.ts does locally for a 409
// check, so a real downstream 401/403 is recognised rather than silently falling through to a 500.
function extractStatus(error: HTTPError | FullPageError | SanitisedError): number | undefined {
  const sanitisedError = error as SanitisedError<{ status?: number }>
  return (error as HTTPError).status ?? sanitisedError.responseStatus ?? sanitisedError.data?.status
}

// Express restores req.params to whatever the CURRENT middleware layer's mount path implies once an
// error propagates out of a nested router (e.g. app.use('/person/:nomsId', ...)) up to a root-level
// error handler like this one — so req.params.nomsId is unreliable here even though it was correctly
// set further down the stack. req.originalUrl still has it, so extract it from there instead.
function extractNomsIdFromUrl(originalUrl: string): string | undefined {
  return originalUrl.match(/^\/person\/([^/?]+)/)?.[1]
}

export default function createErrorHandler(production: boolean) {
  return async (error: HTTPError | FullPageError, req: Request, res: Response, _next: NextFunction): Promise<void> => {
    logger.error(`Error handling request for '${req.originalUrl}', user '${res.locals.user?.username}'`, error)

    const status = extractStatus(error)

    // Auth errors → log user out. If a prisoner journey is in progress, snapshot it so it can be
    // restored once the user has re-authenticated (see populateCurrentPrisoner). A deliberate
    // sign-out never reaches this handler, so it's never snapshotted here.
    if (status === 401 || status === 403) {
      const username = res.locals.user?.username
      const nomsId = req.params?.nomsId ?? extractNomsIdFromUrl(req.originalUrl)
      if (username && nomsId) {
        await saveSession(username, nomsId, req.session)
      }
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
