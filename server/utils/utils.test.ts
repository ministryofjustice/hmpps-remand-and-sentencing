import type { Sentence, Offence } from 'models'
import trimForm from './trim'
import {
  convertToTitleCase,
  getNextPeriodLengthType,
  initialiseName,
  outcomeValueOrLegacy,
  orderCharges,
  orderOffences,
} from './utils'
import type {
  Sentence as ApiSentence,
  SentenceLegacyData,
  Charge,
} from '../@types/remandAndSentencingApi/remandAndSentencingClientTypes'

// utils.offences.test.ts (or add to your existing utils.test.ts)

describe('convert to title case', () => {
  it.each([
    [null, null, ''],
    ['empty string', '', ''],
    ['Lower case', 'robert', 'Robert'],
    ['Upper case', 'ROBERT', 'Robert'],
    ['Mixed case', 'RoBErT', 'Robert'],
    ['Multiple words', 'RobeRT SMiTH', 'Robert Smith'],
    ['Leading spaces', '  RobeRT', '  Robert'],
    ['Trailing spaces', 'RobeRT  ', 'Robert  '],
    ['Hyphenated', 'Robert-John SmiTH-jONes-WILSON', 'Robert-John Smith-Jones-Wilson'],
  ])('%s convertToTitleCase(%s, %s)', (_: string, a: string, expected: string) => {
    expect(convertToTitleCase(a)).toEqual(expected)
  })
})

describe('initialise name', () => {
  it.each([
    [null, null, null],
    ['Empty string', '', null],
    ['One word', 'robert', 'r. robert'],
    ['Two words', 'Robert James', 'R. James'],
    ['Three words', 'Robert James Smith', 'R. Smith'],
    ['Double barrelled', 'Robert-John Smith-Jones-Wilson', 'R. Smith-Jones-Wilson'],
  ])('%s initialiseName(%s, %s)', (_: string, a: string, expected: string) => {
    expect(initialiseName(a)).toEqual(expected)
  })
})

describe('outcome value or legacy', () => {
  it('return not entered when no outcome value and no legacy data', () => {
    expect(outcomeValueOrLegacy(null, null)).toEqual('Not entered')
  })

  it('return not entered when no outcome value and legacy data with no outcome description', () => {
    expect(outcomeValueOrLegacy(null, { foo: 'bar' } as unknown as Record<string, never>)).toEqual('Not entered')
  })
})

describe('trim', () => {
  it('trims out null characters', () => {
    expect(trimForm({ key: `value with null${String.fromCharCode(0)}` })).toEqual({ key: 'value with null' })
  })
})

describe('next period length type', () => {
  it('return null when current period length type is unsupported', () => {
    const sentence = {
      sentenceReference: '0',
      sentenceTypeClassification: 'EXTENDED',
    } as Sentence
    expect(getNextPeriodLengthType(sentence, 'UNSUPPORTED')).toBeNull()
  })
})

const makeCharge = (id: string, opts: Partial<Charge> = {}): Charge =>
  ({
    chargeUuid: `${id}`,
    offenceCode: 'X123',
    offenceStartDate: undefined,
    offenceEndDate: undefined,
    ...opts,
  }) satisfies Charge

const withSentence = (
  id: string,
  { chargeNumber, nomisLine, start, end }: { chargeNumber?: string; nomisLine?: string; start?: string; end?: string },
): Charge =>
  makeCharge(id, {
    offenceStartDate: start,
    offenceEndDate: end,
    sentence: { chargeNumber, legacyData: { nomisLineReference: nomisLine } as SentenceLegacyData } as ApiSentence,
  })

const withNoSentence = (id: string, { start, end }: { start?: string; end?: string } = {}) =>
  makeCharge(id, { offenceStartDate: start, offenceEndDate: end })

