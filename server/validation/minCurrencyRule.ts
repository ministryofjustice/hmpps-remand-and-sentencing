export default function validate(value): boolean {
  const val = String(value).trim()
  const regex = /^[0-9]+(\.[0-9]{1,2})?$/
  if (!regex.test(val)) {
    return false
  }

  const num = Number(val)
  return num >= 0
}