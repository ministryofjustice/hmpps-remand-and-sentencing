import type { Offence } from '../@types/manageOffencesApi/manageOffencesClientTypes'
import ManageOffencesApiClient from '../data/manageOffencesApiClient'

export default class ManageOffencesService {
  constructor(private readonly manageOffencesApiClient: ManageOffencesApiClient) {}

  async getOffenceByCode(offenceCode: string, username: string): Promise<Offence> {
    return this.manageOffencesApiClient.getOffenceByCode(offenceCode, username)
  }

  async searchOffence(searchString: string, username: string): Promise<Offence[]> {
    return this.manageOffencesApiClient.searchOffence(searchString, username)
  }

  async getOffencesByCodes(offenceCodes: string[], username: string): Promise<Offence[]> {
    return this.manageOffencesApiClient.getOffencesByCodes(offenceCodes, username)
  }

  async getOffenceMap(offenceCodes: string[], username: string, offenceDescriptions: [string, string][]) {
    let offenceMap = Object.fromEntries(offenceDescriptions)
    const toSearchCodes = offenceCodes.filter(offenceCode => offenceCode)
    if (toSearchCodes.length) {
      const offences = await this.getOffencesByCodes(Array.from(new Set(toSearchCodes)), username)
      offenceMap = {
        ...offenceMap,
        ...Object.fromEntries(offences.map(offence => [offence.code, offence.description])),
      }
    }
    return offenceMap
  }
}
