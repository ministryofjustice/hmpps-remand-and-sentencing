import Page from './page'

export default class CourtCaseWarrantDatePage extends Page {
  constructor(prisonerName: string) {
    super(`${prisonerName}'s court cases`)
  }
}
