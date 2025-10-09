import Page from './page'

export default class SentencingCorrectManyPeriodLengthPage extends Page {
  constructor(periodType: string) {
    super(`Select the correct ${periodType} for this sentence`)
  }
}
