declare namespace Cypress {
  interface Chainable {
    /**
     * Custom command to signIn. Set failOnStatusCode to false if you expect and non 200 return code
     * @example cy.signIn({ failOnStatusCode: boolean })
     */
    signIn(options?: { failOnStatusCode: boolean }): Chainable<AUTWindow>
    getTable()
    getSummaryList()
    getTaskList()
    getOffenceCards()
    trimTextContent()
    getTableAndOffences()

    createCourtCase(personId: string, courtCaseNumber: string, appearanceReference: string): Chainable<AUTWindow>
    setupComponentsStubs(): Chainable<AUTWindow>
    setupComponentsStubsFail(): Chainable<AUTWindow>
    createOffence(
      personId: string,
      courtCaseReference: string,
      appearanceReference: string,
      offenceReference: string,
    ): Chainable<AUTWindow>
    createSentencedOffence(
      personId: string,
      courtCaseReference: string,
      appearanceReference: string,
      offenceReference: string,
    ): Chainable<AUTWindow>
  }
}
