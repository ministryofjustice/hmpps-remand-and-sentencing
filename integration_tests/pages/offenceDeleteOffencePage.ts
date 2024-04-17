import Page from './page'

export default class OffenceDeleteOffencePage extends Page {
  constructor(sentenceOffence: string) {
    super(`Are you sure you want to delete this ${sentenceOffence}?`)
  }
}
