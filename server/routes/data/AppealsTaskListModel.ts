import type { CourtAppearance, TaskListItemStatus } from 'models'
import TaskListModel from './TaskListModel'

export default class AppealsTaskListModel extends TaskListModel {
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
      this.getOffenceSentencesItem(courtAppearance),
      this.getCourtDocumentsItem(courtAppearance),
    ]
  }

  setPageHeading() {
    this.pageHeading = 'Add an appeal'
  }

  setFinishHeading() {
    this.finishHeading = 'Finish adding an appeal'
  }

  getAppearanceInformationTitleText(): string {
    return 'Add hearing information'
  }

  allAppearanceInformationFilledOut(courtAppearance: CourtAppearance): boolean {
    return false
  }

  anyAppearanceInformationFilledOut(courtAppearance: CourtAppearance): boolean {
    return false
  }

  getOffenceSentenceTitleText(courtAppearance: CourtAppearance): string {
    return 'Record appeal'
  }

  getOffenceSentenceHref(courtAppearance: CourtAppearance): string | undefined {
    return undefined
  }

  getOffenceSentenceStatus(courtAppearance: CourtAppearance): TaskListItemStatus {
    return {
      text: 'Cannot start yet',
      classes: 'govuk-task-list__status--cannot-start-yet',
    }
  }

  getCourtDocumentsHref(courtAppearance: CourtAppearance): string {
    return undefined
  }
}
