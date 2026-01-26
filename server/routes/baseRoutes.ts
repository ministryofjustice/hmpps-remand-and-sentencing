import type { Offence } from 'models'
import { ConsecutiveToDetails } from '@ministryofjustice/hmpps-court-cases-release-dates-design/hmpps/@types'
import dayjs from 'dayjs'
import { SessionData } from 'express-session'
import CourtAppearanceService from '../services/courtAppearanceService'
import OffenceService from '../services/offenceService'
import ManageOffencesService from '../services/manageOffencesService'
import RemandAndSentencingService from '../services/remandAndSentencingService'
import {
  MergedFromCase,
  SentenceConsecutiveToDetailsResponse,
} from '../@types/remandAndSentencingApi/remandAndSentencingClientTypes'
import {
  offenceToConsecutiveToDetails,
  pageCourtCaseAppearanceToCourtAppearance,
  sentenceConsecutiveToDetailsToConsecutiveToDetails,
} from '../utils/mappingUtils'
import { formatDate } from '../utils/utils'
import periodLengthTypeHeadings from '../resources/PeriodLengthTypeHeadings'
import { GroupedPeriodLengths } from './data/GroupedPeriodLengths'
import config from '../config'
import JourneyUrls from './data/JourneyUrls'
import AuditService from '../services/auditService'

export default abstract class BaseRoutes {
  courtAppearanceService: CourtAppearanceService

  offenceService: OffenceService

  remandAndSentencingService: RemandAndSentencingService

  manageOffencesService: ManageOffencesService

  auditService: AuditService

