import type { CourtAppearance, Offence, SentenceLength } from 'models'
import type {
  CourtCaseAlternativeSentenceLengthForm,
  CourtCaseNextHearingDateForm,
  CourtCaseReferenceForm,
  CourtCaseSelectReferenceForm,
  CourtCaseTaggedBailForm,
  CourtCaseWarrantDateForm,
  SentenceLengthForm,
} from 'forms'
import dayjs from 'dayjs'
import OffencePersistType from '../@types/models/OffencePersistType'
import validate from '../validation/validation'
import {
  alternativeSentenceLengthFormToSentenceLength,
  sentenceLengthFormToSentenceLength,
} from '../utils/mappingUtils'
import RemandAndSentencingService from './remandAndSentencingService'
import { toDateString } from '../utils/utils'

export default class CourtAppearanceService {
  constructor(private readonly remandAndSentencingService: RemandAndSentencingService) {}

  setCaseReferenceNumber(
    session: CookieSessionInterfaces.CookieSessionObject,
    nomsId: string,
    courtCaseReferenceForm: CourtCaseReferenceForm,
  ) {
    const errors = validate(
      courtCaseReferenceForm,
      {
        referenceNumber: [
          'required_without:noCaseReference',
          `onlyOne:${courtCaseReferenceForm.noCaseReference ?? ''}`,
          'regex:/^[T]{1}\\d{8}$/',
        ],
        noCaseReference: `onlyOne:${courtCaseReferenceForm.referenceNumber ?? ''}`,
      },
      {
        'required_without.referenceNumber': 'You must enter the case reference',
        'onlyOne.referenceNumber': 'Either reference number or no reference number must be submitted',
        'onlyOne.noCaseReference': 'Either reference number or no reference number must be submitted',
        'regex.referenceNumber': 'You must enter a valid court case reference number.',
      },
    )
    if (errors.length === 0) {
      const courtAppearance = this.getCourtAppearance(session, nomsId)
      if (courtCaseReferenceForm.referenceNumber) {
        courtAppearance.caseReferenceNumber = courtCaseReferenceForm.referenceNumber
      } else {
        delete courtAppearance.caseReferenceNumber
      }
      // eslint-disable-next-line no-param-reassign
      session.courtAppearances[nomsId] = courtAppearance
    }
    return errors
  }

