import type { CourtAppearance, Sentence, SentenceLength } from 'models'
import CalculateReleaseDatesApiClient from '../api/calculateReleaseDatesApiClient'
import { HmppsAuthClient } from '../data'
import {
  OverallSentenceLength,
  OverallSentenceLengthComparison,
  OverallSentenceLengthRequest,
  OverallSentenceLengthSentence,
} from '../@types/calculateReleaseDatesApi/calculateReleaseDatesClientTypes'

export default class CalculateReleaseDatesService {
  constructor(private readonly hmppsAuthClient: HmppsAuthClient) {}

  async compareOverallSentenceLength(
    appearance: CourtAppearance,
    username: string,
  ): Promise<OverallSentenceLengthComparison> {
    const sentences = appearance.offences.filter(it => it.sentence).map(it => it.sentence)

    if (sentences.length && appearance.hasOverallSentenceLength === 'true') {
      const consecutive = sentences.filter(
        sentence =>
          sentence.sentenceServeType === 'CONSECUTIVE' ||
          (sentence.hasCountNumber === 'true' &&
            sentences.some(it => it.hasCountNumber === 'true' && it.consecutiveTo === sentence.countNumber)),
      )
      const concurrent = sentences.filter(it => !consecutive.includes(it))

      console.log('JSON.stringify(all) >>> ')
      console.log(JSON.stringify(sentences))
      console.log('JSON.stringify(consecutive) >>> ')

      console.log(JSON.stringify(consecutive))

      console.log('JSON.stringify(concurrent) >>> ')
      console.log(JSON.stringify(concurrent))

      const request = {
        concurrentSentences: concurrent.map(it => this.mapSentenceToOverallSentenceLengthSentence(it)),
        consecutiveSentences: consecutive.map(it => this.mapSentenceToOverallSentenceLengthSentence(it)),
        overallSentenceLength: this.mapAppearanceToOverallSentenceLength(appearance),
        warrantDate: appearance.warrantDate.toString(),
      } as OverallSentenceLengthRequest

      return new CalculateReleaseDatesApiClient(await this.getSystemClientToken(username)).compareOverallSentenceLength(
        request,
      )
    }
    return {
      custodialLengthMatches: false,
      custodialLength: {},
    } as OverallSentenceLengthComparison
  }

  private mapSentenceToOverallSentenceLengthSentence(sentence: Sentence): OverallSentenceLengthSentence {
    return {
      custodialDuration: this.mapPeriodLengthToOverallSentenceLength(
        sentence.periodLengths.find(
          it => it.periodLengthType === 'SENTENCE_LENGTH' || it.periodLengthType === 'CUSTODIAL_TERM',
        ),
      ),
      extensionDuration: this.mapPeriodLengthToOverallSentenceLength(
        sentence.periodLengths.find(it => it.periodLengthType === 'LICENCE_PERIOD'),
      ),
    } as OverallSentenceLengthSentence
  }

  private mapPeriodLengthToOverallSentenceLength(sentenceLength: SentenceLength): OverallSentenceLength {
    if (!sentenceLength) {
      return null
    }
    return {
      years: Number(sentenceLength.years) || undefined,
      months: Number(sentenceLength.months) || undefined,
      weeks: Number(sentenceLength.weeks) || undefined,
      days: Number(sentenceLength.days) || undefined,
    }
  }

  private mapAppearanceToOverallSentenceLength(appearance: CourtAppearance): OverallSentenceLengthSentence {
    return {
      custodialDuration: this.mapPeriodLengthToOverallSentenceLength(appearance.overallSentenceLength),
    } as OverallSentenceLengthSentence
  }

  private async getSystemClientToken(username: string): Promise<string> {
    return this.hmppsAuthClient.getSystemClientToken(username)
  }
}
