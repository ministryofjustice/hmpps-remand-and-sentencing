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
  DraftCourtAppearance,
  DraftCreateCourtCase,
  NextCourtAppearance,
  PageCourtCaseAppearance,
  PeriodLength,
} from '../@types/remandAndSentencingApi/remandAndSentencingClientTypes'
import { sortByOffenceStartDate } from './utils'

const sentenceLengthToCreatePeriodLength = (sentenceLength: SentenceLength): CreatePeriodLength => {
  return {
    ...(sentenceLength.days ? { days: Number(sentenceLength.days) } : {}),
    ...(sentenceLength.weeks ? { weeks: Number(sentenceLength.weeks) } : {}),
    ...(sentenceLength.months ? { months: Number(sentenceLength.months) } : {}),
    ...(sentenceLength.years ? { years: Number(sentenceLength.years) } : {}),
    periodOrder: sentenceLength.periodOrder.join(','),
    type: sentenceLength.periodLengthType,
  } as CreatePeriodLength
}

const sentenceToCreateSentence = (sentence: Sentence, prisonId: string): CreateSentence | undefined => {
  let createSentence
  if (sentence) {
    const periodLengths =
      sentence.periodLengths?.map(sentenceLength => sentenceLengthToCreatePeriodLength(sentenceLength)) ?? []
    createSentence = {
      chargeNumber: sentence.countNumber,
      periodLengths,
      sentenceServeType: sentence.sentenceServeType,
      sentenceTypeId: sentence.sentenceTypeId,
      consecutiveToChargeNumber: sentence.consecutiveTo,
      prisonId,
      ...(sentence.convictionDate && { convictionDate: dayjs(sentence.convictionDate).format('YYYY-MM-DD') }),
    } as CreateSentence
  }
  return createSentence
}

const courtAppearanceToCreateNextCourtAppearance = (
  courtAppearance: CourtAppearance,
): CreateNextCourtAppearance | undefined => {
  let nextCourtAppearance
  if (courtAppearance.nextHearingSelect) {
    const appearanceDate = dayjs(courtAppearance.nextHearingDate)
    nextCourtAppearance = {
      appearanceDate: appearanceDate.format('YYYY-MM-DD'),
      courtCode: courtAppearance.nextHearingCourtCode,
      appearanceTypeUuid: courtAppearance.nextHearingTypeUuid,
      ...(courtAppearance.nextHearingTimeSet ? { appearanceTime: appearanceDate.format('HH:mm:[00].[000000]') } : {}),
    } as CreateNextCourtAppearance
  }
  return nextCourtAppearance
}

const offenceToCreateCharge = (offence: Offence, prisonId: string): CreateCharge => {
  const sentence = sentenceToCreateSentence(offence.sentence, prisonId)
  return {
    offenceCode: offence.offenceCode,
    offenceStartDate: dayjs(offence.offenceStartDate).format('YYYY-MM-DD'),
    outcomeUuid: offence.outcomeUuid,
    ...(offence.terrorRelated !== undefined && { terrorRelated: offence.terrorRelated }),
    ...(offence.offenceEndDate && { offenceEndDate: dayjs(offence.offenceEndDate).format('YYYY-MM-DD') }),
    ...(offence.chargeUuid && { chargeUuid: offence.chargeUuid }),
    ...(sentence && { sentence }),
    ...(offence.legacyData && { legacyData: { ...offence.legacyData } }),
  } as CreateCharge
}

export const courtAppearanceToCreateCourtAppearance = (
  courtAppearance: CourtAppearance,
  prisonId: string,
  courtCaseUuid?: string,
  appearanceUuid?: string,
): CreateCourtAppearance => {
  const nextCourtAppearance = courtAppearanceToCreateNextCourtAppearance(courtAppearance)
  return {
    courtCaseUuid,
    appearanceUuid,
    outcomeUuid: courtAppearance.appearanceOutcomeUuid,
    courtCode: courtAppearance.courtCode,
    courtCaseReference: courtAppearance.caseReferenceNumber,
    appearanceDate: dayjs(courtAppearance.warrantDate).format('YYYY-MM-DD'),
    charges: courtAppearance.offences.map(offence => offenceToCreateCharge(offence, prisonId)),
    warrantType: courtAppearance.warrantType,
    warrantId: courtAppearance.warrantId,
    prisonId,
    ...(courtAppearance.taggedBail && { taggedBail: parseInt(courtAppearance.taggedBail, 10) }),
    ...(nextCourtAppearance && { nextCourtAppearance }),
    ...(courtAppearance.overallSentenceLength && {
      overallSentenceLength: sentenceLengthToCreatePeriodLength(courtAppearance.overallSentenceLength),
      ...(courtAppearance.overallConvictionDate && {
        overallConvictionDate: dayjs(courtAppearance.overallConvictionDate).format('YYYY-MM-DD'),
      }),
      ...(courtAppearance.legacyData && { legacyData: { ...courtAppearance.legacyData } }),
    }),
  } as CreateCourtAppearance
}

