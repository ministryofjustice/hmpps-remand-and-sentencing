export default function validate(value: string): boolean {
  if (value && parseInt(value, 10) > 0) {
    return true
  }
  const form = this.validator.input
  return Object.entries(form)
    .filter(([key]) => key.endsWith('-value'))
    .some(([_, formValue]) => formValue && parseInt(String(formValue), 10) > 0)
}
