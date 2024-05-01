import type { CourtAppearance, Offence, SentenceLength } from 'models'
import type {
  CourtCaseAlternativeSentenceLengthForm,
  CourtCaseNextHearingDateForm,
  CourtCaseWarrantDateForm,
} from 'forms'
import dayjs from 'dayjs'
import OffencePersistType from '../@types/models/OffencePersistType'
import validate from '../validation/validation'
import { courtCaseAlternativeSentenceLengthFormToSentenceLength } from '../utils/mappingUtils'

export default class CourtAppearanceService {
  constructor() {}

  setCaseReferenceNumber(
    session: CookieSessionInterfaces.CookieSessionObject,
    nomsId: string,
    caseReferenceNumber: string,
  ) {
    const courtAppearance = this.getCourtAppearance(session, nomsId)
    courtAppearance.caseReferenceNumber = caseReferenceNumber
    // eslint-disable-next-line no-param-reassign
    session.courtAppearances[nomsId] = courtAppearance
  }

  getCaseReferenceNumber(session: CookieSessionInterfaces.CookieSessionObject, nomsId: string): string {
    return this.getCourtAppearance(session, nomsId).caseReferenceNumber
  }

  setWarrantDate(
    session: CookieSessionInterfaces.CookieSessionObject,
    nomsId: string,
    courtCaseWarrantDateForm: CourtCaseWarrantDateForm,
  ): {
    text: string
    href: string
  }[] {
    const isValidDateRule =
      courtCaseWarrantDateForm['warrantDate-day'] &&
      courtCaseWarrantDateForm['warrantDate-month'] &&
      courtCaseWarrantDateForm['warrantDate-year']
        ? `|isValidDate:${courtCaseWarrantDateForm['warrantDate-year']}-${courtCaseWarrantDateForm['warrantDate-month'].padStart(2, '0')}-${courtCaseWarrantDateForm['warrantDate-day'].padStart(2, '0')}`
        : ''
    const errors = validate(
      courtCaseWarrantDateForm,
      {
        'warrantDate-day': `required${isValidDateRule}`,
        'warrantDate-month': `required`,
        'warrantDate-year': `required`,
      },
      {
        'required.warrantDate-year': 'Warrant date must include year',
        'required.warrantDate-month': 'Warrant date must include month',
        'required.warrantDate-day': 'Warrant date must include day',
        'isValidDate.warrantDate-day': 'This date does not exist.',
      },
    )
    if (errors.length === 0) {
      const warrantDate = dayjs({
        year: courtCaseWarrantDateForm['warrantDate-year'],
        month: parseInt(courtCaseWarrantDateForm['warrantDate-month'], 10) - 1,
        day: courtCaseWarrantDateForm['warrantDate-day'],
      })
      const courtAppearance = this.getCourtAppearance(session, nomsId)
      courtAppearance.warrantDate = warrantDate.toDate()
      // eslint-disable-next-line no-param-reassign
      session.courtAppearances[nomsId] = courtAppearance
    }
    return errors
  }

  getWarrantDate(session: CookieSessionInterfaces.CookieSessionObject, nomsId: string): Date {
    return new Date(this.getCourtAppearance(session, nomsId).warrantDate)
  }

  setCourtName(session: CookieSessionInterfaces.CookieSessionObject, nomsId: string, courtName: string) {
    const courtAppearance = this.getCourtAppearance(session, nomsId)
    courtAppearance.courtName = courtName
    // eslint-disable-next-line no-param-reassign
    session.courtAppearances[nomsId] = courtAppearance
  }

  getCourtName(session: CookieSessionInterfaces.CookieSessionObject, nomsId: string): string {
    return this.getCourtAppearance(session, nomsId).courtName
  }

  setWarrantType(session: CookieSessionInterfaces.CookieSessionObject, nomsId: string, warrantType: string) {
    const courtAppearance = this.getCourtAppearance(session, nomsId)
    courtAppearance.warrantType = warrantType
    // eslint-disable-next-line no-param-reassign
    session.courtAppearances[nomsId] = courtAppearance
  }

