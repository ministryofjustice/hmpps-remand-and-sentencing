import Page from '../pages/page'
import CourtCaseReferencePage from '../pages/courtCaseReferencePage'
import CourtCaseCheckAnswersPage from '../pages/courtCaseCheckAnswersPage'
import OffenceOffenceCodePage from '../pages/offenceOffenceCodePage'
import OffenceOffenceCodeConfirmPage from '../pages/offenceOffenceCodeConfirmPage'
import OffenceOffenceDatePage from '../pages/offenceOffenceDatePage'
import OffenceOffenceOutcomePage from '../pages/offenceOffenceOutcomePage'
import CourtCaseWarrantTypePage from '../pages/courtCaseWarrantTypePage'
import OffenceCountNumberPage from '../pages/offenceCountNumberPage'
import OffenceTerrorRelatedPage from '../pages/offenceTerrorRelatedPage'
import OffenceSentenceServeTypePage from '../pages/offenceSentenceServeTypePage'
import OffenceSentenceTypePage from '../pages/offenceSentenceTypePage'
import OffenceConvictionDatePage from '../pages/offenceConvictionDatePage'
import OffencePeriodLengthPage from '../pages/offencePeriodLengthPage'

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

const getTableAndOffences = subject => {
  if (subject.get().length > 1) {
    throw new Error(`Selector "${subject.selector}" returned more than 1 element.`)
  }

  const tableElement = subject.get()[0]
  const headers = [...tableElement.querySelectorAll('thead th')].map(e => e.textContent.replace(/\s/g, ' '))

  const rows = [...tableElement.querySelectorAll('tbody tr')].map(row => {
    return [...row.querySelectorAll('td, th')].map(e => {
      if (e.firstElementChild && e.firstElementChild.tagName === 'DETAILS') {
        return getOffenceDetails(e.querySelector('details'))
      }
      return e.textContent.replace(/\r?\n|\r|\n/g, '').trim()
    })
  })

  return rows.map(row =>
    row.reduce((acc, curr, index) => {
      if (typeof curr === 'string') {
        return { ...acc, [headers[index]]: curr }
      }
      return { ...acc, ...curr }
    }, {}),
  )
}

const getOffenceDetails = detailsElement => {
  const summary = detailsElement
    .querySelector('summary')
    .textContent.replace(/\r?\n|\r|\n/g, '')
    .trim()
  const offences = offenceCardContainerToOffenceCard(detailsElement.querySelector('.govuk-details__text'))
  return { [summary]: offences }
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

  return offenceCardContainerToOffenceCard(offenceCardContainer)
}

