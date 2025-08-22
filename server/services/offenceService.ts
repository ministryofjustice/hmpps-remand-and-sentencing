import type {
  FirstSentenceConsecutiveToForm,
  OffenceAlternativePeriodLengthForm,
  OffenceConfirmOffenceForm,
  OffenceConvictionDateForm,
  OffenceCountNumberForm,
  OffenceFineAmountForm,
  OffenceOffenceCodeForm,
  OffenceOffenceDateForm,
  OffenceOffenceNameForm,
  OffenceOffenceOutcomeForm,
  OffenceSentenceServeTypeForm,
  OffenceSentenceTypeForm,
  SentenceConsecutiveToForm,
  SentenceIsSentenceConsecutiveToForm,
  SentenceLengthForm,
  UpdateOffenceOutcomesForm,
} from 'forms'
import type { Offence, Sentence, SentenceLength } from 'models'
import dayjs from 'dayjs'
import { SessionData } from 'express-session'
import validate from '../validation/validation'
import { extractKeyValue, toDateString } from '../utils/utils'
import {
  alternativeSentenceLengthFormToSentenceLength,
  sentenceLengthFormToSentenceLength,
} from '../utils/mappingUtils'
import ManageOffencesService from './manageOffencesService'
import sentenceTypePeriodLengths from '../resources/sentenceTypePeriodLengths'
import periodLengthTypeHeadings from '../resources/PeriodLengthTypeHeadings'
import type { Offence as ApiOffence } from '../@types/manageOffencesApi/manageOffencesClientTypes'
import OffenceOutcomeService from './offenceOutcomeService'
import { OffenceOutcome } from '../@types/remandAndSentencingApi/remandAndSentencingClientTypes'
import RemandAndSentencingService from './remandAndSentencingService'
import sentenceServeTypes from '../resources/sentenceServeTypes'

export default class OffenceService {
  constructor(
    private readonly manageOffencesService: ManageOffencesService,
    private readonly offenceOutcomeService: OffenceOutcomeService,
    private readonly remandAndSentencingService: RemandAndSentencingService,
  ) {}

