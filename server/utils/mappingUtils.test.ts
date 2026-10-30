import type { Sentence } from 'models'
import type { CourtCaseAlternativeSentenceLengthForm, SentenceLengthForm } from 'forms'
import type {
  APISentence,
  NextCourtAppearance,
  PageCourtCaseAppearance,
} from '../@types/remandAndSentencingApi/remandAndSentencingClientTypes'
import {
  alternativeSentenceLengthFormToSentenceLength,
  apiSentenceToSentence,
  nextCourtAppearanceToCourtAppearance,
  pageCourtCaseAppearanceToCourtAppearance,
  sentenceLengthFormToSentenceLength,
  sentenceToCreateSentence,
} from './mappingUtils'
import periodLengthTypeHeadings from '../resources/PeriodLengthTypeHeadings'
import { NIL_UUID } from './constants'

describe('mapping API to session util tests', () => {
  it('correctly map next court appearance', () => {
    const appearance = {
      appearanceUuid: '020cdc11-b45e-433a-ad86-305b5be6a6c5',
      outcome: {
        outcomeUuid: 'ca76bb03-c598-41c9-871e-6fc02b09d92c',
        outcomeName: 'Remanded in custody',
        nomisCode: '1057',
        outcomeType: 'NON_SENTENCING',
        displayOrder: 10,
      },
      courtCode: 'LEEDYC',
      courtCaseReference: 'T12345678',
      appearanceDate: '2024-08-29',
      warrantType: 'NON_SENTENCING',
      nextCourtAppearance: null,
      charges: [],
      overallConvictionDate: null,
      periodLengths: [],
    } as PageCourtCaseAppearance
    const result = pageCourtCaseAppearanceToCourtAppearance(appearance)
    expect(result.nextAppearanceSelect).toEqual(false)
  })

  it('correctly map blank next court appearance from court data', () => {
    const nextAppearance = {
      appearanceDate: '-9999-01-01',
      appearanceType: {
        appearanceTypeUuid: NIL_UUID,
        description: null,
        displayOrder: 1,
        hasSubtypes: false,
      },
      courtCode: null,
      appearanceTime: '00:00',
      futureSkeletonAppearanceUuid: NIL_UUID,
      courtAppearanceSubType: null,
      hmctsCourtHearingId: null,
    } as NextCourtAppearance
    const result = nextCourtAppearanceToCourtAppearance(nextAppearance)
    expect(result.nextAppearanceSelect).toEqual(true)
    expect(result.nextAppearanceDate).toEqual(undefined)
  })

  it('correctly map fine amount', () => {
    const apiSentence = {
      fineAmount: {
        fineAmount: 15,
      },
      periodLengths: [],
    } as APISentence
    const result = apiSentenceToSentence(apiSentence)
    expect(result.fineAmount).toEqual(apiSentence.fineAmount.fineAmount)
  })
})

describe('mapping session to API util tests', () => {
  it('correctly map fine amount', () => {
    const sentence = {
      fineAmount: 150,
    } as Sentence
    const result = sentenceToCreateSentence(sentence, 'PR123')
    expect(result.fineAmount.fineAmount).toEqual(sentence.fineAmount)
  })

  it('maps sentence uuid', () => {
    const sentence = {
      sentenceUuid: '123-456',
    } as Sentence
    const result = sentenceToCreateSentence(sentence, 'PR123')
    expect(result.sentenceUuid).toEqual(sentence.sentenceUuid)
  })

  it('sets whole period order on alternative', () => {
    const alternativeSentenceLengthForm = {
      'firstSentenceLength-value': '6',
      'firstSentenceLength-period': 'weeks',
      'secondSentenceLength-value': '8',
      'secondSentenceLength-period': 'months',
    } as CourtCaseAlternativeSentenceLengthForm

    const result = alternativeSentenceLengthFormToSentenceLength<CourtCaseAlternativeSentenceLengthForm>(
      alternativeSentenceLengthForm,
      'OVERALL_SENTENCE_LENGTH',
      periodLengthTypeHeadings.OVERALL_SENTENCE_LENGTH,
    )
    expect(result.periodOrder).toEqual(['weeks', 'months', 'years', 'days'])
  })

  it('sets default period order on sentence length form', () => {
    const sentenceLengthForm = {
      'sentenceLength-years': '3',
      'sentenceLength-months': '8',
    } as SentenceLengthForm
    const result = sentenceLengthFormToSentenceLength(sentenceLengthForm, 'SENTENCE_LENGTH', '')
    expect(result.periodOrder).toEqual(['years', 'months', 'weeks', 'days'])
  })
})
