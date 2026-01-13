// server/middleware/currentPageUrl.ts
import { RequestHandler } from 'express'

const setCurrentPageUrl: RequestHandler = (req, res, next) => {
  res.locals.currentPageUrl = req.originalUrl
  next()
}

export default setCurrentPageUrl
