import dayjs from 'dayjs'

export default function validate(value, options): boolean {
  const [offendDateValue, dateValue] = options.split(',')
  const offenceDate = dayjs(offendDateValue, 'YYYY-MM-DD', true).startOf('date')
  const date = dayjs(dateValue, 'YYYY-MM-DD', true).startOf('date')
  return date.isAfter(offenceDate)
}
