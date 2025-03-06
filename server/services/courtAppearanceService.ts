import type { CourtAppearance, Offence, SentenceLength } from 'models'
import type {
  CourtCaseAlternativeSentenceLengthForm,
  CourtCaseCaseOutcomeAppliedAllForm,
  CourtCaseCourtNameForm,
  CourtCaseNextHearingCourtNameForm,
  CourtCaseNextHearingCourtSelectForm,
  CourtCaseNextHearingDateForm,
  CourtCaseNextHearingSelectForm,
  CourtCaseNextHearingTypeForm,
  CourtCaseOverallCaseOutcomeForm,
  CourtCaseOverallConvictionDateAppliedAllForm,
  CourtCaseOverallConvictionDateForm,
  CourtCaseReferenceForm,
  CourtCaseSelectCourtNameForm,
  CourtCaseSelectReferenceForm,
  CourtCaseTaggedBailForm,
  CourtCaseWarrantDateForm,
  SentenceLengthForm,
} from 'forms'
import dayjs from 'dayjs'
import validate from '../validation/validation'
import {
  alternativeSentenceLengthFormToSentenceLength,
  sentenceLengthFormToSentenceLength,
} from '../utils/mappingUtils'
import RemandAndSentencingService from './remandAndSentencingService'
import { toDateString } from '../utils/utils'
import periodLengthTypeHeadings from '../resources/PeriodLengthTypeHeadings'

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
        ],
        noCaseReference: `onlyOne:${courtCaseReferenceForm.referenceNumber ?? ''}`,
      },
      {
        'required_without.referenceNumber': 'You must enter the case reference',
        'onlyOne.referenceNumber': 'Either reference number or no reference number must be submitted',
        'onlyOne.noCaseReference': 'Either reference number or no reference number must be submitted',
      },
    )
    if (errors.length === 0) {
      const courtAppearance = this.getCourtAppearance(session, nomsId)
      if (courtCaseReferenceForm.referenceNumber) {
        courtAppearance.caseReferenceNumber = courtCaseReferenceForm.referenceNumber
      } else {
        delete courtAppearance.caseReferenceNumber
      }
      courtAppearance.noCaseReference = courtCaseReferenceForm.noCaseReference
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

  setCourtName(
    session: CookieSessionInterfaces.CookieSessionObject,
    nomsId: string,
    courtNameForm: CourtCaseCourtNameForm,
  ) {
    const errors = validate(
      courtNameForm,
      { courtCode: 'required' },
      { 'required.courtCode': 'You must enter the court name' },
    )
    if (errors.length === 0) {
      const courtAppearance = this.getCourtAppearance(session, nomsId)
      courtAppearance.courtCode = courtNameForm.courtCode
      // eslint-disable-next-line no-param-reassign
      session.courtAppearances[nomsId] = courtAppearance
    }
    return errors
  }

  setCourtNameFromSelect(
    session: CookieSessionInterfaces.CookieSessionObject,
    nomsId: string,
    selectCourtNameForm: CourtCaseSelectCourtNameForm,
  ) {
    const errors = validate(
      selectCourtNameForm,
      { courtNameSelect: 'required' },
      { 'required.courtNameSelect': "Select 'Yes' if the appearance was at this court." },
    )
    if (errors.length === 0 && selectCourtNameForm.courtNameSelect === 'true') {
      const courtAppearance = this.getCourtAppearance(session, nomsId)
      courtAppearance.courtCode = selectCourtNameForm.previousCourtCode
      // eslint-disable-next-line no-param-reassign
      session.courtAppearances[nomsId] = courtAppearance
    }
    return errors
  }

  getCourtCode(session: CookieSessionInterfaces.CookieSessionObject, nomsId: string): string {
    return this.getCourtAppearance(session, nomsId).courtCode
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

  getNextHearingCourtSelect(session: CookieSessionInterfaces.CookieSessionObject, nomsId: string): string {
    return this.getCourtAppearance(session, nomsId).nextHearingCourtSelect
  }

  setNextHearingCourtSelect(
    session: CookieSessionInterfaces.CookieSessionObject,
    nomsId: string,
    nextHearingCourtSelectForm: CourtCaseNextHearingCourtSelectForm,
  ) {
    const errors = validate(
      nextHearingCourtSelectForm,
      { nextHearingCourtSelect: 'required' },
      { 'required.nextHearingCourtSelect': "Select 'Yes' if the next hearing will be at this same court." },
    )
    if (errors.length === 0) {
      const courtAppearance = this.getCourtAppearance(session, nomsId)
      courtAppearance.nextHearingCourtSelect = nextHearingCourtSelectForm.nextHearingCourtSelect
      if (nextHearingCourtSelectForm.nextHearingCourtSelect === 'true') {
        courtAppearance.nextHearingCourtCode = courtAppearance.courtCode
      }
      // eslint-disable-next-line no-param-reassign
      session.courtAppearances[nomsId] = courtAppearance
    }
    return errors
  }

  getNextHearingCourtCode(session: CookieSessionInterfaces.CookieSessionObject, nomsId: string): string {
    return this.getCourtAppearance(session, nomsId).nextHearingCourtCode
  }

  setNextHearingCourtName(
    session: CookieSessionInterfaces.CookieSessionObject,
    nomsId: string,
    nextHearingCourtNameForm: CourtCaseNextHearingCourtNameForm,
  ) {
    const errors = validate(
      nextHearingCourtNameForm,
      { courtCode: 'required' },
      { 'required.courtCode': 'You must enter the court name' },
    )
    if (errors.length === 0) {
      const courtAppearance = this.getCourtAppearance(session, nomsId)
      courtAppearance.nextHearingCourtCode = nextHearingCourtNameForm.courtCode
      // eslint-disable-next-line no-param-reassign
      session.courtAppearances[nomsId] = courtAppearance
    }

    return errors
  }

  setAppearanceOutcomeUuid(
    session: CookieSessionInterfaces.CookieSessionObject,
    nomsId: string,
    overallCaseOutcomeForm: CourtCaseOverallCaseOutcomeForm,
  ) {
    const errors = validate(
      overallCaseOutcomeForm,
      { overallCaseOutcome: 'required' },
      { 'required.overallCaseOutcome': 'You must select the overall case outcome' },
    )
    if (errors.length === 0) {
      const [appearanceOutcomeUuid, relatedOffenceOutcomeUuid] = overallCaseOutcomeForm.overallCaseOutcome.split('|')
      const courtAppearance = this.getCourtAppearance(session, nomsId)
      courtAppearance.appearanceOutcomeUuid = appearanceOutcomeUuid
      courtAppearance.relatedOffenceOutcomeUuid = relatedOffenceOutcomeUuid
      // eslint-disable-next-line no-param-reassign
      session.courtAppearances[nomsId] = courtAppearance
    }
    return errors
  }

  getAppearanceOutcomeUuid(session: CookieSessionInterfaces.CookieSessionObject, nomsId: string): string {
    return this.getCourtAppearance(session, nomsId).appearanceOutcomeUuid
  }

  getRelatedOffenceOutcomeUuid(session: CookieSessionInterfaces.CookieSessionObject, nomsId: string): string {
    return this.getCourtAppearance(session, nomsId).relatedOffenceOutcomeUuid
  }

  setCaseOutcomeAppliedAll(
    session: CookieSessionInterfaces.CookieSessionObject,
    nomsId: string,
    caseOutcomeAppliedAllForm: CourtCaseCaseOutcomeAppliedAllForm,
  ) {
    const errors = validate(
      caseOutcomeAppliedAllForm,
      {
        caseOutcomeAppliedAll: 'required',
      },
      {
        'required.caseOutcomeAppliedAll': 'Select ‘Yes’ if this outcome applies to all offences on the warrant.',
      },
    )
    if (errors.length === 0) {
      const courtAppearance = this.getCourtAppearance(session, nomsId)
      courtAppearance.caseOutcomeAppliedAll = caseOutcomeAppliedAllForm.caseOutcomeAppliedAll
      if (caseOutcomeAppliedAllForm.caseOutcomeAppliedAll === 'true') {
        courtAppearance.offences = courtAppearance.offences.map(offence => {
          // eslint-disable-next-line no-param-reassign
          offence.outcomeUuid = courtAppearance.relatedOffenceOutcomeUuid
          return offence
        })
      }
      // eslint-disable-next-line no-param-reassign
      session.courtAppearances[nomsId] = courtAppearance
    }
    return errors
  }

  getCaseOutcomeAppliedAll(session: CookieSessionInterfaces.CookieSessionObject, nomsId: string): string {
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
        hasOverallSentenceLength: 'required',
        'sentenceLength-years':
          'requireSentenceLength_if:hasOverallSentenceLength,true|minWholeNumber:0|requireOneNonZeroSentenceLength_if:hasOverallSentenceLength,true',
        'sentenceLength-months': 'minWholeNumber:0',
        'sentenceLength-weeks': 'minWholeNumber:0',
        'sentenceLength-days': 'minWholeNumber:0',
      },
      {
        'required.hasOverallSentenceLength': 'You must select if there is an overall sentence length or not',
        'requireSentenceLength_if.sentenceLength-years': 'You must enter the overall sentence length',
        'minWholeNumber.sentenceLength-years': 'The number must be a whole number, or 0',
        'minWholeNumber.sentenceLength-months': 'The number must be a whole number, or 0',
        'minWholeNumber.sentenceLength-weeks': 'The number must be a whole number, or 0',
        'minWholeNumber.sentenceLength-days': 'The number must be a whole number, or 0',
        'requireOneNonZeroSentenceLength_if.sentenceLength-years': 'The sentence length cannot be 0',
      },
    )

    if (errors.length === 0) {
      const courtAppearance = this.getCourtAppearance(session, nomsId)
      if (courtCaseOverallSentenceLengthForm.hasOverallSentenceLength === 'true') {
        courtAppearance.overallSentenceLength = {
          ...courtAppearance.overallSentenceLength,
          ...sentenceLengthFormToSentenceLength(
            courtCaseOverallSentenceLengthForm,
            'OVERALL_SENTENCE_LENGTH',
            periodLengthTypeHeadings.OVERALL_SENTENCE_LENGTH,
          ),
        }
      } else {
        delete courtAppearance.overallSentenceLength
      }

      courtAppearance.hasOverallSentenceLength = courtCaseOverallSentenceLengthForm.hasOverallSentenceLength
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
        'OVERALL_SENTENCE_LENGTH',
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

  setOffenceSentenceAccepted(session: CookieSessionInterfaces.CookieSessionObject, nomsId: string, completed: boolean) {
    const courtAppearance = this.getCourtAppearance(session, nomsId)

    courtAppearance.offenceSentenceAccepted = completed
    // eslint-disable-next-line no-param-reassign
    session.courtAppearances[nomsId] = courtAppearance
  }

  setNextCourtAppearanceAcceptedTrue(session: CookieSessionInterfaces.CookieSessionObject, nomsId: string) {
    const courtAppearance = this.getCourtAppearance(session, nomsId)
    courtAppearance.nextCourtAppearanceAccepted = true
    // eslint-disable-next-line no-param-reassign
    session.courtAppearances[nomsId] = courtAppearance
  }

  isNextCourtAppearanceAccepted(session: CookieSessionInterfaces.CookieSessionObject, nomsId: string): boolean {
    const courtAppearance = this.getCourtAppearance(session, nomsId)
    return courtAppearance.nextCourtAppearanceAccepted
  }

  getNextHearingSelect(session: CookieSessionInterfaces.CookieSessionObject, nomsId: string): boolean {
    return this.getCourtAppearance(session, nomsId).nextHearingSelect
  }

  setNextHearingSelect(
    session: CookieSessionInterfaces.CookieSessionObject,
    nomsId: string,
    nextHearingSelectForm: CourtCaseNextHearingSelectForm,
  ) {
    const errors = validate(
      nextHearingSelectForm,
      {
        nextHearingSelect: 'required',
      },
      {
        'required.nextHearingSelect': 'You must select the hearing has been set',
      },
    )
    if (errors.length === 0) {
      const courtAppearance = this.getCourtAppearance(session, nomsId)
      const previousNextHearingSelect = courtAppearance.nextHearingSelect
      courtAppearance.nextHearingSelect = nextHearingSelectForm.nextHearingSelect === 'true'
      if (!courtAppearance.nextHearingSelect) {
        delete courtAppearance.nextHearingCourtCode
        delete courtAppearance.nextHearingDate
        delete courtAppearance.nextHearingTimeSet
        delete courtAppearance.nextHearingTypeUuid
      }
      if (previousNextHearingSelect !== courtAppearance.nextHearingSelect) {
        courtAppearance.nextCourtAppearanceAccepted = !courtAppearance.nextHearingSelect
      }
      // eslint-disable-next-line no-param-reassign
      session.courtAppearances[nomsId] = courtAppearance
    }
    return errors
  }

  getNextHearingTypeUuid(session: CookieSessionInterfaces.CookieSessionObject, nomsId: string): string {
    return this.getCourtAppearance(session, nomsId).nextHearingTypeUuid
  }

  setNextHearingType(
    session: CookieSessionInterfaces.CookieSessionObject,
    nomsId: string,
    nextHearingTypeForm: CourtCaseNextHearingTypeForm,
  ) {
    const errors = validate(
      nextHearingTypeForm,
      {
        nextHearingType: 'required',
      },
      {
        'required.nextHearingType': 'You must select the next hearing type',
      },
    )
    if (errors.length === 0) {
      const courtAppearance = this.getCourtAppearance(session, nomsId)
      courtAppearance.nextHearingTypeUuid = nextHearingTypeForm.nextHearingType
      // eslint-disable-next-line no-param-reassign
      session.courtAppearances[nomsId] = courtAppearance
    }
    return errors
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
    let isValidDateRule = ''
    if (
      nextHearingDateForm['nextHearingDate-day'] !== undefined &&
      nextHearingDateForm['nextHearingDate-month'] !== undefined &&
      nextHearingDateForm['nextHearingDate-year'] !== undefined
    ) {
      const nextHearingDateString = toDateString(
        nextHearingDateForm['nextHearingDate-year'],
        nextHearingDateForm['nextHearingDate-month'],
        nextHearingDateForm['nextHearingDate-day'],
      )
      isValidDateRule = `|isValidDate:${nextHearingDateString}|isFutureDate:${nextHearingDateString}`
    }
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
        'isFutureDate.nextHearingDate-day': 'The next court date must be in the future',
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

  setOverallConvictionDate(
    session: CookieSessionInterfaces.CookieSessionObject,
    nomsId: string,
    overallConvictionDateForm: CourtCaseOverallConvictionDateForm,
  ): {
    text: string
    href: string
  }[] {
    let isValidOverallConvictionDateRule = ''
    if (
      overallConvictionDateForm['overallConvictionDate-day'] &&
      overallConvictionDateForm['overallConvictionDate-month'] &&
      overallConvictionDateForm['overallConvictionDate-year']
    ) {
      const overallConvictionDateString = toDateString(
        overallConvictionDateForm['overallConvictionDate-year'],
        overallConvictionDateForm['overallConvictionDate-month'],
        overallConvictionDateForm['overallConvictionDate-day'],
      )
      isValidOverallConvictionDateRule = `|isValidDate:${overallConvictionDateString}|isPastDate:${overallConvictionDateString}`
    }

    const errors = validate(
      overallConvictionDateForm,
      {
        'overallConvictionDate-day': `required_if:overallConvictionDateAppliedAll,true${isValidOverallConvictionDateRule}`,
        'overallConvictionDate-month': `required_if:overallConvictionDateAppliedAll,true`,
        'overallConvictionDate-year': `required_if:overallConvictionDateAppliedAll,true`,
        overallConvictionDateAppliedAll: 'required',
      },
      {
        'required_if.overallConvictionDate-year': 'Conviction date must include year',
        'required_if.overallConvictionDate-month': 'Conviction date must include month',
        'required_if.overallConvictionDate-day': 'Conviction date must include day',
        'isValidDate.overallConvictionDate-day': 'This date does not exist.',
        'isPastDate.overallConvictionDate-day': 'Conviction date must be in the past',
        'required.overallConvictionDateAppliedAll':
          'Select yes if the conviction date is the same for all offences on the warrant',
      },
    )
    if (errors.length === 0) {
      const courtAppearance = this.getCourtAppearance(session, nomsId)
      courtAppearance.overallConvictionDateAppliedAll = overallConvictionDateForm.overallConvictionDateAppliedAll
      if (overallConvictionDateForm.overallConvictionDateAppliedAll === 'true') {
        const overallConvictionDate = dayjs({
          year: overallConvictionDateForm['overallConvictionDate-year'],
          month: parseInt(overallConvictionDateForm['overallConvictionDate-month'], 10) - 1,
          day: overallConvictionDateForm['overallConvictionDate-day'],
        })

        courtAppearance.overallConvictionDate = overallConvictionDate.toDate()
      }
      // eslint-disable-next-line no-param-reassign
      session.courtAppearances[nomsId] = courtAppearance
    }
    return errors
  }

  getOverallConvictionDate(session: CookieSessionInterfaces.CookieSessionObject, nomsId: string): Date {
    const { overallConvictionDate } = this.getCourtAppearance(session, nomsId)
    return overallConvictionDate ? new Date(overallConvictionDate) : undefined
  }

  setOverallConvictionDateAppliedAll(
    session: CookieSessionInterfaces.CookieSessionObject,
    nomsId: string,
    overallConvictionDateAppliedAllForm: CourtCaseOverallConvictionDateAppliedAllForm,
  ) {
    const errors = validate(
      overallConvictionDateAppliedAllForm,
      {
        overallConvictionDateAppliedAll: 'required',
      },
      {
        'required.overallConvictionDateAppliedAll':
          'Select ‘Yes’ if this conviction date applies to all offences on the warrant.',
      },
    )
    if (errors.length === 0) {
      const courtAppearance = this.getCourtAppearance(session, nomsId)
      courtAppearance.overallConvictionDateAppliedAll =
        overallConvictionDateAppliedAllForm.overallConvictionDateAppliedAll
      if (overallConvictionDateAppliedAllForm.overallConvictionDateAppliedAll === 'true') {
        courtAppearance.offences = courtAppearance.offences.map(offence => {
          const sentence = offence.sentence ?? {}
          sentence.convictionDate = courtAppearance.overallConvictionDate
          // eslint-disable-next-line no-param-reassign
          offence.sentence = sentence
          return offence
        })
      }
      // eslint-disable-next-line no-param-reassign
      session.courtAppearances[nomsId] = courtAppearance
    }
    return errors
  }

  getOverallConvictionDateAppliedAll(session: CookieSessionInterfaces.CookieSessionObject, nomsId: string): string {
    return this.getCourtAppearance(session, nomsId).overallConvictionDateAppliedAll
  }

  sessionCourtAppearanceExists(
    session: CookieSessionInterfaces.CookieSessionObject,
    nomsId: string,
    appearanceReference: string,
  ): boolean {
    return (
      session.courtAppearances[nomsId] !== undefined &&
      session.courtAppearances[nomsId].appearanceReference === appearanceReference
    )
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
  ) {
    const courtAppearance = this.getCourtAppearance(session, nomsId)
    if (courtAppearance.offences.length > offenceReference) {
      courtAppearance.offences[offenceReference] = offence
    } else {
      courtAppearance.offences.push(offence)
    }
    // eslint-disable-next-line no-param-reassign
    session.courtAppearances[nomsId] = courtAppearance
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
