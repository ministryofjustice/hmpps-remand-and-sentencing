import type { Offence } from 'models'

export default class OffenceService {
  setOffenceStartDate(
    session: CookieSessionInterfaces.CookieSessionObject,
    nomsId: string,
    courtCaseReference: string,
    offenceStartDate: Date,
  ) {
    const id = this.getOffenceId(nomsId, courtCaseReference)
    const offence = this.getOffence(session.offences, id)
    offence.offenceStartDate = offenceStartDate
    // eslint-disable-next-line no-param-reassign
    session.offences[id] = offence
  }

  setOffenceEndDate(
    session: CookieSessionInterfaces.CookieSessionObject,
    nomsId: string,
    courtCaseReference: string,
    offenceEndDate: Date,
  ) {
    const id = this.getOffenceId(nomsId, courtCaseReference)
    const offence = this.getOffence(session.offences, id)
    offence.offenceEndDate = offenceEndDate
    // eslint-disable-next-line no-param-reassign
    session.offences[id] = offence
  }

  private getOffenceId(nomsId: string, courtCaseReference: string) {
    return `${nomsId}-${courtCaseReference}`
  }

  private getOffence(offences: Map<string, Offence>, id: string): Offence {
    return offences[id] ?? {}
  }
}
