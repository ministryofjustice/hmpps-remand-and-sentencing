import type { CourtAppearance, TaskListItem, TaskListItemStatus } from 'models'
import TaskListModel from './TaskListModel'
import JourneyUrls from './JourneyUrls'

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

  setPageHeading() {
    if (this.isAddCourtCase()) {
      this.pageHeading = 'Add a court case'
    } else {
      this.pageHeading = 'Add a court hearing to a court case'
    }
  }

  setFinishHeading() {
    if (this.isAddCourtCase()) {
      this.finishHeading = 'Finish adding a court case'
    } else {
      this.finishHeading = 'Finish adding a court hearing'
    }
  }

  getAppearanceInformationTitleText(): string {
    return 'Add hearing information'
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
      return JourneyUrls.sentencingCheckOverallAnswers(
        this.nomsId,
        this.addOrEditCourtCase,
        this.courtCaseReference,
        this.addOrEditCourtAppearance,
        this.appearanceReference,
      )
    }

    return JourneyUrls.sentencingOverallSentenceLength(
      this.nomsId,
      this.addOrEditCourtCase,
      this.courtCaseReference,
      this.addOrEditCourtAppearance,
      this.appearanceReference,
    )
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
    if (this.allWarrantInformationFilledOut(courtAppearance)) {
      if (courtAppearance.offences.length) {
        if (this.isAddCourtCase()) {
          href = JourneyUrls.checkOffenceAnswers(
            this.nomsId,
            this.addOrEditCourtCase,
            this.courtCaseReference,
            this.addOrEditCourtAppearance,
            this.appearanceReference,
          )
        } else {
          href = JourneyUrls.updateOffenceOutcomes(
            this.nomsId,
            this.addOrEditCourtCase,
            this.courtCaseReference,
            this.addOrEditCourtAppearance,
            this.appearanceReference,
          )
        }
      } else {
        href = JourneyUrls.addAnotherOffence(
          this.nomsId,
          this.addOrEditCourtCase,
          this.courtCaseReference,
          this.addOrEditCourtAppearance,
          this.appearanceReference,
          '0',
        )
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
      href = JourneyUrls.sentencingUploadCourtDocuments(
        this.nomsId,
        this.addOrEditCourtCase,
        this.courtCaseReference,
        this.addOrEditCourtAppearance,
        this.appearanceReference,
      )
    }
    return href
  }
}
