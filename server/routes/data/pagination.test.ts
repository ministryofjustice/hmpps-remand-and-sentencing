import { PagePagedCourtCase } from '../../@types/remandAndSentencingApi/remandAndSentencingClientTypes'
import { govukPaginationFromPagePagedCourtCase, getPaginationResults } from './pagination'

describe('pagination tests', () => {
  const baseUrl = new URL('http://localhost/')
  it('returns null if only 1 page', () => {
    const pageCourtCase = {
      content: [],
      pageable: {
        pageNumber: 0,
        pageSize: 20,
        sort: {
          empty: true,
          sorted: false,
          unsorted: true,
        },
        offset: 0,
        paged: true,
        unpaged: false,
      },
      last: true,
      totalElements: 1,
      totalPages: 1,
      first: true,
      size: 20,
      number: 0,
      sort: {
        empty: true,
        sorted: false,
        unsorted: true,
      },
      numberOfElements: 1,
      empty: false,
    } as PagePagedCourtCase
    const result = govukPaginationFromPagePagedCourtCase(pageCourtCase, baseUrl)
    expect(result).toBeNull()
  })

  it('shows previous if not on first page', () => {
    const pageCourtCase = {
      content: [],
      pageable: {
        pageNumber: 1,
        pageSize: 20,
        sort: {
          empty: true,
          sorted: false,
          unsorted: true,
        },
        offset: 20,
        unpaged: false,
        paged: true,
      },
      last: true,
      totalElements: 34,
      totalPages: 2,
      first: false,
      size: 20,
      number: 1,
      sort: {
        empty: true,
        sorted: false,
        unsorted: true,
      },
      numberOfElements: 14,
      empty: false,
    }
    const result = govukPaginationFromPagePagedCourtCase(pageCourtCase, baseUrl)
    expect(result.previous).toEqual({
      href: `http://localhost/?pageNumber=1`,
    })
  })

  it('show next if not on last page', () => {
    const pageCourtCase = {
      content: [],
      pageable: {
        pageNumber: 0,
        pageSize: 20,
        sort: {
          empty: true,
          sorted: false,
          unsorted: true,
        },
        offset: 0,
        paged: true,
        unpaged: false,
      },
      last: false,
      totalElements: 34,
      totalPages: 2,
      size: 20,
      number: 0,
      sort: {
        empty: true,
        sorted: false,
        unsorted: true,
      },
      first: true,
      numberOfElements: 20,
      empty: false,
    } as PagePagedCourtCase
    const result = govukPaginationFromPagePagedCourtCase(pageCourtCase, baseUrl)
    expect(result.next).toEqual({
      href: `http://localhost/?pageNumber=2`,
    })
  })

  it('shows correct results', () => {
    const pageCourtCase = {
      content: [],
      pageable: {
        pageNumber: 1,
        pageSize: 20,
        sort: {
          empty: true,
          sorted: false,
          unsorted: true,
        },
        offset: 20,
        unpaged: false,
        paged: true,
      },
      last: true,
      totalElements: 34,
      totalPages: 2,
      first: false,
      size: 20,
      number: 1,
      sort: {
        empty: true,
        sorted: false,
        unsorted: true,
      },
      numberOfElements: 14,
      empty: false,
    }
    const result = getPaginationResults(pageCourtCase)
    expect(result).toEqual({
      from: 21,
      to: 34,
      count: 34,
    })
  })

  it('shows ellipsis between range and last', () => {
    const pageCourtCase = {
      content: [],
      pageable: {
        pageNumber: 0,
        pageSize: 8,
        sort: {
          empty: true,
          sorted: false,
          unsorted: true,
        },
        offset: 0,
        paged: true,
        unpaged: false,
      },
      last: false,
      totalElements: 38,
      totalPages: 5,
      first: true,
      size: 8,
      number: 0,
      sort: {
        empty: true,
        sorted: false,
        unsorted: true,
      },
      numberOfElements: 8,
      empty: false,
    } as PagePagedCourtCase
    const result = govukPaginationFromPagePagedCourtCase(pageCourtCase, baseUrl)
    expect(result.items).toEqual([
      {
        number: 1,
        href: 'http://localhost/?pageNumber=1',
        current: true,
      },
      {
        number: 2,
        href: 'http://localhost/?pageNumber=2',
        current: false,
      },
      {
        ellipsis: true,
      },
      {
        number: 5,
        href: 'http://localhost/?pageNumber=5',
        current: false,
      },
    ])
  })

  it('show all pages', () => {
    const pageCourtCase = {
      content: [],
      pageable: {
        pageNumber: 2,
        pageSize: 8,
        sort: {
          empty: true,
          sorted: false,
          unsorted: true,
        },
        offset: 0,
        paged: true,
        unpaged: false,
      },
      last: false,
      totalElements: 38,
      totalPages: 5,
      first: true,
      size: 8,
      number: 0,
      sort: {
        empty: true,
        sorted: false,
        unsorted: true,
      },
      numberOfElements: 8,
      empty: false,
    } as PagePagedCourtCase
    const result = govukPaginationFromPagePagedCourtCase(pageCourtCase, baseUrl)
    expect(result.items).toEqual([
      {
        number: 1,
        href: 'http://localhost/?pageNumber=1',
        current: true,
      },
      {
        number: 2,
        href: 'http://localhost/?pageNumber=2',
        current: false,
      },
      {
        number: 3,
        href: 'http://localhost/?pageNumber=3',
        current: true,
      },
      {
        number: 4,
        href: 'http://localhost/?pageNumber=4',
        current: false,
      },
      {
        number: 5,
        href: 'http://localhost/?pageNumber=5',
        current: false,
      },
    ])
  })

  it('show ellipse between range and first', () => {
    const pageCourtCase = {
      content: [],
      pageable: {
        pageNumber: 3,
        pageSize: 8,
        sort: {
          empty: true,
          sorted: false,
          unsorted: true,
        },
        offset: 0,
        paged: true,
        unpaged: false,
      },
      last: false,
      totalElements: 38,
      totalPages: 5,
      first: false,
      size: 8,
      number: 0,
      sort: {
        empty: true,
        sorted: false,
        unsorted: true,
      },
      numberOfElements: 8,
      empty: false,
    } as PagePagedCourtCase
    const result = govukPaginationFromPagePagedCourtCase(pageCourtCase, baseUrl)
    expect(result.items).toEqual([
      {
        number: 1,
        href: 'http://localhost/?pageNumber=1',
        current: false,
      },
      {
        ellipsis: true,
      },
      {
        number: 3,
        href: 'http://localhost/?pageNumber=3',
        current: false,
      },
      {
        number: 4,
        href: 'http://localhost/?pageNumber=4',
        current: true,
      },
      {
        number: 5,
        href: 'http://localhost/?pageNumber=5',
        current: false,
      },
    ])
  })
})
