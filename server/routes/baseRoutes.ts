import deepmerge from 'deepmerge'
import type { Offence } from 'models'
import CourtAppearanceService from '../services/courtAppearanceService'
import OffenceService from '../services/offenceService'

export default abstract class BaseRoutes {
  courtAppearanceService: CourtAppearanceService

  offenceService: OffenceService

  constructor(courtAppearanceService: CourtAppearanceService, offenceService: OffenceService) {
    this.courtAppearanceService = courtAppearanceService
    this.offenceService = offenceService
  }

  protected isAddJourney(addOrEditCourtCase: string, addOrEditCourtAppearance: string): boolean {
    return addOrEditCourtCase === 'add-court-case' && addOrEditCourtAppearance === 'add-court-appearance'
  }

  protected isEditJourney(addOrEditCourtCase: string, addOrEditCourtAppearance: string): boolean {
    return addOrEditCourtCase === 'edit-court-case' && addOrEditCourtAppearance === 'edit-court-appearance'
  }

  protected getSessionOffenceOrAppearanceOffence(
    req,
    nomsId: string,
    courtCaseReference: string,
    offenceReference: string,
  ): Offence {
    const appearanceOffence = this.courtAppearanceService.getOffence(
      req.session,
      nomsId,
      parseInt(offenceReference, 10),
    )
    const sessionOffence = this.offenceService.getSessionOffence(req.session, nomsId, courtCaseReference)
    return deepmerge(appearanceOffence, sessionOffence, { arrayMerge: (_target, source, _options) => source })
  }

  protected saveOffenceInAppearance(
    req,
    nomsId: string,
    courtCaseReference: string,
    offenceReference: string,
    offence: Offence,
  ) {
    this.courtAppearanceService.addOffence(req.session, nomsId, parseInt(offenceReference, 10), offence)
    this.offenceService.clearOffence(req.session, nomsId, courtCaseReference)
  }

  protected saveSessionOffenceInAppearance(
    req,
    res,
    nomsId: string,
    addOrEditCourtCase: string,
    courtCaseReference: string,
    addOrEditCourtAppearance: string,
    appearanceReference: string,
    offenceReference: string,
  ) {
    const offence = this.offenceService.getSessionOffence(req.session, nomsId, courtCaseReference)
    this.saveOffenceInAppearance(req, nomsId, courtCaseReference, offenceReference, offence)
    if (this.isAddJourney(addOrEditCourtCase, addOrEditCourtAppearance)) {
      return res.redirect(
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/offences/check-offence-answers`,
      )
    }
    const warrantType = this.courtAppearanceService.getWarrantType(req.session, nomsId)
    if (this.isEditJourney(addOrEditCourtCase, addOrEditCourtAppearance)) {
      if (warrantType === 'SENTENCING') {
        return res.redirect(
          `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/sentencing/appearance-details`,
        )
      }
      return res.redirect(
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/remand/appearance-details`,
      )
    }
    if (warrantType === 'SENTENCING') {
      return res.redirect(
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/update-offence-outcomes`,
      )
    }
    return res.redirect(
      `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/review-offences`,
    )
  }
}
