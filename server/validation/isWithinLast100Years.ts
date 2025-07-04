import dayjs from 'dayjs'

export default function isWithinLast100Years(value: string | Date): boolean {
  const date = dayjs(value)
  return date.isAfter(dayjs().subtract(100, 'years'))
}
