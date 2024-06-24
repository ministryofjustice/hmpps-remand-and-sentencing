import type { CaseLoad } from '../@types/prisonApi/types'
import PrisonerService from './prisonerService'

export default class UserService {
  constructor(private readonly prisonerService: PrisonerService) {}

  getUserCaseLoads(token: string): Promise<CaseLoad[]> {
    return this.prisonerService.getUsersCaseloads(token)
  }
}
