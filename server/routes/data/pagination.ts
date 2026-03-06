import { SearchCourtCasesPage } from '../../@types/remandAndSentencingApi/remandAndSentencingClientTypes'

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
  searchCourtCasesPage: SearchCourtCasesPage,
  url: URL,
): PageViewModel | null {
  if (searchCourtCasesPage.totalPages > 1) {
    return {
      previous: getPrevious(searchCourtCasesPage, url),
      next: getNext(searchCourtCasesPage, url),
      items: getNumberedPageItems(searchCourtCasesPage, url),
    }
  }
  return null
}

export function getPaginationResults(searchCourtCasesPage: SearchCourtCasesPage): ResultsMetaData {
  return {
    from: searchCourtCasesPage.pageable.offset + 1,
    to: searchCourtCasesPage.pageable.offset + searchCourtCasesPage.numberOfElements,
    count: searchCourtCasesPage.totalElements,
  }
}

function getNumberedPageItems(searchCourtCasesPage: SearchCourtCasesPage, url: URL): NumberedPageLink[] {
  url.searchParams.set('pageNumber', '1')
  const numberedPageLinks = [
    {
      number: 1,
      href: url.href,
      current: searchCourtCasesPage.first,
    } as NumberedPageLink,
  ]
  if (searchCourtCasesPage.pageable.pageNumber >= 3) {
    numberedPageLinks.push({
      ellipsis: true,
    })
  }
  numberPageRange(
    searchCourtCasesPage,
    searchCourtCasesPage.pageable.pageNumber,
    searchCourtCasesPage.pageable.pageNumber + 2,
  ).forEach(pageNumber => {
    url.searchParams.set('pageNumber', pageNumber.toString())
    numberedPageLinks.push({
      number: pageNumber,
      href: url.href,
      current: pageNumber === searchCourtCasesPage.pageable.pageNumber + 1,
    } as NumberedPageLink)
  })
  if (searchCourtCasesPage.pageable.pageNumber < searchCourtCasesPage.totalPages - 3) {
    numberedPageLinks.push({
      ellipsis: true,
    })
  }
  url.searchParams.set('pageNumber', searchCourtCasesPage.totalPages.toString())
  numberedPageLinks.push({
    number: searchCourtCasesPage.totalPages,
    href: url.href,
    current: searchCourtCasesPage.last,
  } as NumberedPageLink)
  return numberedPageLinks
}

function numberPageRange(searchCourtCasesPage: SearchCourtCasesPage, start: number, end: number): number[] {
  return Array.from({ length: end + 1 - start }, (_, key) => key + start).filter(
    i => i > 1 && i < searchCourtCasesPage.totalPages,
  )
}

function getPrevious(searchCourtCasesPage: SearchCourtCasesPage, url: URL): PageLink | null {
  url.searchParams.set('pageNumber', searchCourtCasesPage.pageable.pageNumber.toString())
  return (
    (!searchCourtCasesPage.first && {
      href: url.href,
    }) ||
    null
  )
}

function getNext(searchCourtCasesPage: SearchCourtCasesPage, url: URL): PageLink | null {
  url.searchParams.set('pageNumber', (searchCourtCasesPage.pageable.pageNumber + 2).toString())
  return (
    (!searchCourtCasesPage.last && {
      href: url.href,
    }) ||
    null
  )
}
