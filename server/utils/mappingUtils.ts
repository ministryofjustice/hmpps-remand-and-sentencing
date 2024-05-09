import type { CourtAppearance, CourtCase, Offence, Sentence, SentenceLength } from 'models'
import dayjs from 'dayjs'
import type { SentenceLengthForm } from 'forms'
import {
  APISentence,
  Charge,
  CreateCharge,
  CreateCourtAppearance,
  CreateCourtCase,
  CreateNextCourtAppearance,
  CreatePeriodLength,
  CreateSentence,
  PeriodLength,
} from '../@types/remandAndSentencingApi/remandAndSentencingClientTypes'

const sentenceLengthToCreatePeriodLength = (sentenceLength: SentenceLength): CreatePeriodLength => {
  return {
    ...(sentenceLength.days ? { days: Number(sentenceLength.days) } : {}),
    ...(sentenceLength.weeks ? { weeks: Number(sentenceLength.weeks) } : {}),
    ...(sentenceLength.months ? { months: Number(sentenceLength.months) } : {}),
    ...(sentenceLength.years ? { years: Number(sentenceLength.years) } : {}),
    periodOrder: sentenceLength.periodOrder.join(','),
  } as CreatePeriodLength
}

const sentenceToCreateSentence = (sentence: Sentence): CreateSentence | undefined => {
  let createSentence
  if (sentence) {
    createSentence = {
      chargeNumber: sentence.countNumber,
      custodialPeriodLength: sentenceLengthToCreatePeriodLength(sentence.custodialSentenceLength),
    } as CreateSentence
  }
  return createSentence
}

const courtAppearanceToCreateNextCourtAppearance = (
  courtAppearance: CourtAppearance,
): CreateNextCourtAppearance | undefined => {
  let nextCourtAppearance
  if (courtAppearance.nextHearingCourtSelect) {
    nextCourtAppearance = {
      appearanceDate: dayjs(courtAppearance.nextHearingDate).format('YYYY-MM-DD'),
      courtCode: courtAppearance.nextHearingCourtName,
      appearanceType: courtAppearance.nextHearingType,
    } as CreateNextCourtAppearance
  }
  return nextCourtAppearance
}

const offenceToCreateCharge = (offence: Offence): CreateCharge => {
  const sentence = sentenceToCreateSentence(offence.sentence)
  return {
    offenceCode: offence.offenceCode,
    offenceStartDate: dayjs(offence.offenceStartDate).format('YYYY-MM-DD'),
    outcome: offence.outcome,
    ...(offence.terrorRelated !== undefined && { terrorRelated: offence.terrorRelated }),
    ...(offence.offenceEndDate && { offenceEndDate: dayjs(offence.offenceEndDate).format('YYYY-MM-DD') }),
    ...(sentence && { sentence }),
  } as CreateCharge
}

export const courtAppearanceToCreateCourtAppearance = (
  courtAppearance: CourtAppearance,
  courtCaseUuid?: string,
): CreateCourtAppearance => {
  const nextCourtAppearance = courtAppearanceToCreateNextCourtAppearance(courtAppearance)
  return {
    courtCaseUuid,
    outcome: courtAppearance.overallCaseOutcome,
    courtCode: courtAppearance.courtName,
    courtCaseReference: courtAppearance.caseReferenceNumber,
    appearanceDate: dayjs(courtAppearance.warrantDate).format('YYYY-MM-DD'),
    charges: courtAppearance.offences.map(offence => offenceToCreateCharge(offence)),
    warrantType: courtAppearance.warrantType,
    warrantId: courtAppearance.warrantId,
    ...(courtAppearance.taggedBail && { taggedBail: parseInt(courtAppearance.taggedBail, 10) }),
    ...(nextCourtAppearance && { nextCourtAppearance }),
  } as CreateCourtAppearance
}

export const courtCaseToCreateCourtCase = (prisonerId: string, courtCase: CourtCase): CreateCourtCase => {
  const appearances = courtCase.appearances.map(courtAppearance =>
    courtAppearanceToCreateCourtAppearance(courtAppearance),
  )

  return {
    prisonerId,
    appearances,
  } as CreateCourtCase
}

const periodLengthToSentenceLength = (periodLength: PeriodLength): SentenceLength => {
  return {
    ...(periodLength.days !== undefined ? { days: String(periodLength.days) } : {}),
    ...(periodLength.weeks !== undefined ? { weeks: String(periodLength.weeks) } : {}),
    ...(periodLength.months !== undefined ? { months: String(periodLength.months) } : {}),
    ...(periodLength.years !== undefined ? { years: String(periodLength.years) } : {}),
    periodOrder: periodLength.periodOrder.split(','),
  } as SentenceLength
}

const apiSentenceToSentence = (apiSentence: APISentence): Sentence => {
  return {
    sentenceUuid: apiSentence.sentenceUuid,
    countNumber: apiSentence.chargeNumber,
    custodialSentenceLength: periodLengthToSentenceLength(apiSentence.custodialPeriodLength),
  } as Sentence
}

