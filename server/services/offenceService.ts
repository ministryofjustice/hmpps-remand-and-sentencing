import type { OffenceOffenceDateForm } from 'forms'
import type { Offence, SentenceLength } from 'models'
import dayjs from 'dayjs'
import validate from '../validation/validation'

export default class OffenceService {
  setOffenceStartDate(
    session: CookieSessionInterfaces.CookieSessionObject,
    nomsId: string,
    courtCaseReference: string,
    offenceStartDate: Date,
  ) {
    const id = this.getOffenceId(nomsId, courtCaseReference)
    const offence = this.getOffence(session.offences, id)
    offence.offenceStartDate = offenceStartDate
    // eslint-disable-next-line no-param-reassign
    session.offences[id] = offence
  }

  setOffenceDates(
    session: CookieSessionInterfaces.CookieSessionObject,
    nomsId: string,
    courtCaseReference: string,
    offenceOffenceDateForm: OffenceOffenceDateForm,
  ) {
    const isValidOffenceStartDateRule =
      offenceOffenceDateForm['offenceStartDate-day'] !== undefined &&
      offenceOffenceDateForm['offenceStartDate-month'] !== undefined &&
      offenceOffenceDateForm['offenceStartDate-year'] !== undefined
        ? `|isValidDate:${offenceOffenceDateForm['offenceStartDate-year']}-${offenceOffenceDateForm['offenceStartDate-month'].padStart(2, '0')}-${offenceOffenceDateForm['offenceStartDate-day'].padStart(2, '0')}`
        : ''

    const isValidOffenceEndDateRule =
      offenceOffenceDateForm['offenceEndDate-day'] !== undefined &&
      offenceOffenceDateForm['offenceEndDate-month'] !== undefined &&
      offenceOffenceDateForm['offenceEndDate-year'] !== undefined
        ? `|isValidDate:${offenceOffenceDateForm['offenceEndDate-year']}-${offenceOffenceDateForm['offenceEndDate-month'].padStart(2, '0')}-${offenceOffenceDateForm['offenceEndDate-day'].padStart(2, '0')}`
        : ''

    const errors = validate(
      offenceOffenceDateForm,
      {
        'offenceStartDate-day': `required${isValidOffenceStartDateRule}`,
        'offenceStartDate-month': `required`,
        'offenceStartDate-year': `required`,
        'offenceEndDate-day': `required_with:offenceEndDate-month,offenceEndDate-year${isValidOffenceEndDateRule}`,
        'offenceEndDate-month': 'required_with:offenceEndDate-day,offenceEndDate-year',
        'offenceEndDate-year': 'required_with:offenceEndDate-day,offenceEndDate-month',
      },
      {
        'required.offenceStartDate-year': 'Offence start date must include year',
        'required.offenceStartDate-month': 'Offence start date must include month',
        'required.offenceStartDate-day': 'Offence start date must include day',
        'isValidDate.offenceStartDate-day': 'This date does not exist.',
        'required_with.offenceEndDate-day': 'Offence end date must include day',
        'required_with.offenceEndDate-month': 'Offence end date must include month',
        'required_with.offenceEndDate-year': 'Offence end date must include year',
        'isValidDate.offenceEndDate-day': 'This date does not exist.',
      },
    )
    if (errors.length === 0) {
      const id = this.getOffenceId(nomsId, courtCaseReference)
      const offence = this.getOffence(session.offences, id)

      const offenceStartDate = dayjs({
        year: offenceOffenceDateForm['offenceStartDate-year'],
        month: parseInt(offenceOffenceDateForm['offenceStartDate-month'], 10) - 1,
        day: offenceOffenceDateForm['offenceStartDate-day'],
      })
      offence.offenceStartDate = offenceStartDate.toDate()
      if (offenceOffenceDateForm['offenceEndDate-day'] !== undefined) {
        const offenceEndDate = dayjs({
          year: offenceOffenceDateForm['offenceEndDate-year'],
          month: parseInt(offenceOffenceDateForm['offenceEndDate-month'], 10) - 1,
          day: offenceOffenceDateForm['offenceEndDate-day'],
        })
        offence.offenceEndDate = offenceEndDate.toDate()
      }
      // eslint-disable-next-line no-param-reassign
      session.offences[id] = offence
    }
    return errors
  }

  setOffenceEndDate(
    session: CookieSessionInterfaces.CookieSessionObject,
    nomsId: string,
    courtCaseReference: string,
    offenceEndDate: Date,
  ) {
    const id = this.getOffenceId(nomsId, courtCaseReference)
    const offence = this.getOffence(session.offences, id)
    offence.offenceEndDate = offenceEndDate
    // eslint-disable-next-line no-param-reassign
    session.offences[id] = offence
  }

  setOffenceCode(
    session: CookieSessionInterfaces.CookieSessionObject,
    nomsId: string,
    courtCaseReference: string,
    offenceCode: string,
  ) {
    const id = this.getOffenceId(nomsId, courtCaseReference)
    const offence = this.getOffence(session.offences, id)
    offence.offenceCode = offenceCode
    // eslint-disable-next-line no-param-reassign
    session.offences[id] = offence
  }

