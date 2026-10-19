import dayjs from 'dayjs'

export default function validate(value, options): boolean {
  const compare = dayjs(options, 'YYYY-MM-DD', true).startOf('date')
  const threeYearsInFuture = dayjs().add(3, 'years').startOf('date')
  return !compare.isAfter(threeYearsInFuture)
}
