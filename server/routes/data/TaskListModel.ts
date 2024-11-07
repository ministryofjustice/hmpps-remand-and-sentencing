import type { CourtAppearance, TaskListItem, TaskListItemStatus } from 'models'

export default class TaskListModel {
  items: TaskListItem[]

  nomsId: string

  addOrEditCourtCase: string

  addOrEditCourtAppearance: string

  courtCaseReference: string

  appearanceReference: string

  constructor(
    nomsId: string,
    addOrEditCourtCase: string,
    addOrEditCourtAppearance: string,
    courtCaseReference: string,
    appearanceReference: string,
    courtAppearance: CourtAppearance,
  ) {
    this.nomsId = nomsId
    this.addOrEditCourtCase = addOrEditCourtCase
    this.addOrEditCourtAppearance = addOrEditCourtAppearance
    this.courtCaseReference = courtCaseReference
    this.appearanceReference = appearanceReference
    this.items = [
      this.getAppearanceInformationItem(courtAppearance),
      this.getCourtDocumentsItem(),
      this.getOffenceSentencesItem(courtAppearance),
    ]
    if (courtAppearance.warrantType === 'REMAND') {
      this.items.push(this.getNextCourtAppearanceItem(courtAppearance))
    }
  }

  private getAppearanceInformationItem(courtAppearance: CourtAppearance): TaskListItem {
    return {
      title: {
        text: 'Add appearance information',
      },
      href: this.isAddCourtCase()
        ? `/person/${this.nomsId}/${this.addOrEditCourtCase}/${this.courtCaseReference}/${this.addOrEditCourtAppearance}/${this.appearanceReference}/reference`
        : `/person/${this.nomsId}/${this.addOrEditCourtCase}/${this.courtCaseReference}/${this.addOrEditCourtAppearance}/${this.appearanceReference}/select-reference`,
      status: this.getAppearanceInformationStatus(courtAppearance),
    }
  }

  private getAppearanceInformationStatus(courtAppearance: CourtAppearance): TaskListItemStatus {
    if (this.allAppearanceInformationFilledOut(courtAppearance)) {
      return {
        text: 'Completed',
      }
    }
    if (this.someAppearanceInformationFilledOut(courtAppearance)) {
      return {
        tag: {
          text: 'In progress',
          classes: 'govuk-tag--light-blue',
        },
      }
    }
    return {
      tag: {
        text: 'Incomplete',
        classes: 'govuk-tag--blue',
      },
    }
  }

  private allAppearanceInformationFilledOut(courtAppearance: CourtAppearance): boolean {
    let typeSpecificInformationFilledOut = false
    if (courtAppearance.warrantType === 'SENTENCING') {
      typeSpecificInformationFilledOut =
        courtAppearance.taggedBail !== undefined || courtAppearance.hasTaggedBail !== undefined
    } else {
      typeSpecificInformationFilledOut =
        courtAppearance.appearanceOutcomeUuid && courtAppearance.caseOutcomeAppliedAll !== undefined
    }
    return (
      courtAppearance.caseReferenceNumber &&
      courtAppearance.warrantDate &&
      courtAppearance.courtCode &&
      typeSpecificInformationFilledOut &&
      courtAppearance.appearanceInformationAccepted
    )
  }

  private someAppearanceInformationFilledOut(courtAppearance: CourtAppearance): boolean {
    let typeSpecificInformationFilledOut = false
    if (courtAppearance.warrantType === 'SENTENCING') {
      typeSpecificInformationFilledOut =
        courtAppearance.taggedBail !== undefined || courtAppearance.hasTaggedBail !== undefined
    } else {
      typeSpecificInformationFilledOut =
        courtAppearance.appearanceOutcomeUuid !== undefined || courtAppearance.caseOutcomeAppliedAll !== undefined
    }
    return (
      courtAppearance.caseReferenceNumber !== undefined ||
      courtAppearance.warrantDate !== undefined ||
      courtAppearance.courtCode !== undefined ||
      typeSpecificInformationFilledOut ||
      courtAppearance.appearanceInformationAccepted
    )
  }

  private offenceOverallFieldsFilledOut(courtAppearance: CourtAppearance): boolean {
    return (
      courtAppearance.overallConvictionDate !== undefined &&
      courtAppearance.overallConvictionDateAppliedAll !== undefined &&
      courtAppearance.overallSentenceLength !== undefined
    )
  }

  private getCourtDocumentsItem(): TaskListItem {
    return {
      title: {
        text: 'Upload court documents',
      },
      href: `/person/${this.nomsId}/${this.addOrEditCourtCase}/${this.courtCaseReference}/${this.addOrEditCourtAppearance}/${this.appearanceReference}/document-type`,
      status: {
        tag: {
          text: 'Optional',
          classes: 'govuk-tag--grey',
        },
      },
    }
  }

