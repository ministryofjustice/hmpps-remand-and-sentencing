import Page from '../pages/page'
import CourtCaseReferencePage from '../pages/courtCaseReferencePage'
import CourtCaseCheckAnswersPage from '../pages/courtCaseCheckAnswersPage'
import OffenceOffenceCodePage from '../pages/offenceOffenceCodePage'
import OffenceOffenceCodeConfirmPage from '../pages/offenceOffenceCodeConfirmPage'
import OffenceOffenceDatePage from '../pages/offenceOffenceDatePage'
import OffenceOffenceOutcomePage from '../pages/offenceOffenceOutcomePage'
import CourtCaseWarrantTypePage from '../pages/courtCaseWarrantTypePage'
import OffenceCountNumberPage from '../pages/offenceCountNumberPage'
import OffenceSentenceLengthPage from '../pages/offenceSentenceLengthPage'
import OffenceTerrorRelatedPage from '../pages/offenceTerrorRelatedPage'

Cypress.Commands.add('signIn', (options = { failOnStatusCode: true }) => {
  cy.request('/')
  return cy.task('getSignInUrl').then((url: string) => cy.visit(url, options))
})

const getTable = subject => {
  if (subject.get().length > 1) {
    throw new Error(`Selector "${subject.selector}" returned more than 1 element.`)
  }

  const tableElement = subject.get()[0]
  const headers = [...tableElement.querySelectorAll('thead th')].map(e => e.textContent.replace(/\s/g, ' '))

  const rows = [...tableElement.querySelectorAll('tbody tr')].map(row => {
    return [...row.querySelectorAll('td, th')].map(e => e.textContent.replace(/\r?\n|\r|\n/g, '').trim())
  })

  return rows.map(row =>
    row.reduce((acc, curr, index) => {
      return { ...acc, [headers[index]]: curr }
    }, {}),
  )
}

const getSummaryList = subject => {
  if (subject.get().length > 1) {
    throw new Error(`Selector "${subject.selector}" returned more than 1 element.`)
  }

  const summaryListElement = subject.get()[0]
  return summaryListElementToObject(summaryListElement)
}

const summaryListElementToObject = summaryListElement => {
  const rows = [...summaryListElement.querySelectorAll('.govuk-summary-list__row')].map(row => {
    const key = row
      .querySelector('.govuk-summary-list__key')
      .textContent.trim()
      .replace(/\s{2,}/g, ' ')
    const value = row
      .querySelector('.govuk-summary-list__value')
      .textContent.replace(/\r?\n|\r|\n/g, '')
      .trim()
      .replace(/\s{2,}/g, ' ')
    return { [key]: value }
  })

  return rows.reduce((acc, curr) => {
    return { ...acc, ...curr }
  }, {})
}

const getOffenceCards = subject => {
  if (subject.get().length > 1) {
    throw new Error(`Selector "${subject.selector}" returned more than 1 element.`)
  }

  const offenceCardContainer = subject.get()[0]

  return [...offenceCardContainer.querySelectorAll('.offence-card-offence-details')].map(offenceCardElement => {
    const offenceCardHeader = offenceCardElement
      .querySelector('.govuk-heading-s')
      .textContent.trim()
      .replace(/\s{2,}/g, ' ')

    const offenceCardSummaryList = summaryListElementToObject(
      offenceCardElement.querySelector('[data-qa=offenceSummaryList]'),
    )

    return { offenceCardHeader, ...offenceCardSummaryList }
  })
}

const trimTextContent = subject => {
  if (subject.get().length > 1) {
    throw new Error(`Selector "${subject.selector}" returned more than 1 element.`)
  }

  const element = subject.get()[0]

  return element.textContent.trim().replace(/\s{2,}/g, ' ')
}

Cypress.Commands.add('getTable', { prevSubject: true }, getTable)
Cypress.Commands.add('getSummaryList', { prevSubject: true }, getSummaryList)
Cypress.Commands.add('trimTextContent', { prevSubject: true }, trimTextContent)
Cypress.Commands.add('getOffenceCards', { prevSubject: true }, getOffenceCards)

Cypress.Commands.add('createCourtCase', (personId: string, courtCaseNumber: string, appearanceReference: string) => {
  cy.visit(`/person/${personId}/add-court-case/${courtCaseNumber}/appearance/${appearanceReference}/check-answers`)
  const courtCaseCheckAnswersPage: CourtCaseCheckAnswersPage = Page.verifyOnPage(CourtCaseCheckAnswersPage)
  courtCaseCheckAnswersPage.changeLink(personId, courtCaseNumber, appearanceReference, 'reference').click()
  const courtCaseReferencePage = Page.verifyOnPage(CourtCaseReferencePage)
  courtCaseReferencePage.input().type(courtCaseNumber)
  courtCaseReferencePage.button().click()
  courtCaseCheckAnswersPage.button().click()
})