const offenceCardContainerToOffenceCard = offenceCardContainer => {
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
Cypress.Commands.add('getTableAndOffences', { prevSubject: true }, getTableAndOffences)

Cypress.Commands.add('createCourtCase', (personId: string, courtCaseNumber: string, appearanceReference: string) => {
  cy.visit(
    `/person/${personId}/add-court-case/${courtCaseNumber}/add-court-appearance/${appearanceReference}/check-answers`,
  )
  const courtCaseCheckAnswersPage: CourtCaseCheckAnswersPage = Page.verifyOnPage(CourtCaseCheckAnswersPage)
  courtCaseCheckAnswersPage.changeLink(personId, courtCaseNumber, appearanceReference, 'reference').click()
  const courtCaseReferencePage = Page.verifyOnPageTitle(CourtCaseReferencePage, 'Enter the case reference')
  courtCaseReferencePage.input().type(courtCaseNumber)
  courtCaseReferencePage.button().click()
  courtCaseCheckAnswersPage.button().click()
})

Cypress.Commands.add(
  'createOffence',
  (personId: string, courtCaseReference: string, appearanceReference: string, offenceReference: string) => {
    cy.visit(
      `/person/${personId}/add-court-case/${courtCaseReference}/add-court-appearance/${appearanceReference}/warrant-type`,
    )
    const courtCaseWarrantTypePage = Page.verifyOnPage(CourtCaseWarrantTypePage)
    courtCaseWarrantTypePage.radioLabelSelector('REMAND').click()
    courtCaseWarrantTypePage.button().click()

    cy.visit(
      `/person/${personId}/add-court-case/${courtCaseReference}/add-court-appearance/${appearanceReference}/offences/${offenceReference}/offence-code`,
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
    const offenceOffenceDatePage = Page.verifyOnPageTitle(OffenceOffenceDatePage, 'Enter the offence date')
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
    cy.visit(
      `/person/${personId}/add-court-case/${courtCaseReference}/add-court-appearance/${appearanceReference}/warrant-type`,
    )
    const courtCaseWarrantTypePage = Page.verifyOnPage(CourtCaseWarrantTypePage)
    courtCaseWarrantTypePage.radioLabelSelector('SENTENCING').click()
    courtCaseWarrantTypePage.button().click()

    cy.visit(
      `/person/${personId}/add-court-case/${courtCaseReference}/add-court-appearance/${appearanceReference}/offences/${offenceReference}/count-number`,
    )
    const offenceCountNumberPage = Page.verifyOnPage(OffenceCountNumberPage)
    offenceCountNumberPage.input().clear()
    offenceCountNumberPage.input().type('1')
    offenceCountNumberPage.button().click()

    const offenceConvictionDatePage = Page.verifyOnPageTitle(OffenceConvictionDatePage, 'Enter the conviction date')
    offenceConvictionDatePage.dayDateInput('convictionDate').clear()
    offenceConvictionDatePage.dayDateInput('convictionDate').type('12')
    offenceConvictionDatePage.monthDateInput('convictionDate').clear()
    offenceConvictionDatePage.monthDateInput('convictionDate').type('5')
    offenceConvictionDatePage.yearDateInput('convictionDate').clear()
    offenceConvictionDatePage.yearDateInput('convictionDate').type('2023')
    offenceConvictionDatePage.button().click()

    const offenceOffenceCodePage = Page.verifyOnPage(OffenceOffenceCodePage)
    offenceOffenceCodePage.input().clear()
    offenceOffenceCodePage.input().type('PS90037')
    offenceOffenceCodePage.button().click()
    const offenceOffenceCodeConfirmPage = Page.verifyOnPage(OffenceOffenceCodeConfirmPage)
    offenceOffenceCodeConfirmPage.button().click()

    const offenceTerrorRelatedPage = Page.verifyOnPage(OffenceTerrorRelatedPage)
    offenceTerrorRelatedPage.radioLabelSelector('true').click()
    offenceTerrorRelatedPage.button().click()

    const offenceOffenceDatePage = Page.verifyOnPageTitle(OffenceOffenceDatePage, 'Enter the offence date')
    offenceOffenceDatePage.dayDateInput('offenceStartDate').clear()
    offenceOffenceDatePage.dayDateInput('offenceStartDate').type('12')
    offenceOffenceDatePage.monthDateInput('offenceStartDate').clear()
    offenceOffenceDatePage.monthDateInput('offenceStartDate').type('5')
    offenceOffenceDatePage.yearDateInput('offenceStartDate').clear()
    offenceOffenceDatePage.yearDateInput('offenceStartDate').type('2023')
    offenceOffenceDatePage.button().click()

    const offenceSentenceTypePage = Page.verifyOnPage(OffenceSentenceTypePage)
    offenceSentenceTypePage.radioLabelContains('SDS (Standard Determinate Sentence)').click()
    offenceSentenceTypePage.button().click()

    const offencePeriodLengthPage = Page.verifyOnPageTitle(OffencePeriodLengthPage, 'sentence length')
    offencePeriodLengthPage.yearsInput().clear()
    offencePeriodLengthPage.yearsInput().type('4')
    offencePeriodLengthPage.monthsInput().clear()
    offencePeriodLengthPage.monthsInput().type('5')
    offencePeriodLengthPage.button().click()

    const offenceSentenceServeTypePage = Page.verifyOnPage(OffenceSentenceServeTypePage)
    offenceSentenceServeTypePage.radioLabelSelector('FORTHWITH').click()
    offenceSentenceServeTypePage.button().click()
  },
)
