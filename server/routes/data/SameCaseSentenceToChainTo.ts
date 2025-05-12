import { SentenceToChainTo } from '../../@types/remandAndSentencingApi/remandAndSentencingClientTypes'

export default interface SameCaseSentenceToChainTo extends SentenceToChainTo {
  sentenceReference: string
}