  setOffenceName(
    session: CookieSessionInterfaces.CookieSessionObject,
    nomsId: string,
    courtCaseReference: string,
    offenceName: string,
  ) {
    const id = this.getOffenceId(nomsId, courtCaseReference)
    const offence = this.getOffence(session.offences, id)
    offence.offenceName = offenceName
    // eslint-disable-next-line no-param-reassign
    session.offences[id] = offence
  }

  getOffenceCode(session: CookieSessionInterfaces.CookieSessionObject, nomsId: string, courtCaseReference: string) {
    const id = this.getOffenceId(nomsId, courtCaseReference)
    return this.getOffence(session.offences, id).offenceCode
  }

  getCountNumber(session: CookieSessionInterfaces.CookieSessionObject, nomsId: string, courtCaseReference: string) {
    const id = this.getOffenceId(nomsId, courtCaseReference)
    return this.getOffence(session.offences, id).sentence?.countNumber
  }

  setCountNumber(
    session: CookieSessionInterfaces.CookieSessionObject,
    nomsId: string,
    courtCaseReference: string,
    countNumber: string,
  ) {
    const id = this.getOffenceId(nomsId, courtCaseReference)
    const offence = this.getOffence(session.offences, id)
    const sentence = offence.sentence ?? {}
    sentence.countNumber = countNumber
    offence.sentence = sentence
    // eslint-disable-next-line no-param-reassign
    session.offences[id] = offence
  }

  getTerrorRelated(session: CookieSessionInterfaces.CookieSessionObject, nomsId: string, courtCaseReference: string) {
    const id = this.getOffenceId(nomsId, courtCaseReference)
    return this.getOffence(session.offences, id).terrorRelated
  }

  setTerrorRelated(
    session: CookieSessionInterfaces.CookieSessionObject,
    nomsId: string,
    courtCaseReference: string,
    terrorRelated: boolean,
  ) {
    const id = this.getOffenceId(nomsId, courtCaseReference)
    const offence = this.getOffence(session.offences, id)
    offence.terrorRelated = terrorRelated
    // eslint-disable-next-line no-param-reassign
    session.offences[id] = offence
  }

  setOffenceOutcome(
    session: CookieSessionInterfaces.CookieSessionObject,
    nomsId: string,
    courtCaseReference: string,
    outcome: string,
  ) {
    const id = this.getOffenceId(nomsId, courtCaseReference)
    const offence = this.getOffence(session.offences, id)
    offence.outcome = outcome
    // eslint-disable-next-line no-param-reassign
    session.offences[id] = offence
  }

  getOffenceOutcome(
    session: CookieSessionInterfaces.CookieSessionObject,
    nomsId: string,
    courtCaseReference: string,
  ): string {
    const id = this.getOffenceId(nomsId, courtCaseReference)
    return this.getOffence(session.offences, id).outcome
  }

  setCustodialSentenceLength(
    session: CookieSessionInterfaces.CookieSessionObject,
    nomsId: string,
    courtCaseReference: string,
    sentenceLength: SentenceLength,
  ) {
    const id = this.getOffenceId(nomsId, courtCaseReference)
    const offence = this.getOffence(session.offences, id)
    const sentence = offence.sentence ?? {}
    sentence.custodialSentenceLength = sentenceLength
    offence.sentence = sentence
    // eslint-disable-next-line no-param-reassign
    session.offences[id] = offence
  }

  setSentenceServeType(
    session: CookieSessionInterfaces.CookieSessionObject,
    nomsId: string,
    courtCaseReference: string,
    sentenceServeType: string,
  ) {
    const id = this.getOffenceId(nomsId, courtCaseReference)
    const offence = this.getOffence(session.offences, id)
    const sentence = offence.sentence ?? {}
    sentence.sentenceServeType = sentenceServeType
    offence.sentence = sentence
    // eslint-disable-next-line no-param-reassign
    session.offences[id] = offence
  }

  setConsecutiveTo(
    session: CookieSessionInterfaces.CookieSessionObject,
    nomsId: string,
    courtCaseReference: string,
    consecutiveTo: string,
  ) {
    const id = this.getOffenceId(nomsId, courtCaseReference)
    const offence = this.getOffence(session.offences, id)
    const sentence = offence.sentence ?? {}
    sentence.consecutiveTo = consecutiveTo
    offence.sentence = sentence
    // eslint-disable-next-line no-param-reassign
    session.offences[id] = offence
  }

  getSessionOffence(
    session: CookieSessionInterfaces.CookieSessionObject,
    nomsId: string,
    courtCaseReference: string,
  ): Offence {
    const id = this.getOffenceId(nomsId, courtCaseReference)
    return this.getOffence(session.offences, id)
  }

  clearOffence(session: CookieSessionInterfaces.CookieSessionObject, nomsId: string, courtCaseReference: string) {
    const id = this.getOffenceId(nomsId, courtCaseReference)
    // eslint-disable-next-line no-param-reassign
    delete session.offences[id]
  }

  private getOffenceId(nomsId: string, courtCaseReference: string) {
    return `${nomsId}-${courtCaseReference}`
  }

  private getOffence(offences: Map<string, Offence>, id: string): Offence {
    return offences[id] ?? {}
  }
}
