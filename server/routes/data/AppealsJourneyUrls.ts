export default class AppealsJourneyUrls {
  static taskList = (
    nomsId: string,
    addOrEditCourtCase: string,
    courtCaseUuid: string,
    addOrEditCourtAppearance: string,
    courtAppearanceUuid: string,
  ) => {
    return `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseUuid}/${addOrEditCourtAppearance}/${courtAppearanceUuid}/appeals/task-list`
  }

  static criminalOfficeReference = (
    nomsId: string,
    addOrEditCourtCase: string,
    courtCaseUuid: string,
    addOrEditCourtAppearance: string,
    courtAppearanceUuid: string,
    hasErrors?: boolean,
  ) => {
    return `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseUuid}/${addOrEditCourtAppearance}/${courtAppearanceUuid}/appeals/criminal-office-reference${hasErrors ? '?hasErrors=true' : ''}`
  }

  static appealDate = (
    nomsId: string,
    addOrEditCourtCase: string,
    courtCaseUuid: string,
    addOrEditCourtAppearance: string,
    courtAppearanceUuid: string,
    hasErrors?: boolean,
  ) => {
    return `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseUuid}/${addOrEditCourtAppearance}/${courtAppearanceUuid}/appeals/appeal-date${hasErrors ? '?hasErrors=true' : ''}`
  }

  static checkHearingAnswers = (
    nomsId: string,
    addOrEditCourtCase: string,
    courtCaseUuid: string,
    addOrEditCourtAppearance: string,
    courtAppearanceUuid: string,
  ) => {
    return `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseUuid}/${addOrEditCourtAppearance}/${courtAppearanceUuid}/appeals/check-hearing-answers`
  }

  static hearingDetails = (
    nomsId: string,
    addOrEditCourtCase: string,
    courtCaseUuid: string,
    addOrEditCourtAppearance: string,
    courtAppearanceUuid: string,
  ) => {
    return `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseUuid}/${addOrEditCourtAppearance}/${courtAppearanceUuid}/appeals/hearing-details`
  }
}
