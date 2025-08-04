import type { Offence } from 'models'
import { ConsecutiveToDetails } from '@ministryofjustice/hmpps-court-cases-release-dates-design/hmpps/@types'
import CourtAppearanceService from '../services/courtAppearanceService'
import OffenceService from '../services/offenceService'
import RemandAndSentencingService from '../services/remandAndSentencingService'
import { SentenceConsecutiveToDetailsResponse } from '../@types/remandAndSentencingApi/remandAndSentencingClientTypes'
import {
  offenceToConsecutiveToDetails,
  sentenceConsecutiveToDetailsToConsecutiveToDetails,
} from '../utils/mappingUtils'
import CourtRegisterService from '../services/courtRegisterService'

export default abstract class BaseRoutes {
  courtAppearanceService: CourtAppearanceService

  offenceService: OffenceService

  remandAndSentencingService: RemandAndSentencingService

  courtRegisterService: CourtRegisterService

  constructor(
    courtAppearanceService: CourtAppearanceService,
    offenceService: OffenceService,
    remandAndSentencingService: RemandAndSentencingService,
    courtRegisterService: CourtRegisterService,
  ) {
    this.courtAppearanceService = courtAppearanceService
    this.offenceService = offenceService
    this.remandAndSentencingService = remandAndSentencingService
    this.courtRegisterService = courtRegisterService
  }

  protected isAddJourney(addOrEditCourtCase: string, addOrEditCourtAppearance: string): boolean {
    return addOrEditCourtCase === 'add-court-case' && addOrEditCourtAppearance === 'add-court-appearance'
  }

  protected isRepeatJourney(addOrEditCourtCase: string, addOrEditCourtAppearance: string): boolean {
    return addOrEditCourtCase === 'edit-court-case' && addOrEditCourtAppearance === 'add-court-appearance'
  }

  protected isEditJourney(addOrEditCourtCase: string, addOrEditCourtAppearance: string): boolean {
    return addOrEditCourtCase === 'edit-court-case' && addOrEditCourtAppearance === 'edit-court-appearance'
  }

  protected saveOffenceInAppearance(
    req,
    nomsId: string,
    courtCaseReference: string,
    offenceReference: string,
    offence: Offence,
  ) {
    this.courtAppearanceService.addOffence(req.session, nomsId, parseInt(offenceReference, 10), offence)
    this.offenceService.clearOffence(req.session, nomsId, courtCaseReference)
  }

  protected saveSessionOffenceInAppearance(
    req,
    res,
    nomsId: string,
    addOrEditCourtCase: string,
    courtCaseReference: string,
    addOrEditCourtAppearance: string,
    appearanceReference: string,
    offenceReference: string,
  ) {
    const offence = this.offenceService.getSessionOffence(req.session, nomsId, courtCaseReference)
    if (offence.onFinishGoToEdit) {
      return res.redirect(
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/offences/${offenceReference}/edit-offence`,
      )
    }
    this.saveOffenceInAppearance(req, nomsId, courtCaseReference, offenceReference, offence)
    if (this.isAddJourney(addOrEditCourtCase, addOrEditCourtAppearance)) {
      return res.redirect(
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/offences/check-offence-answers`,
      )
    }
    const warrantType = this.courtAppearanceService.getWarrantType(req.session, nomsId)
    if (this.isEditJourney(addOrEditCourtCase, addOrEditCourtAppearance)) {
      if (warrantType === 'SENTENCING') {
        return res.redirect(
          `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/sentencing/appearance-details`,
        )
      }
      return res.redirect(
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/remand/appearance-details`,
      )
    }
    if (warrantType === 'SENTENCING') {
      return res.redirect(
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/update-offence-outcomes`,
      )
    }
    return res.redirect(
      `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/review-offences`,
    )
  }

