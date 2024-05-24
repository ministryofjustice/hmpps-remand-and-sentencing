import type {
  OffenceAlternativeSentenceLengthForm,
  OffenceConfirmOffenceForm,
  OffenceConsecutiveToForm,
  OffenceCountNumberForm,
  OffenceOffenceCodeForm,
  OffenceOffenceDateForm,
  OffenceOffenceNameForm,
  OffenceSentenceTypeForm,
  OffenceTerrorRelatedForm,
  SentenceLengthForm,
} from 'forms'
import type { Offence } from 'models'
import dayjs from 'dayjs'
import validate from '../validation/validation'
import { toDateString } from '../utils/utils'
import {
  alternativeSentenceLengthFormToSentenceLength,
  sentenceLengthFormToSentenceLength,
} from '../utils/mappingUtils'
import ManageOffencesService from './manageOffencesService'
import logger from '../../logger'

export default class OffenceService {
  constructor(private readonly manageOffencesService: ManageOffencesService) {}

  setOffenceDates(
    session: CookieSessionInterfaces.CookieSessionObject,
    nomsId: string,
    courtCaseReference: string,
    offenceOffenceDateForm: OffenceOffenceDateForm,
  ) {
    let isValidOffenceStartDateRule = ''
    if (
      offenceOffenceDateForm['offenceStartDate-day'] &&
      offenceOffenceDateForm['offenceStartDate-month'] &&
      offenceOffenceDateForm['offenceStartDate-year']
    ) {
      const startDateString = toDateString(
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
  ) {
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
    if (offenceCodeForm.offenceCode && !offenceCodeForm.unknownCode) {
      try {
        await this.manageOffencesService.getOffenceByCode(offenceCodeForm.offenceCode, authToken)
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
    return errors
  }

  async setOffenceCodeFromLookup(
    session: CookieSessionInterfaces.CookieSessionObject,
    nomsId: string,
    courtCaseReference: string,
    authToken: string,
    offenceNameForm: OffenceOffenceNameForm,
  ) {
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
    if (offenceCode) {
      try {
        await this.manageOffencesService.getOffenceByCode(offenceCode, authToken)
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
    return errors
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
        countNumber: 'required|minNumber:1|wholeNumber',
      },
      {
        'required.countNumber': 'You must enter a count number.',
        'minNumber.countNumber': 'You must enter a number greater than zero.',
        'wholeNumber.countNumber': 'Enter a whole number for the count number.',
      },
    )
    if (errors.length === 0) {
      const id = this.getOffenceId(nomsId, courtCaseReference)
      const offence = this.getOffence(session.offences, id)
      const sentence = offence.sentence ?? {}
      sentence.countNumber = countNumberForm.countNumber
      offence.sentence = sentence
      // eslint-disable-next-line no-param-reassign
      session.offences[id] = offence
    }
    return errors
  }

  getTerrorRelated(session: CookieSessionInterfaces.CookieSessionObject, nomsId: string, courtCaseReference: string) {
    const id = this.getOffenceId(nomsId, courtCaseReference)
    return this.getOffence(session.offences, id).terrorRelated
  }

  setTerrorRelated(
    session: CookieSessionInterfaces.CookieSessionObject,
    nomsId: string,
    courtCaseReference: string,
    terrorRelatedForm: OffenceTerrorRelatedForm,
  ) {
    const errors = validate(
      terrorRelatedForm,
      {
        terrorRelated: 'required',
      },
      {
        'required.terrorRelated': 'You must select Yes or No.',
      },
    )
    if (errors.length === 0) {
      const id = this.getOffenceId(nomsId, courtCaseReference)
      const offence = this.getOffence(session.offences, id)
      offence.terrorRelated = terrorRelatedForm.terrorRelated === 'true'
      // eslint-disable-next-line no-param-reassign
      session.offences[id] = offence
    }
    return errors
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
      sentence.sentenceType = offenceSentenceTypeForm.sentenceType
      offence.sentence = sentence
      // eslint-disable-next-line no-param-reassign
      session.offences[id] = offence
    }
    return errors
  }

  setCustodialSentenceLength(
    session: CookieSessionInterfaces.CookieSessionObject,
    nomsId: string,
    courtCaseReference: string,
    offenceSentenceLengthForm: SentenceLengthForm,
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
      const sentenceLength = sentenceLengthFormToSentenceLength(offenceSentenceLengthForm)
      sentence.custodialSentenceLength = sentenceLength
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
      )
      const id = this.getOffenceId(nomsId, courtCaseReference)
      const offence = this.getOffence(session.offences, id)
      const sentence = offence.sentence ?? {}
      sentence.custodialSentenceLength = sentenceLength
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
