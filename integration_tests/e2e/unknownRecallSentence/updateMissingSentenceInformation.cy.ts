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
    updateMissingSentenceInformationPage
      .appearanceHeading()
      .contains('T20231234 at Accrington Youth Court on 15/11/2023')

    updateMissingSentenceInformationPage.offenceCard(0).should('contain.text', 'PS90037 An offence description')
    updateMissingSentenceInformationPage.offenceCard(0).should('contain.text', '15/11/2023')
    updateMissingSentenceInformationPage.offenceCard(0).should('contain.text', '15/11/2023')
    updateMissingSentenceInformationPage.offenceCard(0).should('contain.text', 'Concurrent')
  })
})
