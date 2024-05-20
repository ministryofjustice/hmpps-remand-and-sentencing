import type { CourtAppearance, TaskListItem } from 'models'

export default class TaskListModel {
  items: TaskListItem[]

  nomsId: string

  addOrEditCourtCase: string

  courtCaseReference: string

  appearanceReference: string

  constructor(
    nomsId: string,
    addOrEditCourtCase: string,
    courtCaseReference: string,
    appearanceReference: string,
    courtAppearance: CourtAppearance,
  ) {
    this.nomsId = nomsId
    this.addOrEditCourtCase = addOrEditCourtCase
    this.courtCaseReference = courtCaseReference
    this.appearanceReference = appearanceReference
    this.items = [
      this.getAppearanceInformationItem(courtAppearance),
      this.getCourtDocumentsItem(),
      this.getOffenceSentencesItem(courtAppearance),
    ]
    if (courtAppearance.warrantType === 'REMAND') {
      this.items.push(this.getNextCourtAppearanceItem())
    }
  }

  private getAppearanceInformationItem(courtAppearance: CourtAppearance): TaskListItem {
    return {
      title: {
        text: 'Add appearance information',
      },
      href: this.isAddCourtCase()
        ? `/person/${this.nomsId}/${this.addOrEditCourtCase}/${this.courtCaseReference}/appearance/${this.appearanceReference}/reference`
        : `/person/${this.nomsId}/${this.addOrEditCourtCase}/${this.courtCaseReference}/appearance/${this.appearanceReference}/select-reference`,
      status: this.getAppearanceInformationStatus(courtAppearance),
    }
  }

  private getAppearanceInformationStatus(courtAppearance: CourtAppearance) {
    if (this.allAppearanceInformationFilledOut(courtAppearance)) {
      return {
        text: 'Completed',
      }
    }
    if (this.someAppearanceInformationFilledOut(courtAppearance)) {
      return {
        text: 'In progress',
        classes: 'govuk-tag--light-blue',
      }
    }
    return {
      text: 'Incomplete',
      classes: 'govuk-tag--blue',
    }
  }

  private allAppearanceInformationFilledOut(courtAppearance: CourtAppearance): boolean {
    return (
      courtAppearance.caseReferenceNumber &&
      courtAppearance.warrantDate &&
      courtAppearance.courtName &&
      courtAppearance.overallCaseOutcome &&
      courtAppearance.caseOutcomeAppliedAll &&
      (courtAppearance.taggedBail !== undefined || courtAppearance.hasTaggedBail !== undefined) &&
      courtAppearance.appearanceInformationAccepted
    )
  }

  private someAppearanceInformationFilledOut(courtAppearance: CourtAppearance): boolean {
    return (
      courtAppearance.caseReferenceNumber !== undefined ||
      courtAppearance.warrantDate !== undefined ||
      courtAppearance.courtName !== undefined ||
      courtAppearance.overallCaseOutcome !== undefined ||
      courtAppearance.caseOutcomeAppliedAll !== undefined ||
      courtAppearance.taggedBail !== undefined ||
      courtAppearance.hasTaggedBail !== undefined ||
      courtAppearance.appearanceInformationAccepted
    )
  }

  private getCourtDocumentsItem(): TaskListItem {
    return {
      title: {
        text: 'Court documents',
      },
      href: `/person/${this.nomsId}/${this.addOrEditCourtCase}/${this.courtCaseReference}/appearance/${this.appearanceReference}/document-type`,
      status: {
        text: 'Ignore status',
      },
    }
  }

  private getOffenceSentencesItem(courtAppearance: CourtAppearance): TaskListItem {
    return {
      title: {
        text: courtAppearance.warrantType === 'SENTENCING' ? 'Sentences' : 'Offences',
      },
      href: `/person/${this.nomsId}/${this.addOrEditCourtCase}/${this.courtCaseReference}/appearance/${this.appearanceReference}/offences/check-offence-answers`,
      status: {
        text: 'Ignore status',
      },
    }
  }

  private getNextCourtAppearanceItem(): TaskListItem {
    return {
      title: {
        text: 'Next court appearance',
      },
      href: `/person/${this.nomsId}/${this.addOrEditCourtCase}/${this.courtCaseReference}/appearance/${this.appearanceReference}/next-hearing-select`,
      status: {
        text: 'Ignore status',
      },
    }
  }

  private isAddCourtCase(): boolean {
    return this.addOrEditCourtCase === 'add-court-case'
  }
}
