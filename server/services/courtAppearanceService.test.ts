import type { CourtAppearance, Offence } from 'models'
import { SessionData } from 'express-session'
import CourtAppearanceService from './courtAppearanceService'
import DocumentManagementService from './documentManagementService'
import RemandAndSentencingService from './remandAndSentencingService'

jest.mock('./documentManagementService')
jest.mock('./remandAndSentencingService')

describe('courtAppearanceService', () => {
  let remandAndSentencingService: jest.Mocked<RemandAndSentencingService>
  let documentManagementService: jest.Mocked<DocumentManagementService>
  let service: CourtAppearanceService

  beforeEach(() => {
    remandAndSentencingService = new RemandAndSentencingService(null) as jest.Mocked<RemandAndSentencingService>
    documentManagementService = new DocumentManagementService(null) as jest.Mocked<DocumentManagementService>
    service = new CourtAppearanceService(remandAndSentencingService, documentManagementService)
  })

  it('must reset chain when multiple sentences are consecutive to same sentence', () => {
    const nomsId = 'P123'
    const toBeDeletedOffence = {
      chargeUuid: '123',
      sentence: {
        sentenceUuid: '123',
        sentenceReference: '0',
      },
    } as Offence

    const firstConsecutiveTo = {
      chargeUuid: '456',
      sentence: {
        sentenceUuid: '456',
        sentenceReference: '1',
        consecutiveToSentenceReference: '0',
      },
    } as Offence
    const secondConsecutiveTo = {
      chargeUuid: '789',
      sentence: {
        sentenceUuid: '789',
        sentenceReference: '2',
        consecutiveToSentenceReference: '0',
      },
    } as Offence
    const courtAppearance = {
      appearanceUuid: '1234567',
      offences: [toBeDeletedOffence, firstConsecutiveTo, secondConsecutiveTo],
    } as CourtAppearance
    const session = {
      courtAppearances: {
        [`${nomsId}`]: courtAppearance,
      },
    } as unknown as Partial<SessionData>
    service.deleteSentenceInChain(session, nomsId, toBeDeletedOffence.chargeUuid, courtAppearance.appearanceUuid)
    expect(firstConsecutiveTo.sentence.consecutiveToSentenceReference).toBeUndefined()
    expect(secondConsecutiveTo.sentence.consecutiveToSentenceReference).toBeUndefined()
  })
})
