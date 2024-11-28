import { validateForm } from './requireOneNonZeroSentenceLength'

export default function validate(value: string, options: string): boolean {
  const form = this.validator.input
  const [fieldKey, fieldValue] = options.split(',')
  if (form[fieldKey] === fieldValue) {
    return validateForm(value, form)
  }
  return true
}
