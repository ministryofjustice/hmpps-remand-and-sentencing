import type { CourtAppearance, Offence } from 'models'
import { SessionData } from 'express-session'
import type { CourtCaseWarrantDateForm } from 'forms'
import dayjs from 'dayjs'
import objectSupport from 'dayjs/plugin/objectSupport'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
import customParseFormat from 'dayjs/plugin/customParseFormat'
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore'
import RemandAndSentencingService from './remandAndSentencingService'
import DocumentManagementService from './documentManagementService'
import CourtAppearanceService from './courtAppearanceService'
import RefDataService from './refDataService'

dayjs.extend(isSameOrBefore)
dayjs.extend(customParseFormat)
dayjs.extend(objectSupport)
dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.tz.setDefault('Europe/London')

jest.mock('./documentManagementService')
jest.mock('./remandAndSentencingService')
jest.mock('./refDataService')

describe('courtAppearanceService', () => {
  let remandAndSentencingService: jest.Mocked<RemandAndSentencingService>
  let documentManagementService: jest.Mocked<DocumentManagementService>
  let refDataService: jest.Mocked<RefDataService>
  let service: CourtAppearanceService

  beforeEach(() => {
    remandAndSentencingService = new RemandAndSentencingService(null) as jest.Mocked<RemandAndSentencingService>
    documentManagementService = new DocumentManagementService(null) as jest.Mocked<DocumentManagementService>
    refDataService = new RefDataService(null) as jest.Mocked<RefDataService>
    service = new CourtAppearanceService(remandAndSentencingService, documentManagementService, refDataService)
  })

  it('must reset chain when multiple sentences are consecutive to same sentence', () => {
    const nomsId = 'P123'
    const toBeDeletedOffence = {
      chargeUuid: '123',
      sentence: {
        sentenceUuid: '123',
      },
    } as Offence

    const firstConsecutiveTo = {
      chargeUuid: '456',
      sentence: {
        sentenceUuid: '456',
        consecutiveToSentenceUuid: '123',
      },
    } as Offence
    const secondConsecutiveTo = {
      chargeUuid: '789',
      sentence: {
        sentenceUuid: '789',
        consecutiveToSentenceUuid: '123',
      },
    } as Offence
    const courtAppearance = {
      appearanceUuid: '1234567',
      offences: [firstConsecutiveTo, secondConsecutiveTo, toBeDeletedOffence],
    } as CourtAppearance
    const session = {
      courtAppearances: {
        [`${nomsId}`]: courtAppearance,
      },
    } as unknown as Partial<SessionData>
    service.deleteSentenceInChain(session, nomsId, toBeDeletedOffence.chargeUuid, courtAppearance.appearanceUuid)
    expect(firstConsecutiveTo.sentence.consecutiveToSentenceUuid).toBeUndefined()
    expect(secondConsecutiveTo.sentence.consecutiveToSentenceUuid).toBeUndefined()
  })

  describe('validate warrant date', () => {
    it('submitting a sentencing warrant date before an existing remand appearance returns error', async () => {
      const nomsId = 'P123'
      remandAndSentencingService.getValidationDatesForCourtCase.mockResolvedValue({
        offenceDate: '2000-01-01',
        latestRemandAppearanceDate: '2025-01-01',
      })
      const courtAppearance = {
        appearanceUuid: '1234567',
        warrantType: 'SENTENCING',
        offences: [],
      } as CourtAppearance
      const session = {
        courtAppearances: {
          [`${nomsId}`]: courtAppearance,
        },
      } as unknown as Partial<SessionData>
      const warrantDateForm = {
        'warrantDate-day': '10',
        'warrantDate-month': '10',
        'warrantDate-year': '2024',
      } as CourtCaseWarrantDateForm
      const errors = await service.setWarrantDate(session, nomsId, warrantDateForm, '1', '1', 'edit-court-case', 'user')
      expect(errors.length).toBe(1)
      const error = errors[0]
      expect(error).toStrictEqual({
        text: 'The date of a sentencing warrant cannot be before the date of a remand warrant',
        href: '#warrantDate',
      })
    })

    it('submitting a remand warrant date after an existing sentencing appearance returns error', async () => {
      const nomsId = 'P123'
      remandAndSentencingService.getValidationDatesForCourtCase.mockResolvedValue({
        offenceDate: '2000-01-01',
        latestRemandAppearanceDate: null,
        latestSentenceAppearanceDate: '2025-10-01',
      })

      const courtAppearance = {
        appearanceUuid: '1234567',
        warrantType: 'REMAND',
        offences: [],
      } as CourtAppearance

      const session = {
        courtAppearances: {
          [nomsId]: courtAppearance,
        },
      } as unknown as Partial<SessionData>

      // 👇 This date is *after* the sentencing date above (2025-10-01)
      const warrantDateForm = {
        'warrantDate-day': '10',
        'warrantDate-month': '10',
        'warrantDate-year': '2025',
      } as CourtCaseWarrantDateForm

      const errors = await service.setWarrantDate(session, nomsId, warrantDateForm, '1', '1', 'edit-court-case', 'user')

      expect(errors.length).toBe(1)
      expect(errors[0]).toStrictEqual({
        text: 'The date of a remand warrant cannot be after the date of a sentencing warrant on the same court case',
        href: '#warrantDate',
      })
    })
  })
})
