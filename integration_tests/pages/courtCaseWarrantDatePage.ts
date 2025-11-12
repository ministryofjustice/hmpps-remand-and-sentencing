import Page from './page'

export default class CourtCaseWarrantDatePage extends Page {
  constructor(title: string = 'warrant') {
    super(`Enter the ${title} date`)
  }
}
