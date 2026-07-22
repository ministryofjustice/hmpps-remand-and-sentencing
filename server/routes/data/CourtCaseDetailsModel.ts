import dayjs from 'dayjs'
import { formatLengths } from '@ministryofjustice/hmpps-court-cases-release-dates-design/hmpps/utils/utils'
import {
  MergedFromCase,
  MergedToCaseDetails,
  PageCourtCaseAppearance,
  PageCourtCaseContent,
} from '../../@types/remandAndSentencingApi/remandAndSentencingClientTypes'
import config from '../../config'
import { periodLengthToSentenceLength } from '../../utils/mappingUtils'
import { formatDate, getUiDocumentType, orderCharges, sortByDateDesc } from '../../utils/utils'

export default class CourtCaseDetailsModel {
  courtCaseUuid: string

  latestCaseReference: string

  latestCourtCode: string

  caseReferences: string

  overallCaseOutcome: string

  nextAppearanceDate: string

  overallSentenceLength: string

  overallCaseStatus: string

  hearingTotal: number

  hearings: PageCourtCaseAppearance[]

  mergedToCaseDetails: MergedToCaseDetails

  mergedToInsetText?: string

  showAppealRow: boolean

  showBreachRow: boolean

  showEditLink: boolean

  constructor(pageCourtCaseContent: PageCourtCaseContent, courtMap: { [key: string]: string }) {
    this.courtCaseUuid = pageCourtCaseContent.courtCaseUuid
    this.latestCaseReference = pageCourtCaseContent.latestAppearance?.courtCaseReference
    this.latestCourtCode = pageCourtCaseContent.latestAppearance?.courtCode
    this.caseReferences = Array.from(
      new Set(
        pageCourtCaseContent.appearances
          .filter(hearing => !!hearing.courtCaseReference)
          .map(hearing => hearing.courtCaseReference),
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
      this.nextAppearanceDate = appearanceDateFormatted
    }
    this.overallSentenceLength = formatLengths(
      periodLengthToSentenceLength(
        pageCourtCaseContent.latestAppearance?.periodLengths.find(
          periodLength => periodLength.periodLengthType === 'OVERALL_SENTENCE_LENGTH',
        ),
      ),
    )
    this.overallCaseStatus = pageCourtCaseContent.status
    this.hearingTotal = pageCourtCaseContent.appearances.length
    this.hearings = pageCourtCaseContent.appearances
      .map(hearing => {
        const sortedCharges = orderCharges(hearing.charges)
        const hasAnyRecalls = hearing.charges.some(charge => charge.sentence?.hasRecall)
        return {
          ...hearing,
          charges: sortedCharges,
          hasAnyRecalls,
          canDelete: hearing.deleteStatus === 'SUPPORTED',
          mergedFromCases: this.offenceGetMergedFromText(
            hearing.charges.filter(offence => offence.mergedFromCase != null).map(offence => offence.mergedFromCase),
            courtMap,
          ),
          documentsWithUiType: Array.isArray(hearing.documents)
            ? hearing.documents.map(document => ({
                ...document,
                documentType: getUiDocumentType(document.documentType, hearing.warrantType),
              }))
            : [],
        }
      })
      .sort((a, b) => sortByDateDesc(a.appearanceDate, b.appearanceDate))

    this.mergedToCaseDetails = pageCourtCaseContent.mergedToCaseDetails

    this.mergedToInsetText = this.mergedToCaseDetails
      ? CourtCaseDetailsModel.buildMergedToInsetText(this.mergedToCaseDetails, courtMap)
      : undefined
    this.showAppealRow = config.featureToggles.appeals
    this.showBreachRow = config.featureToggles.breachSupervision
    this.showEditLink = pageCourtCaseContent.status !== 'MERGED'
  }

  private static buildMergedToInsetText(merged: MergedToCaseDetails, courtMap: { [key: string]: string }): string {
    const mergedDate = merged.mergedToDate ? dayjs(merged.mergedToDate).format(config.dateFormat) : ''
    const courtName = merged.courtCode ? courtMap[merged.courtCode] : ''
    if (merged.caseReference) {
      return `Offences from this court case were merged on ${mergedDate} with ${merged.caseReference} at ${courtName}`
    }
    const latestAppearanceDate = merged.warrantDate ? dayjs(merged.warrantDate).format(config.dateFormat) : ''
    return `Offences from this court case were merged on ${mergedDate} with the case at ${courtName} on ${latestAppearanceDate}`
  }

  private offenceGetMergedFromText(mergedFromCases: MergedFromCase[], courtMap: { [key: string]: string }): string[] {
    if (!mergedFromCases || mergedFromCases.length === 0) return []
    const parts = new Set<string>()
    for (const mergedFromCase of mergedFromCases) {
      const mergedFromDate = formatDate(mergedFromCase.mergedFromDate)
      if (mergedFromCase.caseReference) {
        parts.add(`Offences from ${mergedFromCase.caseReference} were merged with this appearance on ${mergedFromDate}`)
      } else {
        const courtName = courtMap[mergedFromCase.courtCode!]
        const latestAppearance = formatDate(mergedFromCase.warrantDate)
        parts.add(
          `Offences from the case at ${courtName} on ${latestAppearance} were merged with this appearance on ${mergedFromDate}`,
        )
      }
    }
    return Array.from(parts)
  }
}
