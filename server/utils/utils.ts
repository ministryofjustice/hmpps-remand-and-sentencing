import dayjs from 'dayjs'
import type { Sentence, Offence } from 'models'
import config from '../config'
import sentenceTypePeriodLengths from '../resources/sentenceTypePeriodLengths'
import {
  Charge,
  CourtAppearanceLegacyData,
  PeriodLengthLegacyData,
} from '../@types/remandAndSentencingApi/remandAndSentencingClientTypes'

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

export const getNextPeriodLengthType = (sentence: Sentence, currentPeriodLengthType: string | undefined) => {
  const expectedPeriodLengthTypes = sentenceTypePeriodLengths[sentence.sentenceTypeClassification]?.periodLengths
    .filter(periodLength => !periodLength.auto)
    .map(periodLength => periodLength.type)
  if (expectedPeriodLengthTypes && currentPeriodLengthType !== 'UNSUPPORTED') {
    const nextIndex = expectedPeriodLengthTypes.indexOf(currentPeriodLengthType) + 1
    return expectedPeriodLengthTypes[nextIndex]
  }
  return null
}

export const allPeriodLengthTypesEntered = (sentence: Sentence): boolean => {
  const expectedPeriodLengthTypes =
    sentenceTypePeriodLengths[sentence.sentenceTypeClassification]?.periodLengths.map(
      periodLength => periodLength.type,
    ) ?? []
  const enteredPeriodLengthTypes = sentence.periodLengths.map(periodLength => periodLength.periodLengthType)
  return expectedPeriodLengthTypes.every(expectedType => enteredPeriodLengthTypes.includes(expectedType))
}

export const outcomeValueOrLegacy = (outcomeValue: string, legacyData: CourtAppearanceLegacyData) => {
  if (outcomeValue) {
    return outcomeValue
  }
  if (legacyData?.outcomeDescription) {
    return legacyData.outcomeDescription
  }
  return 'Not entered'
}

export const sentenceTypeValueOrLegacy = (sentenceTypeValue: string, legacyData: Record<string, never>) => {
  if (sentenceTypeValue) {
    return sentenceTypeValue
  }
  if (legacyData?.sentenceTypeDesc) {
    return legacyData.sentenceTypeDesc
  }
  return null
}

export const periodLengthValueOrLegacy = (periodLengthValue: string, legacyData: PeriodLengthLegacyData) => {
  if (periodLengthValue) {
    return periodLengthValue
  }
  if (legacyData?.sentenceTermDescription) {
    return legacyData.sentenceTermDescription
  }
  return null
}

export const formatLengthsWithoutPeriodOrder = (length: {
  years: number
  months: number
  weeks: number
  days: number
}) => {
  return `${length.years || 0} years ${length.months || 0} months ${length.weeks || 0} weeks ${length.days || 0} days`
}

export const sortByDateDesc = (a: string | undefined | Date, b: string | undefined | Date) => {
  if (a && b) {
    return dayjs(a).isBefore(b) ? 1 : -1
  }
  return -1
}

export const extractKeyValue = (object, value: string) => {
  return Object.keys(object)[Object.values(object).indexOf(value)]
}

export function getUiDocumentType(documentType: string, warrantType: string): string {
  switch (documentType) {
    case 'HMCTS_WARRANT':
      return warrantType === 'SENTENCING' ? 'Sentencing Warrant' : 'Remand Warrant'
    case 'TRIAL_RECORD_SHEET':
      return 'Trial Record Sheet'
    case 'INDICTMENT':
      return 'Indictment Document'
    case 'PRISON_COURT_REGISTER':
      return 'Prison Court Register'
    default:
      return 'Court Document'
  }
}

enum OffenceGroup {
  NOMIS = 0,
  RAS = 1,
  NO_SENTENCE = 2,
}

enum RasGroup {
  RAS_WITH_MINUS_ONE_COUNT = 0,
  RAS_WITH_COUNT = 1,
}

const toTime = (iso?: string) => (iso ? new Date(iso).getTime() : 0)
const chargeDate = (c: Charge) => toTime(c.offenceEndDate ?? c.offenceStartDate)

const getChargeCount = (c: Charge) => c.sentence?.chargeNumber
const isNomisCharge = (c: Charge) => c.sentence && (getChargeCount(c) == null || getChargeCount(c) === '')
const isChargeRasMinusOne = (c: Charge) => c.sentence && getChargeCount(c) === '-1'
const isRasChargeWithCount = (c: Charge) => {
  if (!c.sentence) return false
  const n = Number(getChargeCount(c))
  return Number.isFinite(n) && n >= 0
}

