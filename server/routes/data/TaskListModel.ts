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
    let typeSpecificInformationFilledOut = false
    if (courtAppearance.warrantType === 'SENTENCING') {
      typeSpecificInformationFilledOut = courtAppearance.overallSentenceLength !== undefined
    } else {
      typeSpecificInformationFilledOut = courtAppearance.overallCaseOutcome && courtAppearance.caseOutcomeAppliedAll
    }
    return (
      courtAppearance.caseReferenceNumber &&
      courtAppearance.warrantDate &&
      courtAppearance.courtName &&
      (courtAppearance.taggedBail !== undefined || courtAppearance.hasTaggedBail !== undefined) &&
      typeSpecificInformationFilledOut &&
      courtAppearance.appearanceInformationAccepted
    )
  }

  private someAppearanceInformationFilledOut(courtAppearance: CourtAppearance): boolean {
    let typeSpecificInformationFilledOut = false
    if (courtAppearance.warrantType === 'SENTENCING') {
      typeSpecificInformationFilledOut = courtAppearance.overallSentenceLength !== undefined
    } else {
      typeSpecificInformationFilledOut =
        courtAppearance.overallCaseOutcome !== undefined || courtAppearance.caseOutcomeAppliedAll !== undefined
    }
    return (
      courtAppearance.caseReferenceNumber !== undefined ||
      courtAppearance.warrantDate !== undefined ||
      courtAppearance.courtName !== undefined ||
      courtAppearance.taggedBail !== undefined ||
      courtAppearance.hasTaggedBail !== undefined ||
      typeSpecificInformationFilledOut ||
      courtAppearance.appearanceInformationAccepted
    )
  }

  private getCourtDocumentsItem(): TaskListItem {
    return {
      title: {
        text: 'Upload court documents',
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
        text: this.getOffenceSentenceTitleText(courtAppearance),
      },
      href: this.getOffenceSentenceHref(courtAppearance),
      status: this.getOffenceSentenceStatus(courtAppearance),
    }
  }

  private getOffenceSentenceTitleText(courtAppearance: CourtAppearance): string {
    let titleText = 'Add Offences'
    if (this.isAddCourtCase()) {
      if (courtAppearance.warrantType === 'SENTENCING') {
        titleText = 'Add Sentences'
      }
    } else if (courtAppearance.warrantType === 'SENTENCING') {
      titleText = 'Review offences and sentences'
    } else {
      titleText = 'Review offences'
    }
    return titleText
  }

  private getOffenceSentenceHref(courtAppearance: CourtAppearance): string {
    let href
    if (this.isAddCourtCase()) {
      if (this.allAppearanceInformationFilledOut(courtAppearance)) {
        href = `/person/${this.nomsId}/${this.addOrEditCourtCase}/${this.courtCaseReference}/appearance/${this.appearanceReference}/offences/check-offence-answers`
      }
    } else if (courtAppearance.warrantType === 'REMAND' || this.allAppearanceInformationFilledOut(courtAppearance)) {
      href = `/person/${this.nomsId}/${this.addOrEditCourtCase}/${this.courtCaseReference}/appearance/${this.appearanceReference}/review-offences`
    }

    return href
  }

  private getOffenceSentenceStatus(courtAppearance: CourtAppearance) {
    let status
    if (this.isAddCourtCase()) {
      if (this.allAppearanceInformationFilledOut(courtAppearance)) {
        status = {
          text: 'Incomplete',
          classes: 'govuk-tag--blue',
        }
      } else {
        status = {
          text: 'Cannot start yet',
        }
      }
    } else if (courtAppearance.warrantType === 'REMAND') {
      status = {
        text: 'Optional',
        classes: 'govuk-tag--grey',
      }
    } else if (this.allAppearanceInformationFilledOut(courtAppearance)) {
      status = {
        text: 'Incomplete',
        classes: 'govuk-tag--blue',
      }
    } else {
      status = {
        text: 'Cannot start yet',
      }
    }
    return status
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
