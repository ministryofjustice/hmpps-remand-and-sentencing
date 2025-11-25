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
