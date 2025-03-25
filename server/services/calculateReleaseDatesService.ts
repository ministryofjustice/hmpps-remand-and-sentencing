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

  private createEmptySentenceLength(): OverallSentenceLength {
    return {
      years: 0,
      months: 0,
      weeks: 0,
      days: 0,
    }
  }

  async compareOverallSentenceLength(
    appearance: CourtAppearance,
    username: string,
  ): Promise<OverallSentenceLengthComparison> {
    const sentences = appearance.offences.filter(it => it.sentence).map(it => it.sentence)
    const emptyResponse = {
      custodialLength: this.createEmptySentenceLength(),
      custodialLengthMatches: false,
    }

    if (sentences.length && appearance.hasOverallSentenceLength === 'true') {
      // Skip validation if any sentence has unsupported length type
      const hasUnsupportedType = sentences.some(sentence =>
        sentence.periodLengths?.some(length => !this.supportedLengthTypes.has(length.periodLengthType)),
      )
      if (hasUnsupportedType) {
        return emptyResponse
      }

      // Handle single sentence case locally
      if (sentences.length === 1) {
        const sentence = sentences[0]

        // TODO Multiple period lengths per sentence?? is that how it works??
        const custodialDuration = this.mapPeriodLengthToOverallSentenceLength(
          sentence.periodLengths.find(
            it => it.periodLengthType === 'SENTENCE_LENGTH' || it.periodLengthType === 'CUSTODIAL_TERM',
          ),
        )
        const overallLength = this.mapPeriodLengthToOverallSentenceLength(appearance.overallSentenceLength)

        return {
          custodialLength: custodialDuration || this.createEmptySentenceLength(),
          custodialLengthMatches:
            custodialDuration?.years === overallLength?.years &&
            custodialDuration?.months === overallLength?.months &&
            custodialDuration?.weeks === overallLength?.weeks &&
            custodialDuration?.days === overallLength?.days,
        }
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
    return emptyResponse
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
