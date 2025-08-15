import dayjs from 'dayjs'

export default function validate(value, options): boolean {
  const [convictionDateValue, dateValue] = options.split(',')
  const convictionDate = dayjs(convictionDateValue, 'YYYY-MM-DD', true).startOf('date')
  const date = dayjs(dateValue, 'YYYY-MM-DD', true).startOf('date')
  return date.isBefore(convictionDate)
}
