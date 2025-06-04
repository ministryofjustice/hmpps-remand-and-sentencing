import { PagePagedCourtCase } from '../../@types/remandAndSentencingApi/remandAndSentencingClientTypes'

type PageLink = {
  text: string
  href: string
}

type NumberedPageLink = {
  text?: string
  href?: string
  selected?: boolean
  type?: string
}

type ResultsMetaData = {
  from: number
  to: number
  count: number
}

type PageViewModel = {
  results: ResultsMetaData
  previous: PageLink | null
  next: PageLink | null
  items: NumberedPageLink[]
}

export default function mojPaginationFromPagePagedCourtCase(
  pageCourtCases: PagePagedCourtCase,
  url: URL,
): PageViewModel | null {
  if (pageCourtCases.totalPages > 1) {
    return {
      results: getResults(pageCourtCases),
      previous: getPrevious(pageCourtCases, url),
      next: getNext(pageCourtCases, url),
      items: getNumberedPageItems(pageCourtCases, url),
    }
  }
  return null
}

function getNumberedPageItems(pageCourtCases: PagePagedCourtCase, url: URL): NumberedPageLink[] {
  url.searchParams.set('pageNumber', '1')
  const numberedPageLinks = [
    {
      text: '1',
      href: url.href,
      selected: pageCourtCases.first,
    } as NumberedPageLink,
  ]
  if (pageCourtCases.pageable.pageNumber >= 3) {
    numberedPageLinks.push({
      type: 'dots',
    })
  }
  numberPageRange(pageCourtCases, pageCourtCases.pageable.pageNumber, pageCourtCases.pageable.pageNumber + 2).forEach(
    pageNumber => {
      url.searchParams.set('pageNumber', pageNumber.toString())
      numberedPageLinks.push({
        text: pageNumber.toString(),
        href: url.href,
        selected: pageNumber === pageCourtCases.pageable.pageNumber + 1,
      } as NumberedPageLink)
    },
  )
  if (pageCourtCases.pageable.pageNumber < pageCourtCases.totalPages - 3) {
    numberedPageLinks.push({
      type: 'dots',
    })
  }
  url.searchParams.set('pageNumber', pageCourtCases.totalPages.toString())
  numberedPageLinks.push({
    text: pageCourtCases.totalPages.toString(),
    href: url.href,
    selected: pageCourtCases.last,
  } as NumberedPageLink)
  return numberedPageLinks
}

function numberPageRange(pageCourtCases: PagePagedCourtCase, start: number, end: number): number[] {
  return Array.from({ length: end + 1 - start }, (_, key) => key + start).filter(
    i => i > 1 && i < pageCourtCases.totalPages,
  )
}

function getResults(pageCourtCases: PagePagedCourtCase): ResultsMetaData {
  return {
    from: pageCourtCases.pageable.offset + 1,
    to: pageCourtCases.pageable.offset + pageCourtCases.numberOfElements,
    count: pageCourtCases.totalElements,
  }
}

function getPrevious(pageCourtCases: PagePagedCourtCase, url: URL): PageLink | null {
  url.searchParams.set('pageNumber', pageCourtCases.pageable.pageNumber.toString())
  return (
    (!pageCourtCases.first && {
      text: 'Previous',
      href: url.href,
    }) ||
    null
  )
}

function getNext(pageCourtCases: PagePagedCourtCase, url: URL): PageLink | null {
  url.searchParams.set('pageNumber', (pageCourtCases.pageable.pageNumber + 2).toString())
  return (
    (!pageCourtCases.last && {
      text: 'Next',
      href: url.href,
    }) ||
    null
  )
}