  constructor(
    courtAppearanceService: CourtAppearanceService,
    offenceService: OffenceService,
    remandAndSentencingService: RemandAndSentencingService,
    manageOffencesService: ManageOffencesService,
    auditService: AuditService,
  ) {
    this.courtAppearanceService = courtAppearanceService
    this.offenceService = offenceService
    this.remandAndSentencingService = remandAndSentencingService
    this.manageOffencesService = manageOffencesService
    this.auditService = auditService
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

  protected saveAllOffencesToAppearance(
    session: Partial<SessionData>,
    nomsId: string,
    appearanceReference: string,
    courtCaseReference: string,
  ) {
    const allOffencesData = this.offenceService.getAllOffences(session, nomsId, courtCaseReference)
    allOffencesData.forEach(offence => {
      this.courtAppearanceService.addOffence(session, nomsId, offence.chargeUuid, offence, appearanceReference)
    })
    this.offenceService.clearAllOffences(session, nomsId, appearanceReference)
  }

  protected saveSessionOffenceInAppearance(
    req,
    res,
    nomsId: string,
    addOrEditCourtCase: string,
    courtCaseReference: string,
    addOrEditCourtAppearance: string,
    appearanceReference: string,
    chargeUuid: string,
  ) {
    const offence = this.offenceService.getSessionOffence(req.session, nomsId, courtCaseReference, chargeUuid)
    if (offence.onFinishGoToEdit) {
      return res.redirect(
        JourneyUrls.editOffence(
          nomsId,
          addOrEditCourtCase,
          courtCaseReference,
          addOrEditCourtAppearance,
          appearanceReference,
          chargeUuid,
        ),
      )
    }
    this.saveAllOffencesToAppearance(req.session, nomsId, appearanceReference, courtCaseReference)
    if (this.isAddJourney(addOrEditCourtCase, addOrEditCourtAppearance)) {
      return res.redirect(
        JourneyUrls.checkOffenceAnswers(
          nomsId,
          addOrEditCourtCase,
          courtCaseReference,
          addOrEditCourtAppearance,
          appearanceReference,
        ),
      )
    }
    const warrantType = this.courtAppearanceService.getWarrantType(req.session, nomsId, appearanceReference)
    if (this.isEditJourney(addOrEditCourtCase, addOrEditCourtAppearance)) {
      if (warrantType === 'SENTENCING') {
        return res.redirect(
          JourneyUrls.sentencingHearing(
            nomsId,
            addOrEditCourtCase,
            courtCaseReference,
            addOrEditCourtAppearance,
            appearanceReference,
          ),
        )
      }
      return res.redirect(
        JourneyUrls.nonSentencingHearing(
          nomsId,
          addOrEditCourtCase,
          courtCaseReference,
          addOrEditCourtAppearance,
          appearanceReference,
        ),
      )
    }
    if (warrantType === 'SENTENCING') {
      return res.redirect(
        JourneyUrls.updateOffenceOutcomes(
          nomsId,
          addOrEditCourtCase,
          courtCaseReference,
          addOrEditCourtAppearance,
          appearanceReference,
        ),
      )
    }
    return res.redirect(
      JourneyUrls.reviewOffences(
        nomsId,
        addOrEditCourtCase,
        courtCaseReference,
        addOrEditCourtAppearance,
        appearanceReference,
      ),
    )
  }

  protected async getConsecutiveToFromApi(
    req,
    nomsId: string,
    appearanceReference: string,
  ): Promise<SentenceConsecutiveToDetailsResponse> {
    const appearance = this.courtAppearanceService.getSessionCourtAppearance(req.session, nomsId, appearanceReference)

    const sentenceUuidsInSession = appearance.offences.filter(o => o.sentence).map(o => o.sentence.sentenceUuid)
    const consecutiveToSentenceUuidsNotInSession = appearance.offences
      .filter(
        o =>
          o.sentence?.consecutiveToSentenceUuid &&
          !sentenceUuidsInSession.some(uuid => uuid === o.sentence?.consecutiveToSentenceUuid),
      )
      .map(o => o.sentence?.consecutiveToSentenceUuid)
    return this.remandAndSentencingService.getConsecutiveToDetails(
      consecutiveToSentenceUuidsNotInSession,
      req.user.username,
    )
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
    appearanceReference: string,
  ): {
    [key: string]: ConsecutiveToDetails
  } {
    const appearance = this.courtAppearanceService.getSessionCourtAppearance(req.session, nomsId, appearanceReference)
    const sentenceUuidsInSession = appearance.offences.filter(o => o.sentence).map(o => o.sentence.sentenceUuid)
    const { offences } = appearance
    return Object.fromEntries(
      offences
        .filter(
          offence =>
            offence.sentence?.consecutiveToSentenceUuid &&
            sentenceUuidsInSession.some(uuid => uuid === offence.sentence?.consecutiveToSentenceUuid),
        )
        .map(consecutiveOffence => {
          const consecutiveToOffence = offences.find(
            offence => offence.sentence?.sentenceUuid === consecutiveOffence.sentence.consecutiveToSentenceUuid,
          )
          return [
            consecutiveOffence.sentence.consecutiveToSentenceUuid,
            offenceToConsecutiveToDetails(consecutiveToOffence, offenceMap),
          ]
        }),
    )
  }

  protected async updateCourtAppearance(req, res, nomsId, addOrEditCourtCase, courtCaseReference, appearanceReference) {
    const courtAppearance = this.courtAppearanceService.getSessionCourtAppearance(
      req.session,
      nomsId,
      appearanceReference,
    )
    const { username } = res.locals.user
    const { prisonId } = res.locals.prisoner
    await this.remandAndSentencingService.updateCourtAppearance(
      username,
      courtCaseReference,
      appearanceReference,
      courtAppearance,
      prisonId,
    )
    const auditDetails = {
      courtCaseUuids: [courtCaseReference],
      courtAppearanceUuids: [appearanceReference],
      chargeUuids: courtAppearance.offences.map(offence => offence.chargeUuid),
      sentenceUuids: courtAppearance.offences.map(offence => offence.sentence?.sentenceUuid),
      periodLengthUuids: courtAppearance.offences.flatMap(
        offence => offence.sentence?.periodLengths.map(periodLength => periodLength.uuid) ?? [],
      ),
      documentUuids: courtAppearance.uploadedDocuments.map(document => document.documentUUID),
    }
    await this.auditService.logEditHearing({
      who: username,
      subjectId: nomsId,
      subjectType: 'PRISONER_ID',
      correlationId: req.id,
      details: auditDetails,
    })
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

  protected getMergedFromText(mergedFromCases: MergedFromCase[], courtMap: { [key: string]: string }): string {
    const parts = new Set<string>()
    for (const mergedFromCase of mergedFromCases) {
      const formattedDate = formatDate(mergedFromCase.mergedFromDate)
      if (mergedFromCase.caseReference != null) {
        parts.add(`offences from ${mergedFromCase.caseReference} that were merged with this case on ${formattedDate}`)
      } else {
        const courtName = courtMap[mergedFromCase.courtCode!]
        const formattedWarrantDate = formatDate(mergedFromCase.warrantDate)
        parts.add(
          `offences from ${courtName} on ${formattedWarrantDate} that were merged with this case on ${formattedDate}`,
        )
      }
    }
    if (parts.size === 0) return ''
    return `This appearance includes ${Array.from(parts).join(' and ')}`
  }

  protected async setAppearanceDetailsToSession(
    appearanceReference: string,
    username: string,
    req,
    nomsId: string,
    courtCaseReference: string,
  ) {
    const storedAppearance = await this.remandAndSentencingService.getCourtAppearanceByAppearanceUuid(
      appearanceReference,
      username,
    )
    this.courtAppearanceService.clearSessionCourtAppearance(req.session, nomsId)
    this.offenceService.clearAllOffences(req.session, nomsId, courtCaseReference)
    this.courtAppearanceService.setSessionCourtAppearance(
      req.session,
      nomsId,
      pageCourtCaseAppearanceToCourtAppearance(storedAppearance),
    )
  }

  protected groupPeriodLengthsByType(offence: Offence): GroupedPeriodLengths[] {
    const periodLengthsByType =
      offence.sentence?.periodLengths?.reduce((periodLengthTypes, periodLength) => {
        const [key, legacyCode] = periodLengthTypeHeadings[periodLength.periodLengthType]
          ? [periodLengthTypeHeadings[periodLength.periodLengthType]]
          : [periodLength.legacyData?.sentenceTermDescription, periodLength.legacyData?.sentenceTermCode]
        const existingPeriodLengths = periodLengthTypes[key] ?? {
          key,
          type: periodLength.periodLengthType,
          legacyCode,
          lengths: [],
        }
        existingPeriodLengths.lengths.push(periodLength)
        return { ...periodLengthTypes, [key]: existingPeriodLengths }
      }, {}) ?? {}
    return Object.values(periodLengthsByType)
  }

  protected async getOffenceHint(
    offence: Offence,
    username: string,
  ): Promise<{ text: string; attributes: { [key: string]: string } }> | undefined {
    let hint
    if (offence.offenceCode) {
      const apiOffence = await this.manageOffencesService.getOffenceByCode(
        offence.offenceCode,
        username,
        offence.legacyData?.offenceDescription,
      )
      let dateText = ''
      if (offence.offenceStartDate) {
        dateText = ` committed on ${dayjs(offence.offenceStartDate).format(config.dateFormat)}`
        if (offence.offenceEndDate) {
          dateText += ` to ${dayjs(offence.offenceEndDate).format(config.dateFormat)}`
        }
      }
      hint = {
        text: `${offence.offenceCode} - ${apiOffence.description}${dateText}`,
        attributes: {
          'data-qa': 'offenceParagraph',
        },
      }
    }
    return hint
  }
}
