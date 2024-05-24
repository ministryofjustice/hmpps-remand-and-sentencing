import Validator, { ErrorMessages, Rules } from 'validatorjs'
import onlyOneValidate from './onlyOneRule'
import minWholeNumberValidate from './minWholeNumberRule'
import isPastDate from './isPastDate'
import isValidDate from './isValidDate'
import requiredFieldWith from './requiredFieldWith'
import requireSentenceLength from './requireSentenceLength'
import requireAlternativeSentenceLength from './requireAlternativeSentenceLength'
import wholeNumberValidate from './wholeNumberRule'
import minNumberValidate from './minNumberRule'
import requireOneNonZeroSentenceLength from './requireOneNonZeroSentenceLength'
import requireOneNonZeroAlternativeSentenceLength from './requireOneNonZeroAlternativeSentenceLength'

export default function validate<T>(
  form: T,
  rules: Rules,
  customMessages: ErrorMessages,
): Array<{ text: string; href: string }> {
  const validation = new Validator(form, rules, customMessages)
  return checkErrors(validation)
}

const checkErrors = <T>(validation: Validator.Validator<T>): Array<{ text: string; href: string }> => {
  validation.check()
  return asErrors(validation.errors)
}

const asErrors = (errors: Validator.Errors) =>
  Object.keys(errors.all()).map(key => {
    const message = errors.first(key) as string
    return { text: message, href: `#${key}` }
  })

Validator.register('onlyOne', onlyOneValidate, 'only one validation rule')
Validator.register('minWholeNumber', minWholeNumberValidate, 'must be greater than number')
Validator.register('isValidDate', isValidDate, 'This date does not exist.')
Validator.registerImplicit('requiredFieldWith', requiredFieldWith, 'This field is required.')
Validator.register('isPastDate', isPastDate, 'date must be in the past')
Validator.registerImplicit(
  'requireAlternativeSentenceLength',
  requireAlternativeSentenceLength,
  'You must enter the sentence length',
)
Validator.registerImplicit('requireSentenceLength', requireSentenceLength, 'You must enter the sentence length')
Validator.register(
  'requireOneNonZeroSentenceLength',
  requireOneNonZeroSentenceLength,
  'The sentence length cannot be 0',
)
Validator.register(
  'requireOneNonZeroAlternativeSentenceLength',
  requireOneNonZeroAlternativeSentenceLength,
  'The sentence length cannot be 0',
)
Validator.register('wholeNumber', wholeNumberValidate, 'must be a whole number')
Validator.register('minNumber', minNumberValidate, 'must be greater than number')
