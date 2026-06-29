import { SessionData } from 'express-session'
import type {
  AggravatingFactorsFinishedAddingForm,
  OffenceWithAggravatingFactorsForm,
  SelectWhichAggravatingFactorsForm,
} from 'forms'
import validate from '../validation/validation'
import OffenceService from './offenceService'
import RefDataService from './refDataService'

export default class AggravatingFactorsService {
  constructor(
    private readonly offenceService: OffenceService,
    private readonly refDataService: RefDataService,
  ) {}

  setAggravatingOffenceIds(
    session: Partial<SessionData>,
    offenceWithAggravatingFactorsForm: OffenceWithAggravatingFactorsForm,
  ) {
    const errors = validate(
      offenceWithAggravatingFactorsForm,
      {
        aggravatedOffenceUuids: 'required',
      },
      {
        'required.aggravatedOffenceUuids': 'Select at least one offence to apply aggravating factors to',
      },
    )
    if (errors.length === 0) {
      // eslint-disable-next-line no-param-reassign
      session.aggravatingChargeUuids = (offenceWithAggravatingFactorsForm.aggravatedOffenceUuids || []).map(uuid => ({
        chargeUuid: uuid,
        processed: false,
      }))
    }
    return errors
  }

  getAggravatingOffenceQueue(session: Partial<SessionData>) {
    return session.aggravatingChargeUuids || []
  }

  removeChargeUUidFromQueue(session: Partial<SessionData>, chargeUuid: string) {
    if (!session.aggravatingChargeUuids) return
    const idx = session.aggravatingChargeUuids.findIndex(e => e.chargeUuid === chargeUuid)
    if (idx !== -1) session.aggravatingChargeUuids.splice(idx, 1)
  }

  clearAggravatingFactors(session: Partial<SessionData>) {
    // eslint-disable-next-line no-param-reassign
    delete session.aggravatingChargeUuids
  }

  getNextUnprocessedAggravatingOffenceId(session: Partial<SessionData>, chargeUuid: string | null): string | undefined {
    const queue = this.getAggravatingOffenceQueue(session)
    if (!chargeUuid) {
      return queue[0]?.chargeUuid
    }

    const currentIndex = queue.findIndex(e => e.chargeUuid === chargeUuid)
    if (currentIndex === -1) {
      return undefined // Not found in queue
    }

    const nextEntry = queue[currentIndex + 1]
    return nextEntry?.chargeUuid
  }

  // Mark a specific offence as processed by uuid
  markAggravatingOffenceProcessed(session: Partial<SessionData>, offenceUuid: string) {
    if (!session.aggravatingChargeUuids) return
    const idx = session.aggravatingChargeUuids.findIndex(e => e.chargeUuid === offenceUuid)
    // eslint-disable-next-line no-param-reassign
    if (idx !== -1) session.aggravatingChargeUuids[idx].processed = true
  }

  async setAggravatingFactors(
    session: Partial<SessionData>,
    nomsId: string,
    courtCaseReference: string,
    form: SelectWhichAggravatingFactorsForm,
    chargeUuid: string,
    isEditing: boolean,
    selected: string[],
    isEditJourney: boolean,
    username: string,
  ) {
    if (isEditJourney || isEditing) {
      return this.updateOffenceWithAggravatingFactors(
        session,
        nomsId,
        courtCaseReference,
        chargeUuid,
        selected,
        username,
      )
    }

    const errors = validate(
      form,
      { aggravatedFactors: 'required' },
      {
        'required.aggravatedFactors': 'Select at least one aggravating factor applicable to the offence',
      },
    )

    if (errors.length === 0) {
      await this.updateOffenceWithAggravatingFactors(
        session,
        nomsId,
        courtCaseReference,
        chargeUuid,
        selected,
        username,
      )
    }

    return errors
  }

  private async updateOffenceWithAggravatingFactors(
    session: Partial<SessionData>,
    nomsId: string,
    courtCaseReference: string,
    chargeUuid: string,
    selected: string[],
    username: string,
  ) {
    const offence = this.offenceService.getSessionOffence(session, nomsId, courtCaseReference, chargeUuid)

    offence.terrorRelated = selected.includes('OATC') ? true : null
    offence.foreignPowerRelated = selected.includes('OAFPC') ? true : null

    const aggravatingFactorsOptions = await this.refDataService.getAllAggravatingFactors(username)
    offence.aggravatingFactors = (aggravatingFactorsOptions || []).filter(opt => selected.includes(opt.code))

    this.offenceService.setSessionOffence(session, nomsId, courtCaseReference, offence)
    this.markAggravatingOffenceProcessed(session, chargeUuid)
    return []
  }

  checkFinishingAggravatingFactors(aggravatingFactorsFinishedAddingForm: AggravatingFactorsFinishedAddingForm): {
    text?: string
    html?: string
    href: string
  }[] {
    return validate(
      aggravatingFactorsFinishedAddingForm,
      {
        finishedAddingAggravatingFactors: 'required',
      },
      {
        'required.finishedAddingAggravatingFactors': `Select if you have finished adding the aggravating factors`,
      },
    )
  }
}