const groupRank = (c: Charge) => {
  if (isNomisCharge(c)) return OffenceGroup.NOMIS
  if (isChargeRasMinusOne(c) || isRasChargeWithCount(c)) return OffenceGroup.RAS
  return OffenceGroup.NO_SENTENCE
}

const nomisLineNumberFromCharge = (c: Charge) => {
  const val = c.sentence?.legacyData?.nomisLineReference
  const n = Number(val)
  return Number.isFinite(n) ? n : Number.POSITIVE_INFINITY
}

const rasCountForCharge = (c: Charge) => {
  const n = Number(getChargeCount(c))
  return Number.isFinite(n) && n >= 0 ? n : Number.POSITIVE_INFINITY
}

const rasSubGroupForCharge = (c: Charge) =>
  isChargeRasMinusOne(c) ? RasGroup.RAS_WITH_MINUS_ONE_COUNT : RasGroup.RAS_WITH_COUNT

const dateToTime = (d?: Date | string) => {
  if (!d) return 0
  const date = typeof d === 'string' ? new Date(d) : d

  return date.getTime()
}
const offenceDate = (o: Offence) => dateToTime(o.offenceEndDate ?? o.offenceStartDate)

const getOffenceCount = (o: Offence) => o.sentence?.countNumber
const isNomisOffence = (o: Offence) => !!o.sentence && (getOffenceCount(o) == null || getOffenceCount(o) === '')
const isOffenceRasMinusOne = (o: Offence) => !!o.sentence && getOffenceCount(o) === '-1'
const isRasWithCountOffence = (o: Offence) => {
  if (!o.sentence) return false
  const n = Number(getOffenceCount(o))
  return Number.isFinite(n) && n >= 0
}

const groupOffence = (o: Offence) => {
  if (isNomisOffence(o)) return 0
  if (isOffenceRasMinusOne(o) || isRasWithCountOffence(o)) return 1
  return 2
}

const nomisLineNumberFromOffence = (o: Offence) => {
  const n = Number(o.sentence?.legacyData?.nomisLineReference)
  return Number.isFinite(n) ? n : Number.POSITIVE_INFINITY
}

const rasCountForOffence = (o: Offence) => {
  const n = Number(getOffenceCount(o))
  return Number.isFinite(n) && n >= 0 ? n : Number.POSITIVE_INFINITY
}

const rasSubRankForOffence = (o: Offence) => (isOffenceRasMinusOne(o) ? 0 : 1)

export function orderCharges(charges: Charge[]): Charge[] {
  if (!charges) return charges
  return [...charges].sort((a, b) => {
    const groupA = groupRank(a)
    const groupB = groupRank(b)
    if (groupA !== groupB) return groupA - groupB

    if (groupA === OffenceGroup.NOMIS) return nomisLineNumberFromCharge(a) - nomisLineNumberFromCharge(b)

    if (groupA === OffenceGroup.RAS) {
      const subGroupA = rasSubGroupForCharge(a)
      const subGroup = rasSubGroupForCharge(b)
      if (subGroupA !== subGroup) return subGroupA - subGroup
      if (subGroupA === RasGroup.RAS_WITH_MINUS_ONE_COUNT) return chargeDate(b) - chargeDate(a)
      return rasCountForCharge(a) - rasCountForCharge(b)
    }

    return chargeDate(b) - chargeDate(a)
  })
}

export function orderOffences(offences: Offence[]): Offence[] {
  if (!offences) return offences
  return [...offences].sort((a, b) => {
    const groupA = groupOffence(a)
    const groupB = groupOffence(b)
    if (groupA !== groupB) return groupA - groupB

    if (groupA === OffenceGroup.NOMIS) return nomisLineNumberFromOffence(a) - nomisLineNumberFromOffence(b)

    if (groupA === OffenceGroup.RAS) {
      const subGroupA = rasSubRankForOffence(a)
      const subGroupB = rasSubRankForOffence(b)
      if (subGroupA !== subGroupB) return subGroupA - subGroupB
      if (subGroupA === RasGroup.RAS_WITH_MINUS_ONE_COUNT) return offenceDate(b) - offenceDate(a)
      return rasCountForOffence(a) - rasCountForOffence(b)
    }

    return offenceDate(b) - offenceDate(a)
  })
}

export function offencesToOffenceDescriptions(offences: Offence[]): [string, string][] {
  return Array.from(
    new Set(
      offences
        .filter(offence => offence.legacyData?.offenceDescription)
        .map(offence => [offence.offenceCode, offence.legacyData.offenceDescription]),
    ),
  )
}
