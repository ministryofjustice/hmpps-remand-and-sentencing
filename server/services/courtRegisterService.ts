import { CourtDto } from '../@types/courtRegisterApi/types'
import CourtRegisterApiClient from '../api/courtRegisterApiClient'
import { HmppsAuthClient } from '../data'

export default class CourtRegisterService {
  constructor(private readonly hmppsAuthClient: HmppsAuthClient) {}

  async searchCourts(textSearch: string, username: string): Promise<CourtDto[]> {
    const pageResult = await new CourtRegisterApiClient(await this.getSystemClientToken(username)).searchCourt(
      textSearch,
    )
    return pageResult.content
  }

  async findCourtById(courtCode: string, username: string): Promise<CourtDto> {
    return new CourtRegisterApiClient(await this.getSystemClientToken(username)).findCourtById(courtCode)
  }

  private async getSystemClientToken(username: string): Promise<string> {
    return this.hmppsAuthClient.getSystemClientToken(username)
  }
}
