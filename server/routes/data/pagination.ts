import { PagePagedCourtCase } from '../../@types/remandAndSentencingApi/remandAndSentencingClientTypes'

type PageLink = {
  href: string
}

type NumberedPageLink = {
  number?: number
  href?: string
  current?: boolean
  ellipsis?: boolean
}

type ResultsMetaData = {
  from: number
  to: number
  count: number
}

type PageViewModel = {
  previous: PageLink | null
  next: PageLink | null
  items: NumberedPageLink[]
}

export function govukPaginationFromPagePagedCourtCase(
  pageCourtCases: PagePagedCourtCase,
  url: URL,
): PageViewModel | null {
  if (pageCourtCases.totalPages > 1) {
    return {
      previous: getPrevious(pageCourtCases, url),
      next: getNext(pageCourtCases, url),
      items: getNumberedPageItems(pageCourtCases, url),
    }
  }
  return null
}

export function getPaginationResults(pageCourtCases: PagePagedCourtCase): ResultsMetaData {
  return {
    from: pageCourtCases.pageable.offset + 1,
    to: pageCourtCases.pageable.offset + pageCourtCases.numberOfElements,
    count: pageCourtCases.totalElements,
  }
}

function getNumberedPageItems(pageCourtCases: PagePagedCourtCase, url: URL): NumberedPageLink[] {
  url.searchParams.set('pageNumber', '1')
  const numberedPageLinks = [
    {
      number: 1,
      href: url.href,
      current: pageCourtCases.first,
    } as NumberedPageLink,
  ]
  if (pageCourtCases.pageable.pageNumber >= 3) {
    numberedPageLinks.push({
      ellipsis: true,
    })
  }
  numberPageRange(pageCourtCases, pageCourtCases.pageable.pageNumber, pageCourtCases.pageable.pageNumber + 2).forEach(
    pageNumber => {
      url.searchParams.set('pageNumber', pageNumber.toString())
      numberedPageLinks.push({
        number: pageNumber,
        href: url.href,
        current: pageNumber === pageCourtCases.pageable.pageNumber + 1,
      } as NumberedPageLink)
    },
  )
  if (pageCourtCases.pageable.pageNumber < pageCourtCases.totalPages - 3) {
    numberedPageLinks.push({
      ellipsis: true,
    })
  }
  url.searchParams.set('pageNumber', pageCourtCases.totalPages.toString())
  numberedPageLinks.push({
    number: pageCourtCases.totalPages,
    href: url.href,
    current: pageCourtCases.last,
  } as NumberedPageLink)
  return numberedPageLinks
}

function numberPageRange(pageCourtCases: PagePagedCourtCase, start: number, end: number): number[] {
  return Array.from({ length: end + 1 - start }, (_, key) => key + start).filter(
    i => i > 1 && i < pageCourtCases.totalPages,
  )
}

function getPrevious(pageCourtCases: PagePagedCourtCase, url: URL): PageLink | null {
  url.searchParams.set('pageNumber', pageCourtCases.pageable.pageNumber.toString())
  return (
    (!pageCourtCases.first && {
      href: url.href,
    }) ||
    null
  )
}

function getNext(pageCourtCases: PagePagedCourtCase, url: URL): PageLink | null {
  url.searchParams.set('pageNumber', (pageCourtCases.pageable.pageNumber + 2).toString())
  return (
    (!pageCourtCases.last && {
      href: url.href,
    }) ||
    null
  )
}
