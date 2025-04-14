import type { CourtAppearance, TaskListItem, TaskListItemStatus } from 'models'

export default class TaskListModel {
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
    courtAppearance: CourtAppearance,
    caseReferenceSet: boolean,
  ) {
    this.nomsId = nomsId
    this.addOrEditCourtCase = addOrEditCourtCase
    this.addOrEditCourtAppearance = addOrEditCourtAppearance
    this.courtCaseReference = courtCaseReference
    this.appearanceReference = appearanceReference
    this.items = [
      this.getAppearanceInformationItem(courtAppearance, caseReferenceSet),
      this.getOffenceSentencesItem(courtAppearance),
      this.getNextCourtAppearanceItem(courtAppearance),
      this.getCourtDocumentsItem(courtAppearance),
    ]

    // Add warrant information item only for SENTENCING warrantType
    if (courtAppearance.warrantType === 'SENTENCING') {
      this.items.splice(1, 0, this.getWarrantInformationItem(courtAppearance))
    }
  }

  private getAppearanceInformationHref(courtAppearance: CourtAppearance, caseReferenceSet: boolean): string {
    if (this.allAppearanceInformationFilledOut(courtAppearance)) {
      return `/person/${this.nomsId}/${this.addOrEditCourtCase}/${this.courtCaseReference}/${this.addOrEditCourtAppearance}/${this.appearanceReference}/check-answers`
    }
    if (this.isAddCourtCase() || !caseReferenceSet) {
      return `/person/${this.nomsId}/${this.addOrEditCourtCase}/${this.courtCaseReference}/${this.addOrEditCourtAppearance}/${this.appearanceReference}/reference`
    }
    return `/person/${this.nomsId}/${this.addOrEditCourtCase}/${this.courtCaseReference}/${this.addOrEditCourtAppearance}/${this.appearanceReference}/select-reference`
  }

  private getAppearanceInformationItem(courtAppearance: CourtAppearance, caseReferenceSet: boolean): TaskListItem {
    return {
      title: {
        text: 'Add appearance information',
        classes: 'govuk-link--no-visited-state',
      },
      href: this.getAppearanceInformationHref(courtAppearance, caseReferenceSet),
      status: this.getAppearanceInformationStatus(courtAppearance),
    }
  }

  private getAppearanceInformationStatus(courtAppearance: CourtAppearance): TaskListItemStatus {
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

  private allAppearanceInformationFilledOut(courtAppearance: CourtAppearance): boolean {
    let typeSpecificInformationFilledOut = false
    if (courtAppearance.warrantType === 'SENTENCING') {
      typeSpecificInformationFilledOut =
        courtAppearance.taggedBail !== undefined || courtAppearance.hasTaggedBail !== undefined
    } else {
      typeSpecificInformationFilledOut =
        courtAppearance.appearanceOutcomeUuid && courtAppearance.caseOutcomeAppliedAll !== undefined
    }
    return (
      courtAppearance.warrantDate &&
      courtAppearance.courtCode &&
      typeSpecificInformationFilledOut &&
      courtAppearance.appearanceInformationAccepted
    )
  }

  private anyAppearanceInformationFilledOut(courtAppearance: CourtAppearance): boolean {
    let typeSpecificInformationFilledOut = false
    if (courtAppearance.warrantType === 'SENTENCING') {
      typeSpecificInformationFilledOut =
        courtAppearance.taggedBail !== undefined || courtAppearance.hasTaggedBail !== undefined
    } else {
      typeSpecificInformationFilledOut =
        courtAppearance.appearanceOutcomeUuid !== undefined || courtAppearance.caseOutcomeAppliedAll !== undefined
    }
    return (
      courtAppearance.caseReferenceNumber !== undefined ||
      courtAppearance.warrantDate !== undefined ||
      courtAppearance.courtCode !== undefined ||
      typeSpecificInformationFilledOut ||
      courtAppearance.appearanceInformationAccepted
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
    console.log('Debugging allWarrantInformationFilledOut:')
    console.log('overallSentenceLength:', courtAppearance.overallSentenceLength)
    console.log('overallConvictionDateAppliedAll:', courtAppearance.overallConvictionDateAppliedAll)
    console.log('caseOutcomeAppliedAll:', courtAppearance.caseOutcomeAppliedAll)
    console.log('warrantInformationAccepted:', courtAppearance.warrantInformationAccepted)
    return (
      // courtAppearance.overallSentenceLength && TODO doesnt check this because it gets deleted if set to NO.. nit sure why but leave it
      courtAppearance.overallConvictionDateAppliedAll && // Is the conviction date the same for all offences on the warrant
      courtAppearance.caseOutcomeAppliedAll && // Is the outcome the same for all offences on the warrant?
      courtAppearance.warrantInformationAccepted
    )
  }

  private anyWarrantInformationFilledOut(courtAppearance: CourtAppearance): boolean {
    return (
      // TODO why !== undefined instead of just ! (copied from other similar methods but double check)
      // TODO these weren't in the original check so do we need to check?
      courtAppearance.overallSentenceLength !== undefined ||
      courtAppearance.overallConvictionDateAppliedAll !== undefined ||
      courtAppearance.caseOutcomeAppliedAll !== undefined ||
      courtAppearance.warrantInformationAccepted
    )
  }

  private warrantInformationFilledOut(courtAppearance: CourtAppearance): boolean {
    return (
      // courtAppearance.overallSentenceLength !== undefined && TODO doesnt check this because it gets deleted if set to NO.. nit sure why but leave it
      courtAppearance.overallConvictionDateAppliedAll !== undefined &&
      courtAppearance.caseOutcomeAppliedAll !== undefined
    )
  }

  private getWarrantInformationHref(courtAppearance: CourtAppearance): string {
    let href
    if (this.allAppearanceInformationFilledOut(courtAppearance)) {
      //  TODO code improvement.. could be improved? combine ifs just one if else
      if (this.warrantInformationFilledOut(courtAppearance)) {
        if (this.isAddCourtCase()) {
          href = `/person/${this.nomsId}/${this.addOrEditCourtCase}/${this.courtCaseReference}/${this.addOrEditCourtAppearance}/${this.appearanceReference}/SENTENCING/check-overall-answers`
        } else {
          href = `/person/${this.nomsId}/${this.addOrEditCourtCase}/${this.courtCaseReference}/${this.addOrEditCourtAppearance}/${this.appearanceReference}/SENTENCING/overall-sentence-length`
        }
      } else {
        // Tested
        href = `/person/${this.nomsId}/${this.addOrEditCourtCase}/${this.courtCaseReference}/${this.addOrEditCourtAppearance}/${this.appearanceReference}/SENTENCING/overall-sentence-length`
      }
    }
    return href
  }

  private XXgetWarrantInformationHref(courtAppearance: CourtAppearance): string {
    if (this.allWarrantInformationFilledOut(courtAppearance)) {
      // TODO check what this is and should be - TODO new route to create for this
      return `/person/${this.nomsId}/${this.addOrEditCourtCase}/${this.courtCaseReference}/${this.addOrEditCourtAppearance}/${this.appearanceReference}/SENTENCING/check-answers`
    }
    return `/person/${this.nomsId}/${this.addOrEditCourtCase}/${this.courtCaseReference}/${this.addOrEditCourtAppearance}/${this.appearanceReference}/SENTENCING/overall-sentence-length`
  }

  private getWarrantInformationItem(courtAppearance: CourtAppearance): TaskListItem {
    return {
      title: {
        text: 'Add warrant information',
        classes: 'govuk-link--no-visited-state',
      },
      href: this.getWarrantInformationHref(courtAppearance),
      status: this.getWarrantInformationStatus(courtAppearance),
    }
  }

  // TODO CHECK THE USAGE ON THIS POSSIBLY NEEDS REFACTORING
  private offenceOverallFieldsFilledOut(courtAppearance: CourtAppearance): boolean {
    return (
      courtAppearance.overallConvictionDate !== undefined &&
      courtAppearance.overallConvictionDateAppliedAll !== undefined &&
      courtAppearance.overallSentenceLength !== undefined
    )
  }

  private getCourtDocumentsItem(courtAppearance: CourtAppearance): TaskListItem {
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

    return {
      title: {
        text: 'Upload court documents',
        classes: 'govuk-link--no-visited-state',
      },
      href: this.allWarrantInformationFilledOut(courtAppearance)
        ? `/person/${this.nomsId}/${this.addOrEditCourtCase}/${this.courtCaseReference}/${this.addOrEditCourtAppearance}/${this.appearanceReference}/document-type`
        : null,
      status,
    }
  }

  private getOffenceSentencesItem(courtAppearance: CourtAppearance): TaskListItem {
    return {
      title: {
        text: this.getOffenceSentenceTitleText(courtAppearance),
        classes: 'govuk-link--no-visited-state',
      },
      href: this.getOffenceSentenceHref(courtAppearance),
      status: this.getOffenceSentenceStatus(courtAppearance),
    }
  }

  private getOffenceSentenceTitleText(courtAppearance: CourtAppearance): string {
    if (this.isAddCourtCase()) {
      return 'Add offences'
    }
    if (courtAppearance.warrantType === 'SENTENCING') {
      return 'Update offence outcomes'
    }

    return 'Review offences'
  }

  private getOffenceSentenceHref(courtAppearance: CourtAppearance): string {
    let href
    if (this.allAppearanceInformationFilledOut(courtAppearance)) {
      if (courtAppearance.warrantType === 'REMAND') {
        if (courtAppearance.offences.length === 0) {
          href = `/person/${this.nomsId}/${this.addOrEditCourtCase}/${this.courtCaseReference}/${this.addOrEditCourtAppearance}/${this.appearanceReference}/offences/0/add-another-offence`
        } else if (this.isAddCourtCase()) {
          href = `/person/${this.nomsId}/${this.addOrEditCourtCase}/${this.courtCaseReference}/${this.addOrEditCourtAppearance}/${this.appearanceReference}/offences/check-offence-answers`
        } else {
          href = `/person/${this.nomsId}/${this.addOrEditCourtCase}/${this.courtCaseReference}/${this.addOrEditCourtAppearance}/${this.appearanceReference}/review-offences`
        }
      } else if (this.warrantInformationFilledOut(courtAppearance)) {
        if (this.isAddCourtCase()) {
          href = `/person/${this.nomsId}/${this.addOrEditCourtCase}/${this.courtCaseReference}/${this.addOrEditCourtAppearance}/${this.appearanceReference}/offences/check-offence-answers`
        } else {
          href = `/person/${this.nomsId}/${this.addOrEditCourtCase}/${this.courtCaseReference}/${this.addOrEditCourtAppearance}/${this.appearanceReference}/update-offence-outcomes`
        }
      }
    }

    return href
  }

  private getOffenceSentenceStatus(courtAppearance: CourtAppearance): TaskListItemStatus {
    const warrantInformationComplete = this.allWarrantInformationFilledOut(courtAppearance)
    let status

    if (!this.allWarrantInformationFilledOut(courtAppearance)) {
      return {
        text: 'Cannot start yet',
        classes: 'govuk-task-list__status--cannot-start-yet',
      }
    }

    // TODO refactor how this is set or maybe ok?
    if (courtAppearance.offenceSentenceAccepted) {
      status = {
        text: 'Completed',
      }
    } else if (warrantInformationComplete) {
      if (
        !this.isAddCourtCase() &&
        courtAppearance.warrantType === 'REMAND' &&
        courtAppearance.caseOutcomeAppliedAll === 'true'
      ) {
        status = {
          tag: {
            text: 'Optional',
            classes: 'govuk-tag--grey',
          },
        }
      } else {
        status = {
          tag: {
            text: 'Incomplete',
            classes: 'govuk-tag--blue',
          },
        }
      }
    }

    return status
  }

  private getNextCourtAppearanceItem(courtAppearance: CourtAppearance): TaskListItem {
    return {
      title: {
        text: this.getNextCourtAppearanceTitleText(),
        classes: 'govuk-link--no-visited-state',
      },
      href: this.allWarrantInformationFilledOut(courtAppearance)
        ? this.getNextCourtAppearanceHref(courtAppearance)
        : null,
      status: this.getNextCourtAppearanceStatus(courtAppearance),
    }
  }

  private getNextCourtAppearanceTitleText(): string {
    return 'Add next court appearance'
  }

  private getNextCourtAppearanceHref(courtAppearance: CourtAppearance): string {
    if (!this.allAppearanceInformationFilledOut(courtAppearance)) {
      return null
    }
    let href = `/person/${this.nomsId}/${this.addOrEditCourtCase}/${this.courtCaseReference}/${this.addOrEditCourtAppearance}/${this.appearanceReference}/next-hearing-select`
    if (courtAppearance.nextCourtAppearanceAccepted) {
      href = `/person/${this.nomsId}/${this.addOrEditCourtCase}/${this.courtCaseReference}/${this.addOrEditCourtAppearance}/${this.appearanceReference}/check-next-hearing-answers`
    }
    return href
  }

  private getNextCourtAppearanceStatus(courtAppearance: CourtAppearance): TaskListItemStatus {
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
    } else if (courtAppearance.nextCourtAppearanceAccepted) {
      status = {
        text: 'Completed',
      }
    }

    return status
  }

  private isAddCourtCase(): boolean {
    return this.addOrEditCourtCase === 'add-court-case'
  }

  isAllMandatoryItemsComplete(): boolean {
    return this.items
      .map(item => item.status.text ?? item.status.tag.text)
      .filter(status => status !== 'Optional')
      .every(status => status === 'Completed')
  }

  isAppearanceInformationComplete(): boolean {
    return this.items
      .filter(item => item.title.text.includes('appearance information'))
      .every(item => {
        if (item.status.tag) {
          return item.status.tag.text === 'Completed'
        }

        return item.status.text === 'Completed'
      })
  }
}
