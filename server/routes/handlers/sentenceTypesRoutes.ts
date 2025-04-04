import type { Request, Response } from 'express'
import type RemandAndSentencingService from '../../services/remandAndSentencingService'
import { RecallType } from '../../@types/remandAndSentencingApi/remandAndSentencingClientTypes'

export default class SentenceTypesRoutesHandler {
  constructor(private readonly remandAndSentencingService: RemandAndSentencingService) {}

  index = async (req: Request, res: Response) => {
    const legacySentenceTypes = await this.remandAndSentencingService.getLegacySentenceTypesSummaryAll(
      req.user.username,
    )

    const legacySentenceTypeItems = [
      { value: '', text: '' },
      ...legacySentenceTypes.map(sentence => ({
        value: sentence.nomisSentenceTypeReference,
        text: sentence.nomisSentenceTypeReference?.trim(),
      })),
    ]

    res.render('pages/sentenceTypes/index', {
      legacySentenceTypeItems,
    })
  }

  getLegacySentenceTypes = async (req: Request, res: Response) => {
    let filtered = await this.remandAndSentencingService.getLegacySentenceTypesSummaryAll(req.user.username)

    const { active, indeterminate, recall } = req.query

    if (active === 'true') {
      filtered = filtered.filter(s => s.nomisActive === true)
    } else if (active === 'false') {
      filtered = filtered.filter(s => s.nomisActive === false)
    }

    if (indeterminate === 'true') {
      filtered = filtered.filter(s => s.isIndeterminate === true)
    } else if (indeterminate === 'false') {
      filtered = filtered.filter(s => s.isIndeterminate === false)
    }

    if (recall) {
      const recallStr = recall.toString()

      if (recallStr === 'FIXED_TERM_RECALL') {
        const fixedTermRecalls = ['FIXED_TERM_RECALL_14', 'FIXED_TERM_RECALL_28']
        filtered = filtered.filter(s => s.recall && fixedTermRecalls.includes(s.recall.type))
      } else {
        filtered = filtered.filter(s => s.recall?.type === recallStr)
      }
    }

    const selectItem = (value: string, text: string, selectedValue?: string) => ({
      value,
      text,
      selected: selectedValue === value,
    })

    const activeFilterItems = [
      selectItem('', 'All', active as string),
      selectItem('true', 'Active only', active as string),
      selectItem('false', 'Inactive only', active as string),
    ]

    const indeterminateFilterItems = [
      selectItem('', 'All', indeterminate as string),
      selectItem('true', 'Yes', indeterminate as string),
      selectItem('false', 'No', indeterminate as string),
    ]

    const recallFilterItems = [
      selectItem('', 'All', recall as string),
      selectItem('NONE', 'No recall', recall as string),
      selectItem('FIXED_TERM_RECALL', 'Fixed term recall (14 or 28 day)', recall as string),
      selectItem('STANDARD_RECALL', 'Standard recall', recall as string),
      selectItem('STANDARD_RECALL_255', 'Standard recall (Section 255)', recall as string),
    ]

    const formatRecallName = (recallType: RecallType): string => {
      if (recallType.isFixedTermRecall && recallType.lengthInDays) {
        return `Fixed term recall (${recallType.lengthInDays} days)`
      }
      return recallType.type.replace(/_/g, ' ')
    }

    const legacySentenceTypes = filtered.map(s => ({
      ...s,

      formattedRecallName: formatRecallName(s.recall),
    }))

    res.render('pages/sentenceTypes/legacy', {
      legacySentenceTypes,
      activeFilterItems,
      indeterminateFilterItems,
      recallFilterItems,
      query: req.query,
    })
  }

  getLegacySentenceTypeDetail = async (req: Request, res: Response) => {
    const nomisSentenceTypeReference = req.query.nomisSentenceTypeReference?.toString()
    if (!nomisSentenceTypeReference) {
      return res.status(400).send('Missing nomisSentenceTypeReference')
    }
    const legacySentenceType = await this.remandAndSentencingService.getLegacySentenceType(
      nomisSentenceTypeReference,
      req.user.username,
    )

    legacySentenceType.sort((a, b) => {
      const yearA = a.sentencingAct || 0
      const yearB = b.sentencingAct || 0
      return yearB - yearA
    })

    return res.render('pages/sentenceTypes/detail', {
      legacySentenceType,
      nomisSentenceTypeReference,
    })
  }
}