  setOffenceDates(
    session: Partial<SessionData>,
    nomsId: string,
    courtCaseReference: string,
    offenceOffenceDateForm: OffenceOffenceDateForm,
    warrantDate: Date,
    overallConvictionDate: Date,
  ) {
    const id = this.getOffenceId(nomsId, courtCaseReference)
    const offence = this.getOffence(session.offences, id)
    let convictionDateString = ''
    if (offence.sentence?.convictionDate) {
      const convictionDate = new Date(offence.sentence.convictionDate)
      convictionDateString = toDateString(
        convictionDate.getFullYear().toString(),
        (convictionDate.getMonth() + 1).toString(),
        convictionDate.getDate().toString(),
      )
    } else if (overallConvictionDate) {
      convictionDateString = toDateString(
        overallConvictionDate.getFullYear().toString(),
        (overallConvictionDate.getMonth() + 1).toString(),
        overallConvictionDate.getDate().toString(),
      )
    }
    let isValidOffenceStartDateRule = ''
    let startDateString = ''
    const warrantDateString = toDateString(
      warrantDate.getFullYear().toString(),
      (warrantDate.getMonth() + 1).toString(),
      warrantDate.getDate().toString(),
    )
    if (
      offenceOffenceDateForm['offenceStartDate-day'] &&
      offenceOffenceDateForm['offenceStartDate-month'] &&
      offenceOffenceDateForm['offenceStartDate-year']
    ) {
      startDateString = toDateString(
        offenceOffenceDateForm['offenceStartDate-year'],
        offenceOffenceDateForm['offenceStartDate-month'],
        offenceOffenceDateForm['offenceStartDate-day'],
      )
      isValidOffenceStartDateRule = `|isValidDate:${startDateString}|isPastDate:${startDateString}|isWithinLast100Years:${startDateString}|isBeforeWarrantDate:${warrantDateString},${startDateString}`
      if (convictionDateString) {
        isValidOffenceStartDateRule += `|isBeforeConvictionDate:${convictionDateString},${startDateString}`
      }
    }

    let isValidOffenceEndDateRule = ''
    let endDateString = ''
    if (
      offenceOffenceDateForm['offenceEndDate-day'] &&
      offenceOffenceDateForm['offenceEndDate-month'] &&
      offenceOffenceDateForm['offenceEndDate-year']
    ) {
      endDateString = toDateString(
        offenceOffenceDateForm['offenceEndDate-year'],
        offenceOffenceDateForm['offenceEndDate-month'],
        offenceOffenceDateForm['offenceEndDate-day'],
      )
      isValidOffenceEndDateRule = `|isValidDate:${endDateString}|isPastDate:${endDateString}|isWithinLast100Years:${endDateString}|isBeforeWarrantDate:${warrantDateString},${endDateString}`
      if (startDateString) {
        isValidOffenceEndDateRule += `|isAfterDate:${startDateString},${endDateString}`
      }
      if (convictionDateString) {
        isValidOffenceEndDateRule += `|isBeforeConvictionDate:${convictionDateString},${endDateString}`
      }
    }

    const errors = validate(
      offenceOffenceDateForm,
      {
        'offenceStartDate-day': `required${isValidOffenceStartDateRule}`,
        'offenceStartDate-month': `required`,
        'offenceStartDate-year': `required`,
        'offenceEndDate-day': `requiredFieldWith:offenceEndDate-month,offenceEndDate-year${isValidOffenceEndDateRule}`,
        'offenceEndDate-month': 'requiredFieldWith:offenceEndDate-day,offenceEndDate-year',
        'offenceEndDate-year': 'requiredFieldWith:offenceEndDate-day,offenceEndDate-month',
      },
      {
        'required.offenceStartDate-year': 'Offence start date must include year',
        'required.offenceStartDate-month': 'Offence start date must include month',
        'required.offenceStartDate-day': 'Offence start date must include day',
        'isValidDate.offenceStartDate-day': 'This date does not exist.',
        'isPastDate.offenceStartDate-day': 'The offence start date must be a date from the past',
        'isWithinLast100Years.offenceStartDate-day': 'All dates must be within the last 100 years from today’s date',
        'isBeforeWarrantDate.offenceStartDate-day': 'The offence start date must be before the warrant date',
        'isBeforeConvictionDate.offenceStartDate-day': 'The offence start date must be before the conviction date',
        'requiredFieldWith.offenceEndDate-day': 'Offence end date must include day',
        'requiredFieldWith.offenceEndDate-month': 'Offence end date must include month',
        'requiredFieldWith.offenceEndDate-year': 'Offence end date must include year',
        'isValidDate.offenceEndDate-day': 'This date does not exist.',
        'isPastDate.offenceEndDate-day': 'The offence end date must be a date from the past',
        'isAfterDate.offenceEndDate-day': 'The offence end date must be after the offence start date',
        'isWithinLast100Years.offenceEndDate-day': 'All dates must be within the last 100 years from today’s date',
        'isBeforeWarrantDate.offenceEndDate-day': 'The offence end date must be before the warrant date',
        'isBeforeConvictionDate.offenceEndDate-day': 'The offence end date must be before the conviction date',
      },
    )

    if (errors.length === 0) {
      const offenceStartDate = dayjs({
        year: offenceOffenceDateForm['offenceStartDate-year'],
        month: parseInt(offenceOffenceDateForm['offenceStartDate-month'], 10) - 1,
        day: offenceOffenceDateForm['offenceStartDate-day'],
      })

      offence.offenceStartDate = offenceStartDate.toDate()
      if (offenceOffenceDateForm['offenceEndDate-day']) {
        const offenceEndDate = dayjs({
          year: offenceOffenceDateForm['offenceEndDate-year'],
          month: parseInt(offenceOffenceDateForm['offenceEndDate-month'], 10) - 1,
          day: offenceOffenceDateForm['offenceEndDate-day'],
        })

        offence.offenceEndDate = offenceEndDate.toDate()
      } else {
        delete offence.offenceEndDate
      }
      // eslint-disable-next-line no-param-reassign
      session.offences[id] = offence
    }
    return errors
  }

  async setOffenceCode(
    session: Partial<SessionData>,
    nomsId: string,
    courtCaseReference: string,
    username: string,
    offenceCodeForm: OffenceOffenceCodeForm,
  ): Promise<{
    errors: {
      text?: string
      html?: string
      href: string
    }[]
    offence: ApiOffence
  }> {
    const errors = validate(
      offenceCodeForm,
      {
        offenceCode: `required_without:unknownCode|onlyOne:${offenceCodeForm.unknownCode ?? ''}`,
        unknownCode: `onlyOne:${offenceCodeForm.offenceCode ?? ''}`,
      },
      {
        'onlyOne.offenceCode': 'Either code or unknown must be submitted',
        'onlyOne.unknownCode': 'Either code or unknown must be submitted',
        'required_without.offenceCode': 'You must enter the offence code',
      },
    )
    let apiOffence
    if (offenceCodeForm.offenceCode && !offenceCodeForm.unknownCode) {
      apiOffence = await this.manageOffencesService.getOffenceByCode(offenceCodeForm.offenceCode, username, '')
      if (apiOffence.id === -1) {
        errors.push({ text: 'You must enter a valid offence code.', href: '#offenceCode' })
      }
    }
    if (errors.length === 0 && offenceCodeForm.offenceCode) {
      const id = this.getOffenceId(nomsId, courtCaseReference)
      const offence = this.getOffence(session.offences, id)
      offence.offenceCode = offenceCodeForm.offenceCode
      // eslint-disable-next-line no-param-reassign
      session.offences[id] = offence
    }
    return { errors, offence: apiOffence }
  }