describe('orderCharges', () => {
  test('groups in order: NOMIS -> RaS -> No sentence (AC1)', () => {
    const nomis = withSentence('N1', { chargeNumber: undefined, nomisLine: '5' }) // NOMIS
    const ras = withSentence('R1', { chargeNumber: '2' }) // RaS with count
    const none = withNoSentence('X1', { start: '2024-01-01' }) // No sentence

    const input = [none, ras, nomis]
    const out = orderCharges(input).map(c => c.chargeUuid)

    expect(out).toEqual(['N1', 'R1', 'X1'])
  })

  test('NOMIS: ordered by nomisLineReference ascending (AC2)', () => {
    const n3 = withSentence('N3', { chargeNumber: undefined, nomisLine: '3' })
    const n1 = withSentence('N1', { chargeNumber: undefined, nomisLine: '1' })
    const n2 = withSentence('N2', { chargeNumber: undefined, nomisLine: '2' })
    const nBad = withSentence('NB', { chargeNumber: undefined, nomisLine: 'not-a-number' }) // falls to Infinity

    const out = orderCharges([n3, nBad, n2, n1]).map(c => c.chargeUuid)
    expect(out).toEqual(['N1', 'N2', 'N3', 'NB'])
  })

  test('RaS: "-1" counts first by offence date DESC (AC3 part 1)', () => {
    const mOld = withSentence('M_OLD', { chargeNumber: '-1', start: '2024-02-01' })
    const mNew = withSentence('M_NEW', { chargeNumber: '-1', end: '2024-03-10' }) // end date should be used and is newer

    const c1 = withSentence('C1', { chargeNumber: '1' })
    const c2 = withSentence('C2', { chargeNumber: '2' })

    const out = orderCharges([c2, mOld, c1, mNew]).map(c => c.chargeUuid)
    expect(out).toEqual(['M_NEW', 'M_OLD', 'C1', 'C2'])
  })

  test('RaS: counted charges ordered by count ascending (AC3 part 2)', () => {
    const r5 = withSentence('R5', { chargeNumber: '5' })
    const r1 = withSentence('R1', { chargeNumber: '1' })
    const r0 = withSentence('R0', { chargeNumber: '0' })
    const r10 = withSentence('R10', { chargeNumber: '10' })

    const out = orderCharges([r10, r5, r1, r0]).map(c => c.chargeUuid)
    expect(out).toEqual(['R0', 'R1', 'R5', 'R10'])
  })

  test('No sentence: ordered by offence date DESC (AC4)', () => {
    const a = withNoSentence('A', { start: '2024-01-02' })
    const b = withNoSentence('B', { end: '2024-03-01' }) // end date preferred, newer
    const c = withNoSentence('C', { start: '2023-12-31' })

    const out = orderCharges([a, c, b]).map(cg => cg.chargeUuid)
    expect(out).toEqual(['B', 'A', 'C'])
  })

  test('Mixed: full ordering across all groups and rules', () => {
    // NOMIS (by line asc)
    const n2 = withSentence('N2', { chargeNumber: undefined, nomisLine: '2' })
    const n1 = withSentence('N1', { chargeNumber: undefined, nomisLine: '1' })
    const nBad = withSentence('NB', { chargeNumber: undefined, nomisLine: 'ZZZ' })

    // RaS -1
    const mOld = withSentence('M_OLD', { chargeNumber: '-1', start: '2024-01-01' })
    const mNew = withSentence('M_NEW', { chargeNumber: '-1', end: '2024-06-15' })

    // RaS with counts
    const r2 = withSentence('R2', { chargeNumber: '2' })
    const r1 = withSentence('R1', { chargeNumber: '1' })

    // No sentence (by date desc)
    const xNew = withNoSentence('X_NEW', { end: '2024-08-01' })
    const xOld = withNoSentence('X_OLD', { start: '2023-05-01' })

    const input = [xOld, r2, n2, mOld, xNew, r1, n1, mNew, nBad]
    const out = orderCharges(input).map(c => c.chargeUuid)

    expect(out).toEqual([
      // NOMIS (line asc, invalid last)
      'N1',
      'N2',
      'NB',
      // RaS "-1" by date desc
      'M_NEW',
      'M_OLD',
      // RaS counted by count asc
      'R1',
      'R2',
      // No sentence by date desc
      'X_NEW',
      'X_OLD',
    ])
  })

  test('Does not mutate the original array', () => {
    const original = [withNoSentence('X'), withSentence('N', { chargeNumber: undefined, nomisLine: '1' })]
    const snapshot = [...original]
    orderCharges(original)
    expect(original).toEqual(snapshot) // unchanged
  })

  test('Invalid/missing dates default to 0 and sort to the end of their subgroup where DESC is used', () => {
    // For "-1" subgroup (DESC by date), missing date should be treated as 0 => last among "-1"
    const mNoDate = withSentence('M_NODATE', { chargeNumber: '-1' })
    const mHasDate = withSentence('M_HASDATE', { chargeNumber: '-1', start: '2024-01-01' })

    const out = orderCharges([mNoDate, mHasDate]).map(c => c.chargeUuid)
    expect(out).toEqual(['M_HASDATE', 'M_NODATE'])
  })

  test('RaS counted: when both nomisLineReference and chargeNumber present, prioritise count (ignore nomis line)', () => {
    const lowCountHighLine = withSentence('LOW_COUNT_HIGH_LINE', {
      chargeNumber: '1',
      nomisLine: '999',
      start: '2024-01-01',
    })
    const highCountLowLine = withSentence('HIGH_COUNT_LOW_LINE', {
      chargeNumber: '7',
      nomisLine: '1',
      start: '2024-01-01',
    })

    const out = orderCharges([highCountLowLine, lowCountHighLine]).map(c => c.chargeUuid)
    expect(out).toEqual(['LOW_COUNT_HIGH_LINE', 'HIGH_COUNT_LOW_LINE'])
  })

  test('RaS "-1": when both nomisLineReference and "-1" present, prioritise date DESC (ignore nomis line)', () => {
    const olderHighLine = withSentence('OLDER_HIGH_LINE', {
      chargeNumber: '-1',
      nomisLine: '999',
      start: '2024-02-01',
    })
    const newerLowLine = withSentence('NEWER_LOW_LINE', {
      chargeNumber: '-1',
      nomisLine: '1',
      end: '2024-03-10',
    })

    const out = orderCharges([olderHighLine, newerLowLine]).map(c => c.chargeUuid)
    expect(out).toEqual(['NEWER_LOW_LINE', 'OLDER_HIGH_LINE'])
  })

  test('Classification: a charge with both fields is treated as RaS (not NOMIS)', () => {
    const nomisOnly = withSentence('NOMIS_ONLY', {
      chargeNumber: undefined,
      nomisLine: '2',
      start: '2024-01-01',
    })

    const rasWithBoth = withSentence('RAS_WITH_BOTH', {
      chargeNumber: '0', // RaS with count takes priority over nomis line
      nomisLine: '1',
      start: '2024-01-01',
    })

    const noSentence = withNoSentence('NO_SENT', { start: '2023-01-01' })

    const out = orderCharges([rasWithBoth, noSentence, nomisOnly]).map(c => c.chargeUuid)

    // Group order must remain NOMIS -> RaS -> No sentence
    expect(out).toEqual(['NOMIS_ONLY', 'RAS_WITH_BOTH', 'NO_SENT'])
  })
})

