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
      updateCourtCaseStatus: jest.fn(),
    } as unknown as jest.Mocked<RemandAndSentencingApiClient>
    ;(RemandAndSentencingApiClient as jest.Mock).mockImplementation(() => remandAndSentencingApiClient)

    service = new RemandAndSentencingService(remandAndSentencingApiClient)
  })

  describe('markCourtCaseAsInactive', () => {
    it('returns a validation error and does not update the court case when the reason is over 200 characters', async () => {
      const reason = 'a'.repeat(201)

      const errors = await service.markCourtCaseAsInactive('court-case-uuid', 'user1', { reason })

      expect(errors).toEqual([{ text: 'Reason must be 200 characters or less', href: '#reason' }])
      expect(remandAndSentencingApiClient.updateCourtCaseStatus).not.toHaveBeenCalled()
    })

    it('returns a validation error and does not update the court case when no reason is given', async () => {
      const errors = await service.markCourtCaseAsInactive('court-case-uuid', 'user1', {})

      expect(errors).toEqual([{ text: 'Enter a reason for marking this case as inactive', href: '#reason' }])
      expect(remandAndSentencingApiClient.updateCourtCaseStatus).not.toHaveBeenCalled()
    })

    it('updates the court case status to INACTIVE when the reason is 200 characters or fewer', async () => {
      const reason = 'a'.repeat(200)

      const errors = await service.markCourtCaseAsInactive('court-case-uuid', 'user1', { reason })

      expect(errors).toEqual([])
      expect(remandAndSentencingApiClient.updateCourtCaseStatus).toHaveBeenCalledWith(
        'court-case-uuid',
        { status: 'INACTIVE', reason },
        'user1',
      )
    })
  })

  describe('validateConsecutiveLoops', () => {
    const sessionCourtAppearance = {
      appearanceUuid: 'app1',
      offences: [{ sentence: { sentenceUuid: 'uuid-1' } }],
    } as unknown as CourtAppearance

    it('Source sentence has not been added to sentences yet - no errors', async () => {
      const response = await service.validateConsecutiveLoops(
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

    it('calls API with correct request using consecutiveToSentenceUuid - no errors, passes validation', async () => {
      const courtAppearance = {
        appearanceUuid: 'app1',
        offences: [
          {
            sentence: {
              sentenceUuid: 'uuid-1',
              consecutiveToSentenceUuid: null,
            },
          },
          {
            sentence: {
              sentenceUuid: 'uuid-2',
              consecutiveToSentenceUuid: 'uuid-1',
            },
          },
        ],
      } as unknown as CourtAppearance

      remandAndSentencingApiClient.hasLoopInChain.mockResolvedValue(false)

      const errors = await service.validateConsecutiveLoops('uuid-3', courtAppearance, 'AB123A', 'uuid-1', 'user')

      expect(errors).toEqual([])
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

    it('offences without sentences get filtered out when running loop validation - no errors, passes validation', async () => {
      const courtAppearance = {
        appearanceUuid: 'app1',
        offences: [
          {
            chargeUuid: 'charge1',
            sentence: {
              sentenceUuid: 'uuid-1',
              consecutiveToSentenceUuid: null,
            },
          },
          {
            sentence: {
              sentenceUuid: 'uuid-2',
              consecutiveToSentenceUuid: 'uuid-1',
            },
          },
          {
            chargeUuid: 'charge2',
          },
        ],
      } as unknown as CourtAppearance

      remandAndSentencingApiClient.hasLoopInChain.mockResolvedValue(false)

      const errors = await service.validateConsecutiveLoops('uuid-2', courtAppearance, 'AB123A', 'uuid-1', 'user')

      expect(errors).toEqual([])
      expect(remandAndSentencingApiClient.hasLoopInChain).toHaveBeenCalledTimes(1)
      const req = remandAndSentencingApiClient.hasLoopInChain.mock.calls[0][0]

      expect(req).toMatchObject({
        prisonerId: 'AB123A',
        appearanceUuid: 'app1',
        sourceSentenceUuid: 'uuid-1',
        targetSentenceUuid: 'uuid-2',
      })

      expect(req.sentences).toEqual([
        { sentenceUuid: 'uuid-1' },
        { sentenceUuid: 'uuid-2', consecutiveToSentenceUuid: 'uuid-1' },
      ])
    })

    it('Runs full validation correctly if there is a offence without a sentence along with a consecutive relationship', async () => {
      const courtAppearance = {
        appearanceUuid: 'app1',
        offences: [
          {
            offenceId: 'uuid-0',
            offenceCode: 'PC02021C', // no sentence
          },
          {
            sentence: {
              sentenceUuid: 'uuid-1',
              consecutiveToSentenceUuid: null,
            },
          },
          {
            sentence: {
              sentenceUuid: 'uuid-2',
              consecutiveToSentenceUuid: 'uuid-1',
            },
          },
        ],
      } as unknown as CourtAppearance

      remandAndSentencingApiClient.hasLoopInChain.mockResolvedValue(false)

      const errors = await service.validateConsecutiveLoops('uuid-3', courtAppearance, 'AB123A', 'uuid-1', 'user')

      expect(errors).toEqual([])
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
