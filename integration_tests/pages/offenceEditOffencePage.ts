import Page from './page'

export default class OffenceDeleteOffencePage extends Page {
  constructor(sentenceOffence: string) {
    super(`Edit ${sentenceOffence} details`)
  }
}
