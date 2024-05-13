import wholeNumberValidate from './wholeNumberRule'

export default function validate(value, options): boolean {
  const valueNumber = Number(value)
  const optionsNumber = Number(options)
  return optionsNumber <= valueNumber && wholeNumberValidate(value)
}
