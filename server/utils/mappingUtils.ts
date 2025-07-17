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
  PagedAppearancePeriodLength,
  PagedCharge,
  PagedSentence,
  PagedSentencePeriodLength,
  PeriodLength,
} from '../@types/remandAndSentencingApi/remandAndSentencingClientTypes'
import { sortByDateDesc } from './utils'
import periodLengthTypeHeadings from '../resources/PeriodLengthTypeHeadings'

const sentenceLengthToCreatePeriodLength = (sentenceLength: SentenceLength, prisonId: string): CreatePeriodLength => {
  return {
    ...(sentenceLength.days ? { days: Number(sentenceLength.days) } : {}),
    ...(sentenceLength.weeks ? { weeks: Number(sentenceLength.weeks) } : {}),
    ...(sentenceLength.months ? { months: Number(sentenceLength.months) } : {}),
    ...(sentenceLength.years ? { years: Number(sentenceLength.years) } : {}),
    periodOrder: sentenceLength.periodOrder.join(','),
    type: sentenceLength.periodLengthType,
    periodLengthUuid: sentenceLength.uuid,
    prisonId,
  } as CreatePeriodLength
}

export const sentenceToCreateSentence = (sentence: Sentence, prisonId: string): CreateSentence | undefined => {
  let createSentence
  if (sentence) {
    const periodLengths =
      sentence.periodLengths?.map(sentenceLength => sentenceLengthToCreatePeriodLength(sentenceLength, prisonId)) ?? []
    createSentence = {
      chargeNumber: sentence.countNumber,
      periodLengths,
      sentenceServeType: sentence.sentenceServeType,
      sentenceTypeId: sentence.sentenceTypeId,
      prisonId,
      sentenceReference: sentence.sentenceReference,
      consecutiveToSentenceReference: sentence.consecutiveToSentenceReference,
      ...(sentence.convictionDate && { convictionDate: dayjs(sentence.convictionDate).format('YYYY-MM-DD') }),
      ...(sentence.fineAmount && { fineAmount: { fineAmount: sentence.fineAmount } }),
      ...(sentence.sentenceUuid && { sentenceUuid: sentence.sentenceUuid }),
      ...(sentence.consecutiveToSentenceUuid && { consecutiveToSentenceUuid: sentence.consecutiveToSentenceUuid }),
    } as CreateSentence
  }
  return createSentence
}

