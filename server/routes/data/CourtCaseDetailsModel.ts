import dayjs from 'dayjs'
import { formatLengths } from 'hmpps-court-cases-release-dates-design/hmpps/utils/utils'
import {
  PageCourtCaseAppearance,
  PageCourtCaseContent,
} from '../../@types/remandAndSentencingApi/remandAndSentencingClientTypes'
import config from '../../config'
import { draftCourtAppearanceToPageCourtAppearance, periodLengthToSentenceLength } from '../../utils/mappingUtils'
import { sortByOffenceStartDate } from '../../utils/utils'

export default class CourtCaseDetailsModel {
  courtCaseUuid: string

  latestCaseReference: string

  latestCourtCode: string

  caseReferences: string

  overallCaseOutcome: string

  nextHearingDate: string

  overallSentenceLength: string

  overallCaseStatus: string

  appearanceTotal: number

  appearances: PageCourtCaseAppearance[]

  draftAppearances: PageCourtCaseAppearance[]

  constructor(pageCourtCaseContent: PageCourtCaseContent) {
    this.courtCaseUuid = pageCourtCaseContent.courtCaseUuid
    this.latestCaseReference = pageCourtCaseContent.latestAppearance?.courtCaseReference
    this.latestCourtCode = pageCourtCaseContent.latestAppearance?.courtCode
    this.caseReferences = Array.from(
      new Set(
        pageCourtCaseContent.appearances
          .filter(appearance => !!appearance.courtCaseReference)
          .map(appearance => appearance.courtCaseReference),
      ),
    ).join(', ')
    this.overallCaseOutcome =
      pageCourtCaseContent.latestAppearance?.outcome?.outcomeName ??
      pageCourtCaseContent.latestAppearance?.legacyData?.outcomeDescription

    if (pageCourtCaseContent.latestAppearance?.nextCourtAppearance) {
      const appearanceDate = dayjs(
        `${pageCourtCaseContent.latestAppearance?.nextCourtAppearance.appearanceDate}${pageCourtCaseContent.latestAppearance.nextCourtAppearance.appearanceTime ? `T${pageCourtCaseContent.latestAppearance.nextCourtAppearance.appearanceTime}` : ''}`,
      )
      let appearanceDateFormatted = appearanceDate.format(config.dateFormat)
      if (pageCourtCaseContent.latestAppearance?.nextCourtAppearance.appearanceTime) {
        appearanceDateFormatted = appearanceDate.format(config.dateTimeFormat)
      }
      this.nextHearingDate = appearanceDateFormatted
    }

    if (pageCourtCaseContent.latestAppearance?.overallSentenceLength) {
      this.overallSentenceLength = formatLengths(
        periodLengthToSentenceLength(pageCourtCaseContent.latestAppearance?.overallSentenceLength),
      )
    }
    this.overallCaseStatus = pageCourtCaseContent.status
    this.appearanceTotal = pageCourtCaseContent.appearances.length
    this.appearances = pageCourtCaseContent.appearances.map(appearance => {
      const sortedCharges = appearance.charges.sort((a, b) => {
        return sortByOffenceStartDate(a.offenceStartDate, b.offenceStartDate)
      })
      return { ...appearance, charges: sortedCharges }
    })
    this.draftAppearances = pageCourtCaseContent.draftAppearances?.map(appearance => {
      return draftCourtAppearanceToPageCourtAppearance(appearance)
    })
  }
}