  protected async getSessionConsecutiveToSentenceDetails(
    req,
    nomsId: string,
  ): Promise<SentenceConsecutiveToDetailsResponse> {
    const appearance = this.courtAppearanceService.getSessionCourtAppearance(req.session, nomsId)
    const consecutiveToSentenceUuids = appearance.offences
      .map(offence => offence.sentence?.consecutiveToSentenceUuid)
      .filter(sentenceUuid => sentenceUuid)
    return this.remandAndSentencingService.getConsecutiveToDetails(consecutiveToSentenceUuids, req.user.username)
  }

  protected getConsecutiveToSentenceDetailsMap(
    allSentenceUuids: string[],
    consecutiveToSentenceDetails: SentenceConsecutiveToDetailsResponse,
    offenceMap: { [key: string]: string },
    courtMap: { [key: string]: string },
  ): {
    [key: string]: ConsecutiveToDetails
  } {
    return Object.fromEntries(
      consecutiveToSentenceDetails.sentences.map(consecutiveToDetails => {
        const consecutiveToDetailsEntry = sentenceConsecutiveToDetailsToConsecutiveToDetails(
          consecutiveToDetails,
          offenceMap,
          courtMap,
          allSentenceUuids.includes(consecutiveToDetails.sentenceUuid),
        )
        return [consecutiveToDetails.sentenceUuid, consecutiveToDetailsEntry]
      }),
    )
  }

  protected getSessionConsecutiveToSentenceDetailsMap(
    req,
    nomsId: string,
    offenceMap: { [key: string]: string },
  ): {
    [key: string]: ConsecutiveToDetails
  } {
    const { offences } = this.courtAppearanceService.getSessionCourtAppearance(req.session, nomsId)
    return Object.fromEntries(
      offences
        .filter(offence => offence.sentence?.consecutiveToSentenceReference)
        .map(consecutiveOffence => {
          const consecutiveToOffence = offences.find(
            offence =>
              offence.sentence?.sentenceReference === consecutiveOffence.sentence.consecutiveToSentenceReference,
          )
          return [
            consecutiveOffence.sentence.consecutiveToSentenceReference,
            offenceToConsecutiveToDetails(consecutiveToOffence, offenceMap),
          ]
        }),
    )
  }

  protected async updateCourtAppearance(req, res, nomsId, addOrEditCourtCase, courtCaseReference, appearanceReference) {
    const courtAppearance = this.courtAppearanceService.getSessionCourtAppearance(req.session, nomsId)
    const { username } = res.locals.user
    const { prisonId } = res.locals.prisoner
    await this.remandAndSentencingService.updateCourtAppearance(
      username,
      courtCaseReference,
      appearanceReference,
      courtAppearance,
      prisonId,
    )
    this.courtAppearanceService.clearSessionCourtAppearance(req.session, nomsId)
    return res.redirect(`/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/appearance-updated-confirmation`)
  }

  protected queryParametersToString(submitToEditOffence, invalidatedFrom): string {
    const submitQueries: string[] = []
    if (submitToEditOffence) {
      submitQueries.push('submitToEditOffence=true')
    }
    if (invalidatedFrom) {
      submitQueries.push(`invalidatedFrom=${invalidatedFrom}`)
    }
    return submitQueries.length ? `?${submitQueries.join('&')}` : ''
  }

  protected async getMergedFromText(mergedOffence: Offence, username: string): Promise<string> {
    if (mergedOffence?.mergedFromCase) {
      if (mergedOffence.mergedFromCase.caseReference != null) {
        return `This appearance includes offences from ${mergedOffence.mergedFromCase.caseReference} that were merged with this case on ${mergedOffence.mergedFromCase.mergedFromDate}`
      }
      const court = await this.courtRegisterService.findCourtById(mergedOffence.mergedFromCase.courtCode!, username)
      return `This appearance includes offences from ${court.courtName} on ${mergedOffence.mergedFromCase.warrantDate} that were merged with this case on ${mergedOffence.mergedFromCase.mergedFromDate}`
    }
    return ''
  }
}
