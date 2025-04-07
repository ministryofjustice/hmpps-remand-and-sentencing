export default function validate(value: string, _, attribute: string): boolean {
  const form = this.validator.input
  const timeValue = form[attribute.replace('-period', '-value')]
  if (!timeValue) {
    return true
  }
  return !Object.entries(form)
    .filter(([key]) => key.endsWith('-period') && key !== attribute && form[key.replace('-period', '-value')])
    .some(([, formValue]) => formValue === value)
}
