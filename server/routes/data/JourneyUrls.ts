export default class JourneyUrls {
  static updateOffenceOutcome = (
    nomsId: string,
    addOrEditCourtCase: string,
    courtCaseUuid: string,
    addOrEditCourtAppearance: string,
    courtAppearanceUuid: string,
    chargeUuid: string,
  ) => {
    return `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseUuid}/${addOrEditCourtAppearance}/${courtAppearanceUuid}/offences/${chargeUuid}/update-offence-outcome`
  }

  static sentencingHearing = (
    nomsId: string,
    addOrEditCourtCase: string,
    courtCaseUuid: string,
    addOrEditCourtAppearance: string,
    courtAppearanceUuid: string,
  ) => {
    return `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseUuid}/${addOrEditCourtAppearance}/${courtAppearanceUuid}/sentencing/hearing-details`
  }

  static updateOffenceOutcomes = (
    nomsId: string,
    addOrEditCourtCase: string,
    courtCaseUuid: string,
    addOrEditCourtAppearance: string,
    courtAppearanceUuid: string,
  ) => {
    return `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseUuid}/${addOrEditCourtAppearance}/${courtAppearanceUuid}/update-offence-outcomes`
  }

  static reviewOffences = (
    nomsId: string,
    addOrEditCourtCase: string,
    courtCaseUuid: string,
    addOrEditCourtAppearance: string,
    courtAppearanceUuid: string,
  ) => {
    return `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseUuid}/${addOrEditCourtAppearance}/${courtAppearanceUuid}/review-offences`
  }

  static editOffence = (
    nomsId: string,
    addOrEditCourtCase: string,
    courtCaseUuid: string,
    addOrEditCourtAppearance: string,
    courtAppearanceUuid: string,
    chargeUuid: string,
  ) => {
    return `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseUuid}/${addOrEditCourtAppearance}/${courtAppearanceUuid}/offences/${chargeUuid}/edit-offence`
  }

  static nonSentencingHearing = (
    nomsId: string,
    addOrEditCourtCase: string,
    courtCaseUuid: string,
    addOrEditCourtAppearance: string,
    courtAppearanceUuid: string,
  ) => {
    return `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseUuid}/${addOrEditCourtAppearance}/${courtAppearanceUuid}/non-sentencing/hearing-details`
  }

  static receivedCustodialSentence = (
    nomsId: string,
    addOrEditCourtCase: string,
    courtCaseUuid: string,
    addOrEditCourtAppearance: string,
    courtAppearanceUuid: string,
  ) => {
    return `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseUuid}/${addOrEditCourtAppearance}/${courtAppearanceUuid}/received-custodial-sentence`
  }

  static selectCourtName = (
    nomsId: string,
    addOrEditCourtCase: string,
    courtCaseUuid: string,
    addOrEditCourtAppearance: string,
    courtAppearanceUuid: string,
  ) => {
    return `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseUuid}/${addOrEditCourtAppearance}/${courtAppearanceUuid}/select-court-name`
  }

  static courtName = (
    nomsId: string,
    addOrEditCourtCase: string,
    courtCaseUuid: string,
    addOrEditCourtAppearance: string,
    courtAppearanceUuid: string,
  ) => {
    return `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseUuid}/${addOrEditCourtAppearance}/${courtAppearanceUuid}/court-name`
  }

  static checkAppearanceAnswers = (
    nomsId: string,
    addOrEditCourtCase: string,
    courtCaseUuid: string,
    addOrEditCourtAppearance: string,
    courtAppearanceUuid: string,
  ) => {
    return `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseUuid}/${addOrEditCourtAppearance}/${courtAppearanceUuid}/check-answers`
  }

  static taskList = (
    nomsId: string,
    addOrEditCourtCase: string,
    courtCaseUuid: string,
    addOrEditCourtAppearance: string,
    courtAppearanceUuid: string,
  ) => {
    return `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseUuid}/${addOrEditCourtAppearance}/${courtAppearanceUuid}/task-list`
  }

  static courtCases = (nomsId: string) => {
    return `/person/${nomsId}`
  }

  static sentenceType = (
    nomsId: string,
    addOrEditCourtCase: string,
    courtCaseUuid: string,
    addOrEditCourtAppearance: string,
    courtAppearanceUuid: string,
    chargeUuid: string,
    submitToEditOffence?: boolean,
  ) => {
    return `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseUuid}/${addOrEditCourtAppearance}/${courtAppearanceUuid}/offences/${chargeUuid}/sentence-type?submitToEditOffence=${submitToEditOffence}`
  }
}

