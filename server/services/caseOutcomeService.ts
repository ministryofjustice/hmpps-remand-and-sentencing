import { CaseOutcome } from '../routes/data/caseOutcome'
import data from '../resources/caseOutcomes.json'

export default class CaseOutcomeService {
  caseOutcomes: CaseOutcome[]

  constructor() {
    this.caseOutcomes = data as CaseOutcome[]
  }

  getTopCaseOutcomes(type: string): CaseOutcome[] {
    return this.caseOutcomes
      .filter(caseOutcome => caseOutcome.type === type)
      .sort((a, b) => {
        return a.rank - b.rank
      })
      .slice(0, 6)
  }

  searchOutcomes(searchString: string, type: string): CaseOutcome[] {
    return this.caseOutcomes
      .filter(
        caseOutcome =>
          caseOutcome.type === type && caseOutcome.description.toLowerCase().includes(searchString.toLowerCase()),
      )
      .sort((a, b) => {
        return a.rank - b.rank
      })
  }
}
