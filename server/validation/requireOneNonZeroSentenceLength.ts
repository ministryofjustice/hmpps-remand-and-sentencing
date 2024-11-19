export default function validate(value: string): boolean {
  return validateForm(value, this.validator.input)
}

export function validateForm(value, form): boolean {
  if (value && parseInt(value, 10) > 0) {
    return true
  }
  return Object.entries(form)
    .filter(([key]) => key.startsWith('sentenceLength-'))
    .some(([_, formValue]) => formValue && parseInt(String(formValue), 10) > 0)
}
