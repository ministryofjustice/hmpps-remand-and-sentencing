import { PagePagedCourtCase } from '../../@types/remandAndSentencingApi/remandAndSentencingClientTypes'
import mojPaginationFromPagePagedCourtCase from './pagination'

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
    const result = mojPaginationFromPagePagedCourtCase(pageCourtCase, baseUrl)
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
    const result = mojPaginationFromPagePagedCourtCase(pageCourtCase, baseUrl)
    expect(result.previous).toEqual({
      text: 'Previous',
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
    const result = mojPaginationFromPagePagedCourtCase(pageCourtCase, baseUrl)
    expect(result.next).toEqual({
      text: 'Next',
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
    const result = mojPaginationFromPagePagedCourtCase(pageCourtCase, baseUrl)
    expect(result.results).toEqual({
      from: 21,
      to: 34,
      count: 34,
    })
  })

  it('shows dots between range and last', () => {
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
    const result = mojPaginationFromPagePagedCourtCase(pageCourtCase, baseUrl)
    expect(result.items).toEqual([
      {
        text: '1',
        href: 'http://localhost/?pageNumber=1',
        selected: true,
      },
      {
        text: '2',
        href: 'http://localhost/?pageNumber=2',
        selected: false,
      },
      {
        type: 'dots',
      },
      {
        text: '5',
        href: 'http://localhost/?pageNumber=5',
        selected: false,
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
    const result = mojPaginationFromPagePagedCourtCase(pageCourtCase, baseUrl)
    expect(result.items).toEqual([
      {
        text: '1',
        href: 'http://localhost/?pageNumber=1',
        selected: true,
      },
      {
        text: '2',
        href: 'http://localhost/?pageNumber=2',
        selected: false,
      },
      {
        text: '3',
        href: 'http://localhost/?pageNumber=3',
        selected: true,
      },
      {
        text: '4',
        href: 'http://localhost/?pageNumber=4',
        selected: false,
      },
      {
        text: '5',
        href: 'http://localhost/?pageNumber=5',
        selected: false,
      },
    ])
  })

  it('show dots between range and first', () => {
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
    const result = mojPaginationFromPagePagedCourtCase(pageCourtCase, baseUrl)
    expect(result.items).toEqual([
      {
        text: '1',
        href: 'http://localhost/?pageNumber=1',
        selected: false,
      },
      {
        type: 'dots',
      },
      {
        text: '3',
        href: 'http://localhost/?pageNumber=3',
        selected: false,
      },
      {
        text: '4',
        href: 'http://localhost/?pageNumber=4',
        selected: true,
      },
      {
        text: '5',
        href: 'http://localhost/?pageNumber=5',
        selected: false,
      },
    ])
  })
})