const courtAppearanceToCreateNextCourtAppearance = (
  courtAppearance: CourtAppearance,
  prisonId: string,
): CreateNextCourtAppearance | undefined => {
  let nextCourtAppearance
  if (courtAppearance.nextHearingSelect) {
    const appearanceDate = dayjs(courtAppearance.nextHearingDate)
    nextCourtAppearance = {
      appearanceDate: appearanceDate.format('YYYY-MM-DD'),
      courtCode: courtAppearance.nextHearingCourtCode,
      appearanceTypeUuid: courtAppearance.nextHearingTypeUuid,
      prisonId,
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
    prisonId,
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
  const nextCourtAppearance = courtAppearanceToCreateNextCourtAppearance(courtAppearance, prisonId)
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
    documents: courtAppearance.uploadedDocuments,
    prisonId,
    ...(nextCourtAppearance && { nextCourtAppearance }),
    ...(courtAppearance.overallSentenceLength && {
      overallSentenceLength: sentenceLengthToCreatePeriodLength(courtAppearance.overallSentenceLength, prisonId),
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
    prisonId,
  } as CreateCourtCase
}

export const periodLengthsToSentenceLengths = (periodLengths: PeriodLength[]): SentenceLength[] => {
  if (periodLengths) {
    return periodLengths.map(periodLength => periodLengthToSentenceLength(periodLength))
  }
  return null
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
      legacyData: periodLength.legacyData,
      description:
        periodLengthTypeHeadings[periodLength.periodLengthType] ?? periodLength.legacyData?.sentenceTermDescription,
      uuid: periodLength.periodLengthUuid,
    } as SentenceLength
  }
  return null
}

export const pagedAppearancePeriodLengthToSentenceLength = (
  pagedAppearancePeriodLength: PagedAppearancePeriodLength,
): SentenceLength => {
  if (pagedAppearancePeriodLength) {
    return {
      ...(typeof pagedAppearancePeriodLength.days === 'number'
        ? { days: String(pagedAppearancePeriodLength.days) }
        : {}),
      ...(typeof pagedAppearancePeriodLength.weeks === 'number'
        ? { weeks: String(pagedAppearancePeriodLength.weeks) }
        : {}),
      ...(typeof pagedAppearancePeriodLength.months === 'number'
        ? { months: String(pagedAppearancePeriodLength.months) }
        : {}),
      ...(typeof pagedAppearancePeriodLength.years === 'number'
        ? { years: String(pagedAppearancePeriodLength.years) }
        : {}),
      periodOrder: pagedAppearancePeriodLength.order.split(','),
      periodLengthType: pagedAppearancePeriodLength.type,
      description: periodLengthTypeHeadings[pagedAppearancePeriodLength.type],
    } as SentenceLength
  }
  return null
}

export const apiSentenceToSentence = (apiSentence: APISentence, index: number): Sentence => {
  return {
    sentenceUuid: apiSentence.sentenceUuid,
    sentenceReference: index.toString(),
    countNumber: apiSentence.chargeNumber,
    periodLengths: apiSentence.periodLengths.map(periodLength => periodLengthToSentenceLength(periodLength)),
    sentenceServeType: apiSentence.sentenceServeType,
    sentenceTypeId: apiSentence.sentenceType?.sentenceTypeUuid,
    sentenceTypeClassification: apiSentence.sentenceType?.classification,
    consecutiveToSentenceUuid: apiSentence.consecutiveToSentenceUuid,
    fineAmount: apiSentence.fineAmount?.fineAmount,
    ...(apiSentence.convictionDate && { convictionDate: dayjs(apiSentence.convictionDate).toDate() }),
    ...(apiSentence.legacyData && { legacyData: { ...apiSentence.legacyData } }),
  } as Sentence
}

export const chargeToOffence = (charge: Charge, index: number): Offence => {
  return {
    offenceCode: charge.offenceCode,
    outcomeUuid: charge.outcome?.outcomeUuid,
    chargeUuid: charge.chargeUuid,
    terrorRelated: charge.terrorRelated,
    ...(charge.offenceStartDate && { offenceStartDate: dayjs(charge.offenceStartDate).toDate() }),
    ...(charge.offenceEndDate && { offenceEndDate: dayjs(charge.offenceEndDate).toDate() }),
    ...(charge.sentence && { sentence: apiSentenceToSentence(charge.sentence, index) }),
    ...(charge.legacyData && { legacyData: { ...charge.legacyData } }),
  } as Offence
}

export const pagedChargeToOffence = (pagedCharge: PagedCharge, index: number): Offence => {
  return {
    offenceCode: pagedCharge.offenceCode,
    outcomeUuid: pagedCharge.outcome?.outcomeUuid,
    ...(pagedCharge.offenceStartDate && { offenceStartDate: dayjs(pagedCharge.offenceStartDate).toDate() }),
    ...(pagedCharge.offenceEndDate && { offenceEndDate: dayjs(pagedCharge.offenceEndDate).toDate() }),
    ...(pagedCharge.legacyData && { legacyData: { ...pagedCharge.legacyData } }),
    ...(pagedCharge.sentence && { sentence: pagedSentenceToSentence(pagedCharge.sentence, index) }),
    ...(pagedCharge.mergedFromCase && { mergedFromCase: pagedCharge.mergedFromCase }),
  } as Offence
}

export const pagedSentenceToSentence = (pagedSentence: PagedSentence, index: number): Sentence => {
  return {
    sentenceUuid: pagedSentence.sentenceUuid,
    sentenceReference: index.toString(),
    countNumber: pagedSentence.chargeNumber,
    periodLengths: pagedSentence.periodLengths.map(periodLength =>
      pagedSentencePeriodLengthToSentenceLength(periodLength),
    ),
    sentenceServeType: pagedSentence.sentenceServeType,
    sentenceTypeId: pagedSentence.sentenceType?.sentenceTypeUuid,
    sentenceTypeClassification: pagedSentence.sentenceType?.classification,
    consecutiveToSentenceUuid: pagedSentence.consecutiveToSentenceUuid,
    fineAmount: pagedSentence.fineAmount,
    ...(pagedSentence.convictionDate && { convictionDate: dayjs(pagedSentence.convictionDate).toDate() }),
    ...(pagedSentence.legacyData && { legacyData: { ...pagedSentence.legacyData } }),
  } as Sentence
}

export const pagedSentencePeriodLengthToSentenceLength = (
  pagedSentencePeriodLength: PagedSentencePeriodLength,
): SentenceLength => {
  if (pagedSentencePeriodLength) {
    return {
      ...(typeof pagedSentencePeriodLength.days === 'number' ? { days: String(pagedSentencePeriodLength.days) } : {}),
      ...(typeof pagedSentencePeriodLength.weeks === 'number'
        ? { weeks: String(pagedSentencePeriodLength.weeks) }
        : {}),
      ...(typeof pagedSentencePeriodLength.months === 'number'
        ? { months: String(pagedSentencePeriodLength.months) }
        : {}),
      ...(typeof pagedSentencePeriodLength.years === 'number'
        ? { years: String(pagedSentencePeriodLength.years) }
        : {}),
      periodOrder: pagedSentencePeriodLength.order.split(','),
      periodLengthType: pagedSentencePeriodLength.type,
      legacyData: pagedSentencePeriodLength.legacyData,
      description:
        periodLengthTypeHeadings[pagedSentencePeriodLength.type] ??
        pagedSentencePeriodLength.legacyData?.sentenceTermDescription,
    } as SentenceLength
  }
  return null
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
  periodLengthType: string,
  description: string,
): SentenceLength {
  const sentenceLength = { periodOrder: [], description, periodLengthType }
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
  ;['years', 'months', 'weeks', 'days'].forEach(unit => {
    if (!sentenceLength.periodOrder.includes(unit)) {
      sentenceLength.periodOrder.push(unit)
    }
  })
  return sentenceLength as SentenceLength
}

export function sentenceLengthToSentenceLengthForm(
  sentenceLength: SentenceLength,
  hasOverallSentenceLength?: string,
): SentenceLengthForm {
  if (!sentenceLength && hasOverallSentenceLength) {
    return { hasOverallSentenceLength }
  }

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
  description: string,
): SentenceLength {
  return {
    ...(sentenceLengthForm['sentenceLength-years'] ? { years: sentenceLengthForm['sentenceLength-years'] } : {}),
    ...(sentenceLengthForm['sentenceLength-months'] ? { months: sentenceLengthForm['sentenceLength-months'] } : {}),
    ...(sentenceLengthForm['sentenceLength-weeks'] ? { weeks: sentenceLengthForm['sentenceLength-weeks'] } : {}),
    ...(sentenceLengthForm['sentenceLength-days'] ? { days: sentenceLengthForm['sentenceLength-days'] } : {}),
    periodOrder: ['years', 'months', 'weeks', 'days'],
    periodLengthType,
    hasOverallSentenceLength: sentenceLengthForm.hasOverallSentenceLength === 'true',
    description,
  } as SentenceLength
}

const populateConsecutiveToSentenceReference = (offences: Offence[]) => {
  offences
    .filter(offence => offence.sentence?.consecutiveToSentenceUuid)
    .forEach(offence => {
      const consecutiveToSentence = offences.find(
        toFindOffence => toFindOffence.sentence?.sentenceUuid === offence.sentence?.consecutiveToSentenceUuid,
      )
      if (consecutiveToSentence) {
        // eslint-disable-next-line no-param-reassign
        offence.sentence.consecutiveToSentenceReference = consecutiveToSentence.sentence.sentenceReference
        // eslint-disable-next-line no-param-reassign
        delete offence.sentence.consecutiveToSentenceUuid
      }
    })
}

export function pageCourtCaseAppearanceToCourtAppearance(
  pageCourtCaseAppearance: PageCourtCaseAppearance,
): CourtAppearance {
  const offences = pageCourtCaseAppearance.charges
    .sort((a, b) => {
      return sortByDateDesc(a.offenceStartDate, b.offenceStartDate)
    })
    .map(chargeToOffence)
  populateConsecutiveToSentenceReference(offences)
  return {
    appearanceReference: pageCourtCaseAppearance.appearanceUuid,
    caseReferenceNumber: pageCourtCaseAppearance.courtCaseReference,
    noCaseReference: pageCourtCaseAppearance.courtCaseReference ? undefined : 'true',
    warrantDate: dayjs(pageCourtCaseAppearance.appearanceDate).toDate(),
    courtCode: pageCourtCaseAppearance.courtCode,
    appearanceOutcomeUuid: pageCourtCaseAppearance.outcome?.outcomeUuid,
    relatedOffenceOutcomeUuid: pageCourtCaseAppearance.outcome?.relatedChargeOutcomeUuid,
    warrantType: pageCourtCaseAppearance.warrantType,
    warrantId: pageCourtCaseAppearance.warrantId,
    uploadedDocuments: pageCourtCaseAppearance.documents,
    ...nextCourtAppearanceToCourtAppearance(pageCourtCaseAppearance.nextCourtAppearance),
    offences,
    ...(pageCourtCaseAppearance.overallSentenceLength && {
      hasOverallSentenceLength: 'true',
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
