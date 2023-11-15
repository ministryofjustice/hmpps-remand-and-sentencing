// Require app insights before anything else to allow for instrumentation of bunyan and express
import 'applicationinsights'
import dayjs from 'dayjs'
import objectSupport from 'dayjs/plugin/objectSupport'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'

import { app, metricsApp } from './server/index'
import logger from './logger'

dayjs.extend(objectSupport)
dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.tz.setDefault('Europe/London')

app.listen(app.get('port'), () => {
  logger.info(`Server listening on port ${app.get('port')}`)
})

metricsApp.listen(metricsApp.get('port'), () => {
  logger.info(`Metrics server listening on port ${metricsApp.get('port')}`)
})