  getWarrantType(session: CookieSessionInterfaces.CookieSessionObject, nomsId: string): string {
    return this.getCourtAppearance(session, nomsId).warrantType
  }

  setWarrantId(session: CookieSessionInterfaces.CookieSessionObject, nomsId: string, warrantId: string) {
    const courtAppearance = this.getCourtAppearance(session, nomsId)
    courtAppearance.warrantId = warrantId
    // eslint-disable-next-line no-param-reassign
    session.courtAppearances[nomsId] = courtAppearance
  }

  getNextHearingCourtSelect(session: CookieSessionInterfaces.CookieSessionObject, nomsId: string): boolean {
    return this.getCourtAppearance(session, nomsId).nextHearingCourtSelect
  }

  setNextHearingCourtSelect(
    session: CookieSessionInterfaces.CookieSessionObject,
    nomsId: string,
    nextHearingCourtSelect: boolean,
  ) {
    const courtAppearance = this.getCourtAppearance(session, nomsId)
    courtAppearance.nextHearingCourtSelect = nextHearingCourtSelect
    if (nextHearingCourtSelect) {
      courtAppearance.nextHearingCourtName = courtAppearance.courtName
    }
    // eslint-disable-next-line no-param-reassign
    session.courtAppearances[nomsId] = courtAppearance
  }

  getNextHearingCourtName(session: CookieSessionInterfaces.CookieSessionObject, nomsId: string): string {
    return this.getCourtAppearance(session, nomsId).nextHearingCourtName
  }

  setNextHearingCourtName(
    session: CookieSessionInterfaces.CookieSessionObject,
    nomsId: string,
    nextHearingCourtName: string,
  ) {
    const courtAppearance = this.getCourtAppearance(session, nomsId)
    courtAppearance.nextHearingCourtName = nextHearingCourtName
    // eslint-disable-next-line no-param-reassign
    session.courtAppearances[nomsId] = courtAppearance
  }

  setOverallCaseOutcome(
    session: CookieSessionInterfaces.CookieSessionObject,
    nomsId: string,
    overallCaseOutcome: string,
  ) {
    const courtAppearance = this.getCourtAppearance(session, nomsId)
    courtAppearance.overallCaseOutcome = overallCaseOutcome
    // eslint-disable-next-line no-param-reassign
    session.courtAppearances[nomsId] = courtAppearance
  }

  getOverallCaseOutcome(session: CookieSessionInterfaces.CookieSessionObject, nomsId: string): string {
    return this.getCourtAppearance(session, nomsId).overallCaseOutcome
  }

  setCaseOutcomeAppliedAll(
    session: CookieSessionInterfaces.CookieSessionObject,
    nomsId: string,
    caseOutcomeAppliedAll: boolean,
  ) {
    const courtAppearance = this.getCourtAppearance(session, nomsId)
    courtAppearance.caseOutcomeAppliedAll = caseOutcomeAppliedAll
    if (caseOutcomeAppliedAll) {
      courtAppearance.offences = courtAppearance.offences.map(offence => {
        // eslint-disable-next-line no-param-reassign
        offence.outcome = courtAppearance.overallCaseOutcome
        return offence
      })
    }
    // eslint-disable-next-line no-param-reassign
    session.courtAppearances[nomsId] = courtAppearance
  }

  getCaseOutcomeAppliedAll(session: CookieSessionInterfaces.CookieSessionObject, nomsId: string): boolean {
    return this.getCourtAppearance(session, nomsId).caseOutcomeAppliedAll
  }

  setTaggedBail(session: CookieSessionInterfaces.CookieSessionObject, nomsId: string, taggedBail: string) {
    const courtAppearance = this.getCourtAppearance(session, nomsId)
    courtAppearance.taggedBail = taggedBail
    // eslint-disable-next-line no-param-reassign
    session.courtAppearances[nomsId] = courtAppearance
  }

  getTaggedBail(session: CookieSessionInterfaces.CookieSessionObject, nomsId: string): string {
    return this.getCourtAppearance(session, nomsId).taggedBail
  }

