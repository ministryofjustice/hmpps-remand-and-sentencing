import type { CourtCase } from 'models'
import type {
  CreateCourtCaseResponse,
  PageCourtCase,
  RemandAndSentencingPerson,
} from '../@types/remandAndSentencingApi/remandAndSentencingClientTypes'
import RemandAndSentencingApiClient from '../api/remandAndSentencingApiClient'
import { courtCaseToCreateCourtCase } from '../utils/mappingUtils'

export default class RemandAndSentencingService {
  async getPersonDetails(prisonerId: string, token: string): Promise<RemandAndSentencingPerson> {
    return new RemandAndSentencingApiClient(token).getPersonDetail(prisonerId)
  }

  async createCourtCase(prisonerId: string, token: string, courtCase: CourtCase): Promise<CreateCourtCaseResponse> {
    const createCourtCase = courtCaseToCreateCourtCase(prisonerId, courtCase)
    return new RemandAndSentencingApiClient(token).createCourtCase(createCourtCase)
  }

  async searchCourtCases(prisonerId: string, token: string): Promise<PageCourtCase> {
    return new RemandAndSentencingApiClient(token).searchCourtCases(prisonerId)
  }
}
