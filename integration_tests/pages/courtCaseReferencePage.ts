import Page from './page'

export default class CourtCaseReferencePage extends Page {
  constructor(prisonerName: string) {
    super(`${prisonerName}'s court cases`)
  }
}
