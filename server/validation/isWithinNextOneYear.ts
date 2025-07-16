import dayjs from 'dayjs'

export default function validate(value, options): boolean {
  const compare = dayjs(options, 'YYYY-MM-DD', true).startOf('date')
  const oneYearInFuture = dayjs().add(1, 'years')
  return compare.isBefore(oneYearInFuture)
}
