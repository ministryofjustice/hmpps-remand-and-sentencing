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
import OffenceSentenceServeTypePage from '../pages/offenceSentenceServeTypePage'
import OffenceSentenceTypePage from '../pages/offenceSentenceTypePage'

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

const getTaskList = subject => {
  if (subject.get().length > 1) {
    throw new Error(`Selector "${subject.selector}" returned more than 1 element.`)
  }

  const taskListElement = subject.get()[0]

  return [...taskListElement.querySelectorAll('.govuk-task-list__item')].map(item => {
    const name = item
      .querySelector('.govuk-task-list__name-and-hint')
      .textContent.trim()
      .replace(/\s{2,}/g, ' ')
    const status = item
      .querySelector('.govuk-task-list__status')
      .textContent.trim()
      .replace(/\s{2,}/g, ' ')
    return {
      name,
      status,
    }
  })
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
Cypress.Commands.add('getTaskList', { prevSubject: true }, getTaskList)
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
    courtCaseWarrantTypePage.radioLabelSelector('REMAND').click()
    courtCaseWarrantTypePage.button().click()

    cy.visit(
      `/person/${personId}/add-court-case/${courtCaseReference}/appearance/${appearanceReference}/offences/${offenceReference}/offence-code`,
    )
    const offenceOffenceCodePage = Page.verifyOnPage(OffenceOffenceCodePage)
    offenceOffenceCodePage.input().clear()
    offenceOffenceCodePage.input().type('PS90037')
    offenceOffenceCodePage.button().click()
    const offenceOffenceCodeConfirmPage = Page.verifyOnPage(OffenceOffenceCodeConfirmPage)
    offenceOffenceCodeConfirmPage.button().click()
    const offenceTerrorRelatedPage = Page.verifyOnPage(OffenceTerrorRelatedPage)
    offenceTerrorRelatedPage.radioLabelSelector('true').click()
    offenceTerrorRelatedPage.button().click()
    const offenceOffenceDatePage = Page.verifyOnPage(OffenceOffenceDatePage)
    offenceOffenceDatePage.dayDateInput('offenceStartDate').clear()
    offenceOffenceDatePage.dayDateInput('offenceStartDate').type('15')
    offenceOffenceDatePage.monthDateInput('offenceStartDate').clear()
    offenceOffenceDatePage.monthDateInput('offenceStartDate').type('7')
    offenceOffenceDatePage.yearDateInput('offenceStartDate').clear()
    offenceOffenceDatePage.yearDateInput('offenceStartDate').type('2023')
    offenceOffenceDatePage.button().click()
    const offenceOffenceOutcomePage = Page.verifyOnPage(OffenceOffenceOutcomePage)
    offenceOffenceOutcomePage.radioLabelSelector('Recall to Prison').click()
    offenceOffenceOutcomePage.button().click()
  },
)

Cypress.Commands.add(
  'createSentencedOffence',
  (personId: string, courtCaseReference: string, appearanceReference: string, offenceReference: string) => {
    cy.visit(`/person/${personId}/add-court-case/${courtCaseReference}/appearance/${appearanceReference}/warrant-type`)
    const courtCaseWarrantTypePage = Page.verifyOnPage(CourtCaseWarrantTypePage)
    courtCaseWarrantTypePage.radioLabelSelector('SENTENCING').click()
    courtCaseWarrantTypePage.button().click()

    cy.visit(
      `/person/${personId}/add-court-case/${courtCaseReference}/appearance/${appearanceReference}/offences/${offenceReference}/count-number`,
    )
    const offenceCountNumberPage = Page.verifyOnPage(OffenceCountNumberPage)
    offenceCountNumberPage.input().clear()
    offenceCountNumberPage.input().type('1')
    offenceCountNumberPage.button().click()

    const offenceOffenceCodePage = Page.verifyOnPage(OffenceOffenceCodePage)
    offenceOffenceCodePage.input().clear()
    offenceOffenceCodePage.input().type('PS90037')
    offenceOffenceCodePage.button().click()
    const offenceOffenceCodeConfirmPage = Page.verifyOnPage(OffenceOffenceCodeConfirmPage)
    offenceOffenceCodeConfirmPage.button().click()

    const offenceTerrorRelatedPage = Page.verifyOnPage(OffenceTerrorRelatedPage)
    offenceTerrorRelatedPage.radioLabelSelector('true').click()
    offenceTerrorRelatedPage.button().click()

    const offenceOffenceDatePage = Page.verifyOnPage(OffenceOffenceDatePage)
    offenceOffenceDatePage.dayDateInput('offenceStartDate').clear()
    offenceOffenceDatePage.dayDateInput('offenceStartDate').type('12')
    offenceOffenceDatePage.monthDateInput('offenceStartDate').clear()
    offenceOffenceDatePage.monthDateInput('offenceStartDate').type('5')
    offenceOffenceDatePage.yearDateInput('offenceStartDate').clear()
    offenceOffenceDatePage.yearDateInput('offenceStartDate').type('2023')
    offenceOffenceDatePage.button().click()

    const offenceSentenceTypePage = Page.verifyOnPage(OffenceSentenceTypePage)
    offenceSentenceTypePage.radioLabelSelector('SDS (Standard Determinate Sentence)').click()
    offenceSentenceTypePage.button().click()

    const offenceSentenceLengthPage = Page.verifyOnPage(OffenceSentenceLengthPage)
    offenceSentenceLengthPage.yearsInput().clear()
    offenceSentenceLengthPage.yearsInput().type('4')
    offenceSentenceLengthPage.monthsInput().clear()
    offenceSentenceLengthPage.monthsInput().type('5')
    offenceSentenceLengthPage.button().click()

    const offenceSentenceServeTypePage = Page.verifyOnPage(OffenceSentenceServeTypePage)
    offenceSentenceServeTypePage.radioLabelSelector('FORTHWITH').click()
    offenceSentenceServeTypePage.button().click()
  },
)
