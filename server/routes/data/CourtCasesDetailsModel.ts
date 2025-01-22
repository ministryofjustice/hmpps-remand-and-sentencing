import dayjs from 'dayjs'
import type { Offence } from 'models'
import {
  CourtCaseLegacyData,
  PageCourtCaseAppearance,
  PageCourtCaseContent,
} from '../../@types/remandAndSentencingApi/remandAndSentencingClientTypes'
import config from '../../config'
import { chargeToOffence } from '../../utils/mappingUtils'
import { outcomeValueOrLegacy, sortByOffenceStartDate } from '../../utils/utils'

export default class CourtCasesDetailsModel {
  courtCaseUuid: string

  caseReferences: string

  overallCaseOutcome: string

  overallCaseStatus: string

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
    let references = pageCourtCaseContent.appearances
      .filter(appearance => !!appearance.courtCaseReference)
      .map(appearance => appearance.courtCaseReference)
    if (pageCourtCaseContent.legacyData) {
      const courtCaseLegacyData = pageCourtCaseContent.legacyData as unknown as CourtCaseLegacyData
      references = references.concat(
        courtCaseLegacyData.caseReferences.map(caseReference => caseReference.offenderCaseReference),
      )
    }
    this.caseReferences = Array.from(new Set(references)).join(', ')
    this.overallCaseOutcome = outcomeValueOrLegacy(
      pageCourtCaseContent.latestAppearance?.outcome?.outcomeName,
      pageCourtCaseContent.latestAppearance?.legacyData,
    )

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
      .sort((a, b) => {
        return sortByOffenceStartDate(a.offenceStartDate, b.offenceStartDate)
      })
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
