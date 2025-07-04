import dayjs from 'dayjs'

export default function validate(value, options): boolean {
  const compare = dayjs(options, 'YYYY-MM-DD', true).startOf('date')
  const hundredYearsAgo = dayjs().subtract(100, 'years')
  return compare.isAfter(hundredYearsAgo)
}
