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
    caseReferenceSet: boolean,
  ) {
    this.nomsId = nomsId
    this.addOrEditCourtCase = addOrEditCourtCase
    this.addOrEditCourtAppearance = addOrEditCourtAppearance
    this.courtCaseReference = courtCaseReference
    this.appearanceReference = appearanceReference
    this.items = [
      this.getAppearanceInformationItem(courtAppearance, caseReferenceSet),
      this.getOffenceSentencesItem(courtAppearance),
    ]
    if (courtAppearance.warrantType === 'REMAND') {
      this.items.push(this.getNextCourtAppearanceItem(courtAppearance))
    }
    this.items.push(this.getCourtDocumentsItem(courtAppearance))
  }

  private getAppearanceInformationHref(courtAppearance: CourtAppearance, caseReferenceSet: boolean): string {
    if (this.allAppearanceInformationFilledOut(courtAppearance)) {
      return `/person/${this.nomsId}/${this.addOrEditCourtCase}/${this.courtCaseReference}/${this.addOrEditCourtAppearance}/${this.appearanceReference}/check-answers`
    }
    if (this.isAddCourtCase() || !caseReferenceSet) {
      return `/person/${this.nomsId}/${this.addOrEditCourtCase}/${this.courtCaseReference}/${this.addOrEditCourtAppearance}/${this.appearanceReference}/reference`
    }
    return `/person/${this.nomsId}/${this.addOrEditCourtCase}/${this.courtCaseReference}/${this.addOrEditCourtAppearance}/${this.appearanceReference}/select-reference`
  }

  private getAppearanceInformationItem(courtAppearance: CourtAppearance, caseReferenceSet: boolean): TaskListItem {
    return {
      title: {
        text: 'Add appearance information',
        classes: 'govuk-link--no-visited-state',
      },
      href: this.getAppearanceInformationHref(courtAppearance, caseReferenceSet),
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

  private getCourtDocumentsItem(courtAppearance: CourtAppearance): TaskListItem {
    let status: TaskListItemStatus = {
      tag: {
        text: 'Optional',
        classes: 'govuk-tag--grey',
      },
    }

    if (!this.allAppearanceInformationFilledOut(courtAppearance)) {
      status = {
        tag: {
          text: 'Cannot start yet',
          classes: 'govuk-tag--grey',
        },
      }
    }

    return {
      title: {
        text: 'Upload court documents',
        classes: 'govuk-link--no-visited-state',
      },
      href: this.allAppearanceInformationFilledOut(courtAppearance)
        ? `/person/${this.nomsId}/${this.addOrEditCourtCase}/${this.courtCaseReference}/${this.addOrEditCourtAppearance}/${this.appearanceReference}/document-type`
        : null,
      status,
    }
  }

  private getOffenceSentencesItem(courtAppearance: CourtAppearance): TaskListItem {
    return {
      title: {
        text: this.getOffenceSentenceTitleText(),
        classes: 'govuk-link--no-visited-state',
      },
      href: this.getOffenceSentenceHref(courtAppearance),
      status: this.getOffenceSentenceStatus(courtAppearance),
    }
  }

  private getOffenceSentenceTitleText(): string {
    if (this.isAddCourtCase()) {
      return 'Add offences'
    }

    return 'Review offences'
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
    const appearanceInfoComplete = this.allAppearanceInformationFilledOut(courtAppearance)
    let status

    if (!this.allAppearanceInformationFilledOut(courtAppearance)) {
      return {
        tag: {
          text: 'Cannot start yet',
          classes: 'govuk-tag--grey',
        },
      }
    }

    if (courtAppearance.offenceSentenceAccepted) {
      status = {
        text: 'Completed',
      }
    } else if (appearanceInfoComplete) {
      if (!this.isAddCourtCase() && courtAppearance.warrantType === 'REMAND') {
        status = {
          tag: {
            text: 'Optional',
            classes: 'govuk-tag--grey',
          },
        }
      }
      status = {
        tag: {
          text: 'Incomplete',
          classes: 'govuk-tag--blue',
        },
      }
    }

    return status
  }

  private getNextCourtAppearanceItem(courtAppearance: CourtAppearance): TaskListItem {
    return {
      title: {
        text: this.getNextCourtAppearanceTitleText(),
        classes: 'govuk-link--no-visited-state',
      },
      href: this.allAppearanceInformationFilledOut(courtAppearance)
        ? this.getNextCourtAppearanceHref(courtAppearance)
        : null,
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
    if (!this.allAppearanceInformationFilledOut(courtAppearance)) {
      return null
    }
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
    if (!this.allAppearanceInformationFilledOut(courtAppearance)) {
      status = {
        tag: {
          text: 'Cannot start yet',
          classes: 'govuk-tag--grey',
        },
      }
    } else if (courtAppearance.nextCourtAppearanceAccepted) {
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
