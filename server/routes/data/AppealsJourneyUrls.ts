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

  static checkHearingAnswers = (
    nomsId: string,
    addOrEditCourtCase: string,
    courtCaseUuid: string,
    addOrEditCourtAppearance: string,
    courtAppearanceUuid: string,
  ) => {
    return `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseUuid}/${addOrEditCourtAppearance}/${courtAppearanceUuid}/appeals/check-hearing-answers`
  }
}
