import { RequestHandler } from 'express'
import createError from 'http-errors'
import type {
  OffenceConfirmOffenceForm,
  OffenceLookupOffenceOutcomeForm,
  OffenceOffenceCodeForm,
  OffenceOffenceDateForm,
  OffenceOffenceNameForm,
  OffenceOffenceOutcomeForm,
} from 'forms'
import dayjs from 'dayjs'
import CourtCaseService from '../services/courtCaseService'
import trimForm from '../utils/trim'
import OffenceService from '../services/offenceService'
import ManageOffencesService from '../services/manageOffencesService'
import CourtAppearanceService from '../services/courtAppearanceService'

export default class OffenceRoutes {
  constructor(
    private readonly courtCaseService: CourtCaseService,
    private readonly offenceService: OffenceService,
    private readonly manageOffencesService: ManageOffencesService,
    private readonly courtAppearanceService: CourtAppearanceService,
  ) {}

  public getOffenceDate: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, offenceReference } = req.params
    const courtCase = this.courtCaseService.getSessionSavedCourtCase(req.session, nomsId, courtCaseReference)
    if (courtCase) {
      return res.render('pages/offences/offence-date', {
        nomsId,
        courtCaseReference,
        courtCase,
        offenceReference,
        backLink: `/person/${nomsId}/court-cases/${courtCaseReference}/offences/${offenceReference}/confirm-offence-code`,
      })
    }
    throw createError(404, 'Not found')
  }

  public submitOffenceDate: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, offenceReference } = req.params
    const offenceDateForm = trimForm<OffenceOffenceDateForm>(req.body)
    const offenceStartDate = dayjs({
      year: offenceDateForm['offenceStartDate-year'],
      month: offenceDateForm['offenceStartDate-month'] - 1,
      day: offenceDateForm['offenceStartDate-day'],
    })
    this.offenceService.setOffenceStartDate(req.session, nomsId, courtCaseReference, offenceStartDate.toDate())

    if (
      offenceDateForm['offenceEndDate-day'] &&
      offenceDateForm['offenceEndDate-month'] &&
      offenceDateForm['offenceEndDate-year']
    ) {
      const offenceEndDate = dayjs({
        year: offenceDateForm['offenceEndDate-year'],
        month: offenceDateForm['offenceEndDate-month'] - 1,
        day: offenceDateForm['offenceEndDate-day'],
      })
      this.offenceService.setOffenceEndDate(req.session, nomsId, courtCaseReference, offenceEndDate.toDate())
    }
    const caseOutcomeAppliedAll = this.courtAppearanceService.getCaseOutcomeAppliedAll(req.session, nomsId)
    if (caseOutcomeAppliedAll) {
      this.offenceService.setOffenceOutcome(
        req.session,
        nomsId,
        courtCaseReference,
        this.courtAppearanceService.getOverallCaseOutcome(req.session, nomsId),
      )
      this.saveOffenceInAppearance(req, nomsId, offenceReference, courtCaseReference)
      return res.redirect(
        `/person/${nomsId}/court-cases/${courtCaseReference}/offences/${offenceReference}/check-offence-answers`,
      )
    }
    // redirect to outcome for offence or check answers offence page
    return res.redirect(
      `/person/${nomsId}/court-cases/${courtCaseReference}/offences/${offenceReference}/offence-outcome`,
    )
  }

  public getOffenceOutcome: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, offenceReference } = req.params
    const courtCase = this.courtCaseService.getSessionSavedCourtCase(req.session, nomsId, courtCaseReference)
    if (courtCase) {
      const offenceOutcome = this.offenceService.getOffenceOutcome(req.session, nomsId, courtCaseReference)
      return res.render('pages/offences/offence-outcome', {
        nomsId,
        courtCaseReference,
        courtCase,
        offenceOutcome,
        offenceReference,
        backLink: `/person/${nomsId}/court-cases/${courtCaseReference}/offences/${offenceReference}/offence-date`,
      })
    }
    throw createError(404, 'Not found')
  }

  public submitOffenceOutcome: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, offenceReference } = req.params
    const offenceOutcomeForm = trimForm<OffenceOffenceOutcomeForm>(req.body)
    if (offenceOutcomeForm.offenceOutcome === 'LOOKUPDIFFERENT') {
      return res.redirect(
        `/person/${nomsId}/court-cases/${courtCaseReference}/offences/${offenceReference}/lookup-offence-outcome`,
      )
    }
    this.offenceService.setOffenceOutcome(req.session, nomsId, courtCaseReference, offenceOutcomeForm.offenceOutcome)
    this.saveOffenceInAppearance(req, nomsId, offenceReference, courtCaseReference)
    return res.redirect(
      `/person/${nomsId}/court-cases/${courtCaseReference}/offences/${offenceReference}/check-offence-answers`,
    )
  }

  public getLookupOffenceOutcome: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, offenceReference } = req.params
    const courtCase = this.courtCaseService.getSessionSavedCourtCase(req.session, nomsId, courtCaseReference)
    if (courtCase) {
      const offenceOutcome = this.offenceService.getOffenceOutcome(req.session, nomsId, courtCaseReference)
      return res.render('pages/offences/lookup-offence-outcome', {
        nomsId,
        courtCaseReference,
        courtCase,
        offenceOutcome,
        offenceReference,
        backLink: `/person/${nomsId}/court-cases/${courtCaseReference}/offences/${offenceReference}/offence-outcome`,
      })
    }
    throw createError(404, 'Not found')
  }

  public submitLookupOffenceOutcome: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, offenceReference } = req.params
    const lookupOffenceOutcomeForm = trimForm<OffenceLookupOffenceOutcomeForm>(req.body)
    this.offenceService.setOffenceOutcome(
      req.session,
      nomsId,
      courtCaseReference,
      lookupOffenceOutcomeForm.offenceOutcome,
    )
    this.saveOffenceInAppearance(req, nomsId, offenceReference, courtCaseReference)
    return res.redirect(
      `/person/${nomsId}/court-cases/${courtCaseReference}/offences/${offenceReference}/check-offence-answers`,
    )
  }

  public getOffenceCode: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, offenceReference } = req.params
    const courtCase = this.courtCaseService.getSessionSavedCourtCase(req.session, nomsId, courtCaseReference)
    if (courtCase) {
      return res.render('pages/offences/offence-code', {
        nomsId,
        courtCaseReference,
        courtCase,
        offenceReference,
        backLink: `/person/${nomsId}/court-cases/check-answers`,
      })
    }
    throw createError(404, 'Not found')
  }

  public submitOffenceCode: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, offenceReference } = req.params
    const offenceCodeForm = trimForm<OffenceOffenceCodeForm>(req.body)

    if (offenceCodeForm.unknownCode) {
      return res.redirect(
        `/person/${nomsId}/court-cases/${courtCaseReference}/offences/${offenceReference}/offence-name`,
      )
    }

    this.offenceService.setOffenceCode(req.session, nomsId, courtCaseReference, offenceCodeForm.offenceCode)

    return res.redirect(
      `/person/${nomsId}/court-cases/${courtCaseReference}/offences/${offenceReference}/confirm-offence-code`,
    )
  }

  public getOffenceName: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, offenceReference } = req.params
    const courtCase = this.courtCaseService.getSessionSavedCourtCase(req.session, nomsId, courtCaseReference)
    if (courtCase) {
      return res.render('pages/offences/offence-name', {
        nomsId,
        courtCaseReference,
        courtCase,
        offenceReference,
        backLink: `/person/${nomsId}/court-cases/${courtCaseReference}/offences/${offenceReference}/offence-code`,
      })
    }
    throw createError(404, 'Not found')
  }

  public submitOffenceName: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, offenceReference } = req.params
    const offenceNameForm = trimForm<OffenceOffenceNameForm>(req.body)
    const [offenceCode, ...offenceNames] = offenceNameForm.offenceName.split(' ')
    const offenceName = offenceNames.join(' ')

    this.offenceService.setOffenceCode(req.session, nomsId, courtCaseReference, offenceCode)
    this.offenceService.setOffenceName(req.session, nomsId, courtCaseReference, offenceName)

    return res.redirect(`/person/${nomsId}/court-cases/${courtCaseReference}/offences/${offenceReference}/offence-date`)
  }

  public getConfirmOffenceCode: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, offenceReference } = req.params
    const courtCase = this.courtCaseService.getSessionSavedCourtCase(req.session, nomsId, courtCaseReference)
    if (courtCase) {
      const offence = await this.manageOffencesService.getOffenceByCode(
        this.offenceService.getOffenceCode(req.session, nomsId, courtCaseReference),
        req.user.token,
      )
      return res.render('pages/offences/confirm-offence', {
        nomsId,
        courtCaseReference,
        courtCase,
        offence,
        offenceReference,
        backLink: `/person/${nomsId}/court-cases/${courtCaseReference}/offences/${offenceReference}/offence-code`,
      })
    }
    throw createError(404, 'Not found')
  }

  public submitConfirmOffenceCode: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, offenceReference } = req.params
    const confirmOffenceForm = trimForm<OffenceConfirmOffenceForm>(req.body)
    this.offenceService.setOffenceCode(req.session, nomsId, courtCaseReference, confirmOffenceForm.offenceCode)
    this.offenceService.setOffenceName(req.session, nomsId, courtCaseReference, confirmOffenceForm.offenceName)

    return res.redirect(`/person/${nomsId}/court-cases/${courtCaseReference}/offences/${offenceReference}/offence-date`)
  }

  public getCheckOffenceAnswers: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, offenceReference } = req.params
    const courtCase = this.courtCaseService.getSessionSavedCourtCase(req.session, nomsId, courtCaseReference)
    if (courtCase) {
      const courtAppearance = this.courtAppearanceService.getSessionCourtAppearance(req.session, nomsId)
      return res.render('pages/offences/check-offence-answers', {
        nomsId,
        courtCaseReference,
        courtCase,
        courtAppearance,
        offenceReference,
      })
    }
    throw createError(404, 'Not found')
  }

  public addAnotherOffence: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, offenceReference } = req.params
    this.offenceService.clearOffence(req.session, nomsId, courtCaseReference)
    return res.redirect(`/person/${nomsId}/court-cases/${courtCaseReference}/offences/${offenceReference}/offence-code`)
  }

  private saveOffenceInAppearance(req, nomsId: string, courtCaseReference: string, offenceReference: string) {
    const offence = this.offenceService.getSessionOffence(req.session, nomsId, courtCaseReference)
    this.courtAppearanceService.addOffence(req.session, nomsId, parseInt(offenceReference, 10), offence)
  }
}
