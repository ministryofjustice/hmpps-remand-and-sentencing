import Page, { PageElement } from './page'

export default class IndexPage extends Page {
  constructor() {
    super('This site is under construction...')
  }

  public skipAxe(): boolean {
    return false
  }

  fallbackHeaderUserName = (): PageElement => cy.get('[data-qa=header-user-name]')

  fallbackHeaderPhaseBanner = (): PageElement => cy.get('[data-qa=header-phase-banner]')

  commonComponentsHeader = (): PageElement => cy.get('[data-qa=common-header]')

  designLibraryFooter = (): PageElement => cy.get('[data-qa=ccrds-footer]')
}
