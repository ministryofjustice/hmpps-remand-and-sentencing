import dayjs from 'dayjs'
import type { Offence } from 'models'
import {
  PageCourtCaseAppearance,
  PageCourtCaseContent,
} from '../../@types/remandAndSentencingApi/remandAndSentencingClientTypes'
import config from '../../config'
import { chargeToOffence } from '../../utils/mappingUtils'

export default class CourtCasesDetailsModel {
  courtCaseUuid: string

  caseReferences: string

  overallCaseOutcome: string

  nextHearing: string[]

  appearanceTotal: number

  showingAppearanceTotal?: number

  latestAppearances: PageCourtCaseAppearance[]

  chargeTotal: number

  showingChargeTotal?: number

  offences: Offence[]

  sentenceTypeMap: { [key: string]: string }

  offenceOutcomeMap: { [key: string]: string }

  latestCourtCode: string

  latestAppearanceDate: string

  constructor(pageCourtCaseContent: PageCourtCaseContent, courtMap: { [key: string]: string }) {
    this.courtCaseUuid = pageCourtCaseContent.courtCaseUuid
    this.caseReferences = Array.from(
      new Set(pageCourtCaseContent.appearances.map(appearance => appearance.courtCaseReference)),
    ).join(', ')
    this.overallCaseOutcome = pageCourtCaseContent.latestAppearance?.outcome.outcomeName

    if (pageCourtCaseContent.latestAppearance?.nextCourtAppearance) {
      const appearanceDate = dayjs(pageCourtCaseContent.latestAppearance.nextCourtAppearance.appearanceDate)
      let appearanceDateFormatted = appearanceDate.format(config.dateFormat)
      if (pageCourtCaseContent.latestAppearance.nextCourtAppearance.appearanceTime) {
        appearanceDateFormatted = appearanceDate.format(config.dateTimeFormat)
      }
      this.nextHearing = [
        courtMap[pageCourtCaseContent.latestAppearance.nextCourtAppearance.courtCode] ??
          pageCourtCaseContent.latestAppearance.nextCourtAppearance.courtCode,
        pageCourtCaseContent.latestAppearance.nextCourtAppearance.appearanceType,
        appearanceDateFormatted,
      ]
    } else {
      this.nextHearing = ['Date to be fixed']
    }
    this.appearanceTotal = pageCourtCaseContent.appearances.length
    if (this.appearanceTotal > 5) {
      this.showingAppearanceTotal = 5
    }
    this.latestAppearances = pageCourtCaseContent.appearances
      .sort((a, b) => (dayjs(a.appearanceDate).isBefore(dayjs(b.appearanceDate)) ? 1 : -1))
      .slice(0, 5)
    this.chargeTotal = pageCourtCaseContent.latestAppearance?.charges.length
    if (this.chargeTotal > 5) {
      this.showingChargeTotal = 5
    }
    const charges = pageCourtCaseContent.latestAppearance?.charges
      .sort((a, b) => (dayjs(a.offenceStartDate).isBefore(dayjs(b.offenceStartDate)) ? 1 : -1))
      .slice(0, 5)
    this.offences = charges?.map(charge => chargeToOffence(charge))
    this.sentenceTypeMap = Object.fromEntries(
      charges
        ?.filter(charge => charge.sentence)
        .map(charge => [charge.sentence.sentenceType.sentenceTypeUuid, charge.sentence.sentenceType.description]) ?? [],
    )
    this.offenceOutcomeMap = Object.fromEntries(
      charges
        ?.filter(charge => charge.outcome)
        .map(charge => [charge.outcome.outcomeUuid, charge.outcome.outcomeName]) ?? [],
    )
    this.latestCourtCode = pageCourtCaseContent.latestAppearance?.courtCode
    this.latestAppearanceDate = dayjs(pageCourtCaseContent.latestAppearance?.appearanceDate).format(config.dateFormat)
  }
}
