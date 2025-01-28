import dayjs from 'dayjs'

export default function validate(value, options): boolean {
  const [startDateValue, endDateValue] = options.split(',')
  const startDate = dayjs(startDateValue, 'YYYY-MM-DD', true).startOf('date')
  const endDate = dayjs(endDateValue, 'YYYY-MM-DD', true).startOf('date')
  return endDate.isAfter(startDate)
}