export const urlMapByName = {
  updateOffenceOutcome: (
    nomsId: string,
    addOrEditCourtCase: string,
    courtCaseUuid: string,
    addOrEditCourtAppearance: string,
    courtAppearanceUuid: string,
    chargeUuid: string,
  ) =>
    JourneyUrls.updateOffenceOutcome(
      nomsId,
      addOrEditCourtCase,
      courtCaseUuid,
      addOrEditCourtAppearance,
      courtAppearanceUuid,
      chargeUuid,
    ),
  sentencingHearing: (
    nomsId: string,
    addOrEditCourtCase: string,
    courtCaseUuid: string,
    addOrEditCourtAppearance: string,
    courtAppearanceUuid: string,
  ) =>
    JourneyUrls.sentencingHearing(
      nomsId,
      addOrEditCourtCase,
      courtCaseUuid,
      addOrEditCourtAppearance,
      courtAppearanceUuid,
    ),
  updateOffenceOutcomes: (
    nomsId: string,
    addOrEditCourtCase: string,
    courtCaseUuid: string,
    addOrEditCourtAppearance: string,
    courtAppearanceUuid: string,
  ) =>
    JourneyUrls.updateOffenceOutcomes(
      nomsId,
      addOrEditCourtCase,
      courtCaseUuid,
      addOrEditCourtAppearance,
      courtAppearanceUuid,
    ),
  reviewOffences: (
    nomsId: string,
    addOrEditCourtCase: string,
    courtCaseUuid: string,
    addOrEditCourtAppearance: string,
    courtAppearanceUuid: string,
  ) =>
    JourneyUrls.reviewOffences(
      nomsId,
      addOrEditCourtCase,
      courtCaseUuid,
      addOrEditCourtAppearance,
      courtAppearanceUuid,
    ),
  editOffence: (
    nomsId: string,
    addOrEditCourtCase: string,
    courtCaseUuid: string,
    addOrEditCourtAppearance: string,
    courtAppearanceUuid: string,
    chargeUuid: string,
  ) =>
    JourneyUrls.editOffence(
      nomsId,
      addOrEditCourtCase,
      courtCaseUuid,
      addOrEditCourtAppearance,
      courtAppearanceUuid,
      chargeUuid,
    ),
  nonSentencingHearing: (
    nomsId: string,
    addOrEditCourtCase: string,
    courtCaseUuid: string,
    addOrEditCourtAppearance: string,
    courtAppearanceUuid: string,
  ) =>
    JourneyUrls.nonSentencingHearing(
      nomsId,
      addOrEditCourtCase,
      courtCaseUuid,
      addOrEditCourtAppearance,
      courtAppearanceUuid,
    ),
  receivedCustodialSentence: (
    nomsId: string,
    addOrEditCourtCase: string,
    courtCaseUuid: string,
    addOrEditCourtAppearance: string,
    courtAppearanceUuid: string,
  ) =>
    JourneyUrls.receivedCustodialSentence(
      nomsId,
      addOrEditCourtCase,
      courtCaseUuid,
      addOrEditCourtAppearance,
      courtAppearanceUuid,
    ),
  selectCourtName: (
    nomsId: string,
    addOrEditCourtCase: string,
    courtCaseUuid: string,
    addOrEditCourtAppearance: string,
    courtAppearanceUuid: string,
  ) =>
    JourneyUrls.selectCourtName(
      nomsId,
      addOrEditCourtCase,
      courtCaseUuid,
      addOrEditCourtAppearance,
      courtAppearanceUuid,
    ),
  courtName: (
    nomsId: string,
    addOrEditCourtCase: string,
    courtCaseUuid: string,
    addOrEditCourtAppearance: string,
    courtAppearanceUuid: string,
  ) => JourneyUrls.courtName(nomsId, addOrEditCourtCase, courtCaseUuid, addOrEditCourtAppearance, courtAppearanceUuid),
  checkAppearanceAnswers: (
    nomsId: string,
    addOrEditCourtCase: string,
    courtCaseUuid: string,
    addOrEditCourtAppearance: string,
    courtAppearanceUuid: string,
  ) =>
    JourneyUrls.checkAppearanceAnswers(
      nomsId,
      addOrEditCourtCase,
      courtCaseUuid,
      addOrEditCourtAppearance,
      courtAppearanceUuid,
    ),
  taskList: (
    nomsId: string,
    addOrEditCourtCase: string,
    courtCaseUuid: string,
    addOrEditCourtAppearance: string,
    courtAppearanceUuid: string,
  ) => JourneyUrls.taskList(nomsId, addOrEditCourtCase, courtCaseUuid, addOrEditCourtAppearance, courtAppearanceUuid),
  courtCases: (nomsId: string) => JourneyUrls.courtCases(nomsId),
  sentenceType: (
    nomsId: string,
    addOrEditCourtCase: string,
    courtCaseUuid: string,
    addOrEditCourtAppearance: string,
    courtAppearanceUuid: string,
    chargeUuid: string,
    submitToEditOffence?: boolean,
  ) =>
    JourneyUrls.sentenceType(
      nomsId,
      addOrEditCourtCase,
      courtCaseUuid,
      addOrEditCourtAppearance,
      courtAppearanceUuid,
      chargeUuid,
      submitToEditOffence,
    ),
}

export type ReturnKey = keyof typeof urlMapByName

export const buildReturnUrlFromKey = (
  key: string,
  nomsId: string,
  addOrEditCourtCase: string,
  courtCaseUuid: string,
  addOrEditCourtAppearance: string,
  courtAppearanceUuid: string,
  chargeUuid: string,
): string | undefined => {
  const createUrlFunction = urlMapByName[key as ReturnKey]
  if (createUrlFunction) {
    return createUrlFunction(
      nomsId,
      addOrEditCourtCase,
      courtCaseUuid,
      addOrEditCourtAppearance,
      courtAppearanceUuid,
      chargeUuid,
    )
  }
  return undefined
}
