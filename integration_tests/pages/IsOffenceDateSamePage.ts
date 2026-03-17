import Page from './page'

export default class OffenceOffenceDatePage extends Page {
  constructor(date: string) {
    super(`Is the offence date ${date}`)
  }
}
