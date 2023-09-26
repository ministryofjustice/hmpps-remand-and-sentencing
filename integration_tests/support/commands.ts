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
