export default function validate(value: string): boolean {
  return validateForm(value, this.validator.input)
}

export function validateForm(value, form): boolean {
  if (value) {
    return true
  }
  return Object.entries(form)
    .filter(([key]) => key.startsWith('sentenceLength-'))
    .some(([_, formValue]) => formValue)
}
