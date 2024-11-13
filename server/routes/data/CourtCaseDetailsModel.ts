import dayjs from 'dayjs'
import { formatLengths } from 'hmpps-court-cases-release-dates-design/hmpps/utils/utils'
import {
  PageCourtCaseAppearance,
  PageCourtCaseContent,
} from '../../@types/remandAndSentencingApi/remandAndSentencingClientTypes'
import config from '../../config'
import { periodLengthToSentenceLength } from '../../utils/mappingUtils'

export default class CourtCaseDetailsModel {
  courtCaseUuid: string

  latestCaseReference: string

  latestCourtCode: string

  caseReferences: string

  overallCaseOutcome: string

  nextHearingDate: string

  overallSentenceLength: string

  appearanceTotal: number

  appearances: PageCourtCaseAppearance[]

  constructor(pageCourtCaseContent: PageCourtCaseContent) {
    this.courtCaseUuid = pageCourtCaseContent.courtCaseUuid
    this.latestCaseReference = pageCourtCaseContent.latestAppearance.courtCaseReference
    this.latestCourtCode = pageCourtCaseContent.latestAppearance.courtCode
    this.caseReferences = Array.from(
      new Set(
        pageCourtCaseContent.appearances
          .filter(appearance => !!appearance.courtCaseReference)
          .map(appearance => appearance.courtCaseReference),
      ),
    ).join(', ')
    this.overallCaseOutcome =
      pageCourtCaseContent.latestAppearance.outcome?.outcomeName ??
      pageCourtCaseContent.latestAppearance.legacyData?.outcomeDescription

    if (pageCourtCaseContent.latestAppearance.nextCourtAppearance) {
      const appearanceDate = dayjs(
        `${pageCourtCaseContent.latestAppearance.nextCourtAppearance.appearanceDate}${pageCourtCaseContent.latestAppearance.nextCourtAppearance.appearanceTime ? `T${pageCourtCaseContent.latestAppearance.nextCourtAppearance.appearanceTime}` : ''}`,
      )
      let appearanceDateFormatted = appearanceDate.format(config.dateFormat)
      if (pageCourtCaseContent.latestAppearance.nextCourtAppearance.appearanceTime) {
        appearanceDateFormatted = appearanceDate.format(config.dateTimeFormat)
      }
      this.nextHearingDate = appearanceDateFormatted
    }

    if (pageCourtCaseContent.latestAppearance.overallSentenceLength) {
      this.overallSentenceLength = formatLengths(
        periodLengthToSentenceLength(pageCourtCaseContent.latestAppearance.overallSentenceLength),
      )
    }
    this.appearanceTotal = pageCourtCaseContent.appearances.length
    this.appearances = pageCourtCaseContent.appearances
  }
}
