import type { CourtAppearance, TaskListItem, TaskListItemStatus, UrlParameters } from 'models'
import TaskListModel from './TaskListModel'
import JourneyUrls from './JourneyUrls'
import AggravatingFactorsJourneyUrls from './AggravatingFactorsJourneyUrls'
import JudicialFindingsJourneyUrls from './JudicialFindingsJourneyUrls'
import config from '../../config'

export default class SentencingTaskListModel extends TaskListModel {
  urlParameters: UrlParameters

  constructor(urlParameters: UrlParameters, courtAppearance: CourtAppearance, caseReferenceSet: boolean) {
    super(
      urlParameters.nomsId,
      urlParameters.addOrEditCourtCase,
      urlParameters.addOrEditCourtAppearance,
      urlParameters.courtCaseReference,
      urlParameters.appearanceReference,
    )
    this.urlParameters = urlParameters
    this.items = [
      this.getAppearanceInformationItem(courtAppearance, caseReferenceSet),
      this.getWarrantInformationItem(courtAppearance),
      this.getOffenceSentencesItem(courtAppearance),
      this.getAggravatingFactorsItem(courtAppearance),
    ]
    if (config.featureToggles.judicialFindings) {
      this.items.push(this.getJudicialFindingsItem(courtAppearance))
    }
    this.items.push(this.getCourtDocumentsItem(courtAppearance))
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

  getCourtDocumentsHref(courtAppearance: CourtAppearance, documentsAvailable: boolean): string {
    let href
    if (documentsAvailable || this.allAppearanceInformationFilledOut(courtAppearance)) {
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

  getAggravatingFactorsItem(courtAppearance: CourtAppearance): TaskListItem {
    return {
      title: {
        text: 'Add aggravating factors',
        classes: 'govuk-link--no-visited-state',
      },
      href: this.getAggravatingFactorsHref(courtAppearance),
      status: this.getAggravatingFactorsStatus(courtAppearance),
    }
  }

  private getAggravatingFactorsHref(courtAppearance: CourtAppearance): string {
    let href
    if (courtAppearance.offenceSentenceAccepted) {
      href = AggravatingFactorsJourneyUrls.selectOffenceWithAggravatingFactors(
        this.nomsId,
        this.addOrEditCourtCase,
        this.courtCaseReference,
        this.addOrEditCourtAppearance,
        this.appearanceReference,
      )
    }
    if (
      courtAppearance.aggravatingFactorsAccepted ||
      courtAppearance.offences.some(offence => (offence.aggravatingFactors?.length ?? 0) > 0)
    ) {
      href = AggravatingFactorsJourneyUrls.checkAggravatingFactorsAnswers(
        this.nomsId,
        this.addOrEditCourtCase,
        this.courtCaseReference,
        this.addOrEditCourtAppearance,
        this.appearanceReference,
      )
    }
    return href
  }

  private getAggravatingFactorsStatus(courtAppearance: CourtAppearance): TaskListItemStatus {
    if (
      courtAppearance.aggravatingFactorsAccepted === false ||
      (!courtAppearance.aggravatingFactorsAccepted &&
        courtAppearance.offences.some(offence => (offence.aggravatingFactors?.length ?? 0) > 0))
    ) {
      return {
        tag: {
          text: 'Incomplete',
          classes: 'govuk-tag--blue',
        },
      }
    }
    if (courtAppearance.aggravatingFactorsAccepted) {
      return {
        text: 'Completed',
      }
    }
    if (courtAppearance.offenceSentenceAccepted !== true) {
      return {
        text: 'Cannot start yet',
        classes: 'govuk-task-list__status--cannot-start-yet',
      }
    }
    return {
      tag: {
        text: 'Optional',
        classes: 'govuk-tag--grey',
      },
    }
  }

  getJudicialFindingsItem(courtAppearance: CourtAppearance): TaskListItem {
    return {
      title: {
        text: 'Add domestic abuse judicial findings',
        classes: 'govuk-link--no-visited-state',
      },
      hint: {
        text: 'This can be found on the PCR',
      },
      href: this.getJudicialFindingsHref(courtAppearance),
      status: this.getJudicialFindingsStatus(courtAppearance),
    }
  }

  private getJudicialFindingsHref(courtAppearance: CourtAppearance): string {
    let href
    if (courtAppearance.offenceSentenceAccepted) {
      href = JudicialFindingsJourneyUrls.selectOffenceWithJudicialFindings(this.urlParameters)
    }
    if (
      courtAppearance.judicialFindingsAccepted ||
      courtAppearance.offences.some(offence => offence.findingOfDomesticAbuse)
    ) {
      href = JudicialFindingsJourneyUrls.checkAnswers(this.urlParameters)
    }
    return href
  }

  private getJudicialFindingsStatus(courtAppearance: CourtAppearance): TaskListItemStatus {
    if (courtAppearance.offenceSentenceAccepted !== true) {
      return {
        text: 'Cannot start yet',
        classes: 'govuk-task-list__status--cannot-start-yet',
      }
    }

    if (courtAppearance.judicialFindingsAccepted) {
      return {
        text: 'Completed',
      }
    }

    if (courtAppearance.offences.some(offence => offence.findingOfDomesticAbuse)) {
      return {
        tag: {
          text: 'Incomplete',
          classes: 'govuk-tag--blue',
        },
      }
    }

    return {
      tag: {
        text: 'Optional',
        classes: 'govuk-tag--grey',
      },
    }
  }
}
