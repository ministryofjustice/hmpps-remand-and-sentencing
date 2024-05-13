import wholeNumberValidate from './wholeNumberRule'
import minNumberValidate from './minNumberRule'

export default function validate(value, options): boolean {
  return minNumberValidate(value, options) && wholeNumberValidate(value)
}
