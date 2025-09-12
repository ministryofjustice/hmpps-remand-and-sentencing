import dayjs from 'dayjs'

export default function validate(value, options): boolean {
  const [warrantDateValue, dateValue] = options.split(',')
  const warrantDate = dayjs(warrantDateValue, 'YYYY-MM-DD', true).startOf('date')
  const date = dayjs(dateValue, 'YYYY-MM-DD', true).startOf('date')
  return date.isSameOrBefore(warrantDate)
}
