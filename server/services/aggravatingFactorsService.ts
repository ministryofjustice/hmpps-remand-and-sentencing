import { SessionData } from 'express-session'
import type {
  OffenceWithAggravatingFactorsForm,
  SelectWhichAggravatingFactorsForm,
} from 'forms'
import validate from '../validation/validation'
import OffenceService from './offenceService'

export default class AggravatingFactorsService {
  constructor(private readonly offenceService: OffenceService) {}


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

  anyAggravatingOffencesProcessed(session: Partial<SessionData>) {
    return this.getAggravatingOffenceQueue(session).some(e => e.processed)
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

  getLastProcessedAggravatingOffenceId(session: Partial<SessionData>, chargeUuid: string): string | null {
    const queue = this.getAggravatingOffenceQueue(session)

    // Find the index of the current item
    const currentIndex = queue.findIndex(e => e.chargeUuid === chargeUuid)
    if (currentIndex === -1) return null // chargeUuid not found

    // Look backwards from the element before the given chargeUuid
    // eslint-disable-next-line no-plusplus
    for (let i = currentIndex - 1; i >= 0; i--) {
      if (queue[i].processed) {
        return queue[i].chargeUuid
      }
    }

    return null
  }

  // Mark a specific offence as processed by uuid
  markAggravatingOffenceProcessed(session: Partial<SessionData>, offenceUuid: string) {
    if (!session.aggravatingChargeUuids) return
    const idx = session.aggravatingChargeUuids.findIndex(e => e.chargeUuid === offenceUuid)
    // eslint-disable-next-line no-param-reassign
    if (idx !== -1) session.aggravatingChargeUuids[idx].processed = true
  }

  setAggravatingFactors(
    session: Partial<SessionData>,
    nomsId: string,
    courtCaseReference: string,
    form: SelectWhichAggravatingFactorsForm,
    chargeUuid: string,
    isEditing: boolean,
  ) {
    if (isEditing) {
      return this.updateOffenceWithAggravatingFactors(session, nomsId, courtCaseReference, chargeUuid, form)
    }

    const errors = validate(
      form,
      { aggravatedFactors: 'required' },
      {
        'required.aggravatedFactors': 'Select at least one aggravating factor applicable to the offence',
      },
    )

    if (errors.length === 0) {
      this.updateOffenceWithAggravatingFactors(session, nomsId, courtCaseReference, chargeUuid, form)
    }

    return errors
  }

  private updateOffenceWithAggravatingFactors(
    session: Partial<SessionData>,
    nomsId: string,
    courtCaseReference: string,
    chargeUuid: string,
    form: SelectWhichAggravatingFactorsForm,
  ) {
    const offence = this.offenceService.getSessionOffence(session, nomsId, courtCaseReference, chargeUuid)

    offence.terrorRelated = form.aggravatedFactors?.includes('terrorRelated') ? true : null
    offence.foreignPowerRelated = form.aggravatedFactors?.includes('foreignPowerRelated') ? true : null

    this.offenceService.setSessionOffence(session, nomsId, courtCaseReference, offence)
    this.markAggravatingOffenceProcessed(session, chargeUuid)
    return []
  }
}
