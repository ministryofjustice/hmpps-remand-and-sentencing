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
import type { Offence } from 'models'
import trimForm from '../utils/trim'
import OffenceService from '../services/offenceService'
import ManageOffencesService from '../services/manageOffencesService'
import CourtAppearanceService from '../services/courtAppearanceService'
import CourtCaseService from '../services/courtCaseService'
import validate from '../validation/validation'
import OffencePersistType from '../@types/models/OffencePersistType'

export default class OffenceRoutes {
  constructor(
    private readonly offenceService: OffenceService,
    private readonly manageOffencesService: ManageOffencesService,
    private readonly courtAppearanceService: CourtAppearanceService,
    private readonly courtCaseService: CourtCaseService,
  ) {}

  public getOffenceDate: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, offenceReference, appearanceReference, addOrEditCourtCase } = req.params
    const isFirstAppearance = appearanceReference === '0'
    const courtCaseUniqueIdentifier = this.courtCaseService.getUniqueIdentifier(req.session, nomsId, courtCaseReference)
    return res.render('pages/offence/offence-date', {
      nomsId,
      courtCaseReference,
      offenceReference,
      appearanceReference,
      isFirstAppearance,
      courtCaseUniqueIdentifier,
      addOrEditCourtCase,
    })
  }

  public submitOffenceDate: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, offenceReference, appearanceReference, addOrEditCourtCase } = req.params
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
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/appearance/${appearanceReference}/offences/check-offence-answers`,
      )
    }
    // redirect to outcome for offence or check answers offence page
    return res.redirect(
      `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/appearance/${appearanceReference}/offences/${offenceReference}/offence-outcome`,
    )
  }

  public getOffenceOutcome: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, offenceReference, appearanceReference, addOrEditCourtCase } = req.params
    const offenceOutcome = this.offenceService.getOffenceOutcome(req.session, nomsId, courtCaseReference)
    const isFirstAppearance = appearanceReference === '0'
    const courtCaseUniqueIdentifier = this.courtCaseService.getUniqueIdentifier(req.session, nomsId, courtCaseReference)
    return res.render('pages/offence/offence-outcome', {
      nomsId,
      courtCaseReference,
      offenceOutcome,
      offenceReference,
      appearanceReference,
      isFirstAppearance,
      courtCaseUniqueIdentifier,
      addOrEditCourtCase,
    })
  }

  public submitOffenceOutcome: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, offenceReference, appearanceReference, addOrEditCourtCase } = req.params
    const offenceOutcomeForm = trimForm<OffenceOffenceOutcomeForm>(req.body)
    if (offenceOutcomeForm.offenceOutcome === 'LOOKUPDIFFERENT') {
      return res.redirect(
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/appearance/${appearanceReference}/offences/${offenceReference}/lookup-offence-outcome`,
      )
    }
    this.offenceService.setOffenceOutcome(req.session, nomsId, courtCaseReference, offenceOutcomeForm.offenceOutcome)
    this.saveOffenceInAppearance(req, nomsId, courtCaseReference, offenceReference)
    return res.redirect(
      `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/appearance/${appearanceReference}/offences/check-offence-answers`,
    )
  }

  public getLookupOffenceOutcome: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, offenceReference, appearanceReference, addOrEditCourtCase } = req.params
    const offenceOutcome = this.offenceService.getOffenceOutcome(req.session, nomsId, courtCaseReference)
    const isFirstAppearance = appearanceReference === '0'
    const courtCaseUniqueIdentifier = this.courtCaseService.getUniqueIdentifier(req.session, nomsId, courtCaseReference)
    return res.render('pages/offence/lookup-offence-outcome', {
      nomsId,
      courtCaseReference,
      offenceOutcome,
      offenceReference,
      appearanceReference,
      isFirstAppearance,
      courtCaseUniqueIdentifier,
      addOrEditCourtCase,
    })
  }

  public submitLookupOffenceOutcome: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, offenceReference, appearanceReference, addOrEditCourtCase } = req.params
    const lookupOffenceOutcomeForm = trimForm<OffenceLookupOffenceOutcomeForm>(req.body)
    this.offenceService.setOffenceOutcome(
      req.session,
      nomsId,
      courtCaseReference,
      lookupOffenceOutcomeForm.offenceOutcome,
    )
    this.saveOffenceInAppearance(req, nomsId, courtCaseReference, offenceReference)
    return res.redirect(
      `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/appearance/${appearanceReference}/offences/check-offence-answers`,
    )
  }

  public getOffenceCode: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, offenceReference, appearanceReference, addOrEditCourtCase } = req.params
    const isFirstAppearance = appearanceReference === '0'
    const courtCaseUniqueIdentifier = this.courtCaseService.getUniqueIdentifier(req.session, nomsId, courtCaseReference)
    return res.render('pages/offence/offence-code', {
      nomsId,
      courtCaseReference,
      offenceReference,
      appearanceReference,
      isFirstAppearance,
      courtCaseUniqueIdentifier,
      errors: req.flash('errors') || [],
      offenceCodeForm: req.flash('offenceCodeForm')[0] || {},
      addOrEditCourtCase,
    })
  }

  public submitOffenceCode: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, offenceReference, appearanceReference, addOrEditCourtCase } = req.params
    const offenceCodeForm = trimForm<OffenceOffenceCodeForm>(req.body)
    const errors = validate(
      offenceCodeForm,
      {
        offenceCode: `onlyOne:${offenceCodeForm.unknownCode ?? ''}`,
        unknownCode: `onlyOne:${offenceCodeForm.offenceCode ?? ''}`,
      },
      {
        'onlyOne.offenceCode': 'Either code or unknown must be submitted',
        'onlyOne.unknownCode': 'Either code or unknown must be submitted',
      },
    )
    if (errors.length > 0) {
      req.flash('errors', errors)
      req.flash('offenceCodeForm', { ...offenceCodeForm })
      return res.redirect(
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/appearance/${appearanceReference}/offences/${offenceReference}/offence-code`,
      )
    }
    if (offenceCodeForm.unknownCode) {
      return res.redirect(
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/appearance/${appearanceReference}/offences/${offenceReference}/offence-name`,
      )
    }

    this.offenceService.setOffenceCode(req.session, nomsId, courtCaseReference, offenceCodeForm.offenceCode)

    return res.redirect(
      `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/appearance/${appearanceReference}/offences/${offenceReference}/confirm-offence-code`,
    )
  }

  public getOffenceName: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, offenceReference, appearanceReference, addOrEditCourtCase } = req.params
    const isFirstAppearance = appearanceReference === '0'
    const courtCaseUniqueIdentifier = this.courtCaseService.getUniqueIdentifier(req.session, nomsId, courtCaseReference)
    return res.render('pages/offence/offence-name', {
      nomsId,
      courtCaseReference,
      offenceReference,
      appearanceReference,
      isFirstAppearance,
      courtCaseUniqueIdentifier,
      addOrEditCourtCase,
    })
  }

  public submitOffenceName: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, offenceReference, appearanceReference, addOrEditCourtCase } = req.params
    const offenceNameForm = trimForm<OffenceOffenceNameForm>(req.body)
    const [offenceCode, ...offenceNames] = offenceNameForm.offenceName.split(' ')
    const offenceName = offenceNames.join(' ')

    this.offenceService.setOffenceCode(req.session, nomsId, courtCaseReference, offenceCode)
    this.offenceService.setOffenceName(req.session, nomsId, courtCaseReference, offenceName)

    return res.redirect(
      `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/appearance/${appearanceReference}/offences/${offenceReference}/offence-date`,
    )
  }

  public getConfirmOffenceCode: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, offenceReference, appearanceReference, addOrEditCourtCase } = req.params
    const offence = await this.manageOffencesService.getOffenceByCode(
      this.offenceService.getOffenceCode(req.session, nomsId, courtCaseReference),
      req.user.token,
    )
    const isFirstAppearance = appearanceReference === '0'
    const courtCaseUniqueIdentifier = this.courtCaseService.getUniqueIdentifier(req.session, nomsId, courtCaseReference)
    return res.render('pages/offence/confirm-offence', {
      nomsId,
      courtCaseReference,
      offence,
      offenceReference,
      appearanceReference,
      isFirstAppearance,
      courtCaseUniqueIdentifier,
      addOrEditCourtCase,
    })
  }

  public submitConfirmOffenceCode: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, offenceReference, appearanceReference, addOrEditCourtCase } = req.params
    const confirmOffenceForm = trimForm<OffenceConfirmOffenceForm>(req.body)
    this.offenceService.setOffenceCode(req.session, nomsId, courtCaseReference, confirmOffenceForm.offenceCode)
    this.offenceService.setOffenceName(req.session, nomsId, courtCaseReference, confirmOffenceForm.offenceName)

    return res.redirect(
      `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/appearance/${appearanceReference}/offences/${offenceReference}/offence-date`,
    )
  }

  public getCheckOffenceAnswers: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, appearanceReference, addOrEditCourtCase } = req.params
    const courtAppearance = this.courtAppearanceService.getSessionCourtAppearance(
      req.session,
      nomsId,
      courtCaseReference,
    )
    const isFirstAppearance = appearanceReference === '0'
    const courtCaseUniqueIdentifier = this.courtCaseService.getUniqueIdentifier(req.session, nomsId, courtCaseReference)
    const offenceMap = await this.getOffenceMap(courtAppearance.offences, req.user.token)
    return res.render('pages/offence/check-offence-answers', {
      nomsId,
      courtCaseReference,
      courtAppearance,
      appearanceReference,
      isFirstAppearance,
      courtCaseUniqueIdentifier,
      infoBanner: req.flash('infoBanner'),
      addOrEditCourtCase,
      offenceMap,
    })
  }

  public addAnotherOffence: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, offenceReference, appearanceReference, addOrEditCourtCase } = req.params
    this.offenceService.clearOffence(req.session, nomsId, courtCaseReference)
    return res.redirect(
      `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/appearance/${appearanceReference}/offences/${offenceReference}/offence-code`,
    )
  }

  public getDeleteOffence: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, offenceReference, appearanceReference, addOrEditCourtCase } = req.params
    const offence = this.courtAppearanceService.getOffence(
      req.session,
      nomsId,
      courtCaseReference,
      parseInt(offenceReference, 10),
    )
    const isFirstAppearance = appearanceReference === '0'
    const courtCaseUniqueIdentifier = this.courtCaseService.getUniqueIdentifier(req.session, nomsId, courtCaseReference)
    return res.render('pages/offence/delete-offence', {
      nomsId,
      courtCaseReference,
      offence,
      offenceReference,
      appearanceReference,
      isFirstAppearance,
      courtCaseUniqueIdentifier,
      addOrEditCourtCase,
    })
  }

  public submitDeleteOffence: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, offenceReference, appearanceReference, addOrEditCourtCase } = req.params
    const deleteOffenceForm = trimForm<OffenceDeleteOffenceForm>(req.body)
    if (deleteOffenceForm.deleteOffence === 'true') {
      this.courtAppearanceService.deleteOffence(req.session, nomsId, courtCaseReference, parseInt(offenceReference, 10))
      req.flash('infoBanner', 'Offence deleted')
    }
    return res.redirect(
      `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/appearance/${appearanceReference}/offences/check-offence-answers`,
    )
  }

  public getReviewOffences: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, appearanceReference, addOrEditCourtCase } = req.params
    const courtAppearance = this.courtAppearanceService.getSessionCourtAppearance(
      req.session,
      nomsId,
      courtCaseReference,
    )
    const offenceMap = await this.getOffenceMap(courtAppearance.offences, req.user.token)
    const courtCaseUniqueIdentifier = this.courtCaseService.getUniqueIdentifier(req.session, nomsId, courtCaseReference)
    return res.render('pages/offence/review-offences', {
      nomsId,
      courtCaseReference,
      courtAppearance,
      appearanceReference,
      courtCaseUniqueIdentifier,
      addOrEditCourtCase,
      offenceMap,
    })
  }

  public submitReviewOffences: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId, courtCaseReference, appearanceReference, addOrEditCourtCase } = req.params
    const reviewOffenceForm = trimForm<ReviewOffencesForm>(req.body)
    if (reviewOffenceForm.changeOffence === 'true') {
      return res.redirect(
        `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/appearance/${appearanceReference}/offences/check-offence-answers`,
      )
    }
    return res.redirect(
      `/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/appearance/${appearanceReference}/next-hearing-select`,
    )
  }

  private async getOffenceMap(offencesToLookup: Offence[], token: string) {
    let offenceMap = {}
    if (offencesToLookup?.length) {
      const offenceCodes = Array.from(new Set(offencesToLookup.map(offence => offence.offenceCode)))
      const offences = await this.manageOffencesService.getOffencesByCodes(offenceCodes, token)
      offenceMap = Object.fromEntries(offences.map(offence => [offence.code, offence.description]))
    }
    return offenceMap
  }

  private saveOffenceInAppearance(req, nomsId: string, courtCaseReference: string, offenceReference: string) {
    const offence = this.offenceService.getSessionOffence(req.session, nomsId, courtCaseReference)
    const offencePersistType = this.courtAppearanceService.addOffence(
      req.session,
      nomsId,
      courtCaseReference,
      parseInt(offenceReference, 10),
      offence,
    )
    if (offencePersistType === OffencePersistType.CREATED) {
      req.flash('infoBanner', 'New offence added')
    } else if (offencePersistType === OffencePersistType.EDITED) {
      req.flash('infoBanner', 'Changes successfully made')
    }
  }
}