Cypress.Commands.add(
  'createOffence',
  (personId: string, courtCaseReference: string, appearanceReference: string, offenceReference: string) => {
    cy.visit(`/person/${personId}/add-court-case/${courtCaseReference}/appearance/${appearanceReference}/warrant-type`)
    const courtCaseWarrantTypePage = Page.verifyOnPage(CourtCaseWarrantTypePage)
    courtCaseWarrantTypePage.radioSelector('REMAND').click()
    courtCaseWarrantTypePage.button().click()

    cy.visit(
      `/person/${personId}/add-court-case/${courtCaseReference}/appearance/${appearanceReference}/offences/${offenceReference}/offence-code`,
    )
    const offenceOffenceCodePage = Page.verifyOnPage(OffenceOffenceCodePage)
    offenceOffenceCodePage.input().type('PS90037')
    offenceOffenceCodePage.button().click()
    const offenceOffenceCodeConfirmPage = Page.verifyOnPage(OffenceOffenceCodeConfirmPage)
    offenceOffenceCodeConfirmPage.button().click()
    const offenceOffenceDatePage = Page.verifyOnPage(OffenceOffenceDatePage)
    offenceOffenceDatePage.dayDateInput('offence-start-date').type('15')
    offenceOffenceDatePage.monthDateInput('offence-start-date').type('7')
    offenceOffenceDatePage.yearDateInput('offence-start-date').type('2023')
    offenceOffenceDatePage.button().click()
    const offenceOffenceOutcomePage = Page.verifyOnPage(OffenceOffenceOutcomePage)
    offenceOffenceOutcomePage.radioSelector('Recall to Prison').click()
    offenceOffenceOutcomePage.button().click()
  },
)

Cypress.Commands.add(
  'createSentencedOffence',
  (personId: string, courtCaseReference: string, appearanceReference: string, offenceReference: string) => {
    cy.visit(`/person/${personId}/add-court-case/${courtCaseReference}/appearance/${appearanceReference}/warrant-type`)
    const courtCaseWarrantTypePage = Page.verifyOnPage(CourtCaseWarrantTypePage)
    courtCaseWarrantTypePage.radioSelector('SENTENCING').click()
    courtCaseWarrantTypePage.button().click()

    cy.visit(
      `/person/${personId}/add-court-case/${courtCaseReference}/appearance/${appearanceReference}/offences/${offenceReference}/count-number`,
    )
    const offenceCountNumberPage = Page.verifyOnPage(OffenceCountNumberPage)
    offenceCountNumberPage.input().type('1')
    offenceCountNumberPage.button().click()

    const offenceOffenceCodePage = Page.verifyOnPage(OffenceOffenceCodePage)
    offenceOffenceCodePage.input().type('PS90037')
    offenceOffenceCodePage.button().click()
    const offenceOffenceCodeConfirmPage = Page.verifyOnPage(OffenceOffenceCodeConfirmPage)
    offenceOffenceCodeConfirmPage.button().click()

    const offenceTerrorRelatedPage = Page.verifyOnPage(OffenceTerrorRelatedPage)
    offenceTerrorRelatedPage.radioSelector('true').click()
    offenceTerrorRelatedPage.button().click()

    const offenceOffenceDatePage = Page.verifyOnPage(OffenceOffenceDatePage)
    offenceOffenceDatePage.dayDateInput('offence-start-date').type('12')
    offenceOffenceDatePage.monthDateInput('offence-start-date').type('5')
    offenceOffenceDatePage.yearDateInput('offence-start-date').type('2023')
    offenceOffenceDatePage.button().click()

    const offenceOffenceOutcomePage = Page.verifyOnPage(OffenceOffenceOutcomePage)
    offenceOffenceOutcomePage.radioSelector('Sentencing outcome 1').click()
    offenceOffenceOutcomePage.button().click()

    const offenceSentenceLengthPage = Page.verifyOnPage(OffenceSentenceLengthPage)
    offenceSentenceLengthPage.yearsInput().type('4')
    offenceSentenceLengthPage.monthsInput().type('5')
    offenceSentenceLengthPage.button().click()
  },
)