const d = (iso?: string) => (iso ? new Date(iso) : undefined)

const makeOffence = (code: string, opts: Partial<Offence> = {}): Offence =>
  ({
    offenceCode: code,
    ...opts,
  }) as Offence

const withOffenceSentence = (
  code: string,
  {
    chargeNumber,
    nomisLine,
    start,
    end,
    sentenceServeType,
    sentenceUuid,
    consecutiveToSentenceUuid,
  }: {
    chargeNumber?: string
    nomisLine?: string
    start?: string
    end?: string
    sentenceServeType?: string
    sentenceUuid?: string
    consecutiveToSentenceUuid?: string
  },
): Offence =>
  makeOffence(code, {
    offenceStartDate: d(start),
    offenceEndDate: d(end),
    sentence: {
      countNumber: chargeNumber,
      legacyData: { nomisLineReference: nomisLine },
      sentenceServeType,
      sentenceUuid,
      consecutiveToSentenceUuid,
    } as Sentence,
  })

const withOffenceNoSentence = (code: string, { start, end }: { start?: string; end?: string } = {}): Offence =>
  makeOffence(code, { offenceStartDate: d(start), offenceEndDate: d(end) })

describe('orderOffences', () => {
  test('groups in order: NOMIS -> RaS -> No sentence (AC1)', () => {
    const nomis = withOffenceSentence('N1', { chargeNumber: undefined, nomisLine: '5' }) // NOMIS
    const ras = withOffenceSentence('R1', { chargeNumber: '2' }) // RaS with count
    const none = withOffenceNoSentence('X1', { start: '2024-01-01' }) // No sentence

    const input = [none, ras, nomis]
    const out = orderOffences(input).map(o => o.offenceCode)

    expect(out).toEqual(['N1', 'R1', 'X1'])
  })

  test('NOMIS: ordered by nomisLineReference ascending (AC2)', () => {
    const n3 = withOffenceSentence('N3', { chargeNumber: undefined, nomisLine: '3' })
    const n1 = withOffenceSentence('N1', { chargeNumber: undefined, nomisLine: '1' })
    const n2 = withOffenceSentence('N2', { chargeNumber: undefined, nomisLine: '2' })
    const nBad = withOffenceSentence('NB', { chargeNumber: undefined, nomisLine: 'not-a-number' }) // Infinity

    const out = orderOffences([n3, nBad, n2, n1]).map(o => o.offenceCode)
    expect(out).toEqual(['N1', 'N2', 'N3', 'NB'])
  })

  test('RaS: "-1" counts first by offence date DESC (AC3 part 1)', () => {
    const mOld = withOffenceSentence('M_OLD', { chargeNumber: '-1', start: '2024-02-01' })
    const mNew = withOffenceSentence('M_NEW', { chargeNumber: '-1', end: '2024-03-10' }) // end date preferred, newer
    const c1 = withOffenceSentence('C1', { chargeNumber: '1' })
    const c2 = withOffenceSentence('C2', { chargeNumber: '2' })

    const out = orderOffences([c2, mOld, c1, mNew]).map(o => o.offenceCode)
    expect(out).toEqual(['M_NEW', 'M_OLD', 'C1', 'C2'])
  })

  test('RaS: counted offences ordered by count ascending (AC3 part 2)', () => {
    const r5 = withOffenceSentence('R5', { chargeNumber: '5' })
    const r1 = withOffenceSentence('R1', { chargeNumber: '1' })
    const r0 = withOffenceSentence('R0', { chargeNumber: '0' })
    const r10 = withOffenceSentence('R10', { chargeNumber: '10' })

    const out = orderOffences([r10, r5, r1, r0]).map(o => o.offenceCode)
    expect(out).toEqual(['R0', 'R1', 'R5', 'R10'])
  })

  test('No sentence: ordered by offence date DESC (AC4)', () => {
    const a = withOffenceNoSentence('A', { start: '2024-01-02' })
    const b = withOffenceNoSentence('B', { end: '2024-03-01' }) // end date preferred, newer
    const c = withOffenceNoSentence('C', { start: '2023-12-31' })

    const out = orderOffences([a, c, b]).map(o => o.offenceCode)
    expect(out).toEqual(['B', 'A', 'C'])
  })

  test('Mixed: full ordering across all groups and rules', () => {
    // NOMIS (by line asc)
    const n2 = withOffenceSentence('N2', { chargeNumber: undefined, nomisLine: '2' })
    const n1 = withOffenceSentence('N1', { chargeNumber: undefined, nomisLine: '1' })
    const nBad = withOffenceSentence('NB', { chargeNumber: undefined, nomisLine: 'ZZZ' })

    // RaS "-1" (by date desc)
    const mOld = withOffenceSentence('M_OLD', { chargeNumber: '-1', start: '2024-01-01' })
    const mNew = withOffenceSentence('M_NEW', { chargeNumber: '-1', end: '2024-06-15' })

    // RaS (by count asc)
    const r2 = withOffenceSentence('R2', { chargeNumber: '2' })
    const r1 = withOffenceSentence('R1', { chargeNumber: '1' })

    // No sentence (by date desc)
    const xNew = withOffenceNoSentence('X_NEW', { end: '2024-08-01' })
    const xOld = withOffenceNoSentence('X_OLD', { start: '2023-05-01' })

    const input = [xOld, r2, n2, mOld, xNew, r1, n1, mNew, nBad]
    const out = orderOffences(input).map(o => o.offenceCode)

    expect(out).toEqual([
      // NOMIS (line asc, invalid last)
      'N1',
      'N2',
      'NB',
      // RaS "-1" by date desc
      'M_NEW',
      'M_OLD',
      // RaS counted by count asc
      'R1',
      'R2',
      // No sentence by date desc
      'X_NEW',
      'X_OLD',
    ])
  })

  test('Does not mutate the original array', () => {
    const original = [withOffenceNoSentence('X'), withOffenceSentence('N', { chargeNumber: undefined, nomisLine: '1' })]
    const snapshot = [...original]
    orderOffences(original)
    expect(original).toEqual(snapshot)
  })

  test('Invalid/missing dates default to 0 and sort to the end of their subgroup where DESC is used', () => {
    const mNoDate = withOffenceSentence('M_NODATE', { chargeNumber: '-1' })
    const mHasDate = withOffenceSentence('M_HASDATE', { chargeNumber: '-1', start: '2024-01-01' })

    const out = orderOffences([mNoDate, mHasDate]).map(o => o.offenceCode)
    expect(out).toEqual(['M_HASDATE', 'M_NODATE'])
  })

  test('RaS counted: when both nomisLineReference and chargeNumber present, prioritise count (ignore nomis line)', () => {
    const lowCountHighLine = withOffenceSentence('LOW_COUNT_HIGH_LINE', {
      chargeNumber: '1',
      nomisLine: '999',
      start: '2024-01-01',
    })
    const highCountLowLine = withOffenceSentence('HIGH_COUNT_LOW_LINE', {
      chargeNumber: '7',
      nomisLine: '1',
      start: '2024-01-01',
    })

    const out = orderOffences([highCountLowLine, lowCountHighLine]).map(o => o.offenceCode)
    expect(out).toEqual(['LOW_COUNT_HIGH_LINE', 'HIGH_COUNT_LOW_LINE'])
  })

  test('RaS "-1": when both nomisLineReference and "-1" present, prioritise date DESC (ignore nomis line)', () => {
    const olderHighLine = withOffenceSentence('OLDER_HIGH_LINE', {
      chargeNumber: '-1',
      nomisLine: '999',
      start: '2024-02-01',
    })
    const newerLowLine = withOffenceSentence('NEWER_LOW_LINE', {
      chargeNumber: '-1',
      nomisLine: '1',
      end: '2024-03-10',
    })

    const out = orderOffences([olderHighLine, newerLowLine]).map(o => o.offenceCode)
    expect(out).toEqual(['NEWER_LOW_LINE', 'OLDER_HIGH_LINE'])
  })

  test('Classification: an offence with both fields is treated as RaS (not NOMIS)', () => {
    const nomisOnly = withOffenceSentence('NOMIS_ONLY', {
      chargeNumber: undefined,
      nomisLine: '2',
      start: '2024-01-01',
    })

    const rasWithBoth = withOffenceSentence('RAS_WITH_BOTH', {
      chargeNumber: '0',
      nomisLine: '1',
      start: '2024-01-01',
    })

    const noSentence = withOffenceNoSentence('NO_SENT', { start: '2023-01-01' })

    const out = orderOffences([rasWithBoth, noSentence, nomisOnly]).map(o => o.offenceCode)
    expect(out).toEqual(['NOMIS_ONLY', 'RAS_WITH_BOTH', 'NO_SENT'])
  })
})
