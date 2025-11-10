import type { CourtAppearance, TaskListItem, TaskListItemStatus } from 'models'
import TaskListModel from './TaskListModel'

export default class SentencingTaskListModel extends TaskListModel {
  constructor(
    nomsId: string,
    addOrEditCourtCase: string,
    addOrEditCourtAppearance: string,
    courtCaseReference: string,
    appearanceReference: string,
    courtAppearance: CourtAppearance,
    caseReferenceSet: boolean,
  ) {
    super(nomsId, addOrEditCourtCase, addOrEditCourtAppearance, courtCaseReference, appearanceReference)
    this.items = [
      this.getAppearanceInformationItem(courtAppearance, caseReferenceSet),
      this.getWarrantInformationItem(courtAppearance),
      this.getOffenceSentencesItem(courtAppearance),
      this.getCourtDocumentsItem(courtAppearance),
    ]
  }

  private getWarrantInformationItem(courtAppearance: CourtAppearance): TaskListItem {
    return {
      title: {
        text: 'Add overall warrant information',
        classes: 'govuk-link--no-visited-state',
      },
      href: this.getWarrantInformationHref(courtAppearance),
      status: this.getWarrantInformationStatus(courtAppearance),
    }
  }

  private getWarrantInformationHref(courtAppearance: CourtAppearance): string {
    if (!this.allAppearanceInformationFilledOut(courtAppearance)) {
      return undefined
    }

    if (courtAppearance.warrantInformationAccepted) {
      return `/person/${this.nomsId}/${this.addOrEditCourtCase}/${this.courtCaseReference}/${this.addOrEditCourtAppearance}/${this.appearanceReference}/sentencing/check-overall-answers`
    }

    return `/person/${this.nomsId}/${this.addOrEditCourtCase}/${this.courtCaseReference}/${this.addOrEditCourtAppearance}/${this.appearanceReference}/sentencing/overall-sentence-length`
  }

  private getWarrantInformationStatus(courtAppearance: CourtAppearance): TaskListItemStatus {
    if (!this.allAppearanceInformationFilledOut(courtAppearance)) {
      return {
        text: 'Cannot start yet',
        classes: 'govuk-task-list__status--cannot-start-yet',
      }
    }

    if (courtAppearance.warrantInformationAccepted) {
      return {
        text: 'Completed',
      }
    }

    return {
      tag: {
        text: 'Incomplete',
        classes: 'govuk-tag--blue',
      },
    }
  }

  private allWarrantInformationFilledOut(courtAppearance: CourtAppearance): boolean {
    return (
      /* Doesnt check courtAppearance.overallSentenceLength because it gets deleted if set to NO
      caseOutcomeAppliedAll is not checked because it is not checked in Remand to Sentencing journey
       */
      courtAppearance.overallConvictionDateAppliedAll && courtAppearance.warrantInformationAccepted
    )
  }

  allAppearanceInformationFilledOut(courtAppearance: CourtAppearance): boolean {
    return (
      courtAppearance.warrantDate &&
      courtAppearance.courtCode !== undefined &&
      courtAppearance.appearanceInformationAccepted
    )
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
    return 'Update offence outcomes'
  }

  getOffenceSentenceHref(courtAppearance: CourtAppearance): string {
    let href
    if (this.allAppearanceInformationFilledOut(courtAppearance)) {
      if (courtAppearance.offences.length) {
        if (this.isAddCourtCase()) {
          href = `/person/${this.nomsId}/${this.addOrEditCourtCase}/${this.courtCaseReference}/${this.addOrEditCourtAppearance}/${this.appearanceReference}/offences/check-offence-answers`
        } else {
          href = `/person/${this.nomsId}/${this.addOrEditCourtCase}/${this.courtCaseReference}/${this.addOrEditCourtAppearance}/${this.appearanceReference}/update-offence-outcomes`
        }
      } else {
        href = `/person/${this.nomsId}/${this.addOrEditCourtCase}/${this.courtCaseReference}/${this.addOrEditCourtAppearance}/${this.appearanceReference}/offences/0/add-another-offence`
      }
    }
    return href
  }

  getOffenceSentenceStatus(courtAppearance: CourtAppearance): TaskListItemStatus {
    if (!this.allWarrantInformationFilledOut(courtAppearance)) {
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

    return {
      tag: {
        text: 'Incomplete',
        classes: 'govuk-tag--blue',
      },
    }
  }

  getCourtDocumentsHref(courtAppearance: CourtAppearance): string {
    let href
    if (this.allAppearanceInformationFilledOut(courtAppearance)) {
      href = `/person/${this.nomsId}/${this.addOrEditCourtCase}/${this.courtCaseReference}/${this.addOrEditCourtAppearance}/${this.appearanceReference}/sentencing/upload-court-documents`
    }
    return href
  }
}