  async setOffenceCodeFromLookup(
    session: Partial<SessionData>,
    nomsId: string,
    courtCaseReference: string,
    username: string,
    offenceNameForm: OffenceOffenceNameForm,
  ): Promise<{
    errors: {
      text?: string
      html?: string
      href: string
    }[]
    offence: ApiOffence
  }> {
    const errors = validate(
      offenceNameForm,
      {
        offenceName: 'required',
      },
      {
        'required.offenceName': 'You must enter the offence',
      },
    )
    const [offenceCode] = offenceNameForm.offenceName.split(' ')
    let apiOffence
    if (offenceCode) {
      apiOffence = await this.manageOffencesService.getOffenceByCode(offenceCode, username, '')
      if (apiOffence.id === -1) {
        errors.push({ text: 'You must enter a valid offence code.', href: '#offenceCode' })
      }
    }
    if (errors.length === 0) {
      const id = this.getOffenceId(nomsId, courtCaseReference)
      const offence = this.getOffence(session.offences, id)
      offence.offenceCode = offenceCode
      // eslint-disable-next-line no-param-reassign
      session.offences[id] = offence
    }
    return { errors, offence: apiOffence }
  }

  setOffenceCodeFromConfirm(
    session: Partial<SessionData>,
    nomsId: string,
    courtCaseReference: string,
    confirmOffenceForm: OffenceConfirmOffenceForm,
  ) {
    const id = this.getOffenceId(nomsId, courtCaseReference)
    const offence = this.getOffence(session.offences, id)
    offence.offenceCode = confirmOffenceForm.offenceCode
    // eslint-disable-next-line no-param-reassign
    session.offences[id] = offence
  }

  getOffenceCode(session: Partial<SessionData>, nomsId: string, courtCaseReference: string) {
    const id = this.getOffenceId(nomsId, courtCaseReference)
    return this.getOffence(session.offences, id).offenceCode
  }

  getCountNumber(session: Partial<SessionData>, nomsId: string, courtCaseReference: string) {
    const id = this.getOffenceId(nomsId, courtCaseReference)
    return this.getOffence(session.offences, id).sentence?.countNumber
  }

  async setCountNumber(
    session: Partial<SessionData>,
    nomsId: string,
    courtCaseReference: string,
    offenceReference: string,
    countNumberForm: OffenceCountNumberForm,
    isRepeatJourney: boolean,
    existingCountNumbers: string[],
    username: string,
  ) {
    let checkCountNumbers = existingCountNumbers
    if (isRepeatJourney) {
      const courtCaseCountNumbers = await this.remandAndSentencingService.getCourtCaseCountNumbers(
        courtCaseReference,
        username,
      )
      checkCountNumbers = checkCountNumbers.concat(
        courtCaseCountNumbers.countNumbers.map(countNumber => countNumber.countNumber),
      )
    }
    let notInRule = ''
    if (checkCountNumbers.length && countNumberForm.countNumber && countNumberForm.hasCountNumber === 'true') {
      notInRule = `|not_in:${checkCountNumbers.join(',')}`
    }
    const errors = validate(
      countNumberForm,
      {
        countNumber: `required_if:hasCountNumber,true|minNumber:1|wholeNumber${notInRule}`,
        hasCountNumber: 'required',
      },
      {
        'required_if.countNumber': 'You must enter a count number.',
        'minNumber.countNumber': 'You must enter a number greater than zero.',
        'wholeNumber.countNumber': 'Enter a whole number for the count number.',
        'required.hasCountNumber': 'You must enter a count number.',
        'not_in.countNumber': 'You must enter a unique count number',
      },
    )
    if (errors.length === 0) {
      const id = this.getOffenceId(nomsId, courtCaseReference)
      const offence = this.getOffence(session.offences, id)
      const sentence = this.getSentence(offence, offenceReference)
      sentence.hasCountNumber = countNumberForm.hasCountNumber
      if (countNumberForm.hasCountNumber === 'true') {
        sentence.countNumber = countNumberForm.countNumber
      } else {
        sentence.countNumber = '-1'
      }

      offence.sentence = sentence
      // eslint-disable-next-line no-param-reassign
      session.offences[id] = offence
    }
    return errors
  }

