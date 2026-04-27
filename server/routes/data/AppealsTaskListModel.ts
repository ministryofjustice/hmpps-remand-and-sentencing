import type { CourtAppearance, TaskListItemStatus } from 'models'
import TaskListModel from './TaskListModel'
import AppealsJourneyUrls from './AppealsJourneyUrls'
import JourneyUrls from './JourneyUrls'

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

  allAppearanceInformationFilledOut(_courtAppearance: CourtAppearance): boolean {
    return false
  }

  anyAppearanceInformationFilledOut(_courtAppearance: CourtAppearance): boolean {
    return false
  }

  getAppearanceInformationHref(courtAppearance: CourtAppearance, caseReferenceSet: boolean): string {
    if (this.allAppearanceInformationFilledOut(courtAppearance)) {
      return AppealsJourneyUrls.checkHearingAnswers(
        this.nomsId,
        this.addOrEditCourtCase,
        this.courtCaseReference,
        this.addOrEditCourtAppearance,
        this.appearanceReference,
      )
    }
    if (!caseReferenceSet) {
      return JourneyUrls.reference(
        this.nomsId,
        this.addOrEditCourtCase,
        this.courtCaseReference,
        this.addOrEditCourtAppearance,
        this.appearanceReference,
      )
    }
    return JourneyUrls.selectReference(
      this.nomsId,
      this.addOrEditCourtCase,
      this.courtCaseReference,
      this.addOrEditCourtAppearance,
      this.appearanceReference,
    )
  }

  getOffenceSentenceTitleText(_courtAppearance: CourtAppearance): string {
    return 'Record appeal'
  }

  getOffenceSentenceHref(_courtAppearance: CourtAppearance): string | undefined {
    return undefined
  }

  getOffenceSentenceStatus(_courtAppearance: CourtAppearance): TaskListItemStatus {
    return {
      text: 'Cannot start yet',
      classes: 'govuk-task-list__status--cannot-start-yet',
    }
  }

  getCourtDocumentsHref(_courtAppearance: CourtAppearance): string {
    return undefined
  }
}
