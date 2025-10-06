import dayjs from 'dayjs'
import type { Offence } from 'models'
import { SentenceLength } from '@ministryofjustice/hmpps-court-cases-release-dates-design/hmpps/@types'
import {
  PagedCourtCase,
  PagedLatestCourtAppearance,
  PagedMergedFromCase,
  PagedMergedToCase,
} from '../../@types/remandAndSentencingApi/remandAndSentencingClientTypes'
import config from '../../config'
import { pagedAppearancePeriodLengthToSentenceLength, pagedChargeToOffence } from '../../utils/mappingUtils'
import { orderOffences, sortByDateDesc } from '../../utils/utils'

export default class CourtCasesDetailsModel {
  courtCaseUuid: string

  title: string

  caseReferences: string

  firstDayInCustody: string

  overallCaseOutcome: string

  overallSentenceLength: SentenceLength

  convictionDate: string

  warrantType: string

  overallCaseStatus: string

  nextHearing: string[]

  appearanceTotal: number

  latestAppearance: PagedLatestCourtAppearance

  chargeTotal: number

  showingChargeTotal?: number

  offences: Offence[]

  sentenceTypeMap: { [key: string]: string }

  hasARecall: boolean

  allAppearancesHaveRecall: boolean

  mergedFromCases: PagedMergedFromCase[]

  mergedToCase: PagedMergedToCase

  newAppearanceUuid: string

  constructor(pagedCourtCase: PagedCourtCase, courtMap: { [key: string]: string }) {
    let titleValue = courtMap[pagedCourtCase.latestCourtAppearance?.courtCode]
    if (pagedCourtCase.latestCourtAppearance?.caseReference) {
      titleValue = `${pagedCourtCase.latestCourtAppearance.caseReference} at ${titleValue}`
    }
    this.title = titleValue
    this.courtCaseUuid = pagedCourtCase.courtCaseUuid
    this.caseReferences = pagedCourtCase.caseReferences.join(', ')
    this.firstDayInCustody = dayjs(pagedCourtCase.firstDayInCustody).format(config.dateFormat)

    this.overallCaseOutcome = pagedCourtCase.latestCourtAppearance.outcome ?? 'Not entered'
    if (pagedCourtCase.overallSentenceLength) {
      this.overallSentenceLength = pagedAppearancePeriodLengthToSentenceLength(pagedCourtCase.overallSentenceLength)
    }
    this.convictionDate = 'Not entered'
    if (pagedCourtCase.latestCourtAppearance.convictionDate) {
      this.convictionDate = dayjs(pagedCourtCase.latestCourtAppearance.convictionDate).format(config.dateFormat)
    }
    this.warrantType = pagedCourtCase.latestCourtAppearance?.warrantType
    this.overallCaseStatus = pagedCourtCase.courtCaseStatus

    if (pagedCourtCase.latestCourtAppearance?.nextCourtAppearance) {
      const appearanceDate = dayjs(
        `${pagedCourtCase.latestCourtAppearance.nextCourtAppearance.appearanceDate}${pagedCourtCase.latestCourtAppearance.nextCourtAppearance.appearanceTime ? `T${pagedCourtCase.latestCourtAppearance.nextCourtAppearance.appearanceTime}` : ''}`,
      )
      let appearanceDateFormatted = appearanceDate.format(config.dateFormat)
      if (pagedCourtCase.latestCourtAppearance.nextCourtAppearance.appearanceTime) {
        appearanceDateFormatted = appearanceDate.format(config.dateTimeFormat)
      }
      this.nextHearing = [
        courtMap[pagedCourtCase.latestCourtAppearance.nextCourtAppearance.courtCode],
        pagedCourtCase.latestCourtAppearance.nextCourtAppearance.appearanceTypeDescription,
        appearanceDateFormatted,
      ]
    } else {
      this.nextHearing = ['No future appearance scheduled']
    }
    this.appearanceTotal = pagedCourtCase.appearanceCount
    this.latestAppearance = pagedCourtCase.latestCourtAppearance
    this.chargeTotal = pagedCourtCase.latestCourtAppearance?.charges.length
    if (this.chargeTotal > 6) {
      this.showingChargeTotal = 6
    }
    const charges = pagedCourtCase.latestCourtAppearance?.charges
      .sort((a, b) => {
        return sortByDateDesc(a.offenceStartDate, b.offenceStartDate)
      })
      .slice(0, 6)
    this.offences = orderOffences(charges?.map(charge => pagedChargeToOffence(charge)))
    this.sentenceTypeMap = Object.fromEntries(
      charges
        ?.filter(charge => charge.sentence?.sentenceType)
        .map(charge => [charge.sentence.sentenceType.sentenceTypeUuid, charge.sentence.sentenceType.description]) ?? [],
    )
    this.hasARecall = pagedCourtCase.latestCourtAppearance.charges.some(charge => charge.sentence?.hasRecall)
    this.mergedFromCases = pagedCourtCase.mergedFromCases
    this.allAppearancesHaveRecall = pagedCourtCase.allAppearancesHaveRecall
    this.mergedToCase = pagedCourtCase.mergedToCase
    this.newAppearanceUuid =
      pagedCourtCase.latestCourtAppearance.nextCourtAppearance?.futureSkeletonAppearanceUuid ?? crypto.randomUUID()
  }
}
