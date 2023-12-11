import { RequestHandler } from 'express'
import type {
  OffenceConfirmOffenceForm,
  OffenceDeleteOffenceForm,
  OffenceLookupOffenceOutcomeForm,
  OffenceOffenceCodeForm,
  OffenceOffenceDateForm,
  OffenceOffenceNameForm,
  OffenceOffenceOutcomeForm,
  ReviewOffencesForm,
} from 'forms'
import dayjs from 'dayjs'
import trimForm from '../utils/trim'
import OffenceService from '../services/offenceService'
import ManageOffencesService from '../services/manageOffencesService'
import CourtAppearanceService from '../services/courtAppearanceService'
import CourtCaseService from '../services/courtCaseService'

export default class OffenceRoutes {
  constructor(
    private readonly offenceService: OffenceService,
    private readonly manageOffencesService: ManageOffencesService,
    private readonly courtAppearanceService: CourtAppearanceService,
    private readonly courtCaseService: CourtCaseService,
  ) {}

  public getOffenceDate: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, offenceReference, appearanceReference } = req.params
    return res.render('pages/offence/offence-date', {
      nomsId,
      courtCaseReference,
      offenceReference,
      appearanceReference,
    })
  }

  public submitOffenceDate: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, offenceReference, appearanceReference } = req.params
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
    const caseOutcomeAppliedAll = this.courtAppearanceService.getCaseOutcomeAppliedAll(
      req.session,
      nomsId,
      courtCaseReference,
    )
    if (caseOutcomeAppliedAll) {
      this.offenceService.setOffenceOutcome(
        req.session,
        nomsId,
        courtCaseReference,
        this.courtAppearanceService.getOverallCaseOutcome(req.session, nomsId, courtCaseReference),
      )
      this.saveOffenceInAppearance(req, nomsId, courtCaseReference, offenceReference)
      return res.redirect(
        `/person/${nomsId}/court-cases/${courtCaseReference}/appearance/${appearanceReference}/offences/check-offence-answers`,
      )
    }
    // redirect to outcome for offence or check answers offence page
    return res.redirect(
      `/person/${nomsId}/court-cases/${courtCaseReference}/appearance/${appearanceReference}/offences/${offenceReference}/offence-outcome`,
    )
  }

  public getOffenceOutcome: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, offenceReference, appearanceReference } = req.params
    const offenceOutcome = this.offenceService.getOffenceOutcome(req.session, nomsId, courtCaseReference)
    return res.render('pages/offence/offence-outcome', {
      nomsId,
      courtCaseReference,
      offenceOutcome,
      offenceReference,
      appearanceReference,
    })
  }

  public submitOffenceOutcome: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, offenceReference, appearanceReference } = req.params
    const offenceOutcomeForm = trimForm<OffenceOffenceOutcomeForm>(req.body)
    if (offenceOutcomeForm.offenceOutcome === 'LOOKUPDIFFERENT') {
      return res.redirect(
        `/person/${nomsId}/court-cases/${courtCaseReference}/appearance/${appearanceReference}/offences/${offenceReference}/lookup-offence-outcome`,
      )
    }
    this.offenceService.setOffenceOutcome(req.session, nomsId, courtCaseReference, offenceOutcomeForm.offenceOutcome)
    this.saveOffenceInAppearance(req, nomsId, courtCaseReference, offenceReference)
    return res.redirect(
      `/person/${nomsId}/court-cases/${courtCaseReference}/appearance/${appearanceReference}/offences/check-offence-answers`,
    )
  }

  public getLookupOffenceOutcome: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, offenceReference, appearanceReference } = req.params
    const offenceOutcome = this.offenceService.getOffenceOutcome(req.session, nomsId, courtCaseReference)
    return res.render('pages/offence/lookup-offence-outcome', {
      nomsId,
      courtCaseReference,
      offenceOutcome,
      offenceReference,
      appearanceReference,
    })
  }

  public submitLookupOffenceOutcome: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, offenceReference, appearanceReference } = req.params
    const lookupOffenceOutcomeForm = trimForm<OffenceLookupOffenceOutcomeForm>(req.body)
    this.offenceService.setOffenceOutcome(
      req.session,
      nomsId,
      courtCaseReference,
      lookupOffenceOutcomeForm.offenceOutcome,
    )
    this.saveOffenceInAppearance(req, nomsId, courtCaseReference, offenceReference)
    return res.redirect(
      `/person/${nomsId}/court-cases/${courtCaseReference}/appearance/${appearanceReference}/offences/check-offence-answers`,
    )
  }

  public getOffenceCode: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, offenceReference, appearanceReference } = req.params
    return res.render('pages/offence/offence-code', {
      nomsId,
      courtCaseReference,
      offenceReference,
      appearanceReference,
    })
  }

  public submitOffenceCode: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, offenceReference, appearanceReference } = req.params
    const offenceCodeForm = trimForm<OffenceOffenceCodeForm>(req.body)

    if (offenceCodeForm.unknownCode) {
      return res.redirect(
        `/person/${nomsId}/court-cases/${courtCaseReference}/appearance/${appearanceReference}/offences/${offenceReference}/offence-name`,
      )
    }

    this.offenceService.setOffenceCode(req.session, nomsId, courtCaseReference, offenceCodeForm.offenceCode)

    return res.redirect(
      `/person/${nomsId}/court-cases/${courtCaseReference}/appearance/${appearanceReference}/offences/${offenceReference}/confirm-offence-code`,
    )
  }

  public getOffenceName: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, offenceReference, appearanceReference } = req.params
    return res.render('pages/offence/offence-name', {
      nomsId,
      courtCaseReference,
      offenceReference,
      appearanceReference,
    })
  }

  public submitOffenceName: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, offenceReference, appearanceReference } = req.params
    const offenceNameForm = trimForm<OffenceOffenceNameForm>(req.body)
    const [offenceCode, ...offenceNames] = offenceNameForm.offenceName.split(' ')
    const offenceName = offenceNames.join(' ')

    this.offenceService.setOffenceCode(req.session, nomsId, courtCaseReference, offenceCode)
    this.offenceService.setOffenceName(req.session, nomsId, courtCaseReference, offenceName)

    return res.redirect(
      `/person/${nomsId}/court-cases/${courtCaseReference}/appearance/${appearanceReference}/offences/${offenceReference}/offence-date`,
    )
  }

  public getConfirmOffenceCode: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, offenceReference, appearanceReference } = req.params
    const offence = await this.manageOffencesService.getOffenceByCode(
      this.offenceService.getOffenceCode(req.session, nomsId, courtCaseReference),
      req.user.token,
    )
    return res.render('pages/offence/confirm-offence', {
      nomsId,
      courtCaseReference,
      offence,
      offenceReference,
      appearanceReference,
    })
  }

  public submitConfirmOffenceCode: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, offenceReference, appearanceReference } = req.params
    const confirmOffenceForm = trimForm<OffenceConfirmOffenceForm>(req.body)
    this.offenceService.setOffenceCode(req.session, nomsId, courtCaseReference, confirmOffenceForm.offenceCode)
    this.offenceService.setOffenceName(req.session, nomsId, courtCaseReference, confirmOffenceForm.offenceName)

    return res.redirect(
      `/person/${nomsId}/court-cases/${courtCaseReference}/appearance/${appearanceReference}/offences/${offenceReference}/offence-date`,
    )
  }

  public getCheckOffenceAnswers: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, appearanceReference } = req.params
    const courtAppearance = this.courtAppearanceService.getSessionCourtAppearance(
      req.session,
      nomsId,
      courtCaseReference,
    )
    return res.render('pages/offence/check-offence-answers', {
      nomsId,
      courtCaseReference,
      courtAppearance,
      appearanceReference,
      infoBanner: req.flash('infoBanner'),
    })
  }

  public addAnotherOffence: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, offenceReference, appearanceReference } = req.params
    this.offenceService.clearOffence(req.session, nomsId, courtCaseReference)
    return res.redirect(
      `/person/${nomsId}/court-cases/${courtCaseReference}/appearance/${appearanceReference}/offences/${offenceReference}/offence-code`,
    )
  }

  public getDeleteOffence: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, offenceReference, appearanceReference } = req.params
    const offence = this.courtAppearanceService.getOffence(
      req.session,
      nomsId,
      courtCaseReference,
      parseInt(offenceReference, 10),
    )
    return res.render('pages/offence/delete-offence', {
      nomsId,
      courtCaseReference,
      offence,
      offenceReference,
      appearanceReference,
    })
  }

  public submitDeleteOffence: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, offenceReference, appearanceReference } = req.params
    const deleteOffenceForm = trimForm<OffenceDeleteOffenceForm>(req.body)
    if (deleteOffenceForm.deleteOffence === 'true') {
      this.courtAppearanceService.deleteOffence(req.session, nomsId, courtCaseReference, parseInt(offenceReference, 10))
      req.flash('infoBanner', 'Offence deleted')
    }
    return res.redirect(
      `/person/${nomsId}/court-cases/${courtCaseReference}/appearance/${appearanceReference}/offences/check-offence-answers`,
    )
  }

  public getReviewOffences: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, appearanceReference } = req.params
    const courtAppearance = this.courtAppearanceService.getSessionCourtAppearance(
      req.session,
      nomsId,
      courtCaseReference,
    )
    const courtCaseUniqueIdentifier = this.courtCaseService.getUniqueIdentifier(req.session, nomsId, courtCaseReference)
    return res.render('pages/offence/review-offences', {
      nomsId,
      courtCaseReference,
      courtAppearance,
      appearanceReference,
      courtCaseUniqueIdentifier,
    })
  }

  public submitReviewOffences: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, appearanceReference } = req.params
    const reviewOffenceForm = trimForm<ReviewOffencesForm>(req.body)
    if (reviewOffenceForm.changeOffence === 'true') {
      return res.redirect(
        `/person/${nomsId}/court-cases/${courtCaseReference}/appearance/${appearanceReference}/offences/check-offence-answers`,
      )
    }
    return res.redirect(
      `/person/${nomsId}/court-cases/${courtCaseReference}/appearance/${appearanceReference}/next-hearing-select`,
    )
  }

  private saveOffenceInAppearance(req, nomsId: string, courtCaseReference: string, offenceReference: string) {
    const offence = this.offenceService.getSessionOffence(req.session, nomsId, courtCaseReference)
    this.courtAppearanceService.addOffence(
      req.session,
      nomsId,
      courtCaseReference,
      parseInt(offenceReference, 10),
      offence,
    )
  }
}
