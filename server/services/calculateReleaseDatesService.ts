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

  private readonly supportedPeriodLengthTypes = new Set(['SENTENCE_LENGTH', 'CUSTODIAL_TERM', 'LICENCE_PERIOD'])

  private readonly emptySentenceLength: OverallSentenceLength = { years: 0, months: 0, weeks: 0, days: 0 }

  async compareOverallSentenceLength(
    appearance: CourtAppearance,
    username: string,
  ): Promise<OverallSentenceLengthComparison> {
    const sentences = appearance.offences.filter(it => it.sentence).map(it => it.sentence)

    const skippedValidationResponse = {
      custodialLength: this.emptySentenceLength,
      custodialLengthMatches: true,
    }

    if (sentences.length && appearance.hasOverallSentenceLength === 'true') {
      // Handle single sentence here without calling CRD-API (single sentence validation occurs for all sentence types)
      if (sentences.length === 1 && sentences[0].periodLengths.length === 1) {
        return this.checkSingleSentenceLength(sentences[0].periodLengths[0], appearance.overallSentenceLength)
      }

      // Only continue to validate using the CRD API for supported types
      if (this.hasUnsupportedPeriodLengthTypes(sentences)) {
        return skippedValidationResponse
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
    return skippedValidationResponse
  }

  private checkSingleSentenceLength(periodLength: SentenceLength, overallSentenceLength: SentenceLength) {
    const custodialDuration = this.mapPeriodLengthToOverallSentenceLength(periodLength)
    const overallLength = this.mapPeriodLengthToOverallSentenceLength(overallSentenceLength)

    return {
      custodialLength: custodialDuration || this.emptySentenceLength,
      custodialLengthMatches:
        custodialDuration?.years === overallLength?.years &&
        custodialDuration?.months === overallLength?.months &&
        custodialDuration?.weeks === overallLength?.weeks &&
        custodialDuration?.days === overallLength?.days,
    }
  }

  private hasUnsupportedPeriodLengthTypes(sentences: Sentence[]): boolean {
    return sentences.some(sentence =>
      sentence.periodLengths?.some(periodLength => !this.supportedPeriodLengthTypes.has(periodLength.periodLengthType)),
    )
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