  getOverallCustodialSentenceLength(
    session: CookieSessionInterfaces.CookieSessionObject,
    nomsId: string,
  ): SentenceLength {
    return this.getCourtAppearance(session, nomsId).overallSentenceLength
  }

  setOverallAlternativeSentenceLength(
    session: CookieSessionInterfaces.CookieSessionObject,
    nomsId: string,
    courtCaseAlternativeSentenceLengthForm: CourtCaseAlternativeSentenceLengthForm,
  ) {
    const errors = validate(
      courtCaseAlternativeSentenceLengthForm,
      {
        'firstSentenceLength-value': 'requireSentenceLength|minWholeNumber:0',
        'secondSentenceLength-value': 'minWholeNumber:0',
        'thirdSentenceLength-value': 'minWholeNumber:0',
        'fourthSentenceLength-value': 'minWholeNumber:0',
      },
      {
        'requireSentenceLength.firstSentenceLength-value': 'You must enter the overall sentence length',
        'minWholeNumber.firstSentenceLength-value': 'The number must be a whole number, or 0',
        'minWholeNumber.secondSentenceLength-value': 'The number must be a whole number, or 0',
        'minWholeNumber.thirdSentenceLength-value': 'The number must be a whole number, or 0',
        'minWholeNumber.fourthSentenceLength-value': 'The number must be a whole number, or 0',
      },
    )
    if (errors.length === 0) {
      const sentenceLength = courtCaseAlternativeSentenceLengthFormToSentenceLength(
        courtCaseAlternativeSentenceLengthForm,
      )
      const courtAppearance = this.getCourtAppearance(session, nomsId)
      courtAppearance.overallSentenceLength = sentenceLength
      // eslint-disable-next-line no-param-reassign
      session.courtAppearances[nomsId] = courtAppearance
    }
    return errors
  }

  getNextHearingSelect(session: CookieSessionInterfaces.CookieSessionObject, nomsId: string): boolean {
    return this.getCourtAppearance(session, nomsId).nextHearingSelect
  }

  setNextHearingSelect(
    session: CookieSessionInterfaces.CookieSessionObject,
    nomsId: string,
    nextHearingSelect: boolean,
  ) {
    const courtAppearance = this.getCourtAppearance(session, nomsId)
    courtAppearance.nextHearingSelect = nextHearingSelect
    // eslint-disable-next-line no-param-reassign
    session.courtAppearances[nomsId] = courtAppearance
  }

  getNextHearingType(session: CookieSessionInterfaces.CookieSessionObject, nomsId: string): string {
    return this.getCourtAppearance(session, nomsId).nextHearingType
  }

  setNextHearingType(session: CookieSessionInterfaces.CookieSessionObject, nomsId: string, nextHearingType: string) {
    const courtAppearance = this.getCourtAppearance(session, nomsId)
    courtAppearance.nextHearingType = nextHearingType
    // eslint-disable-next-line no-param-reassign
    session.courtAppearances[nomsId] = courtAppearance
  }

  getNextHearingDate(session: CookieSessionInterfaces.CookieSessionObject, nomsId: string): Date {
    return this.getCourtAppearance(session, nomsId).nextHearingDate
  }

  hasNextHearingTimeSet(session: CookieSessionInterfaces.CookieSessionObject, nomsId: string): boolean {
    return this.getCourtAppearance(session, nomsId).nextHearingTimeSet
  }

