import Page from './page'

export default class CannotDeletePeriodLengthOffencePage extends Page {
  constructor() {
    super('You must delete the breach hearing, before you can delete this offence')
  }
}
