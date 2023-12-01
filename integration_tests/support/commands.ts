import Page from '../pages/page'
import CourtCaseReferencePage from '../pages/courtCaseReferencePage'
import CourtCaseCheckAnswersPage from '../pages/courtCaseCheckAnswersPage'
import OffenceOffenceCodePage from '../pages/offenceOffenceCodePage'
import OffenceOffenceCodeConfirmPage from '../pages/offenceOffenceCodeConfirmPage'
import OffenceOffenceDatePage from '../pages/offenceOffenceDatePage'
import OffenceOffenceOutcomePage from '../pages/offenceOffenceOutcomePage'

Cypress.Commands.add('signIn', (options = { failOnStatusCode: true }) => {
  cy.request('/')
  return cy.task('getSignInUrl').then((url: string) => cy.visit(url, options))
})

const getSummaryList = subject => {
  if (subject.get().length > 1) {
    throw new Error(`Selector "${subject.selector}" returned more than 1 element.`)
  }

  const summaryListElement = subject.get()[0]

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

Cypress.Commands.add('getSummaryList', { prevSubject: true }, getSummaryList)

Cypress.Commands.add('createCourtCase', (personId: string, courtCaseNumber: string, appearanceReference: string) => {
  cy.visit(`/person/${personId}/court-cases/${courtCaseNumber}/appearance/${appearanceReference}/check-answers`)
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
    cy.visit(
      `/person/${personId}/court-cases/${courtCaseReference}/appearance/${appearanceReference}/offences/${offenceReference}/offence-code`,
    )
    const offenceOffenceCodePage = Page.verifyOnPage(OffenceOffenceCodePage)
    offenceOffenceCodePage.input().type('CC12345')
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
