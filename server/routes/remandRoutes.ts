import { RequestHandler } from 'express'
import OffenceService from '../services/offenceService'
import BaseRoutes from './baseRoutes'
import CourtAppearanceService from '../services/courtAppearanceService'
import ManageOffencesService from '../services/manageOffencesService'

import { pageCourtCaseAppearanceToCourtAppearance } from '../utils/mappingUtils'
import RemandAndSentencingService from '../services/remandAndSentencingService'
import AppearanceOutcomeService from '../services/appearanceOutcomeService'
import CourtRegisterService from '../services/courtRegisterService'
import OffenceOutcomeService from '../services/offenceOutcomeService'

export default class RemandRoutes extends BaseRoutes {
  constructor(
    courtAppearanceService: CourtAppearanceService,
    offenceService: OffenceService,
    private readonly remandAndSentencingService: RemandAndSentencingService,
    private readonly manageOffencesService: ManageOffencesService,
    private readonly appearanceOutcomeService: AppearanceOutcomeService,
    private readonly courtRegisterService: CourtRegisterService,
    private readonly offenceOutcomeService: OffenceOutcomeService,
  ) {
    super(courtAppearanceService, offenceService)
  }

  public getAppearanceDetails: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, appearanceReference, addOrEditCourtCase, addOrEditCourtAppearance } = req.params
    const { token } = res.locals.user
    if (!this.courtAppearanceService.sessionCourtAppearanceExists(req.session, nomsId, appearanceReference)) {
      const storedAppearance = await this.remandAndSentencingService.getCourtAppearanceByAppearanceUuid(
        appearanceReference,
        token,
      )
      this.courtAppearanceService.setSessionCourtAppearance(
        req.session,
        nomsId,
        pageCourtCaseAppearanceToCourtAppearance(storedAppearance),
      )
    }

    const appearance = this.courtAppearanceService.getSessionCourtAppearance(req.session, nomsId)
    const chargeCodes = appearance.offences.map(offences => offences.offenceCode)
    const courtIds = [appearance.courtCode, appearance.nextHearingCourtCode].filter(
      courtId => courtId !== undefined && courtId !== null,
    )
    const sentenceTypeIds = appearance.offences
      .filter(offence => offence.sentence?.sentenceTypeId)
      .map(offence => offence.sentence?.sentenceTypeId)
    const offenceOutcomeIds = appearance.offences.map(offence => offence.outcomeUuid)
    const outcomePromise = appearance.appearanceOutcomeUuid
      ? this.appearanceOutcomeService
          .getOutcomeByUuid(appearance.appearanceOutcomeUuid, req.user.username)
          .then(outcome => outcome.outcomeName)
      : Promise.resolve(appearance.legacyData?.outcomeDescription ?? 'Not entered')
    const appearanceTypePromise = appearance.nextHearingTypeUuid
      ? this.remandAndSentencingService
          .getAppearanceTypeByUuid(appearance.nextHearingTypeUuid, req.user.username)
          .then(appearanceType => appearanceType.description)
      : Promise.resolve('Not entered')

    const [offenceMap, courtMap, sentenceTypeMap, overallCaseOutcome, outcomeMap, appearanceTypeDescription] =
      await Promise.all([
        this.manageOffencesService.getOffenceMap(Array.from(new Set(chargeCodes)), req.user.token),
        this.courtRegisterService.getCourtMap(Array.from(new Set(courtIds)), req.user.username),
        this.remandAndSentencingService.getSentenceTypeMap(Array.from(new Set(sentenceTypeIds)), req.user.username),
        outcomePromise,
        this.offenceOutcomeService.getOutcomeMap(Array.from(new Set(offenceOutcomeIds)), req.user.username),
        appearanceTypePromise,
      ])

    return res.render('pages/courtAppearance/appearance-details', {
      nomsId,
      courtCaseReference,
      appearanceReference,
      addOrEditCourtCase,
      addOrEditCourtAppearance,
      appearance,
      offenceMap,
      courtMap,
      sentenceTypeMap,
      overallCaseOutcome,
      outcomeMap,
      appearanceTypeDescription,
      backLink: `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/details`,
    })
  }

  public submitAppearanceDetailsEdit: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, appearanceReference, addOrEditCourtCase } = req.params
    const { token } = res.locals.user
    const { prisonId } = res.locals.prisoner
    const courtAppearance = this.courtAppearanceService.getSessionCourtAppearance(req.session, nomsId)
    await this.remandAndSentencingService.updateCourtAppearance(
      token,
      courtCaseReference,
      appearanceReference,
      courtAppearance,
      prisonId,
    )
    this.courtAppearanceService.clearSessionCourtAppearance(req.session, nomsId)
    return res.redirect(`/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/details`)
  }
}