export const chargeToOffence = (charge: Charge): Offence => {
  return {
    offenceStartDate: dayjs(charge.offenceStartDate).toDate(),
    offenceCode: charge.offenceCode,
    outcome: charge.outcome,
    chargeUuid: charge.chargeUuid,
    terrorRelated: charge.terrorRelated,
    ...(charge.offenceEndDate && { offenceEndDate: dayjs(charge.offenceEndDate).toDate() }),
    ...(charge.sentence && { sentence: apiSentenceToSentence(charge.sentence) }),
  } as Offence
}

export function sentenceLengthToAlternativeSentenceLengthForm<T>(sentenceLength: SentenceLength): T {
  const alternativeSentenceLengthForm = {
    'firstSentenceLength-period': 'years',
    'secondSentenceLength-period': 'months',
    'thirdSentenceLength-period': 'weeks',
    'fourthSentenceLength-period': 'days',
  } as T
  if (sentenceLength) {
    alternativeSentenceLengthForm['firstSentenceLength-value'] = sentenceLength[sentenceLength.periodOrder[0]]
    alternativeSentenceLengthForm['firstSentenceLength-period'] = sentenceLength.periodOrder.at(0)
    if (sentenceLength.periodOrder.length >= 2) {
      alternativeSentenceLengthForm['secondSentenceLength-value'] = sentenceLength[sentenceLength.periodOrder[1]]
      alternativeSentenceLengthForm['secondSentenceLength-period'] = sentenceLength.periodOrder.at(1)
    }
    if (sentenceLength.periodOrder.length >= 3) {
      alternativeSentenceLengthForm['thirdSentenceLength-value'] = sentenceLength[sentenceLength.periodOrder[2]]
      alternativeSentenceLengthForm['thirdSentenceLength-period'] = sentenceLength.periodOrder.at(2)
    }
    if (sentenceLength.periodOrder.length === 4) {
      alternativeSentenceLengthForm['fourthSentenceLength-value'] = sentenceLength[sentenceLength.periodOrder[3]]
      alternativeSentenceLengthForm['fourthSentenceLength-period'] = sentenceLength.periodOrder.at(3)
    }
  }
  return alternativeSentenceLengthForm
}

export function alternativeSentenceLengthFormToSentenceLength<T>(alternativeSentenceLengthForm: T): SentenceLength {
  const sentenceLength = { periodOrder: [] }
  if (alternativeSentenceLengthForm['firstSentenceLength-value']) {
    sentenceLength[alternativeSentenceLengthForm['firstSentenceLength-period']] =
      alternativeSentenceLengthForm['firstSentenceLength-value']
    sentenceLength.periodOrder.push(alternativeSentenceLengthForm['firstSentenceLength-period'])
  }
  if (alternativeSentenceLengthForm['secondSentenceLength-value']) {
    sentenceLength[alternativeSentenceLengthForm['secondSentenceLength-period']] =
      alternativeSentenceLengthForm['secondSentenceLength-value']
    sentenceLength.periodOrder.push(alternativeSentenceLengthForm['secondSentenceLength-period'])
  }
  if (alternativeSentenceLengthForm['thirdSentenceLength-value']) {
    sentenceLength[alternativeSentenceLengthForm['thirdSentenceLength-period']] =
      alternativeSentenceLengthForm['thirdSentenceLength-value']
    sentenceLength.periodOrder.push(alternativeSentenceLengthForm['thirdSentenceLength-period'])
  }
  if (alternativeSentenceLengthForm['fourthSentenceLength-value']) {
    sentenceLength[alternativeSentenceLengthForm['fourthSentenceLength-period']] =
      alternativeSentenceLengthForm['fourthSentenceLength-value']
    sentenceLength.periodOrder.push(alternativeSentenceLengthForm['fourthSentenceLength-period'])
  }
  return sentenceLength
}

export function sentenceLengthToSentenceLengthForm(sentenceLength: SentenceLength): SentenceLengthForm {
  return sentenceLength
    ? {
        'sentenceLength-years': sentenceLength.years,
        'sentenceLength-months': sentenceLength.months,
        'sentenceLength-weeks': sentenceLength.weeks,
        'sentenceLength-days': sentenceLength.days,
      }
    : ({} as SentenceLengthForm)
}

export function sentenceLengthFormToSentenceLength(sentenceLengthForm: SentenceLengthForm): SentenceLength {
  return {
    ...(sentenceLengthForm['sentenceLength-years'] ? { years: sentenceLengthForm['sentenceLength-years'] } : {}),
    ...(sentenceLengthForm['sentenceLength-months'] ? { months: sentenceLengthForm['sentenceLength-months'] } : {}),
    ...(sentenceLengthForm['sentenceLength-weeks'] ? { weeks: sentenceLengthForm['sentenceLength-weeks'] } : {}),
    ...(sentenceLengthForm['sentenceLength-days'] ? { days: sentenceLengthForm['sentenceLength-days'] } : {}),
    periodOrder: [
      ...(sentenceLengthForm['sentenceLength-years'] ? ['years'] : []),
      ...(sentenceLengthForm['sentenceLength-months'] ? ['months'] : []),
      ...(sentenceLengthForm['sentenceLength-weeks'] ? ['weeks'] : []),
      ...(sentenceLengthForm['sentenceLength-days'] ? ['days'] : []),
    ],
  } as SentenceLength
}
