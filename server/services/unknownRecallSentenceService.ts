import { SessionData } from 'express-session'

export default class UnknownRecallSentenceService {
  setSentenceUuids(session: Partial<SessionData>, nomsId: string, sentenceUuids: string[]) {
    const uniqueSentenceUuids = Array.from(new Set(sentenceUuids))
    // eslint-disable-next-line no-param-reassign
    session.unknownRecallSentenceUuids[nomsId] = uniqueSentenceUuids
  }

  getSentenceUuids(session: Partial<SessionData>, nomsId: string): string[] {
    return session.unknownRecallSentenceUuids[nomsId]
  }

  removeSentenceUuid(session: Partial<SessionData>, nomsId: string, toRemoveUuid: string) {
    const sessionUuids = this.getSentenceUuids(session, nomsId)
    // eslint-disable-next-line no-param-reassign
    session.unknownRecallSentenceUuids[nomsId] = sessionUuids.filter(sentenceUuid => sentenceUuid !== toRemoveUuid)
  }
}
