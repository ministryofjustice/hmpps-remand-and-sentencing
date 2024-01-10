import dayjs from 'dayjs'
import {
  PageCourtCaseAppearance,
  PageCourtCaseContent,
} from '../../@types/remandAndSentencingApi/remandAndSentencingClientTypes'
import config from '../../config'

export default class CourtCaseDetailsModel {
  courtCaseUuid: string

  caseReferences: string

  overallCaseOutcome: string

  nextHearing: string[]

  appearanceTotal: number

  showingAppearanceTotal?: number

  latestAppearances: PageCourtCaseAppearance[]

  constructor(pageCourtCaseContent: PageCourtCaseContent) {
    this.courtCaseUuid = pageCourtCaseContent.courtCaseUuid
    this.caseReferences = Array.from(
      new Set(pageCourtCaseContent.appearances.map(appearance => appearance.courtCaseReference)),
    ).join(', ')
    this.overallCaseOutcome = pageCourtCaseContent.latestAppearance.outcome

    if (pageCourtCaseContent.latestAppearance.nextCourtAppearance) {
      const appearanceDate = dayjs(pageCourtCaseContent.latestAppearance.nextCourtAppearance.appearanceDate)
      let appearanceDateFormatted = appearanceDate.format(config.dateFormat)
      if (appearanceDate.hour() || appearanceDate.minute()) {
        appearanceDateFormatted = appearanceDate.format(config.dateTimeFormat)
      }
      this.nextHearing = [
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
  }
}
