export default class UnknownRecallSentenceJourneyUrls {
  static prefix = (nomsId: string) => {
    return `/person/${nomsId}/unknown-recall-sentence`
  }

  static landingPage = (nomsId: string) => {
    return this.prefix(nomsId)
  }

  static offenceDate = (nomsId: string, appearanceReference: string, chargeUuid: string) => {
    return `${this.prefix(nomsId)}/court-appearance/${appearanceReference}/charge/${chargeUuid}/offence-date`
  }

  static convictionDate = (nomsId: string, appearanceReference: string, chargeUuid: string) => {
    return `${this.prefix(nomsId)}/court-appearance/${appearanceReference}/charge/${chargeUuid}/conviction-date`
  }

  static sentenceType = (nomsId: string, appearanceReference: string, chargeUuid: string) => {
    return `${this.prefix(nomsId)}/court-appearance/${appearanceReference}/charge/${chargeUuid}/sentence-type`
  }

  static periodLength = (nomsId: string, appearanceReference: string, chargeUuid: string, periodLengthType: string) => {
    return `${this.prefix(nomsId)}/court-appearance/${appearanceReference}/charge/${chargeUuid}/period-length?periodLengthType=${periodLengthType}`
  }

  static fineAmount = (nomsId: string, appearanceReference: string, chargeUuid: string) => {
    return `${this.prefix(nomsId)}/court-appearance/${appearanceReference}/charge/${chargeUuid}/fine-amount`
  }

  static checkAnswers = (nomsId: string, appearanceReference: string, chargeUuid: string) => {
    return `${this.prefix(nomsId)}/court-appearance/${appearanceReference}/charge/${chargeUuid}/check-answers`
  }
}
