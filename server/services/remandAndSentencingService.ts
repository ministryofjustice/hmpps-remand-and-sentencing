import type { CourtCase } from 'models'
import dayjs from 'dayjs'
import type {
  CreateCharge,
  CreateCourtAppearance,
  CreateCourtCase,
  CreateCourtCaseResponse,
  CreateNextCourtAppearance,
  RemandAndSentencingPerson,
} from '../@types/remandAndSentencingApi/remandAndSentencingClientTypes'
import RemandAndSentencingApiClient from '../api/remandAndSentencingApiClient'

export default class RemandAndSentencingService {
  async getPersonDetails(prisonerId: string, token: string): Promise<RemandAndSentencingPerson> {
    return new RemandAndSentencingApiClient(token).getPersonDetail(prisonerId)
  }

  async createCourtCase(prisonerId: string, token: string, courtCase: CourtCase): Promise<CreateCourtCaseResponse> {
    const appearances = courtCase.appearances.map(courtAppearance => {
      let nextCourtAppearance
      if (courtAppearance.nextHearingCourtSelect) {
        nextCourtAppearance = {
          appearanceDate: dayjs(courtAppearance.nextHearingDate).format('YYYY-MM-DD'),
          courtCode: courtAppearance.nextHearingCourtName,
          appearanceType: courtAppearance.nextHearingType,
        } as CreateNextCourtAppearance
      }
      const charges = courtAppearance.offences.map(offence => {
        return {
          offenceCode: offence.offenceCode,
          offenceStartDate: dayjs(offence.offenceStartDate).format('YYYY-MM-DD'),
          outcome: offence.outcome,
          ...(offence.offenceEndDate && { offenceEndDate: dayjs(offence.offenceEndDate).format('YYYY-MM-DD') }),
        } as CreateCharge
      })
      return {
        outcome: courtAppearance.overallCaseOutcome,
        courtCode: courtAppearance.courtName,
        courtCaseReference: courtAppearance.caseReferenceNumber,
        appearanceDate: dayjs(courtAppearance.warrantDate).format('YYYY-MM-DD'),
        nextCourtAppearance,
        charges,
      } as CreateCourtAppearance
    })
    const createCourtCase = {
      prisonerId,
      appearances,
    } as CreateCourtCase
    return new RemandAndSentencingApiClient(token).createCourtCase(createCourtCase)
  }
}
