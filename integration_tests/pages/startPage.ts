import Page from './page'

export default class StartPage extends Page {
  constructor(prisonerName: string) {
    super(`${prisonerName}'s court cases`)
  }
}
