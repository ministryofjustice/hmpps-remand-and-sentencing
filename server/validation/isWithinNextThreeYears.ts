import dayjs from 'dayjs'

export default function validate(value, options): boolean {
  const compare = dayjs(options, 'YYYY-MM-DD', true).startOf('date')
  const dayAfterThreeYearsInFuture = dayjs().add(3, 'years').add(1, 'day').startOf('date')
  return compare.isBefore(dayAfterThreeYearsInFuture)
}
