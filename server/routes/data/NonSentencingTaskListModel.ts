import type { CourtAppearance, TaskListItem, TaskListItemStatus } from 'models'
import TaskListModel from './TaskListModel'
import { AppearanceOutcome } from '../../@types/remandAndSentencingApi/remandAndSentencingClientTypes'

export default class RemandTaskListModel extends TaskListModel {
  constructor(
    nomsId: string,
    addOrEditCourtCase: string,
    addOrEditCourtAppearance: string,
    courtCaseReference: string,
    appearanceReference: string,
    courtAppearance: CourtAppearance,
    caseReferenceSet: boolean,
    appearanceOutcome: AppearanceOutcome,
  ) {
    super(nomsId, addOrEditCourtCase, addOrEditCourtAppearance, courtCaseReference, appearanceReference)
    this.items = [
      this.getAppearanceInformationItem(courtAppearance, caseReferenceSet),
      this.getOffenceSentencesItem(courtAppearance),
    ]
    if (appearanceOutcome.dispositionCode === 'INTERIM') {
      this.items.push(this.getNextCourtAppearanceItem(courtAppearance))
    }
    this.items.push(this.getCourtDocumentsItem(courtAppearance))
  }

  setPageHeading() {
    if (this.isAddCourtCase()) {
      this.pageHeading = 'Add a court case'
    } else {
      this.pageHeading = 'Add a hearing to a court case'
    }
  }

  setFinishHeading() {
    if (this.isAddCourtCase()) {
      this.finishHeading = 'Finish adding a court case'
    } else {
      this.finishHeading = 'Finish adding a hearing'
    }
  }

  getAppearanceInformationTitleText(): string {
    return 'Add hearing information'
  }

  allAppearanceInformationFilledOut(courtAppearance: CourtAppearance): boolean {
    return courtAppearance.warrantDate && courtAppearance.courtCode && courtAppearance.appearanceInformationAccepted
  }

  anyAppearanceInformationFilledOut(courtAppearance: CourtAppearance): boolean {
    return (
      courtAppearance.caseReferenceNumber !== undefined ||
      courtAppearance.warrantDate !== undefined ||
      courtAppearance.courtCode !== undefined ||
      courtAppearance.appearanceInformationAccepted
    )
  }

  getOffenceSentenceTitleText(): string {
    if (this.isAddCourtCase()) {
      return 'Add offences'
    }

    return 'Review offences'
  }

  getOffenceSentenceHref(courtAppearance: CourtAppearance): string {
    let href
    if (this.allAppearanceInformationFilledOut(courtAppearance)) {
      if (courtAppearance.offences.length === 0) {
        href = `/person/${this.nomsId}/${this.addOrEditCourtCase}/${this.courtCaseReference}/${this.addOrEditCourtAppearance}/${this.appearanceReference}/offences/0/add-another-offence`
      } else if (this.isAddCourtCase()) {
        href = `/person/${this.nomsId}/${this.addOrEditCourtCase}/${this.courtCaseReference}/${this.addOrEditCourtAppearance}/${this.appearanceReference}/offences/check-offence-answers`
      } else {
        href = `/person/${this.nomsId}/${this.addOrEditCourtCase}/${this.courtCaseReference}/${this.addOrEditCourtAppearance}/${this.appearanceReference}/review-offences`
      }
    }
    return href
  }

  getOffenceSentenceStatus(courtAppearance: CourtAppearance): TaskListItemStatus {
    const appearanceInfoComplete = this.allAppearanceInformationFilledOut(courtAppearance)
    const isAddJourney = this.isAddCourtCase()
    if (!appearanceInfoComplete) {
      return {
        text: 'Cannot start yet',
        classes: 'govuk-task-list__status--cannot-start-yet',
      }
    }
    if (courtAppearance.offenceSentenceAccepted) {
      return {
        text: 'Completed',
      }
    }
    if (appearanceInfoComplete && !isAddJourney && courtAppearance.caseOutcomeAppliedAll === 'true') {
      return {
        tag: {
          text: 'Optional',
          classes: 'govuk-tag--grey',
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
    return 'Next court appearance'
  }

  private getNextCourtAppearanceHref(courtAppearance: CourtAppearance): string {
    if (!this.allAppearanceInformationFilledOut(courtAppearance)) {
      return null
    }
    let href = `/person/${this.nomsId}/${this.addOrEditCourtCase}/${this.courtCaseReference}/${this.addOrEditCourtAppearance}/${this.appearanceReference}/next-appearance-select`
    if (courtAppearance.nextCourtAppearanceAccepted) {
      href = `/person/${this.nomsId}/${this.addOrEditCourtCase}/${this.courtCaseReference}/${this.addOrEditCourtAppearance}/${this.appearanceReference}/check-next-appearance-answers`
    }
    return href
  }

  private getNextCourtAppearanceStatus(courtAppearance: CourtAppearance): TaskListItemStatus {
    let status: TaskListItemStatus = {
      tag: {
        text: 'Incomplete',
        classes: 'govuk-tag--blue',
      },
    }
    if (!this.allAppearanceInformationFilledOut(courtAppearance)) {
      status = {
        text: 'Cannot start yet',
        classes: 'govuk-task-list__status--cannot-start-yet',
      }
    } else if (courtAppearance.nextCourtAppearanceAccepted) {
      status = {
        text: 'Completed',
      }
    }

    return status
  }

  getCourtDocumentsHref(courtAppearance: CourtAppearance): string {
    let href
    if (this.allAppearanceInformationFilledOut(courtAppearance)) {
      href = `/person/${this.nomsId}/${this.addOrEditCourtCase}/${this.courtCaseReference}/${this.addOrEditCourtAppearance}/${this.appearanceReference}/upload-court-documents`
    }
    return href
  }
}
