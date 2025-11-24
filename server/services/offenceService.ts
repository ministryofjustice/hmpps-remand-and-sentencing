import type {
  CorrectAlternativeManyPeriodLengthsForm,
  CorrectManyPeriodLengthsForm,
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
import type { Offence, Sentence, SentenceLength, CourtAppearance } from 'models'
import dayjs from 'dayjs'
import { SessionData } from 'express-session'
import { groupAndSortPeriodLengths } from '@ministryofjustice/hmpps-court-cases-release-dates-design/hmpps/utils/utils'
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
import { OffenceOutcome } from '../@types/remandAndSentencingApi/remandAndSentencingClientTypes'
import RemandAndSentencingService from './remandAndSentencingService'
import sentenceServeTypes from '../resources/sentenceServeTypes'
import RefDataService from './refDataService'

export default class OffenceService {
  constructor(
    private readonly manageOffencesService: ManageOffencesService,
    private readonly remandAndSentencingService: RemandAndSentencingService,
    private readonly refDataService: RefDataService,
  ) {}

  setOffenceDates(
    session: Partial<SessionData>,
    nomsId: string,
    courtCaseReference: string,
    offenceOffenceDateForm: OffenceOffenceDateForm,
    warrantDate: Date,
    overallConvictionDate: Date,
    chargeUuid: string,
  ) {
    const id = this.getOffenceCompositeId(nomsId, courtCaseReference, chargeUuid)
    const offence = this.getSessionOffence(session, nomsId, courtCaseReference, chargeUuid)
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
    chargeUuid: string,
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
      const id = this.getOffenceCompositeId(nomsId, courtCaseReference, chargeUuid)
      const offence = this.getSessionOffence(session, nomsId, courtCaseReference, chargeUuid)
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
    chargeUuid: string,
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
        errors.push({ text: 'You must enter a valid offence.', href: '#offenceName' })
      }
    }
    if (errors.length === 0) {
      const id = this.getOffenceCompositeId(nomsId, courtCaseReference, chargeUuid)
      const offence = this.getSessionOffence(session, nomsId, courtCaseReference, chargeUuid)
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
    chargeUuid: string,
  ) {
    const id = this.getOffenceCompositeId(nomsId, courtCaseReference, chargeUuid)
    const offence = this.getSessionOffence(session, nomsId, courtCaseReference, chargeUuid)
    offence.offenceCode = confirmOffenceForm.offenceCode
    // eslint-disable-next-line no-param-reassign
    session.offences[id] = offence
  }

  getOffenceCode(session: Partial<SessionData>, nomsId: string, courtCaseReference: string, chargeUuid: string) {
    const id = this.getOffenceCompositeId(nomsId, courtCaseReference, chargeUuid)
    return this.getOffence(session.offences, id).offenceCode
  }

  async setCountNumber(
    session: Partial<SessionData>,
    nomsId: string,
    courtCaseReference: string,
    chargeUuid: string,
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
      const id = this.getOffenceCompositeId(nomsId, courtCaseReference, chargeUuid)
      const offence = this.getSessionOffence(session, nomsId, courtCaseReference, chargeUuid)
      const sentence = this.getSentence(offence)
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
    sentenceUuidsInChain: string[],
    username: string,
    chargeUuid: string,
  ): Promise<{
    errors: {
      text?: string
      html?: string
      href: string
    }[]
    outcome: OffenceOutcome
    hasSentencesAfter: boolean
  }> {
    const errors = validate(
      offenceOutcomeForm,
      { offenceOutcome: 'required' },
      { 'required.offenceOutcome': 'You must select the offence outcome' },
    )
    let outcome: OffenceOutcome
    if (errors.length === 0) {
      const id = this.getOffenceCompositeId(nomsId, courtCaseReference, chargeUuid)
      const offence = this.getSessionOffence(session, nomsId, courtCaseReference, chargeUuid)
      outcome = await this.refDataService.getChargeOutcomeById(offenceOutcomeForm.offenceOutcome, username)
      if (outcome.outcomeType !== 'SENTENCING' && offence.sentence) {
        const hasSentencesAfter = await this.remandAndSentencingService.hasSentenceAfterOnOtherCourtAppearance(
          sentenceUuidsInChain,
          username,
        )
        if (hasSentencesAfter.hasSentenceAfterOnOtherCourtAppearance) {
          return { errors, outcome, hasSentencesAfter: hasSentencesAfter.hasSentenceAfterOnOtherCourtAppearance }
        }
        delete offence.sentence
      }
      offence.outcomeUuid = offenceOutcomeForm.offenceOutcome
      offence.updatedOutcome = true
      // eslint-disable-next-line no-param-reassign
      session.offences[id] = offence
    }
    return { errors, outcome, hasSentencesAfter: false }
  }

  // OffenceService.ts

  updateOffenceOutcome(
    session: Partial<SessionData>,
    nomsId: string,
    courtCaseReference: string,
    offenceOutcomeForm: OffenceOffenceOutcomeForm,
    chargeUuid: string,
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
      const id = this.getOffenceCompositeId(nomsId, courtCaseReference, chargeUuid)
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
    chargeUuid: string,
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
      const id = this.getOffenceCompositeId(nomsId, courtCaseReference, chargeUuid)
      const offence = this.getSessionOffence(session, nomsId, courtCaseReference, chargeUuid)
      const sentence = this.getSentence(offence)
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
    chargeUuid: string,
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
      const id = this.getOffenceCompositeId(nomsId, courtCaseReference, chargeUuid)
      const offence = this.getSessionOffence(session, nomsId, courtCaseReference, chargeUuid)
      const sentence = this.getSentence(offence)
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
    chargeUuid: string,
    currentOffence: Offence,
  ) {
    const expectedPeriodLengthTypes = sentenceTypePeriodLengths[
      currentOffence.sentence.sentenceTypeClassification
    ].periodLengths.map(periodLength => periodLength.type)
    const currentPeriodLengths =
      currentOffence.sentence?.periodLengths?.map(periodLength => periodLength.periodLengthType) ?? []
    if (!expectedPeriodLengthTypes.every(type => currentPeriodLengths.includes(type))) {
      const id = this.getOffenceCompositeId(nomsId, courtCaseReference, chargeUuid)
      const offence = this.getSessionOffence(session, nomsId, courtCaseReference, chargeUuid)
      const sentence = this.getSentence(offence)
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
    periodLengths: SentenceLength[],
    chargeUuid: string,
  ) {
    const id = this.getOffenceCompositeId(nomsId, courtCaseReference, chargeUuid)
    const offence = this.getSessionOffence(session, nomsId, courtCaseReference, chargeUuid)
    const sentence = this.getSentence(offence)
    sentence.periodLengths = periodLengths
    offence.sentence = sentence
    // eslint-disable-next-line no-param-reassign
    session.offences[id] = offence
  }

  setPeriodLength(
    session: Partial<SessionData>,
    nomsId: string,
    courtCaseReference: string,
    chargeUuid: string,
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
      const id = this.getOffenceCompositeId(nomsId, courtCaseReference, chargeUuid)
      const offence = this.getSessionOffence(session, nomsId, courtCaseReference, chargeUuid)
      const sentence = this.getSentence(offence)
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

  correctManyPeriodLengths(
    session: Partial<SessionData>,
    nomsId: string,
    courtCaseReference: string,
    correctManyPeriodLengthsForm: CorrectManyPeriodLengthsForm,
    periodLengthType: string,
    legacyCode: string,
    chargeUuid: string,
  ) {
    const id = this.getOffenceCompositeId(nomsId, courtCaseReference, chargeUuid)
    const offence = this.getSessionOffence(session, nomsId, courtCaseReference, chargeUuid)
    const sentence = this.getSentence(offence)
    const periodLengths =
      sentence.periodLengths.filter(
        periodLength =>
          periodLength.periodLengthType === periodLengthType ||
          (legacyCode && periodLength.legacyData?.sentenceTermCode === legacyCode),
      ) ?? []
    const periodLengthHeader =
      periodLengthTypeHeadings[periodLengthType as string]?.toLowerCase() ??
      periodLengths.at(0)?.legacyData?.sentenceTermDescription
    if (correctManyPeriodLengthsForm.correctPeriodLengthUuid !== 'NONE') {
      // eslint-disable-next-line no-param-reassign
      delete correctManyPeriodLengthsForm['sentenceLength-days']
      // eslint-disable-next-line no-param-reassign
      delete correctManyPeriodLengthsForm['sentenceLength-months']
      // eslint-disable-next-line no-param-reassign
      delete correctManyPeriodLengthsForm['sentenceLength-years']
    }
    const errors = validate(
      correctManyPeriodLengthsForm,
      {
        correctPeriodLengthUuid: 'required',
        'sentenceLength-years':
          'requireSentenceLength_if:correctPeriodLengthUuid,NONE|requireOneNonZeroSentenceLength_if:correctPeriodLengthUuid,NONE|minWholeNumber:0',
        'sentenceLength-months': 'minWholeNumber:0',
        'sentenceLength-weeks': 'minWholeNumber:0',
        'sentenceLength-days': 'minWholeNumber:0',
      },
      {
        'required.correctPeriodLengthUuid': `You must select the correct ${periodLengthHeader} for this sentence`,
        'requireSentenceLength_if.sentenceLength-years': `You must enter the ${periodLengthHeader}`,
        'minWholeNumber.sentenceLength-years': 'The number must be a whole number, or 0',
        'minWholeNumber.sentenceLength-months': 'The number must be a whole number, or 0',
        'minWholeNumber.sentenceLength-weeks': 'The number must be a whole number, or 0',
        'minWholeNumber.sentenceLength-days': 'The number must be a whole number, or 0',
        'requireOneNonZeroSentenceLength.sentenceLength-years': `The ${periodLengthHeader} cannot be 0`,
      },
    )

    if (errors.length === 0) {
      if (correctManyPeriodLengthsForm.correctPeriodLengthUuid === 'NONE') {
        const newPeriodLength = sentenceLengthFormToSentenceLength(
          correctManyPeriodLengthsForm,
          periodLengthType,
          periodLengthHeader,
        )
        sentence.periodLengths = sentence.periodLengths
          .filter(
            periodLength =>
              periodLength.periodLengthType !== periodLengthType ||
              (legacyCode && periodLength.legacyData.sentenceTermCode !== legacyCode),
          )
          .concat(newPeriodLength)
      } else {
        sentence.periodLengths = sentence.periodLengths.filter(
          periodLength =>
            periodLength.periodLengthType !== periodLengthType ||
            (legacyCode && periodLength.legacyData.sentenceTermCode !== legacyCode) ||
            periodLength.uuid === correctManyPeriodLengthsForm.correctPeriodLengthUuid,
        )
      }
      offence.sentence = sentence
      // eslint-disable-next-line no-param-reassign
      session.offences[id] = offence
    }
    return errors
  }

  correctManyAlternativePeriodLength(
    session: Partial<SessionData>,
    nomsId: string,
    courtCaseReference: string,
    correctAlternativeManyPeriodLengthsForm: CorrectAlternativeManyPeriodLengthsForm,
    periodLengthType: string,
    legacyCode: string,
    chargeUuid: string,
  ) {
    const id = this.getOffenceCompositeId(nomsId, courtCaseReference, chargeUuid)
    const offence = this.getOffence(session.offences, id)
    const sentence = this.getSentence(offence)
    const periodLengths =
      sentence.periodLengths.filter(
        periodLength =>
          periodLength.periodLengthType === periodLengthType ||
          (legacyCode && periodLength.legacyData?.sentenceTermCode === legacyCode),
      ) ?? []
    const periodLengthHeader =
      periodLengthTypeHeadings[periodLengthType as string]?.toLowerCase() ??
      periodLengths.at(0)?.legacyData?.sentenceTermDescription
    const errors = validate(
      correctAlternativeManyPeriodLengthsForm,
      {
        'firstSentenceLength-value':
          'requireAlternativeSentenceLength|minWholeNumber:0|requireOneNonZeroAlternativeSentenceLength',
        'secondSentenceLength-value': 'minWholeNumber:0',
        'thirdSentenceLength-value': 'minWholeNumber:0',
        'fourthSentenceLength-value': 'minWholeNumber:0',
      },
      {
        'requireAlternativeSentenceLength.firstSentenceLength-value': `You must enter the ${periodLengthHeader}`,
        'minWholeNumber.firstSentenceLength-value': 'The number must be a whole number, or 0',
        'minWholeNumber.secondSentenceLength-value': 'The number must be a whole number, or 0',
        'minWholeNumber.thirdSentenceLength-value': 'The number must be a whole number, or 0',
        'minWholeNumber.fourthSentenceLength-value': 'The number must be a whole number, or 0',
        'requireOneNonZeroAlternativeSentenceLength.firstSentenceLength-value': `The ${periodLengthHeader} cannot be 0`,
      },
    )
    if (errors.length === 0) {
      const newPeriodLength = alternativeSentenceLengthFormToSentenceLength<CorrectAlternativeManyPeriodLengthsForm>(
        correctAlternativeManyPeriodLengthsForm,
        periodLengthType,
        periodLengthHeader,
      )
      sentence.periodLengths = sentence.periodLengths
        .filter(
          periodLength =>
            periodLength.periodLengthType !== periodLengthType ||
            (legacyCode && periodLength.legacyData.sentenceTermCode !== legacyCode),
        )
        .concat(newPeriodLength)
    }
    return errors
  }

  setAlternativePeriodLength(
    session: Partial<SessionData>,
    nomsId: string,
    courtCaseReference: string,
    chargeUuid: string,
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
      const id = this.getOffenceCompositeId(nomsId, courtCaseReference, chargeUuid)
      const offence = this.getSessionOffence(session, nomsId, courtCaseReference, chargeUuid)
      const sentence = this.getSentence(offence)
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

  getSentenceServeType(session: Partial<SessionData>, nomsId: string, courtCaseReference: string, chargeUuid: string) {
    const sentenceServeType = this.getSessionOffence(session, nomsId, courtCaseReference, chargeUuid)
    return sentenceServeType ? `${sentenceServeType}` : undefined
  }

  setSentenceServeType(
    session: Partial<SessionData>,
    nomsId: string,
    courtCaseReference: string,
    chargeUuid: string,
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
      const id = this.getOffenceCompositeId(nomsId, courtCaseReference, chargeUuid)
      const offence = this.getSessionOffence(session, nomsId, courtCaseReference, chargeUuid)
      const sentence = this.getSentence(offence)
      if (
        !existingSentenceServeType ||
        !sentenceIsInChain ||
        offenceSentenceServeTypeForm.sentenceServeType !==
          extractKeyValue(sentenceServeTypes, sentenceServeTypes.CONCURRENT)
      ) {
        sentence.sentenceServeType = offenceSentenceServeTypeForm.sentenceServeType
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
    chargeUuid: string,
    convictionDate: Date,
  ) {
    const id = this.getOffenceCompositeId(nomsId, courtCaseReference, chargeUuid)
    const offence = this.getSessionOffence(session, nomsId, courtCaseReference, chargeUuid)
    const sentence = this.getSentence(offence)
    sentence.convictionDate = convictionDate
    offence.sentence = sentence
    // eslint-disable-next-line no-param-reassign
    session.offences[id] = offence
  }

  setConvictionDateForm(
    session: Partial<SessionData>,
    nomsId: string,
    courtCaseReference: string,
    chargeUuid: string,
    offenceConvictionDateForm: OffenceConvictionDateForm,
    addOrEditCourtAppearance: string,
    warrantDate: Date,
  ): {
    text?: string
    html?: string
    href: string
  }[] {
    let isValidConvictionDateRule = ''
    const id = this.getOffenceCompositeId(nomsId, courtCaseReference, chargeUuid)
    const offence = this.getSessionOffence(session, nomsId, courtCaseReference, chargeUuid)
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
      const warrantDateString = toDateString(
        warrantDate.getFullYear().toString(),
        (warrantDate.getMonth() + 1).toString(),
        warrantDate.getDate().toString(),
      )
      let offenceRules = ''
      if (offence.offenceEndDate) {
        const offenceEndDate = dayjs(offence.offenceEndDate)
        const offenceEndDateString = toDateString(
          offenceEndDate.year().toString(),
          (offenceEndDate.month() + 1).toString(),
          offenceEndDate.date().toString(),
        )
        offenceRules = `|isAfterOffenceEndDate:${offenceEndDateString},${convictionDateString}`
      } else if (offence.offenceStartDate) {
        const offenceStartDate = dayjs(offence.offenceStartDate)
        const offenceStartDateString = toDateString(
          offenceStartDate.year().toString(),
          (offenceStartDate.month() + 1).toString(),
          offenceStartDate.date().toString(),
        )
        offenceRules = `|isAfterOffenceStartDate:${offenceStartDateString},${convictionDateString}`
      }
      isValidConvictionDateRule = `|isValidDate:${convictionDateString}|isPastOrCurrentDate:${convictionDateString}|isWithinLast100Years:${convictionDateString}|isSameOrBeforeWarrantDate:${warrantDateString},${convictionDateString}${offenceRules}`
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
        'isSameOrBeforeWarrantDate.convictionDate-day': 'The conviction date must be on or before the warrant date',
        'isAfterOffenceEndDate.convictionDate-day':
          'The conviction date must be after the offence start date and offence end date',
        'isAfterOffenceStartDate.convictionDate-day': 'The conviction date must be after the offence start date',
      },
    )
    if (errors.length === 0) {
      const convictionDate = dayjs({
        year: offenceConvictionDateForm['convictionDate-year'],
        month: parseInt(offenceConvictionDateForm['convictionDate-month'], 10) - 1,
        day: offenceConvictionDateForm['convictionDate-day'],
      })
      const sentence = this.getSentence(offence)

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
    chargeUuid: string,
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
      const id = this.getOffenceCompositeId(nomsId, courtCaseReference, chargeUuid)
      const offence = this.getSessionOffence(session, nomsId, courtCaseReference, chargeUuid)
      const sentence = this.getSentence(offence)
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
    chargeUuid: string,
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
      const id = this.getOffenceCompositeId(nomsId, courtCaseReference, chargeUuid)
      const offence = this.getSessionOffence(session, nomsId, courtCaseReference, chargeUuid)
      const sentence = this.getSentence(offence)
      sentence.consecutiveToSentenceUuid = firstSentenceConsecutiveToForm.consecutiveToSentenceUuid
      offence.sentence = sentence
      // eslint-disable-next-line no-param-reassign
      session.offences[id] = offence
    }
    return errors
  }

  async setSentenceConsecutiveTo(
    session: Partial<SessionData>,
    nomsId: string,
    courtCaseReference: string,
    chargeUuid: string,
    sentenceConsecutiveToForm: SentenceConsecutiveToForm,
    sessionCourtAppearance: CourtAppearance,
    username: string,
  ): Promise<
    {
      text?: string
      html?: string
      href: string
    }[]
  > {
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
      const id = this.getOffenceCompositeId(nomsId, courtCaseReference, chargeUuid)
      const offence = this.getSessionOffence(session, nomsId, courtCaseReference, chargeUuid)
      const sentence = this.getSentence(offence)
      const sentenceUuid = sentenceConsecutiveToForm.consecutiveToSentenceUuid
      const sourceSentenceUuid = sentence.sentenceUuid

      const loopErrors = await this.remandAndSentencingService.validateConsecutiveLoops(
        sentenceUuid,
        sessionCourtAppearance,
        nomsId,
        sourceSentenceUuid,
        username,
      )
      if (loopErrors.length !== 0) return loopErrors

      sentence.consecutiveToSentenceUuid = sentenceUuid
      offence.sentence = sentence
      // eslint-disable-next-line no-param-reassign
      session.offences[id] = offence
    }
    return errors
  }

  getSessionOffence(
    session: Partial<SessionData>,
    nomsId: string,
    courtCaseReference: string,
    chargeUuid: string, // This parameter might be empty/undefined if pulled from a faulty source
  ): Offence {
    const effectiveChargeUuid = chargeUuid || crypto.randomUUID()
    const id = this.getOffenceCompositeId(nomsId, courtCaseReference, effectiveChargeUuid)
    return this.getOffence(session.offences, id, effectiveChargeUuid)
  }

  private getOffence(offences: Map<string, Offence>, id: string, effectiveChargeUuid?: string): Offence {
    return offences[id] ?? { chargeUuid: effectiveChargeUuid }
  }

  setSessionOffence(
    session: Partial<SessionData>,
    nomsId: string,
    courtCaseReference: string,
    offence: Offence, // This object might come in with chargeUuid: undefined
  ): string {
    const id = this.getOffenceCompositeId(nomsId, courtCaseReference, offence.chargeUuid)
    // eslint-disable-next-line no-param-reassign
    session.offences[id] = offence
    return id
  }

  invalidateFromOffenceDate(
    session: Partial<SessionData>,
    nomsId: string,
    courtCaseReference: string,
    chargeUuid: string,
  ) {
    const id = this.getOffenceCompositeId(nomsId, courtCaseReference, chargeUuid)
    const offence = this.getSessionOffence(session, nomsId, courtCaseReference, chargeUuid)
    const sentence = this.getSentence(offence)
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
    chargeUuid: string,
  ) {
    const id = this.getOffenceCompositeId(nomsId, courtCaseReference, chargeUuid)
    const offence = this.getSessionOffence(session, nomsId, courtCaseReference, chargeUuid)
    const sentence = this.getSentence(offence)
    delete sentence.sentenceTypeClassification
    delete sentence.sentenceTypeId
    delete sentence.periodLengths
    offence.sentence = sentence
    // eslint-disable-next-line no-param-reassign
    session.offences[id] = offence
  }

  setOnFinishGoToEdit(session: Partial<SessionData>, nomsId: string, courtCaseReference: string, chargeUuid: string) {
    const offence = this.getSessionOffence(session, nomsId, courtCaseReference, chargeUuid)
    offence.onFinishGoToEdit = true
  }

  setSentenceToConcurrent(
    session: Partial<SessionData>,
    nomsId: string,
    courtCaseReference: string,
    chargeUuid: string,
  ) {
    this.updateSentenceServType(nomsId, courtCaseReference, session, chargeUuid, sentenceServeTypes.CONCURRENT)
  }

  setSentenceToForthwith(
    session: Partial<SessionData>,
    nomsId: string,
    courtCaseReference: string,
    chargeUuid: string,
  ) {
    this.updateSentenceServType(nomsId, courtCaseReference, session, chargeUuid, sentenceServeTypes.FORTHWITH)
  }

  setSentenceToConsecutive(
    session: Partial<SessionData>,
    nomsId: string,
    courtCaseReference: string,
    chargeUuid: string,
  ) {
    this.updateSentenceServType(nomsId, courtCaseReference, session, chargeUuid, sentenceServeTypes.CONSECUTIVE)
  }

  private updateSentenceServType(
    nomsId: string,
    courtCaseReference: string,
    session: Partial<SessionData>,
    chargeUuid: string,
    sentenceServeType: string,
  ) {
    const id = this.getOffenceCompositeId(nomsId, courtCaseReference, chargeUuid)
    const offence = this.getSessionOffence(session, nomsId, courtCaseReference, chargeUuid)
    const sentence = this.getSentence(offence)
    sentence.sentenceServeType = extractKeyValue(sentenceServeTypes, sentenceServeType)
    delete sentence.consecutiveToSentenceUuid
    offence.sentence = sentence
    // eslint-disable-next-line no-param-reassign
    session.offences[id] = offence
  }

  clearOffence(session: Partial<SessionData>, nomsId: string, courtCaseReference: string, chargeUuid: string) {
    const id = this.getOffenceCompositeId(nomsId, courtCaseReference, chargeUuid)
    // eslint-disable-next-line no-param-reassign
    delete session.offences[id]
  }

  private getSentence(offence: Offence): Sentence {
    return offence.sentence ?? { sentenceUuid: crypto.randomUUID() }
  }

  private getOffenceCompositeId(nomsId: string, courtCaseReference: string, chargeUuid: string): string {
    return `${nomsId}-${courtCaseReference}-${chargeUuid}`
  }

  // OffenceService.ts (Corrected clearAllOffences)

  clearAllOffences(session: Partial<SessionData>, nomsId: string, courtCaseReference: string) {
    // --- FIX START: Reconstitute Map if session.offences is a plain object ---
    if (session.offences && !(session.offences instanceof Map)) {
      // Convert the plain JavaScript object back into a Map instance
      // eslint-disable-next-line no-param-reassign
      session.offences = new Map(Object.entries(session.offences))
    }

    if (!session.offences) {
      return
    }
    // --- FIX END ---

    const prefix = `${nomsId}-${courtCaseReference}-`

    // The .keys() method is now safe to call, as session.offences is guaranteed to be a Map.
    for (const id of session.offences.keys()) {
      if (id.startsWith(prefix)) {
        session.offences.delete(id)
      }
    }
  }

  validateOffenceMandatoryFields(offence: Offence): { text: string; href: string }[] {
    const errors: { text: string; href: string }[] = []
    if (!offence.sentence) {
      return errors
    }
    if (!offence.sentence?.sentenceTypeClassification) {
      errors.push({ text: 'You must enter the sentence type', href: '#' })
    } else {
      const expectedPeriodLengthType =
        sentenceTypePeriodLengths[offence.sentence?.sentenceTypeClassification]?.periodLengths ?? []

      expectedPeriodLengthType.forEach(expectedPeriodLength => {
        if (
          !offence.sentence.periodLengths ||
          !offence.sentence.periodLengths.some(pl => pl.periodLengthType === expectedPeriodLength.type)
        ) {
          errors.push({
            text: `You must enter the ${periodLengthTypeHeadings[expectedPeriodLength.type].toLowerCase()}`,
            href: '#',
          })
        }
      })

      if (offence.sentence.periodLengths) {
        const groupedPeriodLengths = groupAndSortPeriodLengths(offence.sentence.periodLengths)
        if (groupedPeriodLengths.find(groupedPeriodLength => groupedPeriodLength.lengths.length > 1)) {
          errors.push({
            text: `This sentence has an invalid number of period lengths`,
            href: '#',
          })
        }
      }
    }

    if (!offence.offenceStartDate) {
      errors.push({
        text: `You must enter the offence date`,
        href: '#',
      })
    }

    if (offence.sentence?.sentenceServeType === 'CONSECUTIVE' && !offence.sentence?.consecutiveToSentenceUuid) {
      errors.push({ text: 'You must enter consecutive to details', href: '#' })
    }
    return errors
  }
}