  async setOffenceOutcome(
    session: Partial<SessionData>,
    nomsId: string,
    courtCaseReference: string,
    offenceOutcomeForm: OffenceOffenceOutcomeForm,
    username: string,
  ): Promise<{
    errors: {
      text?: string
      html?: string
      href: string
    }[]
    outcome: OffenceOutcome
  }> {
    const errors = validate(
      offenceOutcomeForm,
      { offenceOutcome: 'required' },
      { 'required.offenceOutcome': 'You must select the offence outcome' },
    )
    let outcome: OffenceOutcome
    if (errors.length === 0) {
      const id = this.getOffenceId(nomsId, courtCaseReference)
      const offence = this.getOffence(session.offences, id)
      offence.outcomeUuid = offenceOutcomeForm.offenceOutcome
      offence.updatedOutcome = true
      outcome = await this.offenceOutcomeService.getOutcomeById(offence.outcomeUuid, username)
      if (outcome.outcomeType !== 'SENTENCING') {
        delete offence.sentence
      }
      // eslint-disable-next-line no-param-reassign
      session.offences[id] = offence
    }
    return { errors, outcome }
  }

  updateOffenceOutcome(
    session: Partial<SessionData>,
    nomsId: string,
    courtCaseReference: string,
    offenceOutcomeForm: OffenceOffenceOutcomeForm,
  ): {
    text?: string
    html?: string
    href: string
  }[] {
    const errors = validate(
      offenceOutcomeForm,
      { offenceOutcome: 'required' },
      { 'required.offenceOutcome': 'You must select the new outcome for this offence' },
    )
    if (errors.length === 0) {
      const id = this.getOffenceId(nomsId, courtCaseReference)
      const offence = this.getOffence(session.offences, id)
      offence.outcomeUuid = offenceOutcomeForm.offenceOutcome
      offence.updatedOutcome = true
      // eslint-disable-next-line no-param-reassign
      session.offences[id] = offence
    }
    return errors
  }

  setSentenceType(
    session: Partial<SessionData>,
    nomsId: string,
    courtCaseReference: string,
    offenceReference: string,
    offenceSentenceTypeForm: OffenceSentenceTypeForm,
  ) {
    const errors = validate(
      offenceSentenceTypeForm,
      {
        sentenceType: 'required',
      },
      {
        'required.sentenceType': 'You must select the sentence type',
      },
    )
    if (errors.length === 0) {
      const id = this.getOffenceId(nomsId, courtCaseReference)
      const offence = this.getOffence(session.offences, id)
      const sentence = this.getSentence(offence, offenceReference)
      const [sentenceTypeId, sentenceTypeClassification] = offenceSentenceTypeForm.sentenceType.split('|')
      sentence.sentenceTypeId = sentenceTypeId
      sentence.sentenceTypeClassification = sentenceTypeClassification
      if (sentence.sentenceTypeClassification !== 'FINE') {
        delete sentence.fineAmount
      }
      offence.sentence = sentence
      // eslint-disable-next-line no-param-reassign
      session.offences[id] = offence
    }
    return errors
  }

  setOffenceFineAmount(
    session: Partial<SessionData>,
    nomsId: string,
    courtCaseReference: string,
    offenceReference: string,
    offenceFineAmountForm: OffenceFineAmountForm,
  ) {
    const errors = validate(
      offenceFineAmountForm,
      {
        fineAmount: 'required|minCurrency|min:0',
      },
      {
        'required.fineAmount': 'You must provide the fine amount',
        'minCurrency.fineAmount': 'The fine amount must be entered in a valid format, such as £21.34',
      },
    )
    if (errors.length === 0) {
      const id = this.getOffenceId(nomsId, courtCaseReference)
      const offence = this.getOffence(session.offences, id)
      const sentence = this.getSentence(offence, offenceReference)
      sentence.fineAmount = offenceFineAmountForm.fineAmount
      // eslint-disable-next-line no-param-reassign
      session.offences[id] = offence
    }
    return errors
  }

  updatePeriodLengths(
    session: Partial<SessionData>,
    nomsId: string,
    courtCaseReference: string,
    offenceReference: string,
    currentOffence: Offence,
  ) {
    const expectedPeriodLengthTypes = sentenceTypePeriodLengths[
      currentOffence.sentence.sentenceTypeClassification
    ].periodLengths.map(periodLength => periodLength.type)
    const currentPeriodLengths =
      currentOffence.sentence?.periodLengths?.map(periodLength => periodLength.periodLengthType) ?? []
    if (!expectedPeriodLengthTypes.every(type => currentPeriodLengths.includes(type))) {
      const id = this.getOffenceId(nomsId, courtCaseReference)
      const offence = this.getOffence(session.offences, id)
      const sentence = this.getSentence(offence, offenceReference)
      const autoAddPeriodLengths = sentenceTypePeriodLengths[
        currentOffence.sentence.sentenceTypeClassification
      ].periodLengths
        .filter(periodLengthConfig => periodLengthConfig.auto)
        .map(periodLengthConfig => {
          return { ...periodLengthConfig.periodLength, uuid: crypto.randomUUID() }
        })
      sentence.periodLengths = autoAddPeriodLengths
      offence.sentence = sentence
      // eslint-disable-next-line no-param-reassign
      session.offences[id] = offence
    }
  }