  async setCaseReferenceFromSelectCaseReference(
    session: CookieSessionInterfaces.CookieSessionObject,
    nomsId: string,
    courtCaseReference: string,
    authToken: string,
    referenceForm: CourtCaseSelectReferenceForm,
  ) {
    const errors = validate(
      referenceForm,
      {
        referenceNumberSelect: 'required',
      },
      {
        'required.referenceNumberSelect': 'Select ‘Yes’ if this appearance uses the same case reference.',
      },
    )
    if (errors.length === 0) {
      const courtAppearance = this.getCourtAppearance(session, nomsId)
      if (referenceForm.referenceNumberSelect === 'true') {
        const latestCourtAppearance = await this.remandAndSentencingService.getLatestCourtAppearanceByCourtCaseUuid(
          authToken,
          courtCaseReference,
        )
        courtAppearance.caseReferenceNumber = latestCourtAppearance.courtCaseReference
      } else {
        delete courtAppearance.caseReferenceNumber
      }
      courtAppearance.referenceNumberSelect = referenceForm.referenceNumberSelect
      // eslint-disable-next-line no-param-reassign
      session.courtAppearances[nomsId] = courtAppearance
    }
    return errors
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
    let isValidWarrantDateRule = ''
    if (
      courtCaseWarrantDateForm['warrantDate-day'] &&
      courtCaseWarrantDateForm['warrantDate-month'] &&
      courtCaseWarrantDateForm['warrantDate-year']
    ) {
      const warrantDateString = toDateString(
        courtCaseWarrantDateForm['warrantDate-year'],
        courtCaseWarrantDateForm['warrantDate-month'],
        courtCaseWarrantDateForm['warrantDate-day'],
      )
      isValidWarrantDateRule = `|isValidDate:${warrantDateString}|isPastDate:${warrantDateString}`
    }

    const errors = validate(
      courtCaseWarrantDateForm,
      {
        'warrantDate-day': `required${isValidWarrantDateRule}`,
        'warrantDate-month': `required`,
        'warrantDate-year': `required`,
      },
      {
        'required.warrantDate-year': 'Warrant date must include year',
        'required.warrantDate-month': 'Warrant date must include month',
        'required.warrantDate-day': 'Warrant date must include day',
        'isValidDate.warrantDate-day': 'This date does not exist.',
        'isPastDate.warrantDate-day': 'Warrant date must be in the past',
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
    const { warrantDate } = this.getCourtAppearance(session, nomsId)
    return warrantDate ? new Date(warrantDate) : undefined
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

  setTaggedBail(
    session: CookieSessionInterfaces.CookieSessionObject,
    nomsId: string,
    taggedBailForm: CourtCaseTaggedBailForm,
  ) {
    const errors = validate(
      taggedBailForm,
      { taggedBail: 'required_if:hasTaggedBail,true|minWholeNumber:1', hasTaggedBail: 'required' },
      {
        'required_if.taggedBail': 'Enter the number of days for the tagged bail',
        'minWholeNumber.taggedBail': 'Enter a whole number for the number of days on tagged bail',
        'required.hasTaggedBail': 'Enter the number of days for the tagged bail',
      },
    )
    if (errors.length === 0) {
      const courtAppearance = this.getCourtAppearance(session, nomsId)
      if (taggedBailForm.hasTaggedBail === 'true') {
        courtAppearance.taggedBail = taggedBailForm.taggedBail
      } else {
        delete courtAppearance.taggedBail
      }
      courtAppearance.hasTaggedBail = taggedBailForm.hasTaggedBail
      // eslint-disable-next-line no-param-reassign
      session.courtAppearances[nomsId] = courtAppearance
    }
    return errors
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

  setOverallSentenceLength(
    session: CookieSessionInterfaces.CookieSessionObject,
    nomsId: string,
    courtCaseOverallSentenceLengthForm: SentenceLengthForm,
  ) {
    const errors = validate(
      courtCaseOverallSentenceLengthForm,
      {
        'sentenceLength-years': 'requireSentenceLength|minWholeNumber:0|requireOneNonZeroSentenceLength',
        'sentenceLength-months': 'minWholeNumber:0',
        'sentenceLength-weeks': 'minWholeNumber:0',
        'sentenceLength-days': 'minWholeNumber:0',
      },
      {
        'requireSentenceLength.sentenceLength-years': 'You must enter the overall sentence length',
        'minWholeNumber.sentenceLength-years': 'The number must be a whole number, or 0',
        'minWholeNumber.sentenceLength-months': 'The number must be a whole number, or 0',
        'minWholeNumber.sentenceLength-weeks': 'The number must be a whole number, or 0',
        'minWholeNumber.sentenceLength-days': 'The number must be a whole number, or 0',
        'requireOneNonZeroSentenceLength.sentenceLength-years': 'The sentence length cannot be 0',
      },
    )
    if (errors.length === 0) {
      const sentenceLength = sentenceLengthFormToSentenceLength(courtCaseOverallSentenceLengthForm)
      const courtAppearance = this.getCourtAppearance(session, nomsId)
      courtAppearance.overallSentenceLength = sentenceLength
      // eslint-disable-next-line no-param-reassign
      session.courtAppearances[nomsId] = courtAppearance
    }
    return errors
  }

  setOverallAlternativeSentenceLength(
    session: CookieSessionInterfaces.CookieSessionObject,
    nomsId: string,
    courtCaseAlternativeSentenceLengthForm: CourtCaseAlternativeSentenceLengthForm,
  ) {
    const errors = validate(
      courtCaseAlternativeSentenceLengthForm,
      {
        'firstSentenceLength-value':
          'requireAlternativeSentenceLength|minWholeNumber:0|requireOneNonZeroAlternativeSentenceLength',
        'secondSentenceLength-value': 'minWholeNumber:0',
        'thirdSentenceLength-value': 'minWholeNumber:0',
        'fourthSentenceLength-value': 'minWholeNumber:0',
      },
      {
        'requireAlternativeSentenceLength.firstSentenceLength-value': 'You must enter the overall sentence length',
        'minWholeNumber.firstSentenceLength-value': 'The number must be a whole number, or 0',
        'minWholeNumber.secondSentenceLength-value': 'The number must be a whole number, or 0',
        'minWholeNumber.thirdSentenceLength-value': 'The number must be a whole number, or 0',
        'minWholeNumber.fourthSentenceLength-value': 'The number must be a whole number, or 0',
        'requireOneNonZeroAlternativeSentenceLength.firstSentenceLength-value': 'The sentence length cannot be 0',
      },
    )
    if (errors.length === 0) {
      const sentenceLength = alternativeSentenceLengthFormToSentenceLength<CourtCaseAlternativeSentenceLengthForm>(
        courtCaseAlternativeSentenceLengthForm,
      )
      const courtAppearance = this.getCourtAppearance(session, nomsId)
      courtAppearance.overallSentenceLength = sentenceLength
      // eslint-disable-next-line no-param-reassign
      session.courtAppearances[nomsId] = courtAppearance
    }
    return errors
  }

  setAppearanceInformationAcceptedTrue(session: CookieSessionInterfaces.CookieSessionObject, nomsId: string) {
    const courtAppearance = this.getCourtAppearance(session, nomsId)
    courtAppearance.appearanceInformationAccepted = true
    // eslint-disable-next-line no-param-reassign
    session.courtAppearances[nomsId] = courtAppearance
  }

  setOffenceSentenceAcceptedTrue(session: CookieSessionInterfaces.CookieSessionObject, nomsId: string) {
    const courtAppearance = this.getCourtAppearance(session, nomsId)
    courtAppearance.offenceSentenceAccepted = true
    // eslint-disable-next-line no-param-reassign
    session.courtAppearances[nomsId] = courtAppearance
  }

  setNextCourtAppearanceAcceptedTrue(session: CookieSessionInterfaces.CookieSessionObject, nomsId: string) {
    const courtAppearance = this.getCourtAppearance(session, nomsId)
    courtAppearance.nextCourtAppearanceAccepted = true
    // eslint-disable-next-line no-param-reassign
    session.courtAppearances[nomsId] = courtAppearance
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

  sessionCourtAppearanceExists(session: CookieSessionInterfaces.CookieSessionObject, nomsId: string): boolean {
    return session.courtAppearances[nomsId] !== undefined
  }

  setSessionCourtAppearance(
    session: CookieSessionInterfaces.CookieSessionObject,
    nomsId: string,
    courtAppearance: CourtAppearance,
  ) {
    // eslint-disable-next-line no-param-reassign
    session.courtAppearances[nomsId] = courtAppearance
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
