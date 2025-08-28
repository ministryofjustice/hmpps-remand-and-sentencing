import type { CourtAppearance } from 'models'
import RemandAndSentencingApiClient from '../data/remandAndSentencingApiClient'
import RemandAndSentencingService from './remandAndSentencingService'

jest.mock('../data/remandAndSentencingApiClient')

describe('RemandAndSentencingService', () => {
  let remandAndSentencingApiClient: jest.Mocked<RemandAndSentencingApiClient>

  let service: RemandAndSentencingService

  beforeEach(() => {
    remandAndSentencingApiClient = {
      hasLoopInChain: jest.fn(),
    } as unknown as jest.Mocked<RemandAndSentencingApiClient>
    ;(RemandAndSentencingApiClient as jest.Mock).mockImplementation(() => remandAndSentencingApiClient)

    service = new RemandAndSentencingService(remandAndSentencingApiClient)
  })

  describe('validateConsecutiveLoops', () => {
    const sessionCourtAppearance = {
      appearanceUuid: 'app1',
      offences: [{ sentence: { sentenceUuid: 'uuid-1', sentenceReference: 'ref-1' } }],
    } as unknown as CourtAppearance

    it('Source sentence has not beed added to sentences yet', async () => {
      const response = await service.validateConsecutiveLoops(
        true,
        'uuid3',
        sessionCourtAppearance,
        'AB123A',
        'uuid-0',
        'user',
      )

      expect(response).toEqual([])
    })

    it('If validation api call fails correct errors are returned', async () => {
      remandAndSentencingApiClient.hasLoopInChain.mockResolvedValue(true)
      const response = await service.validateConsecutiveLoops(
        false,
        'uuid3',
        sessionCourtAppearance,
        'AB123A',
        'uuid-1',
        'user',
      )

      expect(response).toEqual([
        {
          html: 'The sentence you have selected is already part of the consecutive chain<br>You must select a sentence that has not been used in this chain.',
          href: '#',
        },
      ])
    })

    it('calls API with correct request using cnsecutiveToSentenceUuid', async () => {
      const courtAppearance = {
        appearanceUuid: 'app1',
        offences: [
          {
            sentence: {
              sentenceUuid: 'uuid-1',
              sentenceReference: 'REF-1',
              consecutiveToSentenceUuid: null,
            },
          },
          {
            sentence: {
              sentenceUuid: 'uuid-2',
              sentenceReference: 'REF-2',
              consecutiveToSentenceUuid: 'uuid-1',
            },
          },
        ],
      } as unknown as CourtAppearance

      remandAndSentencingApiClient.hasLoopInChain.mockResolvedValue(false)

      await service.validateConsecutiveLoops(false, 'uuid-3', courtAppearance, 'AB123A', 'uuid-1', 'user')

      expect(remandAndSentencingApiClient.hasLoopInChain).toHaveBeenCalledTimes(1)
      const req = remandAndSentencingApiClient.hasLoopInChain.mock.calls[0][0]

      expect(req).toMatchObject({
        prisonerId: 'AB123A',
        appearanceUuid: 'app1',
        sourceSentenceUuid: 'uuid-1',
        targetSentenceUuid: 'uuid-3',
      })

      expect(req.sentences).toEqual([
        { sentenceUuid: 'uuid-1' },
        { sentenceUuid: 'uuid-2', consecutiveToSentenceUuid: 'uuid-1' },
      ])
    })

    it('calls API with correct request using cnsecutiveToSentenceRef', async () => {
      const courtAppearance = {
        appearanceUuid: 'app1',
        offences: [
          {
            sentence: {
              sentenceUuid: 'uuid-1',
              sentenceReference: 'REF-1',
              consecutiveToSentenceUuid: null,
            },
          },
          {
            sentence: {
              sentenceUuid: 'uuid-2',
              sentenceReference: 'REF-2',
              consecutiveToSentenceReference: 'REF-1',
            },
          },
        ],
      } as unknown as CourtAppearance

      remandAndSentencingApiClient.hasLoopInChain.mockResolvedValue(false)

      await service.validateConsecutiveLoops(false, 'uuid-3', courtAppearance, 'AB123A', 'uuid-1', 'user')

      expect(remandAndSentencingApiClient.hasLoopInChain).toHaveBeenCalledTimes(1)
      const req = remandAndSentencingApiClient.hasLoopInChain.mock.calls[0][0]

      expect(req).toMatchObject({
        prisonerId: 'AB123A',
        appearanceUuid: 'app1',
        sourceSentenceUuid: 'uuid-1',
        targetSentenceUuid: 'uuid-3',
      })

      expect(req.sentences).toEqual([
        { sentenceUuid: 'uuid-1' },
        { sentenceUuid: 'uuid-2', consecutiveToSentenceUuid: 'uuid-1' },
      ])
    })
  })
})
