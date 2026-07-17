import type { CourtAppearance, TaskListItemStatus, UrlParameters } from 'models'
import TaskListModel from './TaskListModel'
import BreachJourneyUrls from './BreachJourneyUrls'
import JourneyUrls from './JourneyUrls'

export default class BreachTaskListModel extends TaskListModel {
  urlParameters: UrlParameters

  constructor(urlParameters: UrlParameters, courtAppearance: CourtAppearance) {
    super(
      urlParameters.nomsId,
      urlParameters.addOrEditCourtCase,
      urlParameters.addOrEditCourtAppearance,
      urlParameters.courtCaseReference,
      urlParameters.appearanceReference,
    )
    this.urlParameters = urlParameters
    this.items = [
      this.getAppearanceInformationItem(courtAppearance, false),
      this.getCourtDocumentsItem(courtAppearance),
    ]
  }

  setPageHeading() {
    this.pageHeading = 'Add a breach'
  }

  setFinishHeading() {
    this.finishHeading = 'Finish adding a breach'
  }

  getAppearanceInformationTitleText(): string {
    return 'Add hearing information'
  }

  allAppearanceInformationFilledOut(courtAppearance: CourtAppearance): boolean {
    return courtAppearance.warrantDate && courtAppearance.courtCode && courtAppearance.appearanceInformationAccepted
  }

  anyAppearanceInformationFilledOut(courtAppearance: CourtAppearance): boolean {
    return (
      courtAppearance.warrantDate !== undefined ||
      courtAppearance.courtCode !== undefined ||
      courtAppearance.appearanceInformationAccepted
    )
  }

  getAppearanceInformationHref(courtAppearance: CourtAppearance, _caseReferenceSet: boolean): string {
    if (this.allAppearanceInformationFilledOut(courtAppearance)) {
      return BreachJourneyUrls.checkHearingAnswers(this.urlParameters)
    }

    return JourneyUrls.reference(
      this.nomsId,
      this.addOrEditCourtCase,
      this.courtCaseReference,
      this.addOrEditCourtAppearance,
      this.appearanceReference,
    )
  }

  getOffenceSentenceTitleText(_courtAppearance: CourtAppearance): string {
    return 'Add offences'
  }

  getOffenceSentenceHref(courtAppearance: CourtAppearance): string | undefined {
    let href
    if (this.allAppearanceInformationFilledOut(courtAppearance)) {
      href = BreachJourneyUrls.addOffences(this.urlParameters)
    }
    return href
  }

  getOffenceSentenceStatus(courtAppearance: CourtAppearance): TaskListItemStatus {
    const appearanceInfoComplete = this.allAppearanceInformationFilledOut(courtAppearance)
    if (courtAppearance.offenceSentenceAccepted) {
      return {
        text: 'Completed',
      }
    }
    if (appearanceInfoComplete) {
      return {
        tag: {
          text: 'Incomplete',
          classes: 'govuk-tag--blue',
        },
      }
    }

    return {
      text: 'Cannot start yet',
      classes: 'govuk-task-list__status--cannot-start-yet',
    }
  }

  getCourtDocumentsHref(courtAppearance: CourtAppearance, documentsAvailable: boolean): string {
    let href
    if (documentsAvailable || this.allAppearanceInformationFilledOut(courtAppearance)) {
      href = courtAppearance.uploadedDocuments?.length
        ? BreachJourneyUrls.viewBreachOrder(this.urlParameters)
        : BreachJourneyUrls.uploadBreachOrder(this.urlParameters)
    }
    return href
  }
}
