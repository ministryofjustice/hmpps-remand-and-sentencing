import HmppsAuditClient, { AuditEvent } from '../data/hmppsAuditClient'

export enum Page {
  EXAMPLE_PAGE = 'EXAMPLE_PAGE',
  COURT_CASES = 'COURT_CASES',
  COURT_CASE = 'COURT_CASE',
  SENT_CONSEC_TO = 'SENT_CONSEC_TO',
}

export interface AuditEventDetails {
  who: string
  subjectId?: string
  subjectType?: string
  correlationId?: string
  details?: object
}

export default class AuditService {
  constructor(private readonly hmppsAuditClient: HmppsAuditClient) {}

  async logAuditEvent(event: AuditEvent) {
    await this.hmppsAuditClient.sendMessage(event)
  }

  async logPageView(page: Page, eventDetails: AuditEventDetails) {
    const event: AuditEvent = {
      ...eventDetails,
      what: `PAGE_VIEW_${page}`,
    }
    await this.hmppsAuditClient.sendMessage(event)
  }

  async logViewDocument(eventDetails: AuditEventDetails) {
    const event: AuditEvent = {
      ...eventDetails,
      what: 'VIEW_DOCUMENT',
    }
    await this.hmppsAuditClient.sendMessage(event)
  }

  async logCreateCourtCase(eventDetails: AuditEventDetails) {
    const event: AuditEvent = {
      ...eventDetails,
      what: 'CREATE_COURT_CASE',
    }
    await this.hmppsAuditClient.sendMessage(event)
  }

  async logCreateHearing(eventDetails: AuditEventDetails) {
    const event: AuditEvent = {
      ...eventDetails,
      what: 'CREATE_HEARING',
    }
    await this.hmppsAuditClient.sendMessage(event)
  }

  async logEditHearing(eventDetails: AuditEventDetails) {
    const event: AuditEvent = {
      ...eventDetails,
      what: 'EDIT_HEARING',
    }
    await this.hmppsAuditClient.sendMessage(event)
  }
}
