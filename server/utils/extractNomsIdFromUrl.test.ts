import extractNomsIdFromUrl from './extractNomsIdFromUrl'

describe('extractNomsIdFromUrl', () => {
  it('extracts the nomsId from a person-scoped URL', () => {
    expect(extractNomsIdFromUrl('/person/A1234BC/court-cases')).toBe('A1234BC')
  })

  it('extracts the nomsId when the URL has query parameters', () => {
    expect(extractNomsIdFromUrl('/person/A1234BC/court-cases?foo=bar')).toBe('A1234BC')
  })

  it('extracts the nomsId when it is the entire path', () => {
    expect(extractNomsIdFromUrl('/person/A1234BC')).toBe('A1234BC')
  })

  it('returns undefined for a non-person URL', () => {
    expect(extractNomsIdFromUrl('/sign-in')).toBeUndefined()
  })

  it('returns undefined for the root URL', () => {
    expect(extractNomsIdFromUrl('/')).toBeUndefined()
  })
})