  setInitialPeriodLengths(
    session: Partial<SessionData>,
    nomsId: string,
    courtCaseReference: string,
    offenceReference: string,
    periodLengths: SentenceLength[],
  ) {
    const id = this.getOffenceId(nomsId, courtCaseReference)
    const offence = this.getOffence(session.offences, id)
    const sentence = this.getSentence(offence, offenceReference)
    sentence.periodLengths = periodLengths
    offence.sentence = sentence
    // eslint-disable-next-line no-param-reassign
    session.offences[id] = offence
  }

  setPeriodLength(
    session: Partial<SessionData>,
    nomsId: string,
    courtCaseReference: string,
    offenceReference: string,
    offenceSentenceLengthForm: SentenceLengthForm,
    periodLengthType: string,
  ) {
    const errors = validate(
      offenceSentenceLengthForm,
      {
        'sentenceLength-years': 'requireSentenceLength|minWholeNumber:0|requireOneNonZeroSentenceLength',
        'sentenceLength-months': 'minWholeNumber:0',
        'sentenceLength-weeks': 'minWholeNumber:0',
        'sentenceLength-days': 'minWholeNumber:0',
      },
      {
        'requireSentenceLength.sentenceLength-years': 'You must enter the sentence length',
        'minWholeNumber.sentenceLength-years': 'The number must be a whole number, or 0',
        'minWholeNumber.sentenceLength-months': 'The number must be a whole number, or 0',
        'minWholeNumber.sentenceLength-weeks': 'The number must be a whole number, or 0',
        'minWholeNumber.sentenceLength-days': 'The number must be a whole number, or 0',
        'requireOneNonZeroSentenceLength.sentenceLength-years': 'The sentence length cannot be 0',
      },
    )
    if (errors.length === 0) {
      const id = this.getOffenceId(nomsId, courtCaseReference)
      const offence = this.getOffence(session.offences, id)
      const sentence = this.getSentence(offence, offenceReference)
      const periodLengths = sentence.periodLengths ?? []
      const sentenceLength = sentenceLengthFormToSentenceLength(
        offenceSentenceLengthForm,
        periodLengthType,
        periodLengthTypeHeadings[periodLengthType],
      )
      const index = periodLengths.findIndex(periodLength => periodLength.periodLengthType === periodLengthType)
      if (index !== -1) {
        periodLengths[index] = {
          ...sentenceLength,
          description: sentenceLength.description ?? periodLengths[index].description,
          legacyData: periodLengths[index].legacyData,
          uuid: periodLengths[index].uuid,
        }
      } else {
        periodLengths.push(sentenceLength)
      }
      sentence.periodLengths = periodLengths
      offence.sentence = sentence
      // eslint-disable-next-line no-param-reassign
      session.offences[id] = offence
    }
    return errors
  }

  setAlternativePeriodLength(
    session: Partial<SessionData>,
    nomsId: string,
    courtCaseReference: string,
    offenceReference: string,
    offenceAlternativeSentenceLengthForm: OffenceAlternativePeriodLengthForm,
    periodLengthType: string,
  ) {
    const errors = validate(
      offenceAlternativeSentenceLengthForm,
      {
        'firstSentenceLength-value':
          'requireAlternativeSentenceLength|minWholeNumber:0|requireOneNonZeroAlternativeSentenceLength',
        'secondSentenceLength-value': 'minWholeNumber:0',
        'thirdSentenceLength-value': 'minWholeNumber:0',
        'fourthSentenceLength-value': 'minWholeNumber:0',
      },
      {
        'requireAlternativeSentenceLength.firstSentenceLength-value': 'You must enter the sentence length',
        'minWholeNumber.firstSentenceLength-value': 'The number must be a whole number, or 0',
        'minWholeNumber.secondSentenceLength-value': 'The number must be a whole number, or 0',
        'minWholeNumber.thirdSentenceLength-value': 'The number must be a whole number, or 0',
        'minWholeNumber.fourthSentenceLength-value': 'The number must be a whole number, or 0',
        'requireOneNonZeroAlternativeSentenceLength.firstSentenceLength-value': 'The sentence length cannot be 0',
      },
    )
    if (errors.length === 0) {
      const sentenceLength = alternativeSentenceLengthFormToSentenceLength<OffenceAlternativePeriodLengthForm>(
        offenceAlternativeSentenceLengthForm,
        periodLengthType,
        periodLengthTypeHeadings[periodLengthType],
      )
      const id = this.getOffenceId(nomsId, courtCaseReference)
      const offence = this.getOffence(session.offences, id)
      const sentence = this.getSentence(offence, offenceReference)
      const periodLengths = sentence.periodLengths ?? []
      const index = periodLengths.findIndex(periodLength => periodLength.periodLengthType === periodLengthType)
      if (index !== -1) {
        periodLengths[index] = sentenceLength
      } else {
        periodLengths.push(sentenceLength)
      }
      sentence.periodLengths = periodLengths
      offence.sentence = sentence
      // eslint-disable-next-line no-param-reassign
      session.offences[id] = offence
    }
    return errors
  }

