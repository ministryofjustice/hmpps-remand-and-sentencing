import Page from './page'

export default class CourtCaseSelectReferencePage extends Page {
  constructor(caseReference: string) {
    super(`Is the case reference ${caseReference}?`)
  }
}