  setNextHearingDate(
    session: CookieSessionInterfaces.CookieSessionObject,
    nomsId: string,
    nextHearingDateForm: CourtCaseNextHearingDateForm,
  ) {
    const isValidDateRule =
      nextHearingDateForm['nextHearingDate-day'] !== undefined &&
      nextHearingDateForm['nextHearingDate-month'] !== undefined &&
      nextHearingDateForm['nextHearingDate-year'] !== undefined
        ? `|isValidDate:${nextHearingDateForm['nextHearingDate-year']}-${nextHearingDateForm['nextHearingDate-month'].padStart(2, '0')}-${nextHearingDateForm['nextHearingDate-day'].padStart(2, '0')}`
        : ''
    const errors = validate(
      nextHearingDateForm,
      {
        'nextHearingDate-day': `required${isValidDateRule}`,
        'nextHearingDate-month': `required`,
        'nextHearingDate-year': `required`,
        nextHearingTime: ['regex:/^([0-9]|0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/'],
      },
      {
        'required.nextHearingDate-year': 'Next court date must include year',
        'required.nextHearingDate-month': 'Next court date must include month',
        'required.nextHearingDate-day': 'Next court date must include day',
        'isValidDate.nextHearingDate-day': 'This date does not exist.',
        'regex.nextHearingTime': 'Time must be in 1:00 or 13:00 format',
      },
    )
    if (errors.length === 0) {
      let nextHearingDate = dayjs({
        year: nextHearingDateForm['nextHearingDate-year'],
        month: parseInt(nextHearingDateForm['nextHearingDate-month'], 10) - 1,
        day: nextHearingDateForm['nextHearingDate-day'],
      })
      if (nextHearingDateForm.nextHearingTime) {
        const [nextHearingHour, nextHearingMinute] = nextHearingDateForm.nextHearingTime.split(':')
        nextHearingDate = nextHearingDate.set('hour', parseInt(nextHearingHour, 10))
        nextHearingDate = nextHearingDate.set('minute', parseInt(nextHearingMinute, 10))
      }
      const courtAppearance = this.getCourtAppearance(session, nomsId)
      courtAppearance.nextHearingDate = nextHearingDate.toDate()
      courtAppearance.nextHearingTimeSet = Boolean(nextHearingDateForm.nextHearingTime)
      // eslint-disable-next-line no-param-reassign
      session.courtAppearances[nomsId] = courtAppearance
    }
    return errors
  }

  getSessionCourtAppearance(session: CookieSessionInterfaces.CookieSessionObject, nomsId: string): CourtAppearance {
    return this.getCourtAppearance(session, nomsId)
  }

  isForwithAlreadySelected(session: CookieSessionInterfaces.CookieSessionObject, nomsId: string): boolean {
    const courtAppearance = this.getCourtAppearance(session, nomsId)
    return courtAppearance.offences.some(offence => offence.sentence?.sentenceServeType === 'FORTHWITH')
  }

  addOffence(
    session: CookieSessionInterfaces.CookieSessionObject,
    nomsId: string,
    offenceReference: number,
    offence: Offence,
  ): OffencePersistType {
    const courtAppearance = this.getCourtAppearance(session, nomsId)
    let offencePersistType = OffencePersistType.CREATED
    if (courtAppearance.offences.length > offenceReference) {
      const previousOffenceRecord = courtAppearance.offences[offenceReference]
      const isSame = JSON.stringify(previousOffenceRecord) === JSON.stringify(offence)
      courtAppearance.offences[offenceReference] = offence
      offencePersistType = isSame ? OffencePersistType.NO_CHANGE : OffencePersistType.EDITED
    } else {
      courtAppearance.offences.push(offence)
    }
    // eslint-disable-next-line no-param-reassign
    session.courtAppearances[nomsId] = courtAppearance
    return offencePersistType
  }

  deleteOffence(session: CookieSessionInterfaces.CookieSessionObject, nomsId: string, offenceReference: number) {
    const courtAppearance = this.getCourtAppearance(session, nomsId)
    courtAppearance.offences.splice(offenceReference, 1)
    // eslint-disable-next-line no-param-reassign
    session.courtAppearances[nomsId] = courtAppearance
  }

  getOffence(session: CookieSessionInterfaces.CookieSessionObject, nomsId: string, offenceReference: number): Offence {
    const courtAppearance = this.getCourtAppearance(session, nomsId)
    return courtAppearance.offences[offenceReference]
  }

  clearSessionCourtAppearance(session: CookieSessionInterfaces.CookieSessionObject, nomsId: string) {
    // eslint-disable-next-line no-param-reassign
    delete session.courtAppearances[nomsId]
  }

  private getCourtAppearance(session: CookieSessionInterfaces.CookieSessionObject, nomsId: string): CourtAppearance {
    return session.courtAppearances[nomsId] ?? { offences: [] }
  }
}