  getSentenceServeType(session: Partial<SessionData>, nomsId: string, courtCaseReference: string) {
    const id = this.getOffenceId(nomsId, courtCaseReference)
    const sentenceServeType = this.getOffence(session.offences, id).sentence?.sentenceServeType
    return sentenceServeType ? `${sentenceServeType}` : undefined
  }

  setSentenceServeType(
    session: Partial<SessionData>,
    nomsId: string,
    courtCaseReference: string,
    offenceReference: string,
    offenceSentenceServeTypeForm: OffenceSentenceServeTypeForm,
    existingSentenceServeType: string,
    sentenceIsInChain: boolean,
  ) {
    const errors = validate(
      offenceSentenceServeTypeForm,
      {
        sentenceServeType: 'required',
      },
      {
        'required.sentenceServeType': `You must select the consecutive or concurrent`,
      },
    )
    if (errors.length === 0) {
      const id = this.getOffenceId(nomsId, courtCaseReference)
      const offence = this.getOffence(session.offences, id)
      const sentence = this.getSentence(offence, offenceReference)
      if (
        !existingSentenceServeType ||
        !sentenceIsInChain ||
        offenceSentenceServeTypeForm.sentenceServeType !==
          extractKeyValue(sentenceServeTypes, sentenceServeTypes.CONCURRENT)
      ) {
        sentence.sentenceServeType = offenceSentenceServeTypeForm.sentenceServeType
        delete sentence.consecutiveToSentenceReference
        delete sentence.consecutiveToSentenceUuid
      }

      offence.sentence = sentence
      // eslint-disable-next-line no-param-reassign
      session.offences[id] = offence
    }
    return errors
  }

  setConvictionDate(
    session: Partial<SessionData>,
    nomsId: string,
    courtCaseReference: string,
    offenceReference: string,
    convictionDate: Date,
  ) {
    const id = this.getOffenceId(nomsId, courtCaseReference)
    const offence = this.getOffence(session.offences, id)
    const sentence = this.getSentence(offence, offenceReference)
    sentence.convictionDate = convictionDate
    offence.sentence = sentence
    // eslint-disable-next-line no-param-reassign
    session.offences[id] = offence
  }

  setConvictionDateForm(
    session: Partial<SessionData>,
    nomsId: string,
    courtCaseReference: string,
    offenceReference: string,
    offenceConvictionDateForm: OffenceConvictionDateForm,
    addOrEditCourtAppearance: string,
    warrantDate: Date,
  ): {
    text?: string
    html?: string
    href: string
  }[] {
    let isValidConvictionDateRule = ''
    if (
      offenceConvictionDateForm['convictionDate-day'] &&
      offenceConvictionDateForm['convictionDate-month'] &&
      offenceConvictionDateForm['convictionDate-year']
    ) {
      const convictionDateString = toDateString(
        offenceConvictionDateForm['convictionDate-year'],
        offenceConvictionDateForm['convictionDate-month'],
        offenceConvictionDateForm['convictionDate-day'],
      )
      isValidConvictionDateRule = `|isValidDate:${convictionDateString}|isPastOrCurrentDate:${convictionDateString}|isWithinLast100Years:${convictionDateString}`
    }

    const errors = validate(
      offenceConvictionDateForm,
      {
        'convictionDate-day': `required${isValidConvictionDateRule}`,
        'convictionDate-month': `required`,
        'convictionDate-year': `required`,
      },
      {
        'required.convictionDate-year': 'Conviction date must include year',
        'required.convictionDate-month': 'Conviction date must include month',
        'required.convictionDate-day': 'Conviction date must include day',
        'isValidDate.convictionDate-day': 'This date does not exist.',
        'isPastOrCurrentDate.convictionDate-day': 'The conviction date cannot be a date in the future',
        'isWithinLast100Years.overallConvictionDate-day':
          'All dates must be within the last 100 years from today’s date',
      },
    )
    if (errors.length === 0) {
      const convictionDate = dayjs({
        year: offenceConvictionDateForm['convictionDate-year'],
        month: parseInt(offenceConvictionDateForm['convictionDate-month'], 10) - 1,
        day: offenceConvictionDateForm['convictionDate-day'],
      })
      const id = this.getOffenceId(nomsId, courtCaseReference)
      const offence = this.getOffence(session.offences, id)
      const sentence = this.getSentence(offence, offenceReference)

      if (addOrEditCourtAppearance === 'add-court-appearance') {
        if (warrantDate && convictionDate.isAfter(dayjs(warrantDate))) {
          return [
            {
              text: 'The conviction date must be on or before the warrant date',
              href: '#convictionDate',
            },
          ]
        }

        const offenceStartDate = dayjs(offence.offenceStartDate)
        const offenceEndDate = offence.offenceEndDate ? dayjs(offence.offenceEndDate) : null

        if (offenceEndDate && !convictionDate.isAfter(offenceEndDate)) {
          return [
            {
              text: 'The conviction date must be after the offence start date and offence end date',
              href: '#convictionDate',
            },
          ]
        }

        if (!offenceEndDate && !convictionDate.isAfter(offenceStartDate)) {
          return [
            {
              text: 'The conviction date must be after the offence start date',
              href: '#convictionDate',
            },
          ]
        }
      }

      sentence.convictionDate = convictionDate.toDate()

      offence.sentence = sentence
      // eslint-disable-next-line no-param-reassign
      session.offences[id] = offence
    }
    return errors
  }

