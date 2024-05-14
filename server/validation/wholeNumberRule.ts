export default function validate(value): boolean {
  const valueNumber = Number(value)
  return Number.isInteger(valueNumber)
}
