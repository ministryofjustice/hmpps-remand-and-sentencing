import Validator, { ErrorMessages, Rules } from 'validatorjs'
import onlyOneValidate from './onlyOneRule'
import minWholeNumberValidate from './minWholeNumberRule'
import minCurrencyValidate from './minCurrencyRule'
import isPastDate from './isPastDate'
import isValidDate from './isValidDate'
import requiredFieldWith from './requiredFieldWith'
import requireSentenceLength from './requireSentenceLength'
import requireAlternativeSentenceLength from './requireAlternativeSentenceLength'
import wholeNumberValidate from './wholeNumberRule'
import minNumberValidate from './minNumberRule'
import requireOneNonZeroSentenceLength from './requireOneNonZeroSentenceLength'
import requireOneNonZeroAlternativeSentenceLength from './requireOneNonZeroAlternativeSentenceLength'
import requireSentenceLengthIf from './requireSentenceLengthIf'
import requireOneNonZeroSentenceLengthIf from './requireOneNonZeroSentenceLengthIf'
import isAfterDate from './isAfterDate'
import isFutureDate from './isFutureDate'
import isUniqueTimePeriod from './isUniqueTimePeriod'
import atLeastOneNumberInString from './atLeastOneNumberInString'
import isNotTrue from './isNotTrue'
import isWithinLast100Years from './isWithinLast100Years'

export default function validate<T>(
  form: T,
  rules: Rules,
  customMessages: ErrorMessages,
): Array<{ text?: string; html?: string; href: string }> {
  const validation = new Validator(form, rules, customMessages)
  return checkErrors(validation)
}

const checkErrors = <T>(validation: Validator.Validator<T>): Array<{ text?: string; html?: string; href: string }> => {
  validation.check()
  return asErrors(validation.errors)
}

const asErrors = (errors: Validator.Errors) =>
  Object.keys(errors.all()).map(key => {
    const message = errors.first(key) as string
    let error = { text: message } as { text?: string; html?: string }
    if (message.startsWith('html:')) {
      error = { html: message.replace('html:', '') }
    }
    return { href: `#${key}`, ...error }
  })

Validator.register('onlyOne', onlyOneValidate, 'only one validation rule')
Validator.register('minWholeNumber', minWholeNumberValidate, 'must be greater than number')
Validator.register('minCurrency', minCurrencyValidate, 'must be entered in a valid format')
Validator.register('isValidDate', isValidDate, 'This date does not exist.')
Validator.registerImplicit('requiredFieldWith', requiredFieldWith, 'This field is required.')
Validator.register('isPastDate', isPastDate, 'date must be in the past')
Validator.register('isAfterDate', isAfterDate, 'date must be after')
Validator.register('isFutureDate', isFutureDate, 'date must be in the future')
Validator.registerImplicit(
  'requireAlternativeSentenceLength',
  requireAlternativeSentenceLength,
  'You must enter the sentence length',
)
Validator.registerImplicit('requireSentenceLength', requireSentenceLength, 'You must enter the sentence length')
Validator.registerImplicit('requireSentenceLength_if', requireSentenceLengthIf, 'You must enter the sentence length')
Validator.register(
  'requireOneNonZeroSentenceLength',
  requireOneNonZeroSentenceLength,
  'The sentence length cannot be 0',
)
Validator.register(
  'requireOneNonZeroSentenceLength_if',
  requireOneNonZeroSentenceLengthIf,
  'The sentence length cannot be 0',
)
Validator.register(
  'requireOneNonZeroAlternativeSentenceLength',
  requireOneNonZeroAlternativeSentenceLength,
  'The sentence length cannot be 0',
)
Validator.register('wholeNumber', wholeNumberValidate, 'must be a whole number')
Validator.register('minNumber', minNumberValidate, 'must be greater than number')
Validator.register('isUniqueTimePeriod', isUniqueTimePeriod, 'More than one of the same type of date is not allowed')
Validator.register('atLeastOneNumberInString', atLeastOneNumberInString, 'Must enter at least one number')
Validator.register('isNotTrue', isNotTrue, 'Cannot be true')
Validator.register('isWithinLast100Years', isWithinLast100Years, 'Date must be within the last 100 years')
