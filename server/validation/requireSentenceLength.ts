export default function validate(value: string): boolean {
  if (value) {
    return true
  }
  const form = this.validator.input
  return Object.values(form).some(formValue => formValue)
}
