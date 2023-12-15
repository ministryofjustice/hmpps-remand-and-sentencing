import type { CourtAppearance, CourtCase, Offence } from 'models'
import dayjs from 'dayjs'
import {
  Charge,
  CreateCharge,
  CreateCourtAppearance,
  CreateCourtCase,
  CreateNextCourtAppearance,
  NextCourtAppearance,
  PageCourtCaseAppearance,
  PageCourtCaseContent,
} from '../@types/remandAndSentencingApi/remandAndSentencingClientTypes'

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
  return {
    offenceCode: offence.offenceCode,
    offenceStartDate: dayjs(offence.offenceStartDate).format('YYYY-MM-DD'),
    outcome: offence.outcome,
    ...(offence.offenceEndDate && { offenceEndDate: dayjs(offence.offenceEndDate).format('YYYY-MM-DD') }),
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

const chargeToOffence = (charge: Charge): Offence => {
  return {
    offenceStartDate: dayjs(charge.offenceStartDate).toDate(),
    offenceCode: charge.offenceCode,
    outcome: charge.outcome,
    chargeUuid: charge.chargeUuid,
    ...(charge.offenceEndDate && { offenceEndDate: dayjs(charge.offenceEndDate).toDate() }),
  } as Offence
}

const nextCourtAppearanceToCourtAppearance = (
  nextCourtAppearance?: NextCourtAppearance,
): CourtAppearance | undefined => {
  let nextHearing
  if (nextCourtAppearance) {
    nextHearing = {
      nextHearingCourtSelect: true,
      nextHearingCourtName: nextCourtAppearance.courtCode,
      nextHearingSelect: true,
      nextHearingType: nextCourtAppearance.appearanceType,
      nextHearingDate: dayjs(nextCourtAppearance.appearanceDate).toDate(),
    } as CourtAppearance
  }
  return nextHearing
}

const pageCourtAppearanceContentToCourtAppearance = (
  pageCourtCaseAppearance: PageCourtCaseAppearance,
): CourtAppearance => {
  const offences = pageCourtCaseAppearance.charges.map(charge => chargeToOffence(charge))
  const uniqueOutcomes = [...new Set(pageCourtCaseAppearance.charges.map(charge => charge.outcome))]
  const caseOutcomeAppliedAll = uniqueOutcomes.length === 1 && uniqueOutcomes[0] === pageCourtCaseAppearance.outcome
  const nextHearing = nextCourtAppearanceToCourtAppearance(pageCourtCaseAppearance.nextCourtAppearance)
  return {
    caseReferenceNumber: pageCourtCaseAppearance.courtCaseReference,
    warrantDate: dayjs(pageCourtCaseAppearance.appearanceDate).toDate(),
    courtName: pageCourtCaseAppearance.courtCode,
    overallCaseOutcome: pageCourtCaseAppearance.outcome,
    caseOutcomeAppliedAll,
    offences,
    ...nextHearing,
  } as CourtAppearance
}

export const pageCourtCaseContentToCourtCase = (pageCourtCase: PageCourtCaseContent): CourtCase => {
  const appearances = pageCourtCase.appearances.map(pageAppearance =>
    pageCourtAppearanceContentToCourtAppearance(pageAppearance),
  )
  return {
    uniqueIdentifier: pageCourtCase.courtCaseUuid,
    appearances,
  } as CourtCase
}
