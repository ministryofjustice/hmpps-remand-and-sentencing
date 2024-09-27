import type { PageCourtCaseAppearance } from '../@types/remandAndSentencingApi/remandAndSentencingClientTypes'
import { pageCourtCaseAppearanceToCourtAppearance } from './mappingUtils'

describe('mapping util tests', () => {
  it('correctly map next court appearance', () => {
    const appearance = {
      appearanceUuid: '020cdc11-b45e-433a-ad86-305b5be6a6c5',
      lifetimeUuid: 'a36bf43e-0fc2-48c6-a8f4-1e42638ac2ac',
      outcome: 'Remanded in custody',
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
})
