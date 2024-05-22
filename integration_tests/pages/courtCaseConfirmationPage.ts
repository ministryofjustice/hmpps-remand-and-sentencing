import Page from './page'

export default class CourtCaseConfirmationPage extends Page {
  constructor(entity: string) {
    super(`${entity} successfully saved`)
  }
}
