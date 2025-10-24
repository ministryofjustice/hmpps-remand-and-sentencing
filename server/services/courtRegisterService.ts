import { CourtDto } from '../@types/courtRegisterApi/types'
import CourtRegisterApiClient from '../data/courtRegisterApiClient'

export default class CourtRegisterService {
  constructor(private readonly courtRegisterApiClient: CourtRegisterApiClient) {}

  async searchCourts(textSearch: string, username: string): Promise<CourtDto[]> {
    const pageResult = await this.courtRegisterApiClient.searchCourt(textSearch, username)
    return pageResult.content
  }

  async findCourtById(courtCode: string, username: string): Promise<CourtDto> {
    return this.courtRegisterApiClient.findCourtById(courtCode, username)
  }

  async getCourtMap(courtIds: string[], username: string): Promise<{ [key: string]: string }> {
    let courtMap = {}
    const toSearchIds = courtIds.filter(courtId => courtId)
    if (toSearchIds.length) {
      const courts = await this.courtRegisterApiClient.findCourtsByIds(Array.from(new Set(toSearchIds)), username)
      courtMap = Object.fromEntries(courts.map(court => [court.courtId, court.courtName]))
    }
    return courtMap
  }
}
