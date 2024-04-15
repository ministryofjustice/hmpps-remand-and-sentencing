export default function validate(value, options): boolean {
  const valueNumber = Number(value)
  const optionsNumber = Number(options)
  return optionsNumber <= valueNumber && Number.isInteger(value)
}
