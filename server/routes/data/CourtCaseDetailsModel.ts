import dayjs from 'dayjs'
import { formatLengths } from '@ministryofjustice/hmpps-court-cases-release-dates-design/hmpps/utils/utils'
import {
  MergedFromCase,
  MergedToCaseDetails,
  CourtAppearance as PageCourtCaseAppearance,
  CourtCase as PageCourtCaseContent,
} from '../../@types/remandAndSentencingApi'
import config from '../../config'
import { periodLengthToSentenceLength } from '../../utils/mappingUtils'
import { formatDate, getSortedDocumentsWithUiDocumentType, orderCharges, sortByDateDesc } from '../../utils/utils'

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

  showEditLink: boolean

  markCourtCaseStatusAction?: 'active' | 'inactive'

  hasActiveSentence: boolean

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
    const isMergedToAnotherCase = pageCourtCaseContent.status === 'MERGED'
    const hasMergedFromCases = pageCourtCaseContent.appearances.some(
      hearing => this.getMergedFromCases(hearing).length > 0,
    )
    this.hearings = pageCourtCaseContent.appearances
      .map(hearing => {
        const sortedCharges = orderCharges(hearing.charges)
        const hasAnyRecalls = hearing.charges.some(charge => charge.sentence?.hasRecall)
        const breachOfSupervisionLength = formatLengths(
          periodLengthToSentenceLength(
            hearing.periodLengths.find(
              periodLength => periodLength.periodLengthType === 'BREACH_OF_SUPERVISION_REQUIREMENTS',
            ),
          ),
        )
        const breachOfImprisonableOffence = formatLengths(
          periodLengthToSentenceLength(
            hearing.periodLengths.find(
              periodLength => periodLength.periodLengthType === 'BREACH_OF_IMPRISONABLE_OFFENCE',
            ),
          ),
        )
        const canDelete = hearing.deleteStatus === 'SUPPORTED'
        const deleteRestrictionMessages = this.getDeleteRestrictionMessages(
          hearing,
          canDelete,
          isMergedToAnotherCase,
          hasMergedFromCases,
        )
        return {
          ...hearing,
          charges: sortedCharges,
          hasAnyRecalls,
          canDelete,
          deleteRestrictionMessages,
          mergedFromCases: this.offenceGetMergedFromText(this.getMergedFromCases(hearing), courtMap),
          documentsWithUiType: getSortedDocumentsWithUiDocumentType(hearing.documents, hearing.warrantType),
          breachOfSupervisionLength,
          breachOfImprisonableOffence,
        }
      })
      .sort((a, b) => sortByDateDesc(a.appearanceDate, b.appearanceDate))

    this.mergedToCaseDetails = pageCourtCaseContent.mergedToCaseDetails

    this.mergedToInsetText = this.mergedToCaseDetails
      ? CourtCaseDetailsModel.buildMergedToInsetText(this.mergedToCaseDetails, courtMap)
      : undefined
    this.showEditLink = pageCourtCaseContent.status !== 'MERGED'
    if (pageCourtCaseContent.status === 'ACTIVE') {
      this.markCourtCaseStatusAction = 'inactive'
    } else if (pageCourtCaseContent.status === 'INACTIVE') {
      this.markCourtCaseStatusAction = 'active'
    }
    this.hasActiveSentence = pageCourtCaseContent.appearances.some(appearance =>
      appearance.charges.some(charge => charge.sentence?.status === 'ACTIVE'),
    )
  }

  private getDeleteRestrictionMessages(
    hearing: PageCourtCaseAppearance,
    canDelete: boolean,
    isMergedToAnotherCase: boolean,
    hasMergedFromCases: boolean,
  ): string[] {
    if (canDelete) {
      return []
    }

    const hasSentences = hearing.charges.some(charge => charge.sentence != null)
    const deleteRestrictions: string[] = []

    if (isMergedToAnotherCase) {
      deleteRestrictions.push('You cannot delete a hearing because this court case is merged with another court case.')
    }
    if (hasMergedFromCases) {
      deleteRestrictions.push('You cannot delete a hearing because another court case is merged with this court case.')
    }
    if (hasSentences || deleteRestrictions.length === 0) {
      deleteRestrictions.push('You cannot delete a hearing that includes sentences.')
    }

    return deleteRestrictions
  }

  private getMergedFromCases(hearing: PageCourtCaseAppearance): MergedFromCase[] {
    return hearing.charges.filter(offence => offence.mergedFromCase != null).map(offence => offence.mergedFromCase)
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
