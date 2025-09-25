import OffenceOutcomeService from './offenceOutcomeService'
import RemandAndSentencingApiClient from '../data/remandAndSentencingApiClient'
import getOrSetRefDataInCache from '../cache/refDataCache'
import { OffenceOutcome } from '../@types/remandAndSentencingApi/remandAndSentencingClientTypes'

jest.mock('../cache/refDataCache')
jest.mock('../data/remandAndSentencingApiClient')

describe('OffenceOutcomeService', () => {
  let remandAndSentencingApiClient: jest.Mocked<RemandAndSentencingApiClient>
  let getOrSetRefDataInCacheMock: jest.MockedFunction<typeof getOrSetRefDataInCache>

  let service: OffenceOutcomeService

  beforeEach(() => {
    remandAndSentencingApiClient = {
      getChargeOutcomeById: jest.fn(),
      getChargeOutcomesByIds: jest.fn(),
    } as unknown as jest.Mocked<RemandAndSentencingApiClient>
    ;(RemandAndSentencingApiClient as jest.Mock).mockImplementation(() => remandAndSentencingApiClient)
    getOrSetRefDataInCacheMock = getOrSetRefDataInCache as jest.MockedFunction<typeof getOrSetRefDataInCache>
    getOrSetRefDataInCacheMock.mockReset()

    service = new OffenceOutcomeService(remandAndSentencingApiClient)
  })

  it('should call the api if the cached outcomes dont contain the outcome (e.g. if its inactive)', async () => {
    const inactiveOutcomeUuid = 'inactive-0'
    const apiResult = {
      outcomeUuid: inactiveOutcomeUuid,
      outcomeName: 'Inactive outcome',
    } as OffenceOutcome
    getOrSetRefDataInCacheMock.mockResolvedValue([
      { outcomeUuid: 'active-1', outcomeName: 'Active 1' },
      { outcomeUuid: 'active-2', outcomeName: 'Active 2' },
    ])

    remandAndSentencingApiClient.getChargeOutcomeById.mockResolvedValue(apiResult)

    const result = await service.getOutcomeById(inactiveOutcomeUuid, 'user')
    expect(result).toEqual(apiResult)
  })

  it('returns mapped outcomes from cache when all IDs are present', async () => {
    const username = 'user'
    const outcomeIds = ['id-1', 'id-2']
    const cachedOutcomes: OffenceOutcome[] = [
      { outcomeUuid: 'id-1', outcomeName: 'Outcome 1' } as OffenceOutcome,
      { outcomeUuid: 'id-2', outcomeName: 'Outcome 2' } as OffenceOutcome,
    ]

    getOrSetRefDataInCacheMock.mockResolvedValue(cachedOutcomes)

    const result = await service.getOutcomeMap(outcomeIds, username)

    expect(result).toEqual({
      'id-1': cachedOutcomes[0],
      'id-2': cachedOutcomes[1],
    })
    // API should not be called since cache had everything
    expect(remandAndSentencingApiClient.getChargeOutcomesByIds).not.toHaveBeenCalled()
  })

  it('returns mapped outcomes from api when IDs are not in cache', async () => {
    const username = 'user'
    const outcomeIds = ['id-3']
    const cachedOutcomes: OffenceOutcome[] = [
      { outcomeUuid: 'id-1', outcomeName: 'Outcome 1' } as OffenceOutcome,
      { outcomeUuid: 'id-2', outcomeName: 'Outcome 2' } as OffenceOutcome,
    ]

    const apiOutcomes: OffenceOutcome[] = [{ outcomeUuid: 'id-3', outcomeName: 'Outcome 3' } as OffenceOutcome]

    getOrSetRefDataInCacheMock.mockResolvedValue(cachedOutcomes)
    remandAndSentencingApiClient.getChargeOutcomesByIds.mockResolvedValue(apiOutcomes)

    const result = await service.getOutcomeMap(outcomeIds, username)

    expect(result).toEqual({
      'id-3': apiOutcomes[0],
    })
  })
})
