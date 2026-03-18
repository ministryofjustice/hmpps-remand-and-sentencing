export default class ReplicateOffenceJourneyUrls {
  static isOffenceDateSame = (
    nomsId: string,
    addOrEditCourtCase: string,
    courtCaseUuid: string,
    addOrEditCourtAppearance: string,
    courtAppearanceUuid: string,
    chargeUuid: string,
    hasErrors?: boolean,
  ) => {
    return `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseUuid}/${addOrEditCourtAppearance}/${courtAppearanceUuid}/offences/${chargeUuid}/is-offence-date-same${hasErrors ? '?hasErrors' : ''}`
  }

  static replicateOffenceOutcome = (
    nomsId: string,
    addOrEditCourtCase: string,
    courtCaseUuid: string,
    addOrEditCourtAppearance: string,
    courtAppearanceUuid: string,
    chargeUuid: string,
    hasErrors?: boolean,
  ) => {
    return `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseUuid}/${addOrEditCourtAppearance}/${courtAppearanceUuid}/offences/${chargeUuid}/replicate-offence-outcome${hasErrors ? '?hasErrors' : ''}`
  }
}
