import Page from '../pages/page'
import CourtCaseReferencePage from '../pages/courtCaseReferencePage'
import CourtCaseCheckAnswersPage from '../pages/courtCaseCheckAnswersPage'
import OffenceOffenceCodePage from '../pages/offenceOffenceCodePage'
import OffenceOffenceCodeConfirmPage from '../pages/offenceOffenceCodeConfirmPage'
import OffenceOffenceDatePage from '../pages/offenceOffenceDatePage'
import OffenceOffenceOutcomePage from '../pages/offenceOffenceOutcomePage'
import CourtCaseWarrantTypePage from '../pages/courtCaseWarrantTypePage'
import OffenceCountNumberPage from '../pages/offenceCountNumberPage'
import OffenceSentenceTypePage from '../pages/offenceSentenceTypePage'
import OffenceConvictionDatePage from '../pages/offenceConvictionDatePage'
import OffencePeriodLengthPage from '../pages/offencePeriodLengthPage'
import SentenceIsSentenceConsecutiveToPage from '../pages/sentenceIsSentenceConsecutiveToPage'
import SentenceSentenceConsecutiveToPage from '../pages/sentenceSentenceConsecutiveToPage'
import OffenceSentenceServeTypePage from '../pages/offenceSentenceServeTypePage'

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

