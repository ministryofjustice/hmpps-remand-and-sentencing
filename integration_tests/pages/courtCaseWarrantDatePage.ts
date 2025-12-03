import Page from './page'

export default class CourtCaseWarrantDatePage extends Page {
  constructor(title: string = 'hearing') {
    super(`Enter the ${title} date`)
  }
}
