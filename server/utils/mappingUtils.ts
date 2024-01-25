import type { CourtAppearance, CourtCase, Offence, Sentence, SentenceLength } from 'models'
import dayjs from 'dayjs'
import {
  Charge,
  CreateCharge,
  CreateCourtAppearance,
  CreateCourtCase,
  CreateNextCourtAppearance,
  CreatePeriodLength,
  CreateSentence,
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

export const chargeToOffence = (charge: Charge): Offence => {
  return {
    offenceStartDate: dayjs(charge.offenceStartDate).toDate(),
    offenceCode: charge.offenceCode,
    outcome: charge.outcome,
    chargeUuid: charge.chargeUuid,
    terrorRelated: charge.terrorRelated,
    ...(charge.offenceEndDate && { offenceEndDate: dayjs(charge.offenceEndDate).toDate() }),
  } as Offence
}
