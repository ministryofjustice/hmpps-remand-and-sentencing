import dayjs from 'dayjs'

export default function validate(value, options): boolean {
  return dayjs(options, 'YYYY-MM-DD', true).isValid()
}