export const courtCaseToCreateCourtCase = (
  prisonerId: string,
  courtCase: CourtCase,
  prisonId: string,
): CreateCourtCase => {
  const appearances = courtCase.appearances.map(courtAppearance =>
    courtAppearanceToCreateCourtAppearance(courtAppearance, prisonId),
  )

  return {
    prisonerId,
    appearances,
  } as CreateCourtCase
}

export const periodLengthToSentenceLength = (periodLength: PeriodLength): SentenceLength => {
  if (periodLength) {
    return {
      ...(typeof periodLength.days === 'number' ? { days: String(periodLength.days) } : {}),
      ...(typeof periodLength.weeks === 'number' ? { weeks: String(periodLength.weeks) } : {}),
      ...(typeof periodLength.months === 'number' ? { months: String(periodLength.months) } : {}),
      ...(typeof periodLength.years === 'number' ? { years: String(periodLength.years) } : {}),
      periodOrder: periodLength.periodOrder.split(','),
      periodLengthType: periodLength.periodLengthType,
    } as SentenceLength
  }
  return null
}

const apiSentenceToSentence = (apiSentence: APISentence): Sentence => {
  return {
    sentenceUuid: apiSentence.sentenceUuid,
    countNumber: apiSentence.chargeNumber,
    custodialSentenceLength: periodLengthToSentenceLength(
      apiSentence.periodLengths.find(periodLength => periodLength.periodLengthType === 'SENTENCE_LENGTH'),
    ),
    periodLengths: apiSentence.periodLengths.map(periodLength => periodLengthToSentenceLength(periodLength)),
    sentenceServeType: apiSentence.sentenceServeType,
    sentenceTypeId: apiSentence.sentenceType.sentenceTypeUuid,
    sentenceTypeClassification: apiSentence.sentenceType.classification,
    consecutiveTo: apiSentence.consecutiveToChargeNumber,
    ...(apiSentence.convictionDate && { convictionDate: dayjs(apiSentence.convictionDate).toDate() }),
  } as Sentence
}

