import Page from './page'

export default class OffenceConsecutiveToPage extends Page {
  constructor(countNumber: string) {
    super(`What sentence is count ${countNumber} consecutive to?`)
  }
}