  validateUpdateOffenceOutcomesForm(updateOffenceOutcomesForm: UpdateOffenceOutcomesForm) {
    const errors = validate(
      updateOffenceOutcomesForm,
      {
        finishedReviewOffenceOutcomes: 'required',
      },
      {
        'required.finishedReviewOffenceOutcomes': 'Select whether you have finished reviewing offences.',
      },
    )

    return errors
  }

  setIsSentenceConsecutiveTo(
    session: Partial<SessionData>,
    nomsId: string,
    courtCaseReference: string,
    offenceReference: string,
    sentenceIsSentenceConsecutiveToForm: SentenceIsSentenceConsecutiveToForm,
  ): {
    text?: string
    html?: string
    href: string
  }[] {
    const errors = validate(
      sentenceIsSentenceConsecutiveToForm,
      {
        isSentenceConsecutiveToAnotherCase: 'required',
      },
      {
        'required.isSentenceConsecutiveToAnotherCase':
          'Select Yes if the sentence is consecutive to a sentence on another case',
      },
    )
    if (errors.length === 0) {
      const id = this.getOffenceId(nomsId, courtCaseReference)
      const offence = this.getOffence(session.offences, id)
      const sentence = this.getSentence(offence, offenceReference)
      sentence.isSentenceConsecutiveToAnotherCase =
        sentenceIsSentenceConsecutiveToForm.isSentenceConsecutiveToAnotherCase
      offence.sentence = sentence
      // eslint-disable-next-line no-param-reassign
      session.offences[id] = offence
    }
    return errors
  }

  setFirstSentenceConsecutiveTo(
    session: Partial<SessionData>,
    nomsId: string,
    courtCaseReference: string,
    offenceReference: string,
    firstSentenceConsecutiveToForm: FirstSentenceConsecutiveToForm,
  ): {
    text?: string
    html?: string
    href: string
  }[] {
    const errors = validate(
      firstSentenceConsecutiveToForm,
      {
        consecutiveToSentenceUuid: 'required',
      },
      {
        'required.consecutiveToSentenceUuid': 'Select the sentence that this sentence is consecutive to',
      },
    )
    if (errors.length === 0) {
      const id = this.getOffenceId(nomsId, courtCaseReference)
      const offence = this.getOffence(session.offences, id)
      const sentence = this.getSentence(offence, offenceReference)
      sentence.consecutiveToSentenceUuid = firstSentenceConsecutiveToForm.consecutiveToSentenceUuid
      offence.sentence = sentence
      // eslint-disable-next-line no-param-reassign
      session.offences[id] = offence
    }
    return errors
  }

  setSentenceConsecutiveTo(
    session: Partial<SessionData>,
    nomsId: string,
    courtCaseReference: string,
    offenceReference: string,
    sentenceConsecutiveToForm: SentenceConsecutiveToForm,
  ): {
    text?: string
    html?: string
    href: string
  }[] {
    const errors = validate(
      sentenceConsecutiveToForm,
      {
        consecutiveToSentenceUuid: 'required',
      },
      {
        'required.consecutiveToSentenceUuid': 'Select the sentence that this sentence is consecutive to',
      },
    )
    if (errors.length === 0) {
      const id = this.getOffenceId(nomsId, courtCaseReference)
      const offence = this.getOffence(session.offences, id)
      const sentence = this.getSentence(offence, offenceReference)
      const [sentenceReference, sameOrOther] = sentenceConsecutiveToForm.consecutiveToSentenceUuid.split('|')
      if (sameOrOther === 'SAME') {
        sentence.consecutiveToSentenceReference = sentenceReference
        delete sentence.consecutiveToSentenceUuid
      } else {
        sentence.consecutiveToSentenceUuid = sentenceReference
        delete sentence.consecutiveToSentenceReference
      }
      offence.sentence = sentence
      // eslint-disable-next-line no-param-reassign
      session.offences[id] = offence
    }
    return errors
  }

