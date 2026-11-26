import Page from '../../pages/page'
import CourtCaseDetailsPage from '../../pages/courtCaseDetailsPage'
import CourtCaseTaskListPage from '../../pages/courtCaseTaskListPage'
import CourtCaseOverallCaseOutcomePage from '../../pages/courtCaseOverallCaseOutcomePage'
import CourtCaseSelectReferencePage from '../../pages/courtCaseSelectReferencePage'
import CourtCaseWarrantDatePage from '../../pages/courtCaseWarrantDatePage'
import CourtCaseSelectCourtNamePage from '../../pages/courtCaseSelectCourtNamePage'
import CourtCaseCheckAnswersPage from '../../pages/courtCaseCheckAnswersPage'

context('Add missed hearing', () => {
  const courtCaseUuid = '83517113-5c14-4628-9133-1e3cb12e31fa'
  const appearance = {
    appearanceUuid: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
    appearanceDate: '2025-07-21',
    courtCode: 'STHHPM',
    warrantType: 'NON_SENTENCING',
    courtCaseReference: '1234567',
    outcome: { outcomeUuid: '1', outcomeName: 'Remanded in custody' },
    charges: [
      {
        chargeUuid: '11111111-1111-4111-8111-111111111111',
        offenceCode: 'PS90037',
        offenceStartDate: '2025-07-21',
        outcome: { outcomeUuid: '1', outcomeName: 'Remanded in custody' },
      },
    ],
    source: 'DPS',
    deleteStatus: 'SUPPORTED',
    documents: [],
    periodLengths: [],
  }

  beforeEach(() => {
    cy.task('happyPathStubs')
    cy.task('stubGetOffencesByCodes', {})
    cy.task('stubGetCourtsByIds')
    cy.task('stubGetCourtById', { courtId: 'STHHPM', courtName: 'Southampton Magistrate Court' })
    cy.task('stubGetCourtById', { courtId: 'ACCRYC', courtName: 'Accrington Youth Court' })
    cy.task('stubGetCourtCaseDetails', { courtCaseUuid, appearances: [appearance] })
    cy.task('stubGetLatestCourtAppearance', { courtCaseUuid })
    cy.task('stubGetAllAppearanceOutcomes')
    cy.task('stubGetLatestOffenceDate', { courtCaseUuid })
    cy.task('stubGetCourtCaseValidationDates', { courtCaseUuid })
    cy.signIn()
    cy.visit(`/person/A1234AB/edit-court-case/${courtCaseUuid}/details`)
  })

  it('should start a new hearing on the task list without reusing an existing appearance', () => {
    const detailsPage = Page.verifyOnPageTitle(CourtCaseDetailsPage, 'Hearings for 1234567 at')
    detailsPage
      .addMissedHearingButton()
      .should('contain.text', 'Add missed hearing')
      .and('have.attr', 'href')
      .and('match', /\/add-court-appearance\/[0-9a-f-]{36}\/missed-hearing\/new-journey$/)
      .and('not.contain', appearance.appearanceUuid)

    detailsPage.addMissedHearingButton().click()

    const courtCaseTaskListPage = Page.verifyOnPageTitle(CourtCaseTaskListPage, 'Add a hearing to a court case')
    courtCaseTaskListPage
      .taskList()
      .getTaskList()
      .should('deep.equal', [
        {
          name: 'Add hearing information',
          status: 'Incomplete',
        },
        {
          name: 'Review offences',
          status: 'Cannot start yet',
        },
        {
          name: 'Upload court documents',
          status: 'Cannot start yet',
        },
      ])

    courtCaseTaskListPage.continueButton().should('be.disabled')
  })

  it('should complete hearing information starting from the overall case outcome set as Remanded in custody', () => {
    Page.verifyOnPageTitle(CourtCaseDetailsPage, 'Hearings for 1234567 at').addMissedHearingButton().click()

    const taskListPage = Page.verifyOnPageTitle(CourtCaseTaskListPage, 'Add a hearing to a court case')
    taskListPage
      .hearingInformationLink()
      .should('have.attr', 'href')
      .and('match', /\/overall-case-outcome\?backTo=taskList$/)
    taskListPage.hearingInformationLink().click()

    const outcomePage = Page.verifyOnPageTitle(CourtCaseOverallCaseOutcomePage, 'Select the overall case outcome')
    outcomePage.radioLabelContains('Remanded in custody').click()
    outcomePage.continueButton().click()

    const referencePage = Page.verifyOnPageTitle(CourtCaseSelectReferencePage, 'C894623')
    referencePage
      .backLink()
      .should('have.attr', 'href')
      .and('match', /\/overall-case-outcome\?backTo=taskList$/)
    referencePage.radioLabelSelector('true').click()
    referencePage.continueButton().click()

    const warrantDatePage = Page.verifyOnPageTitle(CourtCaseWarrantDatePage, 'warrant')
    warrantDatePage.dayDateInput('warrantDate').type('13')
    warrantDatePage.monthDateInput('warrantDate').type('5')
    warrantDatePage.yearDateInput('warrantDate').type('2023')
    warrantDatePage.continueButton().click()

    const courtPage = Page.verifyOnPageTitle(CourtCaseSelectCourtNamePage, 'Was the hearing at Accrington Youth Court?')
    courtPage.radioLabelSelector('true').click()
    courtPage.continueButton().click()

    const checkAnswersPage = Page.verifyOnPage(CourtCaseCheckAnswersPage)
    checkAnswersPage.summaryList().getSummaryList().should('deep.equal', {
      'Case reference': 'C894623',
      'Warrant date': '13/05/2023',
      'Court name': 'Accrington Youth Court',
      'Overall case outcome': 'Remanded in custody',
    })
    checkAnswersPage.continueButton().click()

    Page.verifyOnPageTitle(CourtCaseTaskListPage, 'Add a hearing to a court case')
  })

  it('should complete hearing information starting from the overall case outcome set as Lie on file', () => {
    Page.verifyOnPageTitle(CourtCaseDetailsPage, 'Hearings for 1234567 at').addMissedHearingButton().click()

    const taskListPage = Page.verifyOnPageTitle(CourtCaseTaskListPage, 'Add a hearing to a court case')
    taskListPage
      .hearingInformationLink()
      .should('have.attr', 'href')
      .and('match', /\/overall-case-outcome\?backTo=taskList$/)
    taskListPage.hearingInformationLink().click()

    const outcomePage = Page.verifyOnPageTitle(CourtCaseOverallCaseOutcomePage, 'Select the overall case outcome')
    outcomePage.radioLabelContains('Lie on file').click()
    outcomePage.continueButton().click()

    const referencePage = Page.verifyOnPageTitle(CourtCaseSelectReferencePage, 'C894623')
    referencePage
      .backLink()
      .should('have.attr', 'href')
      .and('match', /\/overall-case-outcome\?backTo=taskList$/)
    referencePage.radioLabelSelector('true').click()
    referencePage.continueButton().click()

    const hearingDatePage = Page.verifyOnPageTitle(CourtCaseWarrantDatePage, 'hearing')
    hearingDatePage.dayDateInput('warrantDate').type('13')
    hearingDatePage.monthDateInput('warrantDate').type('5')
    hearingDatePage.yearDateInput('warrantDate').type('2023')
    hearingDatePage.continueButton().click()

    const courtPage = Page.verifyOnPageTitle(CourtCaseSelectCourtNamePage, 'Was the hearing at Accrington Youth Court?')
    courtPage.radioLabelSelector('true').click()
    courtPage.continueButton().click()

    const checkAnswersPage = Page.verifyOnPage(CourtCaseCheckAnswersPage)
    checkAnswersPage.summaryList().getSummaryList().should('deep.equal', {
      'Case reference': 'C894623',
      'Hearing date': '13/05/2023',
      'Court name': 'Accrington Youth Court',
      'Overall case outcome': 'Lie on file',
    })
    checkAnswersPage.continueButton().click()

    Page.verifyOnPageTitle(CourtCaseTaskListPage, 'Add a hearing to a court case')
  })
})
