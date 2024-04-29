export default function validate(value: string, options: string): boolean {
  const fieldsRequired = options.split(',')
  const form = this.validator.input
  if (value) {
    return true
  }

  return !fieldsRequired.some(fieldKey => form[fieldKey])
}
