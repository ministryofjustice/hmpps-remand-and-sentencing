import type { CourtAppearance, CourtCase, Offence } from 'models'
import dayjs from 'dayjs'
import {
  CreateCharge,
  CreateCourtAppearance,
  CreateCourtCase,
  CreateNextCourtAppearance,
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
