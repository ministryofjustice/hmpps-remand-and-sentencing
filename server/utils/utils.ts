import dayjs from 'dayjs'
import type { Sentence } from 'models'
import config from '../config'
import sentenceTypePeriodLengths from '../resources/sentenceTypePeriodLengths'

const properCase = (word: string): string =>
  word.length >= 1 ? word[0].toUpperCase() + word.toLowerCase().slice(1) : word

const isBlank = (str: string): boolean => !str || /^\s*$/.test(str)

/**
 * Converts a name (first name, last name, middle name, etc.) to proper case equivalent, handling double-barreled names
 * correctly (i.e. each part in a double-barreled is converted to proper case).
 * @param name name to be converted.
 * @returns name converted to proper case.
 */
const properCaseName = (name: string): string => (isBlank(name) ? '' : name.split('-').map(properCase).join('-'))

export const convertToTitleCase = (sentence: string): string =>
  isBlank(sentence) ? '' : sentence.split(' ').map(properCaseName).join(' ')

export const initialiseName = (fullName?: string): string | null => {
  // this check is for the authError page
  if (!fullName) return null

  const array = fullName.split(' ')
  return `${array[0][0]}. ${array.reverse()[0]}`
}

export const formatDate = (date?: string): string | null => {
  if (!date) return null

  return dayjs(date).format(config.dateFormat)
}

export const formatDateTime = (date?: string, showTime?: boolean): string | null => {
  if (!date) return null

  return showTime ? dayjs(date).format(config.dateTimeFormat) : formatDate(date)
}

export const getAsStringOrDefault = (value: unknown, defaultValue: string): string | null => {
  if (typeof value === 'string') return value
  return defaultValue
}

export const toDateString = (year: string, month: string, day: string): string => {
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
}

export const pluraliseName = (name: string) => {
  if (name.endsWith('s')) {
    return `${name}'`
  }
  return `${name}'s`
}

export const getNextPeriodLengthType = (sentence: Sentence) => {
  const currentPeriodLengthTypes = (sentence.periodLengths ?? []).map(periodLength => periodLength.periodLengthType)
  const expectedPeriodLengthTypes = sentenceTypePeriodLengths[sentence.sentenceTypeClassification].periodLengths.map(
    periodLength => periodLength.type,
  )
  const remainingPeriodLengthTypes = expectedPeriodLengthTypes.filter(
    expectedPeriodLengthType => !currentPeriodLengthTypes.includes(expectedPeriodLengthType),
  )
  return remainingPeriodLengthTypes[0]
}
