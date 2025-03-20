import dayjs from 'dayjs'
import type { Offence } from 'models'
import { SentenceLength } from '@ministryofjustice/hmpps-court-cases-release-dates-design/hmpps/@types'
import {
  CourtCaseLegacyData,
  PageCourtCaseAppearance,
  PageCourtCaseContent,
} from '../../@types/remandAndSentencingApi/remandAndSentencingClientTypes'
import config from '../../config'
import { chargeToOffence, periodLengthToSentenceLength } from '../../utils/mappingUtils'
import { outcomeValueOrLegacy, sortByOffenceStartDate } from '../../utils/utils'

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

  latestAppearance: PageCourtCaseAppearance

  chargeTotal: number

  showingChargeTotal?: number

  offences: Offence[]

  sentenceTypeMap: { [key: string]: string }

  offenceOutcomeMap: { [key: string]: string }

  constructor(pageCourtCaseContent: PageCourtCaseContent, courtMap: { [key: string]: string }) {
    let titleValue = courtMap[pageCourtCaseContent.latestAppearance?.courtCode]
    if (pageCourtCaseContent.latestAppearance?.courtCaseReference) {
      titleValue = `${pageCourtCaseContent.latestAppearance.courtCaseReference} at ${titleValue}`
    }
    this.title = titleValue
    this.courtCaseUuid = pageCourtCaseContent.courtCaseUuid
    let references = pageCourtCaseContent.appearances
      .filter(appearance => appearance.courtCaseReference)
      .map(appearance => appearance.courtCaseReference)
    if (pageCourtCaseContent.legacyData) {
      const courtCaseLegacyData = pageCourtCaseContent.legacyData as unknown as CourtCaseLegacyData
      references = references.concat(
        courtCaseLegacyData.caseReferences.map(caseReference => caseReference.offenderCaseReference),
      )
    }
    this.caseReferences = Array.from(new Set(references)).join(', ')
    this.firstDayInCustody = 'Not entered'
    if (pageCourtCaseContent.appearances.length) {
      this.firstDayInCustody = pageCourtCaseContent.appearances
        .map(appearance => dayjs(appearance.appearanceDate))
        .reduce((a, b) => (a.isBefore(b) ? a : b))
        .format(config.dateFormat)
    }

    this.overallCaseOutcome = outcomeValueOrLegacy(
      pageCourtCaseContent.latestAppearance?.outcome?.outcomeName,
      pageCourtCaseContent.latestAppearance?.legacyData,
    )
    if (pageCourtCaseContent.latestAppearance?.overallSentenceLength) {
      this.overallSentenceLength = periodLengthToSentenceLength(
        pageCourtCaseContent.latestAppearance?.overallSentenceLength,
      )
    }
    this.convictionDate = 'Not entered'
    if (pageCourtCaseContent.latestAppearance?.overallConvictionDate) {
      this.convictionDate = dayjs(pageCourtCaseContent.latestAppearance?.overallConvictionDate).format(
        config.dateFormat,
      )
    }
    this.warrantType = pageCourtCaseContent.latestAppearance?.warrantType
    this.overallCaseStatus = pageCourtCaseContent.status

    if (pageCourtCaseContent.latestAppearance?.nextCourtAppearance) {
      const appearanceDate = dayjs(
        `${pageCourtCaseContent.latestAppearance.nextCourtAppearance.appearanceDate}${pageCourtCaseContent.latestAppearance.nextCourtAppearance.appearanceTime ? `T${pageCourtCaseContent.latestAppearance.nextCourtAppearance.appearanceTime}` : ''}`,
      )
      let appearanceDateFormatted = appearanceDate.format(config.dateFormat)
      if (pageCourtCaseContent.latestAppearance.nextCourtAppearance.appearanceTime) {
        appearanceDateFormatted = appearanceDate.format(config.dateTimeFormat)
      }
      this.nextHearing = [
        courtMap[pageCourtCaseContent.latestAppearance.nextCourtAppearance.courtCode] ??
          pageCourtCaseContent.latestAppearance.nextCourtAppearance.courtCode,
        pageCourtCaseContent.latestAppearance.nextCourtAppearance.appearanceType.description,
        appearanceDateFormatted,
      ]
    } else {
      this.nextHearing = ['No future appearance scheduled']
    }
    this.appearanceTotal = pageCourtCaseContent.appearances.length
    this.latestAppearance = pageCourtCaseContent.latestAppearance
    this.chargeTotal = pageCourtCaseContent.latestAppearance?.charges.length
    if (this.chargeTotal > 6) {
      this.showingChargeTotal = 6
    }
    const charges = pageCourtCaseContent.latestAppearance?.charges
      .sort((a, b) => {
        return sortByOffenceStartDate(a.offenceStartDate, b.offenceStartDate)
      })
      .slice(0, 6)
    this.offences = charges?.map(charge => chargeToOffence(charge))
    this.sentenceTypeMap = Object.fromEntries(
      charges
        ?.filter(charge => charge.sentence?.sentenceType)
        .map(charge => [charge.sentence.sentenceType.sentenceTypeUuid, charge.sentence.sentenceType.description]) ?? [],
    )
    this.offenceOutcomeMap = Object.fromEntries(
      charges
        ?.filter(charge => charge.outcome)
        .map(charge => [charge.outcome.outcomeUuid, charge.outcome.outcomeName]) ?? [],
    )
  }
}
