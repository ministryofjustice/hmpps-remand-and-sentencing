import type { Offence } from 'models'
import type { OffenceOffenceDateForm } from 'forms'
import { SessionData } from 'express-session'
import ManageOffencesService from './manageOffencesService'
import OffenceOutcomeService from './offenceOutcomeService'
import OffenceService from './offenceService'
import RemandAndSentencingService from './remandAndSentencingService'

jest.mock('./manageOffencesService')
jest.mock('./offenceOutcomeService')
jest.mock('./remandAndSentencingService')

describe('offenceService', () => {
  let manageOffencesService: jest.Mocked<ManageOffencesService>
  let offenceOutcomeService: jest.Mocked<OffenceOutcomeService>
  let remandAndSentencingService: jest.Mocked<RemandAndSentencingService>
  let service: OffenceService

  beforeEach(() => {
    manageOffencesService = new ManageOffencesService(null) as jest.Mocked<ManageOffencesService>
    offenceOutcomeService = new OffenceOutcomeService(null) as jest.Mocked<OffenceOutcomeService>
    remandAndSentencingService = new RemandAndSentencingService(null) as jest.Mocked<RemandAndSentencingService>
    service = new OffenceService(manageOffencesService, offenceOutcomeService, remandAndSentencingService)
  })

  it('must clear offence end date', () => {
    const nomsId = 'P123'
    const courtCaseReference = '1'
    const offence = {
      chargeUuid: '1',
      offenceStartDate: new Date(),
      offenceEndDate: new Date(),
    } as Offence
    const session = {
      offences: {
        [`${nomsId}-${courtCaseReference}`]: offence,
      },
    } as unknown as Partial<SessionData>
    const offenceOffenceDateForm = {
      'offenceStartDate-day': '12',
      'offenceStartDate-month': '5',
      'offenceStartDate-year': '2025',
    } as OffenceOffenceDateForm
    const errors = service.setOffenceDates(
      session,
      nomsId,
      courtCaseReference,
      offenceOffenceDateForm,
      '',
      new Date(),
      new Date(),
    )
    expect(errors.length).toBe(0)
    expect(offence.offenceEndDate).toBeUndefined()
  })
})
