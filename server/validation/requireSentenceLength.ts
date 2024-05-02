export default function validate(value: string): boolean {
  if (value) {
    return true
  }
  const form = this.validator.input
  return Object.entries(form)
    .filter(([key]) => key.startsWith('sentenceLength-'))
    .some(([_, formValue]) => formValue)
}
