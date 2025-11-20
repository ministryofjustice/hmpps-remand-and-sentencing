export default class journeyUrls {
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
    journeyUrls.updateOffenceOutcome(
      nomsId,
      addOrEditCourtCase,
      courtCaseUuid,
      addOrEditCourtAppearance,
      courtAppearanceUuid,
      chargeUuid,
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
