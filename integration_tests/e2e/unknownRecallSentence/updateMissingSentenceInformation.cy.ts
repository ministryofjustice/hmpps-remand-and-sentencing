import UpdateMissingSentenceInformationPage from '../../pages/updateMissingSentenceInformationPage'
import Page from '../../pages/page'

context('Update missing sentence information page', () => {
  let updateMissingSentenceInformationPage: UpdateMissingSentenceInformationPage
  beforeEach(() => {
    cy.task('happyPathStubs')
    cy.task('stubGetPrisonerDetails')
    cy.task('stubGetSentencesWithUnknownRecallType')
    cy.task('stubGetOffencesByCodes', {})
    cy.task('stubGetOffenceByCode', {})
    cy.task('stubGetCourtsByIds', {})
  })

  it('displays the page with the correct content', () => {
    cy.signIn()
    cy.visit('/person/A1234AB/unknown-recall-sentence?sentenceUuids=a-sentence-uuid')
    updateMissingSentenceInformationPage = Page.verifyOnPage(UpdateMissingSentenceInformationPage)
    updateMissingSentenceInformationPage.heading().contains('Update missing sentence information')
    updateMissingSentenceInformationPage.caption().contains('Update sentence information')
    updateMissingSentenceInformationPage
      .body()
      .contains(
        'To make sure release dates are calculated correctly, you must add the missing sentence information including the original sentence type, not the recall sentence type.',
      )
    updateMissingSentenceInformationPage.sentenceCount().contains('Sentences that have not been updated (1)')
    updateMissingSentenceInformationPage.appearanceHeading().contains('MDI-Magistrates Court on 15/11/2023')
    updateMissingSentenceInformationPage.offenceCard(0).should('contain.text', 'Robbery')
    updateMissingSentenceInformationPage.offenceCard(0).should('contain.text', 'Committed on 15/11/2023')
    updateMissingSentenceInformationPage.offenceCard(0).should('contain.text', 'Convicted on 15/11/2023')
    updateMissingSentenceInformationPage.offenceCard(0).should('contain.text', 'Sentence type: Missing')
    updateMissingSentenceInformationPage.offenceCard(0).should('contain.text', 'Sentence date: 15/11/2023')
    updateMissingSentenceInformationPage.offenceCard(0).should('contain.text', 'Sentence length: Missing')
    updateMissingSentenceInformationPage.offenceCard(0).should('contain.text', 'Concurrent')
    updateMissingSentenceInformationPage.updateSentenceLink(0).should('exist')
  })
})