export const chargeToOffence = (charge: Charge): Offence => {
  return {
    offenceCode: charge.offenceCode,
    outcomeUuid: charge.outcome?.outcomeUuid,
    chargeUuid: charge.chargeUuid,
    terrorRelated: charge.terrorRelated,
    ...(charge.offenceStartDate && { offenceStartDate: dayjs(charge.offenceStartDate).toDate() }),
    ...(charge.offenceEndDate && { offenceEndDate: dayjs(charge.offenceEndDate).toDate() }),
    ...(charge.sentence && { sentence: apiSentenceToSentence(charge.sentence) }),
    ...(charge.legacyData && { legacyData: { ...charge.legacyData } }),
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

export function alternativeSentenceLengthFormToSentenceLength<T>(
  alternativeSentenceLengthForm: T,
  periodLengthType:
    | 'SENTENCE_LENGTH'
    | 'CUSTODIAL_TERM'
    | 'LICENCE_PERIOD'
    | 'TARIFF_LENGTH'
    | 'TERM_LENGTH'
    | 'OVERALL_SENTENCE_LENGTH',
): SentenceLength {
  const sentenceLength = { periodOrder: [], periodLengthType }
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

export function sentenceLengthToSentenceLengthForm(
  sentenceLength: SentenceLength,
  hasOverallSentenceLength?: string,
): SentenceLengthForm {
  return sentenceLength
    ? {
        'sentenceLength-years': sentenceLength.years,
        'sentenceLength-months': sentenceLength.months,
        'sentenceLength-weeks': sentenceLength.weeks,
        'sentenceLength-days': sentenceLength.days,
        hasOverallSentenceLength,
      }
    : ({} as SentenceLengthForm)
}

export function sentenceLengthFormToSentenceLength(
  sentenceLengthForm: SentenceLengthForm,
  periodLengthType: string,
): SentenceLength {
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
    periodLengthType,
    hasOverallSentenceLength: sentenceLengthForm.hasOverallSentenceLength === 'true',
  } as SentenceLength
}

export function pageCourtCaseAppearanceToCourtAppearance(
  pageCourtCaseAppearance: PageCourtCaseAppearance,
): CourtAppearance {
  return {
    appearanceReference: pageCourtCaseAppearance.appearanceUuid,
    caseReferenceNumber: pageCourtCaseAppearance.courtCaseReference,
    warrantDate: dayjs(pageCourtCaseAppearance.appearanceDate).toDate(),
    courtCode: pageCourtCaseAppearance.courtCode,
    appearanceOutcomeUuid: pageCourtCaseAppearance.outcome?.outcomeUuid,
    relatedOffenceOutcomeUuid: pageCourtCaseAppearance.outcome?.relatedChargeOutcomeUuid,
    warrantType: pageCourtCaseAppearance.warrantType,
    warrantId: pageCourtCaseAppearance.warrantId,
    taggedBail: pageCourtCaseAppearance.taggedBail?.toLocaleString(),
    hasTaggedBail: pageCourtCaseAppearance.taggedBail ? 'true' : 'false',
    ...nextCourtAppearanceToCourtAppearance(pageCourtCaseAppearance.nextCourtAppearance),
    offences: pageCourtCaseAppearance.charges.map(chargeToOffence).sort((a, b) => {
      return sortByOffenceStartDate(a.offenceStartDate, b.offenceStartDate)
    }),
    ...(pageCourtCaseAppearance.overallSentenceLength && {
      overallSentenceLength: periodLengthToSentenceLength(pageCourtCaseAppearance.overallSentenceLength),
    }),
    ...(pageCourtCaseAppearance.overallConvictionDate && {
      overallConvictionDate: dayjs(pageCourtCaseAppearance.overallConvictionDate).toDate(),
    }),
    ...(pageCourtCaseAppearance.legacyData && { legacyData: { ...pageCourtCaseAppearance.legacyData } }),
  } as CourtAppearance
}

function nextCourtAppearanceToCourtAppearance(nextCourtAppearance: NextCourtAppearance): CourtAppearance {
  let nextHearingDate
  if (nextCourtAppearance?.appearanceDate !== undefined) {
    nextHearingDate = dayjs(
      `${nextCourtAppearance.appearanceDate}${nextCourtAppearance.appearanceTime ? `T${nextCourtAppearance.appearanceTime}` : ''}`,
    )
  }
  return {
    nextHearingSelect: !!nextCourtAppearance,
    nextHearingCourtCode: nextCourtAppearance?.courtCode,
    nextHearingTypeUuid: nextCourtAppearance?.appearanceType.appearanceTypeUuid,
    nextHearingTimeSet: typeof nextCourtAppearance?.appearanceTime === 'string',
    nextHearingDate,
    nextCourtAppearanceAccepted: !!nextCourtAppearance,
  } as CourtAppearance
}

export function courtCaseToDraftCreateCourtCase(nomsId: string, courtCase: CourtCase): DraftCreateCourtCase {
  const draftAppearances = courtCase.appearances.map(appearance =>
    courtAppearanceToDraftCreateCourtAppearance(appearance),
  )

  return {
    prisonerId: nomsId,
    draftAppearances,
  }
}

export function courtAppearanceToDraftCreateCourtAppearance(appearance: CourtAppearance) {
  const entries = Object.entries(appearance).map(([key, value]) => {
    if (key === 'warrantDate') {
      return [key, dayjs(value as Date).format('YYYY-MM-DD')]
    }
    return [key, value]
  })
  return {
    sessionBlob: Object.fromEntries(entries) as Record<string, never>,
  }
}

export function draftCourtAppearanceToCourtAppearance(draftAppearance: DraftCourtAppearance): CourtAppearance {
  const appearance = draftAppearance.sessionBlob as unknown as CourtAppearance
  appearance.appearanceReference = draftAppearance.draftUuid
  appearance.existingDraft = true
  return appearance
}

export function draftCourtAppearanceToPageCourtAppearance(
  draftAppearance: DraftCourtAppearance,
): PageCourtCaseAppearance {
  const blobAsCourtAppearance = <CourtAppearance>(<unknown>draftAppearance.sessionBlob)

  return {
    charges: [],
    lifetimeUuid: 'draft',
    appearanceUuid: draftAppearance.draftUuid,
    /** Format: uuid */
    // lifetimeUuid: string
    outcome: {
      outcomeUuid: blobAsCourtAppearance.appearanceOutcomeUuid,
      outcomeName: 'draft',
      nomisCode: null,
      outcomeType: null,
      displayOrder: null,
      relatedChargeOutcomeUuid: null,
      isSubList: null,
    },
    courtCode: blobAsCourtAppearance.courtCode,
    courtCaseReference: blobAsCourtAppearance.caseReferenceNumber,
    /** Format: date */
    appearanceDate: String(blobAsCourtAppearance.warrantDate),
    warrantId: blobAsCourtAppearance.warrantId,
    warrantType: blobAsCourtAppearance.warrantType,
    /** Format: int32 */
    // nextCourtAppearance?: components['schemas']['NextCourtAppearance']
    // charges: components['schemas']['Charge'][]
    /** Format: date */
    overallConvictionDate: String(blobAsCourtAppearance.overallConvictionDate),
  }
}