  private getOffenceSentencesItem(courtAppearance: CourtAppearance): TaskListItem {
    return {
      title: {
        text: this.getOffenceSentenceTitleText(courtAppearance),
      },
      href: this.getOffenceSentenceHref(courtAppearance),
      status: this.getOffenceSentenceStatus(courtAppearance),
    }
  }

  private getOffenceSentenceTitleText(courtAppearance: CourtAppearance): string {
    let titleText = 'Add offences'
    if (this.isAddCourtCase()) {
      if (courtAppearance.warrantType === 'SENTENCING') {
        titleText = 'Add sentences'
      }
    } else if (courtAppearance.warrantType === 'SENTENCING') {
      titleText = 'Review offences and sentences'
    } else {
      titleText = 'Review offences'
    }
    return titleText
  }

  private getOffenceSentenceHref(courtAppearance: CourtAppearance): string {
    let href
    if (this.allAppearanceInformationFilledOut(courtAppearance)) {
      if (courtAppearance.warrantType === 'REMAND' || this.offenceOverallFieldsFilledOut(courtAppearance)) {
        if (this.isAddCourtCase()) {
          href = `/person/${this.nomsId}/${this.addOrEditCourtCase}/${this.courtCaseReference}/${this.addOrEditCourtAppearance}/${this.appearanceReference}/offences/check-offence-answers`
        } else {
          href = `/person/${this.nomsId}/${this.addOrEditCourtCase}/${this.courtCaseReference}/${this.addOrEditCourtAppearance}/${this.appearanceReference}/review-offences`
        }
      } else {
        href = `/person/${this.nomsId}/${this.addOrEditCourtCase}/${this.courtCaseReference}/${this.addOrEditCourtAppearance}/${this.appearanceReference}/overall-sentence-length`
      }
    }

    return href
  }

  private getOffenceSentenceStatus(courtAppearance: CourtAppearance): TaskListItemStatus {
    let status
    if (courtAppearance.offenceSentenceAccepted) {
      status = {
        text: 'Completed',
      }
    } else if (!this.isAddCourtCase() && courtAppearance.warrantType === 'REMAND') {
      status = {
        tag: {
          text: 'Optional',
          classes: 'govuk-tag--grey',
        },
      }
    } else if (this.allAppearanceInformationFilledOut(courtAppearance)) {
      status = {
        tag: {
          text: 'Incomplete',
          classes: 'govuk-tag--blue',
        },
      }
    } else {
      status = {
        text: 'Cannot start yet',
      }
    }
    return status
  }

  private getNextCourtAppearanceItem(courtAppearance: CourtAppearance): TaskListItem {
    return {
      title: {
        text: this.getNextCourtAppearanceTitleText(),
      },
      href: this.getNextCourtAppearanceHref(courtAppearance),
      status: this.getNextCourtAppearanceStatus(courtAppearance),
    }
  }

  private getNextCourtAppearanceTitleText(): string {
    let titleText = 'Add next court appearance'
    if (this.isAddCourtCase()) {
      titleText = 'Next court appearance'
    }
    return titleText
  }

  private getNextCourtAppearanceHref(courtAppearance: CourtAppearance): string {
    let href = `/person/${this.nomsId}/${this.addOrEditCourtCase}/${this.courtCaseReference}/${this.addOrEditCourtAppearance}/${this.appearanceReference}/next-hearing-select`
    if (courtAppearance.nextCourtAppearanceAccepted) {
      href = `/person/${this.nomsId}/${this.addOrEditCourtCase}/${this.courtCaseReference}/${this.addOrEditCourtAppearance}/${this.appearanceReference}/check-next-hearing-answers`
    }
    return href
  }

  private getNextCourtAppearanceStatus(courtAppearance: CourtAppearance): TaskListItemStatus {
    let status: TaskListItemStatus = {
      tag: {
        text: 'Optional',
        classes: 'govuk-tag--grey',
      },
    }
    if (courtAppearance.nextCourtAppearanceAccepted) {
      status = {
        text: 'Completed',
      }
    } else if (this.isAddCourtCase()) {
      status = {
        tag: {
          text: 'Incomplete',
          classes: 'govuk-tag--blue',
        },
      }
    }
    return status
  }

  private isAddCourtCase(): boolean {
    return this.addOrEditCourtCase === 'add-court-case'
  }

  isAllMandatoryItemsComplete(): boolean {
    return this.items
      .map(item => item.status.text ?? item.status.tag.text)
      .filter(status => status !== 'Optional')
      .every(status => status === 'Completed')
  }
}
