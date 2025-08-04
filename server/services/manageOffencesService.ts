import type { Offence } from '../@types/manageOffencesApi/manageOffencesClientTypes'
import ManageOffencesApiClient from '../api/manageOffencesApiClient'
import { HmppsAuthClient } from '../data'

export default class ManageOffencesService {
  constructor(private readonly hmppsAuthClient: HmppsAuthClient) {}

  async getOffenceByCode(offenceCode: string, username: string): Promise<Offence> {
    return new ManageOffencesApiClient(await this.getSystemClientToken(username)).getOffenceByCode(offenceCode)
  }

  async searchOffence(searchString: string, username: string): Promise<Offence[]> {
    return new ManageOffencesApiClient(await this.getSystemClientToken(username)).searchOffence(searchString)
  }

  async getOffencesByCodes(offenceCodes: string[], username: string): Promise<Offence[]> {
    return new ManageOffencesApiClient(await this.getSystemClientToken(username)).getOffencesByCodes(offenceCodes)
  }

  async getOffenceMap(offenceCodes: string[], username: string) {
    let offenceMap = {}
    const toSearchCodes = offenceCodes.filter(offenceCode => offenceCode)
    if (toSearchCodes.length) {
      const offences = await this.getOffencesByCodes(Array.from(new Set(toSearchCodes)), username)
      offenceMap = Object.fromEntries(offences.map(offence => [offence.code, offence.description]))
    }
    return offenceMap
  }

  private async getSystemClientToken(username: string): Promise<string> {
    return this.hmppsAuthClient.getSystemClientToken(username)
  }
}
