import type { CourtAppearance, CourtCase } from 'models'
import type {
  CreateCourtAppearanceResponse,
  CreateCourtCaseResponse,
  PageCourtCase,
  PageCourtCaseAppearance,
  PageCourtCaseContent,
} from '../@types/remandAndSentencingApi/remandAndSentencingClientTypes'
import RemandAndSentencingApiClient from '../api/remandAndSentencingApiClient'
import { courtAppearanceToCreateCourtAppearance, courtCaseToCreateCourtCase } from '../utils/mappingUtils'

export default class RemandAndSentencingService {
  async createCourtCase(prisonerId: string, token: string, courtCase: CourtCase): Promise<CreateCourtCaseResponse> {
    const createCourtCase = courtCaseToCreateCourtCase(prisonerId, courtCase)
    return new RemandAndSentencingApiClient(token).createCourtCase(createCourtCase)
  }

  async searchCourtCases(prisonerId: string, token: string, sortBy: string): Promise<PageCourtCase> {
    return new RemandAndSentencingApiClient(token).searchCourtCases(prisonerId, sortBy)
  }

  async createCourtAppearance(
    token: string,
    courtCaseUuid: string,
    courtAppearance: CourtAppearance,
  ): Promise<CreateCourtAppearanceResponse> {
    const createCourtAppearance = courtAppearanceToCreateCourtAppearance(courtAppearance, courtCaseUuid)
    return new RemandAndSentencingApiClient(token).createCourtAppearance(createCourtAppearance)
  }

  async updateCourtAppearance(
    token: string,
    courtCaseUuid: string,
    appearanceUuid: string,
    courtAppearance: CourtAppearance,
  ): Promise<CreateCourtAppearanceResponse> {
    const updateCourtAppearance = courtAppearanceToCreateCourtAppearance(courtAppearance, courtCaseUuid, appearanceUuid)
    return new RemandAndSentencingApiClient(token).putCourtAppearance(appearanceUuid, updateCourtAppearance)
  }

  async getLatestCourtAppearanceByCourtCaseUuid(
    token: string,
    courtCaseUuid: string,
  ): Promise<PageCourtCaseAppearance> {
    return new RemandAndSentencingApiClient(token).getLatestAppearanceByCourtCaseUuid(courtCaseUuid)
  }

  async getCourtAppearanceByAppearanceUuid(appearanceUuid: string, token: string): Promise<PageCourtCaseAppearance> {
    return new RemandAndSentencingApiClient(token).getCourtAppearanceByAppearanceUuid(appearanceUuid)
  }

  async getCourtCaseDetails(courtCaseUuid: string, token: string): Promise<PageCourtCaseContent> {
    return new RemandAndSentencingApiClient(token).getCourtCaseByUuid(courtCaseUuid)
  }
}
