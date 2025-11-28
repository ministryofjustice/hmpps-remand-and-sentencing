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

  static sentencingCourtAppearance = (
    nomsId: string,
    addOrEditCourtCase: string,
    courtCaseUuid: string,
    addOrEditCourtAppearance: string,
    courtAppearanceUuid: string,
  ) => {
    return `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseUuid}/${addOrEditCourtAppearance}/${courtAppearanceUuid}/sentencing/appearance-details`
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

  static courtCases = (nomsId: string) => {
    return `/person/${nomsId}`
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
  sentencingCourtAppearance: (
    nomsId: string,
    addOrEditCourtCase: string,
    courtCaseUuid: string,
    addOrEditCourtAppearance: string,
    courtAppearanceUuid: string,
  ) =>
    JourneyUrls.sentencingCourtAppearance(
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
  courtCases: (nomsId: string) => JourneyUrls.courtCases(nomsId),
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