  getSessionOffence(session: Partial<SessionData>, nomsId: string, courtCaseReference: string): Offence {
    const id = this.getOffenceId(nomsId, courtCaseReference)
    return this.getOffence(session.offences, id)
  }

  setSessionOffence(session: Partial<SessionData>, nomsId: string, courtCaseReference: string, offence: Offence) {
    const id = this.getOffenceId(nomsId, courtCaseReference)
    // eslint-disable-next-line no-param-reassign
    session.offences[id] = offence
  }

  invalidateFromOffenceDate(
    session: Partial<SessionData>,
    nomsId: string,
    courtCaseReference: string,
    offenceReference: string,
  ) {
    const id = this.getOffenceId(nomsId, courtCaseReference)
    const offence = this.getOffence(session.offences, id)
    const sentence = this.getSentence(offence, offenceReference)
    delete sentence.sentenceTypeClassification
    delete sentence.sentenceTypeId
    delete sentence.periodLengths
    offence.sentence = sentence
    // eslint-disable-next-line no-param-reassign
    session.offences[id] = offence
  }

  invalidateFromConvictionDate(
    session: Partial<SessionData>,
    nomsId: string,
    courtCaseReference: string,
    offenceReference: string,
  ) {
    const id = this.getOffenceId(nomsId, courtCaseReference)
    const offence = this.getOffence(session.offences, id)
    const sentence = this.getSentence(offence, offenceReference)
    delete sentence.sentenceTypeClassification
    delete sentence.sentenceTypeId
    delete sentence.periodLengths
    offence.sentence = sentence
    // eslint-disable-next-line no-param-reassign
    session.offences[id] = offence
  }

  setOnFinishGoToEdit(session: Partial<SessionData>, nomsId: string, courtCaseReference: string) {
    const id = this.getOffenceId(nomsId, courtCaseReference)
    const offence = this.getOffence(session.offences, id)
    offence.onFinishGoToEdit = true
  }

  setSentenceToConcurrent(
    session: Partial<SessionData>,
    nomsId: string,
    courtCaseReference: string,
    offenceReference: string,
  ) {
    this.updateSentenceServType(nomsId, courtCaseReference, session, offenceReference, sentenceServeTypes.CONCURRENT)
  }

  setSentenceToForthwith(
    session: Partial<SessionData>,
    nomsId: string,
    courtCaseReference: string,
    offenceReference: string,
  ) {
    this.updateSentenceServType(nomsId, courtCaseReference, session, offenceReference, sentenceServeTypes.FORTHWITH)
  }

  setSentenceToConsecutive(
    session: Partial<SessionData>,
    nomsId: string,
    courtCaseReference: string,
    offenceReference: string,
  ) {
    this.updateSentenceServType(nomsId, courtCaseReference, session, offenceReference, sentenceServeTypes.CONSECUTIVE)
  }

  private updateSentenceServType(
    nomsId: string,
    courtCaseReference: string,
    session: Partial<SessionData>,
    offenceReference: string,
    sentenceServeType: string,
  ) {
    const id = this.getOffenceId(nomsId, courtCaseReference)
    const offence = this.getOffence(session.offences, id)
    const sentence = this.getSentence(offence, offenceReference)
    sentence.sentenceServeType = extractKeyValue(sentenceServeTypes, sentenceServeType)
    delete sentence.consecutiveToSentenceReference
    delete sentence.consecutiveToSentenceUuid
    offence.sentence = sentence
    // eslint-disable-next-line no-param-reassign
    session.offences[id] = offence
  }

  clearOffence(session: Partial<SessionData>, nomsId: string, courtCaseReference: string) {
    const id = this.getOffenceId(nomsId, courtCaseReference)
    // eslint-disable-next-line no-param-reassign
    delete session.offences[id]
  }

  private getOffenceId(nomsId: string, courtCaseReference: string) {
    return `${nomsId}-${courtCaseReference}`
  }

  private getOffence(offences: Map<string, Offence>, id: string): Offence {
    return offences[id] ?? { chargeUuid: crypto.randomUUID() }
  }

  private getSentence(offence: Offence, sentenceReference: string): Sentence {
    return offence.sentence ?? { sentenceReference, sentenceUuid: crypto.randomUUID() }
  }
}
