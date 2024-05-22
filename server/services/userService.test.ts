import UserService from './userService'
import ManageUsersApiClient, { type User } from '../data/manageUsersApiClient'
import createUserToken from '../testutils/createUserToken'
import PrisonerService from './prisonerService'
import { PrisonApiUserCaseloads } from '../@types/prisonApi/types'

jest.mock('../data/manageUsersApiClient')
jest.mock('./prisonerService')

describe('User service', () => {
  let manageUsersApiClient: jest.Mocked<ManageUsersApiClient>
  let prisonerService: jest.Mocked<PrisonerService>
  let userService: UserService

  describe('getUser', () => {
    beforeEach(() => {
      manageUsersApiClient = new ManageUsersApiClient() as jest.Mocked<ManageUsersApiClient>
      prisonerService = new PrisonerService() as jest.Mocked<PrisonerService>
      prisonerService.getUsersCaseloads.mockResolvedValue([{ caseLoadId: 'MDI' } as PrisonApiUserCaseloads])
      userService = new UserService(manageUsersApiClient, prisonerService)
    })

    it('Retrieves and formats user name', async () => {
      const token = createUserToken([])
      manageUsersApiClient.getUser.mockResolvedValue({ name: 'john smith' } as User)

      const result = await userService.getUser(token)

      expect(result.displayName).toEqual('John Smith')
    })

    it('Retrieves and formats roles', async () => {
      const token = createUserToken(['ROLE_ONE', 'ROLE_TWO'])
      manageUsersApiClient.getUser.mockResolvedValue({ name: 'john smith' } as User)

      const result = await userService.getUser(token)

      expect(result.roles).toEqual(['ONE', 'TWO'])
    })

    it('Propagates error', async () => {
      const token = createUserToken([])
      manageUsersApiClient.getUser.mockRejectedValue(new Error('some error'))

      await expect(userService.getUser(token)).rejects.toEqual(new Error('some error'))
    })
  })
})
