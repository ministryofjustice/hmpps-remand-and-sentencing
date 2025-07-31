import dayjs from 'dayjs'

export default function validate(value, options): boolean {
  const today = dayjs().startOf('date')
  const compare = dayjs(options, 'YYYY-MM-DD', true).startOf('date')
  return compare.isAfter(today) || compare.isSame(today)
}
