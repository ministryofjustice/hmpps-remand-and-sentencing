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

  private readonly supportedLengthTypes = new Set(['SENTENCE_LENGTH', 'CUSTODIAL_TERM', 'LICENCE_PERIOD'])

  async compareOverallSentenceLength(
    appearance: CourtAppearance,
    username: string,
  ): Promise<OverallSentenceLengthComparison> {
    const sentences = appearance.offences.filter(it => it.sentence).map(it => it.sentence)

    if (sentences.length && appearance.hasOverallSentenceLength === 'true') {
      // Skip validation if any sentence has unsupported length type
      const hasUnsupportedType = sentences.some(sentence =>
        sentence.periodLengths?.some(length => !this.supportedLengthTypes.has(length.periodLengthType)),
      )
      if (hasUnsupportedType) {
        return {
          custodialLengthMatches: false,
          custodialLength: {},
        } as OverallSentenceLengthComparison
      }

      const consecutive = sentences.filter(
        sentence =>
          sentence.sentenceServeType === 'CONSECUTIVE' ||
          sentences.some(it => it.consecutiveTo === sentence.countNumber),
      )
      const concurrent = sentences.filter(it => !consecutive.includes(it))

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
