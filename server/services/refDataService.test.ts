import RemandAndSentencingApiClient from '../data/remandAndSentencingApiClient'
import getOrSetRefDataInCache from '../cache/refDataCache'
import { AppearanceOutcome } from '../@types/remandAndSentencingApi/remandAndSentencingClientTypes'
import RefDataService from './refDataService'

jest.mock('../cache/refDataCache')
jest.mock('../data/remandAndSentencingApiClient')

describe('RefDataService', () => {
  let remandAndSentencingApiClient: jest.Mocked<RemandAndSentencingApiClient>
  let getOrSetRefDataInCacheMock: jest.MockedFunction<typeof getOrSetRefDataInCache>

  let service: RefDataService

  beforeEach(() => {
    remandAndSentencingApiClient = {
      getAppearanceOutcomeByUuid: jest.fn(),
    } as unknown as jest.Mocked<RemandAndSentencingApiClient>
    ;(RemandAndSentencingApiClient as jest.Mock).mockImplementation(() => remandAndSentencingApiClient)
    getOrSetRefDataInCacheMock = getOrSetRefDataInCache as jest.MockedFunction<typeof getOrSetRefDataInCache>
    getOrSetRefDataInCacheMock.mockReset()

    service = new RefDataService(remandAndSentencingApiClient)
  })
  describe('AppearanceOutcomeTests', () => {
    describe('getAppearanceOutcomeByUuid', () => {
      it('should call the api if the cached outcomes dont contain the outcome (e.g. if its inactive)', async () => {
        const inactiveOutcomeUuid = 'inactive-0'
        const apiResult = {
          outcomeUuid: inactiveOutcomeUuid,
          outcomeName: 'Inactive appearance outcome',
        } as AppearanceOutcome
        getOrSetRefDataInCacheMock.mockResolvedValue([
          { outcomeUuid: 'active-1', outcomeName: 'Active 1' },
          { outcomeUuid: 'active-2', outcomeName: 'Active 2' },
        ])

        remandAndSentencingApiClient.getAppearanceOutcomeByUuid.mockResolvedValue(apiResult)

        const result = await service.getAppearanceOutcomeByUuid(inactiveOutcomeUuid, 'user')
        expect(result).toEqual(apiResult)
      })
    })
  })
})
