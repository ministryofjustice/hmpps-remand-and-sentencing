import type {
  FirstSentenceConsecutiveToForm,
  OffenceAlternativeSentenceLengthForm,
  OffenceConfirmOffenceForm,
  OffenceConsecutiveToForm,
  OffenceConvictionDateForm,
  OffenceCountNumberForm,
  OffenceFineAmountForm,
  OffenceOffenceCodeForm,
  OffenceOffenceDateForm,
  OffenceOffenceNameForm,
  OffenceOffenceOutcomeForm,
  OffenceSentenceServeTypeForm,
  OffenceSentenceTypeForm,
  SentenceIsSentenceConsecutiveToForm,
  SentenceLengthForm,
  UpdateOffenceOutcomesForm,
} from 'forms'
import type { Offence, SentenceLength } from 'models'
import dayjs from 'dayjs'
import validate from '../validation/validation'
import { toDateString } from '../utils/utils'
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

export default class OffenceService {
  constructor(
    private readonly manageOffencesService: ManageOffencesService,
    private readonly offenceOutcomeService: OffenceOutcomeService,
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

  setCountNumber(
    session: CookieSessionInterfaces.CookieSessionObject,
    nomsId: string,
    courtCaseReference: string,
    countNumberForm: OffenceCountNumberForm,
  ) {
    const errors = validate(
      countNumberForm,
      {
        countNumber: 'required_if:hasCountNumber,true|minNumber:1|wholeNumber',
        hasCountNumber: 'required',
      },
      {
        'required_if.countNumber': 'You must enter a count number.',
        'minNumber.countNumber': 'You must enter a number greater than zero.',
        'wholeNumber.countNumber': 'Enter a whole number for the count number.',
        'required.hasCountNumber': 'You must enter a count number.',
      },
    )
    if (errors.length === 0) {
      const id = this.getOffenceId(nomsId, courtCaseReference)
      const offence = this.getOffence(session.offences, id)
      const sentence = offence.sentence ?? {}
      sentence.hasCountNumber = countNumberForm.hasCountNumber
      if (countNumberForm.hasCountNumber === 'true') {
        sentence.countNumber = countNumberForm.countNumber
      } else {
        delete sentence.countNumber
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
      const sentence = offence.sentence ?? {}
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
      const sentence = offence.sentence ?? {}
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
      const sentence = offence.sentence ?? {}
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
    periodLengths: SentenceLength[],
  ) {
    const id = this.getOffenceId(nomsId, courtCaseReference)
    const offence = this.getOffence(session.offences, id)
    const sentence = offence.sentence ?? {}
    sentence.periodLengths = periodLengths
    offence.sentence = sentence
    // eslint-disable-next-line no-param-reassign
    session.offences[id] = offence
  }

  setPeriodLength(
    session: CookieSessionInterfaces.CookieSessionObject,
    nomsId: string,
    courtCaseReference: string,
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
      const sentence = offence.sentence ?? {}
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

  setAlternativeSentenceLength(
    session: CookieSessionInterfaces.CookieSessionObject,
    nomsId: string,
    courtCaseReference: string,
    offenceAlternativeSentenceLengthForm: OffenceAlternativeSentenceLengthForm,
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
      const sentenceLength = alternativeSentenceLengthFormToSentenceLength<OffenceAlternativeSentenceLengthForm>(
        offenceAlternativeSentenceLengthForm,
        'SENTENCE_LENGTH',
      )
      const id = this.getOffenceId(nomsId, courtCaseReference)
      const offence = this.getOffence(session.offences, id)
      const sentence = offence.sentence ?? {}
      const periodLengths = sentence.periodLengths ?? []
      const index = periodLengths.findIndex(periodLength => periodLength.periodLengthType === 'SENTENCE_LENGTH')
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
    offenceSentenceServeTypeForm: OffenceSentenceServeTypeForm,
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
      const sentence = offence.sentence ?? {}
      sentence.sentenceServeType = offenceSentenceServeTypeForm.sentenceServeType
      offence.sentence = sentence
      // eslint-disable-next-line no-param-reassign
      session.offences[id] = offence
    }
    return errors
  }

  setConsecutiveTo(
    session: CookieSessionInterfaces.CookieSessionObject,
    nomsId: string,
    courtCaseReference: string,
    offenceConsecutiveToForm: OffenceConsecutiveToForm,
  ) {
    const errors = validate(
      offenceConsecutiveToForm,
      {
        consecutiveTo: 'required|minWholeNumber:1',
      },
      {
        'required.consecutiveTo': `You must enter the consecutive to`,
        'minWholeNumber.consecutiveTo': 'Enter a whole number for the count number.',
      },
    )

    if (errors.length === 0) {
      const id = this.getOffenceId(nomsId, courtCaseReference)
      const offence = this.getOffence(session.offences, id)
      const sentence = offence.sentence ?? {}
      sentence.consecutiveTo = offenceConsecutiveToForm.consecutiveTo
      offence.sentence = sentence
      // eslint-disable-next-line no-param-reassign
      session.offences[id] = offence
    }

    return errors
  }

  getConvictionDate(
    session: CookieSessionInterfaces.CookieSessionObject,
    nomsId: string,
    courtCaseReference: string,
  ): Date {
    const id = this.getOffenceId(nomsId, courtCaseReference)
    const sentence = this.getOffence(session.offences, id).sentence ?? {}
    return sentence.convictionDate
  }

  setConvictionDate(
    session: CookieSessionInterfaces.CookieSessionObject,
    nomsId: string,
    courtCaseReference: string,
    convictionDate: Date,
  ) {
    const id = this.getOffenceId(nomsId, courtCaseReference)
    const offence = this.getOffence(session.offences, id)
    const sentence = offence.sentence ?? {}
    sentence.convictionDate = convictionDate
    offence.sentence = sentence
    // eslint-disable-next-line no-param-reassign
    session.offences[id] = offence
  }

  setConvictionDateForm(
    session: CookieSessionInterfaces.CookieSessionObject,
    nomsId: string,
    courtCaseReference: string,
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
        'isPastDate.convictionDate-day': 'Conviction date must be in the past',
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
      const sentence = offence.sentence ?? {}
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
      const sentence = offence.sentence ?? {}
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
      const sentence = offence.sentence ?? {}
      sentence.consecutiveToSentenceUuid = firstSentenceConsecutiveToForm.consecutiveToSentenceUuid
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