const getAppearanceCardDetails = subject => {
  if (subject.get().length > 1) {
    throw new Error(`Selector "${subject.selector}" returned more than 1 element.`)
  }

  const card = subject.get()[0]

  const appearances = [...card.querySelectorAll('[data-qa=appearance]')].map(appearance => {
    const headers = [...appearance.querySelectorAll('h3')].map(e => e.textContent.replace(/\s/g, ' '))

    const values = headers.map(field => {
      const value =
        field !== 'Offences'
          ? appearance
              .querySelector(`[data-qa=${field.toLowerCase().replace(' ', '-')}]`)
              .textContent.replace(/\r?\n|\r|\n/g, '')
              .trim()
          : getOffenceDetails(appearance.querySelector(`[data-qa=${field.toLowerCase().replace(' ', '-')}]`))

      return {
        [field]: value,
      }
    })
    return Object.assign({}, ...values)
  })

  return appearances
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

const getActions = card => {
  if (card.get().length > 1) {
    throw new Error(`Selector "${card.selector}" returned more than 1 element.`)
  }

  return card
    .get()[0]
    .querySelector('.govuk-summary-card__actions')
    .querySelector('.govuk-link')
    .textContent.replace(/\r?\n|\r|\n/g, '')
    .trim()
    .replace(/\s{2,}/g, ' ')
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

const getRadioOptions = subject => {
  if (subject.get().length > 1) {
    throw new Error(`Selector "${subject.selector}" returned more than 1 element.`)
  }

  const radiosElement = subject.get()[0]

  return [...radiosElement.querySelectorAll('div.govuk-radios__item, div.govuk-radios__divider')].map(
    radioOptionElement => {
      if (radioOptionElement.classList.contains('govuk-radios__item')) {
        const label = radioOptionElement
          .querySelector('label')
          .textContent.trim()
          .replace(/\s{2,}/g, ' ')
        const input = radioOptionElement.querySelector('input')
        const { checked } = input
        return {
          label,
          checked,
        }
      }
      return {
        isDivider: true,
        label: radioOptionElement.textContent.trim().replace(/\s{2,}/g, ' '),
      }
    },
  )
}

Cypress.Commands.add('getTable', { prevSubject: true }, getTable)
Cypress.Commands.add('getSummaryList', { prevSubject: true }, getSummaryList)
Cypress.Commands.add('getActions', { prevSubject: true }, getActions)
Cypress.Commands.add('getTaskList', { prevSubject: true }, getTaskList)
Cypress.Commands.add('trimTextContent', { prevSubject: true }, trimTextContent)
Cypress.Commands.add('getOffenceCards', { prevSubject: true }, getOffenceCards)
Cypress.Commands.add('getAppearanceCardDetails', { prevSubject: true }, getAppearanceCardDetails)
Cypress.Commands.add('getRadioOptions', { prevSubject: true }, getRadioOptions)

Cypress.Commands.add('createCourtCase', (personId: string, courtCaseNumber: string, appearanceReference: string) => {
  cy.visit(
    `/person/${personId}/add-court-case/${courtCaseNumber}/add-court-appearance/${appearanceReference}/check-answers`,
  )
  const courtCaseCheckAnswersPage: CourtCaseCheckAnswersPage = Page.verifyOnPage(CourtCaseCheckAnswersPage)
  courtCaseCheckAnswersPage.changeLink(personId, courtCaseNumber, appearanceReference, 'reference').click()
  const courtCaseReferencePage = Page.verifyOnPageTitle(CourtCaseReferencePage, 'Enter the case reference')
  courtCaseReferencePage.input().type(courtCaseNumber)
  courtCaseReferencePage.continueButton().click()
  courtCaseCheckAnswersPage.continueButton().click()
})

Cypress.Commands.add(
  'createOffence',
  (personId: string, courtCaseReference: string, appearanceReference: string, offenceReference: string) => {
    cy.visit(
      `/person/${personId}/add-court-case/${courtCaseReference}/add-court-appearance/${appearanceReference}/warrant-type`,
    )
    const courtCaseWarrantTypePage = Page.verifyOnPage(CourtCaseWarrantTypePage)
    courtCaseWarrantTypePage.radioLabelSelector('REMAND').click()
    courtCaseWarrantTypePage.continueButton().click()

    cy.visit(
      `/person/${personId}/add-court-case/${courtCaseReference}/add-court-appearance/${appearanceReference}/offences/${offenceReference}/offence-date`,
    )
    const offenceOffenceDatePage = Page.verifyOnPageTitle(OffenceOffenceDatePage, 'Enter the offence date')
    offenceOffenceDatePage.dayDateInput('offenceStartDate').clear()
    offenceOffenceDatePage.dayDateInput('offenceStartDate').type('15')
    offenceOffenceDatePage.monthDateInput('offenceStartDate').clear()
    offenceOffenceDatePage.monthDateInput('offenceStartDate').type('7')
    offenceOffenceDatePage.yearDateInput('offenceStartDate').clear()
    offenceOffenceDatePage.yearDateInput('offenceStartDate').type('2023')
    offenceOffenceDatePage.continueButton().click()
    const offenceOffenceCodePage = Page.verifyOnPage(OffenceOffenceCodePage)
    offenceOffenceCodePage.input().clear()
    offenceOffenceCodePage.input().type('PS90037')
    offenceOffenceCodePage.continueButton().click()
    const offenceOffenceCodeConfirmPage = Page.verifyOnPage(OffenceOffenceCodeConfirmPage)
    offenceOffenceCodeConfirmPage.continueButton().click()
    const offenceOffenceOutcomePage = Page.verifyOnPageTitle(
      OffenceOffenceOutcomePage,
      'Select the outcome for this offence',
    )
    offenceOffenceOutcomePage.radioLabelContains('Remanded in custody').click()
    offenceOffenceOutcomePage.continueButton().click()
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
    courtCaseWarrantTypePage.continueButton().click()

    cy.visit(
      `/person/${personId}/add-court-case/${courtCaseReference}/add-court-appearance/${appearanceReference}/offences/${offenceReference}/offence-date`,
    )

    const offenceOffenceDatePage = Page.verifyOnPageTitle(OffenceOffenceDatePage, 'Enter the offence date')
    offenceOffenceDatePage.dayDateInput('offenceStartDate').clear()
    offenceOffenceDatePage.dayDateInput('offenceStartDate').type('12')
    offenceOffenceDatePage.monthDateInput('offenceStartDate').clear()
    offenceOffenceDatePage.monthDateInput('offenceStartDate').type('5')
    offenceOffenceDatePage.yearDateInput('offenceStartDate').clear()
    offenceOffenceDatePage.yearDateInput('offenceStartDate').type('2023')
    offenceOffenceDatePage.continueButton().click()

    const offenceOffenceCodePage = Page.verifyOnPage(OffenceOffenceCodePage)
    offenceOffenceCodePage.input().clear()
    offenceOffenceCodePage.input().type('PS90037')
    offenceOffenceCodePage.continueButton().click()
    const offenceOffenceCodeConfirmPage = Page.verifyOnPage(OffenceOffenceCodeConfirmPage)
    offenceOffenceCodeConfirmPage.continueButton().click()

    const offenceOffenceOutcomePage = Page.verifyOnPageTitle(
      OffenceOffenceOutcomePage,
      'Select the outcome for this offence',
    )
    offenceOffenceOutcomePage.radioLabelContains('Imprisonment').click()
    offenceOffenceOutcomePage.continueButton().click()

    const offenceCountNumberPage = Page.verifyOnPage(OffenceCountNumberPage)
    offenceCountNumberPage.radioLabelSelector('true').click()
    offenceCountNumberPage.input().clear()
    offenceCountNumberPage.input().type('1')
    offenceCountNumberPage.continueButton().click()

    const offenceConvictionDatePage = Page.verifyOnPageTitle(OffenceConvictionDatePage, 'Enter the conviction date')
    offenceConvictionDatePage.dayDateInput('convictionDate').clear()
    offenceConvictionDatePage.dayDateInput('convictionDate').type('12')
    offenceConvictionDatePage.monthDateInput('convictionDate').clear()
    offenceConvictionDatePage.monthDateInput('convictionDate').type('5')
    offenceConvictionDatePage.yearDateInput('convictionDate').clear()
    offenceConvictionDatePage.yearDateInput('convictionDate').type('2023')
    offenceConvictionDatePage.continueButton().click()

    const offenceSentenceTypePage = Page.verifyOnPage(OffenceSentenceTypePage)
    offenceSentenceTypePage.radioLabelContains('SDS (Standard Determinate Sentence)').click()
    offenceSentenceTypePage.continueButton().click()

    const offencePeriodLengthPage = Page.verifyOnPageTitle(OffencePeriodLengthPage, 'sentence length')
    offencePeriodLengthPage.yearsInput().clear()
    offencePeriodLengthPage.yearsInput().type('4')
    offencePeriodLengthPage.monthsInput().clear()
    offencePeriodLengthPage.monthsInput().type('5')
    offencePeriodLengthPage.continueButton().click()

    const sentenceIsConsecutiveToPage = Page.verifyOnPage(SentenceIsSentenceConsecutiveToPage)
    sentenceIsConsecutiveToPage.radioLabelSelector('false').click()
    sentenceIsConsecutiveToPage.continueButton().click()
  },
)

Cypress.Commands.add(
  'createSentencedOffenceConsecutiveTo',
  (
    personId: string,
    courtCaseReference: string,
    appearanceReference: string,
    offenceReference: string,
    countNumber: string = '2',
    consecutiveToSelect: string = '0|SAME',
  ) => {
    cy.visit(
      `/person/${personId}/add-court-case/${courtCaseReference}/add-court-appearance/${appearanceReference}/offences/${offenceReference}/offence-date`,
    )

    const offenceOffenceDatePage = Page.verifyOnPageTitle(OffenceOffenceDatePage, 'Enter the offence date')
    offenceOffenceDatePage.dayDateInput('offenceStartDate').clear()
    offenceOffenceDatePage.dayDateInput('offenceStartDate').type('12')
    offenceOffenceDatePage.monthDateInput('offenceStartDate').clear()
    offenceOffenceDatePage.monthDateInput('offenceStartDate').type('5')
    offenceOffenceDatePage.yearDateInput('offenceStartDate').clear()
    offenceOffenceDatePage.yearDateInput('offenceStartDate').type('2023')
    offenceOffenceDatePage.continueButton().click()

    const offenceOffenceCodePage = Page.verifyOnPage(OffenceOffenceCodePage)
    offenceOffenceCodePage.input().clear()
    offenceOffenceCodePage.input().type('PS90037')
    offenceOffenceCodePage.continueButton().click()
    const offenceOffenceCodeConfirmPage = Page.verifyOnPage(OffenceOffenceCodeConfirmPage)
    offenceOffenceCodeConfirmPage.continueButton().click()

    const offenceOffenceOutcomePage = Page.verifyOnPageTitle(
      OffenceOffenceOutcomePage,
      'Select the outcome for this offence',
    )
    offenceOffenceOutcomePage.radioLabelContains('Imprisonment').click()
    offenceOffenceOutcomePage.continueButton().click()

    const offenceCountNumberPage = Page.verifyOnPage(OffenceCountNumberPage)
    offenceCountNumberPage.radioLabelSelector('true').click()
    offenceCountNumberPage.input().clear()
    offenceCountNumberPage.input().type(countNumber)
    offenceCountNumberPage.continueButton().click()

    const offenceConvictionDatePage = Page.verifyOnPageTitle(OffenceConvictionDatePage, 'Enter the conviction date')
    offenceConvictionDatePage.dayDateInput('convictionDate').clear()
    offenceConvictionDatePage.dayDateInput('convictionDate').type('12')
    offenceConvictionDatePage.monthDateInput('convictionDate').clear()
    offenceConvictionDatePage.monthDateInput('convictionDate').type('5')
    offenceConvictionDatePage.yearDateInput('convictionDate').clear()
    offenceConvictionDatePage.yearDateInput('convictionDate').type('2023')
    offenceConvictionDatePage.continueButton().click()

    const offenceSentenceTypePage = Page.verifyOnPage(OffenceSentenceTypePage)
    offenceSentenceTypePage.radioLabelContains('SDS (Standard Determinate Sentence)').click()
    offenceSentenceTypePage.continueButton().click()

    const offencePeriodLengthPage = Page.verifyOnPageTitle(OffencePeriodLengthPage, 'sentence length')
    offencePeriodLengthPage.yearsInput().clear()
    offencePeriodLengthPage.yearsInput().type('4')
    offencePeriodLengthPage.monthsInput().clear()
    offencePeriodLengthPage.monthsInput().type('5')
    offencePeriodLengthPage.continueButton().click()
    const offenceSentenceServeTypePage = Page.verifyOnPage(OffenceSentenceServeTypePage)
    offenceSentenceServeTypePage.radioLabelSelector('CONSECUTIVE').click()
    offenceSentenceServeTypePage.continueButton().click()
    const sentenceSentenceConsecutiveToPage = Page.verifyOnPage(SentenceSentenceConsecutiveToPage)
    sentenceSentenceConsecutiveToPage.radioLabelSelector(consecutiveToSelect).click()
    sentenceSentenceConsecutiveToPage.continueButton().click()
  },
)
