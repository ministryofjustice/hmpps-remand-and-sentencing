import { RequestHandler } from 'express'
import createError from 'http-errors'
import type { OffenceOffenceCodeForm, OffenceOffenceDateForm } from 'forms'
import CourtCaseService from '../services/courtCaseService'
import trimForm from '../utils/trim'
import OffenceService from '../services/offenceService'
import ManageOffencesService from '../services/manageOffencesService'

export default class OffenceRoutes {
  constructor(
    private readonly courtCaseService: CourtCaseService,
    private readonly offenceService: OffenceService,
    private readonly manageOffencesService: ManageOffencesService,
  ) {}

  public getOffenceDate: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference } = req.params
    const courtCase = this.courtCaseService.getSessionSavedCourtCase(req.session, nomsId, courtCaseReference)
    if (courtCase) {
      return res.render('pages/offence/offence-date', {
        nomsId,
        courtCaseReference,
        courtCase,
        backLink: `/person/${nomsId}/court-cases/${courtCaseReference}/confirm-offence-code`,
      })
    }
    throw createError(404, 'Not found')
  }

  public submitOffenceDate: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference } = req.params
    const offenceDateForm = trimForm<OffenceOffenceDateForm>(req.body)
    const offenceStartDate = new Date(
      offenceDateForm['offenceStartDate-year'],
      offenceDateForm['offenceStartDate-month'] - 1,
      offenceDateForm['offenceStartDate-day'],
    )
    this.offenceService.setOffenceStartDate(req.session, nomsId, courtCaseReference, offenceStartDate)

    if (
      offenceDateForm['offenceEndDate-day'] &&
      offenceDateForm['offenceEndDate-month'] &&
      offenceDateForm['offenceEndDate-year']
    ) {
      const offenceEndDate = new Date(
        offenceDateForm['offenceEndDate-year'],
        offenceDateForm['offenceEndDate-month'] - 1,
        offenceDateForm['offenceEndDate-day'],
      )
      this.offenceService.setOffenceEndDate(req.session, nomsId, courtCaseReference, offenceEndDate)
    }

    return res.redirect(`/person/${nomsId}/court-cases/${courtCaseReference}/offence-code`)
  }

  public getOffenceCode: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference } = req.params
    const courtCase = this.courtCaseService.getSessionSavedCourtCase(req.session, nomsId, courtCaseReference)
    if (courtCase) {
      return res.render('pages/offence/offence-code', {
        nomsId,
        courtCaseReference,
        courtCase,
        backLink: `/person/${nomsId}/court-cases/check-answers`,
      })
    }
    throw createError(404, 'Not found')
  }

  public submitOffenceCode: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference } = req.params
    const offenceCodeForm = trimForm<OffenceOffenceCodeForm>(req.body)

    if (offenceCodeForm.unknownCode) {
      return res.redirect(`/person/${nomsId}/court-cases/${courtCaseReference}/offence-name`)
    }

    this.offenceService.setOffenceCode(req.session, nomsId, courtCaseReference, offenceCodeForm.offenceCode)

    return res.redirect(`/person/${nomsId}/court-cases/${courtCaseReference}/confirm-offence-code`)
  }

  public getConfirmOffenceCode: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference } = req.params
    const courtCase = this.courtCaseService.getSessionSavedCourtCase(req.session, nomsId, courtCaseReference)
    if (courtCase) {
      const offence = await this.manageOffencesService.getOffenceByCode(
        this.offenceService.getOffenceCode(req.session, nomsId, courtCaseReference),
        req.user.token,
      )
      return res.render('pages/offence/confirm-offence', {
        nomsId,
        courtCaseReference,
        courtCase,
        offence,
        backLink: `/person/${nomsId}/court-cases/${courtCaseReference}/offence-code`,
      })
    }
    throw createError(404, 'Not found')
  }
}
