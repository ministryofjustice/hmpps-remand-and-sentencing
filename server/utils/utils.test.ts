import trimForm from './trim'
import { convertToTitleCase, initialiseName, outcomeValueOrLegacy } from './utils'

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
