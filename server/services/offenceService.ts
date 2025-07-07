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
import validate from '../validation/validation'
import { extractKeyValue, toDateString } from '../utils/utils'
import {
  alternativeSentenceLengthFormToSentenceLength,
  sentenceLengthFormToSentenceLength,
} from '../utils/mappingUtils'
import ManageOffencesService from './manageOffencesService'
import logger from '../../logger'
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
    session: CookieSessionInterfaces.CookieSessionObject,
    nomsId: string,
    courtCaseReference: string,
    offenceOffenceDateForm: OffenceOffenceDateForm,
  ) {
    let isValidOffenceStartDateRule = ''
    let startDateString = ''
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
      isValidOffenceStartDateRule = `|isValidDate:${startDateString}|isPastDate:${startDateString}`
    }
    let isValidOffenceEndDateRule = ''
    if (
      offenceOffenceDateForm['offenceEndDate-day'] &&
      offenceOffenceDateForm['offenceEndDate-month'] &&
      offenceOffenceDateForm['offenceEndDate-year']
    ) {
      const endDateString = toDateString(
        offenceOffenceDateForm['offenceEndDate-year'],
        offenceOffenceDateForm['offenceEndDate-month'],
        offenceOffenceDateForm['offenceEndDate-day'],
      )
      isValidOffenceEndDateRule = `|isValidDate:${endDateString}|isPastDate:${endDateString}`
      if (startDateString) {
        isValidOffenceEndDateRule += `|isAfterDate:${startDateString},${endDateString}`
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
        'isPastDate.offenceStartDate-day': 'Offence start date must use a date from the past',
        'requiredFieldWith.offenceEndDate-day': 'Offence end date must include day',
        'requiredFieldWith.offenceEndDate-month': 'Offence end date must include month',
        'requiredFieldWith.offenceEndDate-year': 'Offence end date must include year',
        'isValidDate.offenceEndDate-day': 'This date does not exist.',
        'isPastDate.offenceEndDate-day': 'Offence end date must use a date from the past',
        'isAfterDate.offenceEndDate-day': 'The offence end date must be after the offence start date',
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
      if (offenceOffenceDateForm['offenceEndDate-day']) {
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

  async setOffenceCode(
    session: CookieSessionInterfaces.CookieSessionObject,
    nomsId: string,
    courtCaseReference: string,
    authToken: string,
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
      try {
        apiOffence = await this.manageOffencesService.getOffenceByCode(offenceCodeForm.offenceCode, authToken)
      } catch (error) {
        logger.error(error)
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
    session: CookieSessionInterfaces.CookieSessionObject,
    nomsId: string,
    courtCaseReference: string,
    authToken: string,
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
      try {
        apiOffence = await this.manageOffencesService.getOffenceByCode(offenceCode, authToken)
      } catch (error) {
        logger.error(error)
        errors.push({ text: 'You must enter a valid offence.', href: '#offenceName' })
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
    session: CookieSessionInterfaces.CookieSessionObject,
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

  getOffenceCode(session: CookieSessionInterfaces.CookieSessionObject, nomsId: string, courtCaseReference: string) {
    const id = this.getOffenceId(nomsId, courtCaseReference)
    return this.getOffence(session.offences, id).offenceCode
  }

  getCountNumber(session: CookieSessionInterfaces.CookieSessionObject, nomsId: string, courtCaseReference: string) {
    const id = this.getOffenceId(nomsId, courtCaseReference)
    return this.getOffence(session.offences, id).sentence?.countNumber
  }

  async setCountNumber(
    session: CookieSessionInterfaces.CookieSessionObject,
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
    session: CookieSessionInterfaces.CookieSessionObject,
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
    session: CookieSessionInterfaces.CookieSessionObject,
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
    session: CookieSessionInterfaces.CookieSessionObject,
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
      offence.sentence = sentence
      // eslint-disable-next-line no-param-reassign
      session.offences[id] = offence
    }
    return errors
  }

  setOffenceFineAmount(
    session: CookieSessionInterfaces.CookieSessionObject,
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
    session: CookieSessionInterfaces.CookieSessionObject,
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
        .map(periodLengthConfig => periodLengthConfig.periodLength)
      sentence.periodLengths = autoAddPeriodLengths
      offence.sentence = sentence
      // eslint-disable-next-line no-param-reassign
      session.offences[id] = offence
    }
  }

  setInitialPeriodLengths(
    session: CookieSessionInterfaces.CookieSessionObject,
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
    session: CookieSessionInterfaces.CookieSessionObject,
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
    session: CookieSessionInterfaces.CookieSessionObject,
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

  setSentenceServeType(
    session: CookieSessionInterfaces.CookieSessionObject,
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
    session: CookieSessionInterfaces.CookieSessionObject,
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
    session: CookieSessionInterfaces.CookieSessionObject,
    nomsId: string,
    courtCaseReference: string,
    offenceReference: string,
    offenceConvictionDateForm: OffenceConvictionDateForm,
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
      isValidConvictionDateRule = `|isValidDate:${convictionDateString}|isPastDate:${convictionDateString}`
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
        'isPastDate.convictionDate-day': 'Conviction date cannot be a date in the future',
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
    session: CookieSessionInterfaces.CookieSessionObject,
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
    session: CookieSessionInterfaces.CookieSessionObject,
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
    session: CookieSessionInterfaces.CookieSessionObject,
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

  getSessionOffence(
    session: CookieSessionInterfaces.CookieSessionObject,
    nomsId: string,
    courtCaseReference: string,
  ): Offence {
    const id = this.getOffenceId(nomsId, courtCaseReference)
    return this.getOffence(session.offences, id)
  }

  setSessionOffence(
    session: CookieSessionInterfaces.CookieSessionObject,
    nomsId: string,
    courtCaseReference: string,
    offence: Offence,
  ) {
    const id = this.getOffenceId(nomsId, courtCaseReference)
    // eslint-disable-next-line no-param-reassign
    session.offences[id] = offence
  }

  invalidateFromOffenceDate(
    session: CookieSessionInterfaces.CookieSessionObject,
    nomsId: string,
    courtCaseReference: string,
    offenceReference: string,
  ) {
    const id = this.getOffenceId(nomsId, courtCaseReference)
    const offence = this.getOffence(session.offences, id)
    const sentence = this.getSentence(offence, offenceReference)
    delete sentence.convictionDate
    delete sentence.sentenceTypeClassification
    delete sentence.sentenceTypeId
    delete sentence.periodLengths
    offence.sentence = sentence
    // eslint-disable-next-line no-param-reassign
    session.offences[id] = offence
  }

  invalidateFromConvictionDate(
    session: CookieSessionInterfaces.CookieSessionObject,
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

  setOnFinishGoToEdit(
    session: CookieSessionInterfaces.CookieSessionObject,
    nomsId: string,
    courtCaseReference: string,
  ) {
    const id = this.getOffenceId(nomsId, courtCaseReference)
    const offence = this.getOffence(session.offences, id)
    offence.onFinishGoToEdit = true
  }

  setSentenceToConcurrent(
    session: CookieSessionInterfaces.CookieSessionObject,
    nomsId: string,
    courtCaseReference: string,
    offenceReference: string,
  ) {
    this.updateSentenceServType(nomsId, courtCaseReference, session, offenceReference, sentenceServeTypes.CONCURRENT)
  }

  setSentenceToForthwith(
    session: CookieSessionInterfaces.CookieSessionObject,
    nomsId: string,
    courtCaseReference: string,
    offenceReference: string,
  ) {
    this.updateSentenceServType(nomsId, courtCaseReference, session, offenceReference, sentenceServeTypes.FORTHWITH)
  }

  setSentenceToConsecutive(
    session: CookieSessionInterfaces.CookieSessionObject,
    nomsId: string,
    courtCaseReference: string,
    offenceReference: string,
  ) {
    this.updateSentenceServType(nomsId, courtCaseReference, session, offenceReference, sentenceServeTypes.CONSECUTIVE)
  }

  private updateSentenceServType(
    nomsId: string,
    courtCaseReference: string,
    session: CookieSessionInterfaces.CookieSessionObject,
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

  private getSentence(offence: Offence, sentenceReference: string): Sentence {
    return offence.sentence ?? { sentenceReference }
  }
}
