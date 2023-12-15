import type { CourtAppearance, CourtCase } from 'models'
import type {
  CreateCourtAppearanceResponse,
  CreateCourtCaseResponse,
  PageCourtCase,
  RemandAndSentencingPerson,
} from '../@types/remandAndSentencingApi/remandAndSentencingClientTypes'
import RemandAndSentencingApiClient from '../api/remandAndSentencingApiClient'
import { courtAppearanceToCreateCourtAppearance, courtCaseToCreateCourtCase } from '../utils/mappingUtils'

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

  async createCourtAppearance(
    token: string,
    courtCaseUuid: string,
    courtAppearance: CourtAppearance,
  ): Promise<CreateCourtAppearanceResponse> {
    const createCourtAppearance = courtAppearanceToCreateCourtAppearance(courtAppearance, courtCaseUuid)
    return new RemandAndSentencingApiClient(token).createCourtAppearance(createCourtAppearance)
  }
}
