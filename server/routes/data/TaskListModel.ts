import type { CourtAppearance, TaskListItem, TaskListItemStatus } from 'models'

export default abstract class TaskListModel {
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
  ) {
    this.nomsId = nomsId
    this.addOrEditCourtCase = addOrEditCourtCase
    this.addOrEditCourtAppearance = addOrEditCourtAppearance
    this.courtCaseReference = courtCaseReference
    this.appearanceReference = appearanceReference
  }

  isAllMandatoryItemsComplete(): boolean {
    return this.items
      .map(item => item.status.text ?? item.status.tag.text)
      .filter(status => status !== 'Optional')
      .every(status => status === 'Completed')
  }

  isAddCourtCase(): boolean {
    return this.addOrEditCourtCase === 'add-court-case'
  }

  getAppearanceInformationItem(courtAppearance: CourtAppearance, caseReferenceSet: boolean): TaskListItem {
    return {
      title: {
        text: 'Add appearance information',
        classes: 'govuk-link--no-visited-state',
      },
      href: this.getAppearanceInformationHref(courtAppearance, caseReferenceSet),
      status: this.getAppearanceInformationStatus(courtAppearance),
    }
  }

  getAppearanceInformationHref(courtAppearance: CourtAppearance, caseReferenceSet: boolean): string {
    if (this.allAppearanceInformationFilledOut(courtAppearance)) {
      return `/person/${this.nomsId}/${this.addOrEditCourtCase}/${this.courtCaseReference}/${this.addOrEditCourtAppearance}/${this.appearanceReference}/check-answers`
    }
    if (this.isAddCourtCase() || !caseReferenceSet) {
      return `/person/${this.nomsId}/${this.addOrEditCourtCase}/${this.courtCaseReference}/${this.addOrEditCourtAppearance}/${this.appearanceReference}/reference`
    }
    return `/person/${this.nomsId}/${this.addOrEditCourtCase}/${this.courtCaseReference}/${this.addOrEditCourtAppearance}/${this.appearanceReference}/select-reference`
  }

  abstract allAppearanceInformationFilledOut(courtAppearance: CourtAppearance): boolean

  abstract anyAppearanceInformationFilledOut(courtAppearance: CourtAppearance): boolean

  getAppearanceInformationStatus(courtAppearance: CourtAppearance): TaskListItemStatus {
    if (this.allAppearanceInformationFilledOut(courtAppearance)) {
      return {
        text: 'Completed',
      }
    }
    if (this.anyAppearanceInformationFilledOut(courtAppearance)) {
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

  getOffenceSentencesItem(courtAppearance: CourtAppearance): TaskListItem {
    return {
      title: {
        text: this.getOffenceSentenceTitleText(courtAppearance),
        classes: 'govuk-link--no-visited-state',
      },
      href: this.getOffenceSentenceHref(courtAppearance),
      status: this.getOffenceSentenceStatus(courtAppearance),
    }
  }

  abstract getOffenceSentenceTitleText(courtAppearance: CourtAppearance): string

  abstract getOffenceSentenceHref(courtAppearance: CourtAppearance): string

  abstract getOffenceSentenceStatus(courtAppearance: CourtAppearance): TaskListItemStatus

  getCourtDocumentsItem(courtAppearance: CourtAppearance): TaskListItem {
    return {
      title: {
        text: 'Add appearance information',
        classes: 'govuk-link--no-visited-state',
      },
      href: this.getCourtDocumentsHref(courtAppearance),
      status: this.getCourtDocumentsStatus(courtAppearance),
    }
  }

  abstract getCourtDocumentsHref(courtAppearance: CourtAppearance): string

  private getCourtDocumentsStatus(courtAppearance: CourtAppearance): TaskListItemStatus {
    let status: TaskListItemStatus = {
      tag: {
        text: 'Optional',
        classes: 'govuk-tag--grey',
      },
    }

    if (!this.allAppearanceInformationFilledOut(courtAppearance)) {
      status = {
        text: 'Cannot start yet',
        classes: 'govuk-task-list__status--cannot-start-yet',
      }
    }

    if (courtAppearance.documentUploadAccepted) {
      status = {
        text: 'Completed',
      }
    }
    return status
  }
}
