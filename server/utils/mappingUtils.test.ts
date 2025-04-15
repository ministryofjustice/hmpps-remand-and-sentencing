import type { Sentence } from 'models'
import type {
  APISentence,
  PageCourtCaseAppearance,
} from '../@types/remandAndSentencingApi/remandAndSentencingClientTypes'
import {
  apiSentenceToSentence,
  pageCourtCaseAppearanceToCourtAppearance,
  sentenceToCreateSentence,
} from './mappingUtils'

describe('mapping API to session util tests', () => {
  it('correctly map next court appearance', () => {
    const appearance = {
      appearanceUuid: '020cdc11-b45e-433a-ad86-305b5be6a6c5',
      outcome: {
        outcomeUuid: 'ca76bb03-c598-41c9-871e-6fc02b09d92c',
        outcomeName: 'Remanded in custody',
        nomisCode: '1057',
        outcomeType: 'REMAND',
        displayOrder: 10,
      },
      courtCode: 'LEEDYC',
      courtCaseReference: 'T12345678',
      appearanceDate: '2024-08-29',
      warrantId: null,
      warrantType: 'REMAND',
      taggedBail: null,
      nextCourtAppearance: null,
      charges: [],
      overallSentenceLength: null,
      overallConvictionDate: null,
    } as PageCourtCaseAppearance
    const result = pageCourtCaseAppearanceToCourtAppearance(appearance)
    expect(result.nextHearingSelect).toEqual(false)
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
})
