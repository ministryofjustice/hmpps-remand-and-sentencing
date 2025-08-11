import type { CourtAppearance, Offence, SentenceLength, UploadedDocument } from 'models'
import type {
  CourtCaseAlternativeSentenceLengthForm,
  CourtCaseCaseOutcomeAppliedAllForm,
  CourtCaseCourtNameForm,
  CourtCaseNextHearingCourtNameForm,
  CourtCaseNextHearingCourtSelectForm,
  CourtCaseNextHearingDateForm,
  CourtCaseNextHearingSelectForm,
  CourtCaseNextHearingTypeForm,
  CourtCaseOverallCaseOutcomeForm,
  CourtCaseOverallConvictionDateForm,
  CourtCaseReferenceForm,
  CourtCaseSelectCourtNameForm,
  CourtCaseSelectReferenceForm,
  CourtCaseWarrantDateForm,
  DeleteDocumentForm,
  OffenceCountNumberForm,
  OffenceFinishedAddingForm,
  SentenceLengthForm,
} from 'forms'
import dayjs from 'dayjs'
import { SessionData } from 'express-session'
import validate from '../validation/validation'
import {
  alternativeSentenceLengthFormToSentenceLength,
  sentenceLengthFormToSentenceLength,
} from '../utils/mappingUtils'
import RemandAndSentencingService from './remandAndSentencingService'
import { extractKeyValue, toDateString } from '../utils/utils'
import periodLengthTypeHeadings from '../resources/PeriodLengthTypeHeadings'
import { OffenceOutcome } from '../@types/remandAndSentencingApi/remandAndSentencingClientTypes'
import sentenceServeTypes from '../resources/sentenceServeTypes'
import logger from '../../logger'
import DocumentManagementService from './documentManagementService'

export default class CourtAppearanceService {
  constructor(
    private readonly remandAndSentencingService: RemandAndSentencingService,
    private readonly documentManagementService: DocumentManagementService,
  ) {}

  setCaseReferenceNumber(
    session: Partial<SessionData>,
    nomsId: string,
    courtCaseReferenceForm: CourtCaseReferenceForm,
    appearanceUuid: string,
  ) {
    const errors = validate(
      courtCaseReferenceForm,
      {
        referenceNumber: [
          'required_without:noCaseReference',
          `onlyOne:${courtCaseReferenceForm.noCaseReference ?? ''}`,
          'regex:/^[A-Za-z0-9\\/\\.\\- ]+$/',
          'atLeastOneNumberInString',
        ],
        noCaseReference: `onlyOne:${courtCaseReferenceForm.referenceNumber ?? ''}`,
      },
      {
        'required_without.referenceNumber': 'You must enter the case reference',
        'onlyOne.referenceNumber': 'Either reference number or no reference number must be submitted',
        'onlyOne.noCaseReference': 'Either reference number or no reference number must be submitted',
        'regex.referenceNumber': `html:<span aria-hidden='true' class="govuk-error-message">You can only use spaces, letters, numbers and symbols '/', '.' and '-' when entering a Case reference</span><span class="govuk-visually-hidden">You can only use spaces, letters, numbers, hyphens, forward slashes and full stops when entering a case reference.</span>`,
        'atLeastOneNumberInString.referenceNumber': 'Case references should include at least one number',
      },
    )
    if (errors.length === 0) {
      const courtAppearance = this.getCourtAppearance(session, nomsId, appearanceUuid)
      if (courtCaseReferenceForm.referenceNumber) {
        courtAppearance.caseReferenceNumber = courtCaseReferenceForm.referenceNumber
      } else {
        delete courtAppearance.caseReferenceNumber
      }
      courtAppearance.noCaseReference = courtCaseReferenceForm.noCaseReference
      // eslint-disable-next-line no-param-reassign
      session.courtAppearances[nomsId] = courtAppearance
    }
    return errors
  }

  async setCaseReferenceFromSelectCaseReference(
    session: Partial<SessionData>,
    nomsId: string,
    courtCaseReference: string,
    username: string,
    referenceForm: CourtCaseSelectReferenceForm,
    appearanceUuid: string,
  ) {
    const errors = validate(
      referenceForm,
      {
        referenceNumberSelect: 'required',
      },
      {
        'required.referenceNumberSelect': 'Select ‘Yes’ if this appearance uses the same case reference.',
      },
    )
    if (errors.length === 0) {
      const courtAppearance = this.getCourtAppearance(session, nomsId, appearanceUuid)
      if (referenceForm.referenceNumberSelect === 'true') {
        const latestCourtAppearance = await this.remandAndSentencingService.getLatestCourtAppearanceByCourtCaseUuid(
          username,
          courtCaseReference,
        )
        courtAppearance.caseReferenceNumber = latestCourtAppearance.courtCaseReference
      } else {
        delete courtAppearance.caseReferenceNumber
      }
      courtAppearance.referenceNumberSelect = referenceForm.referenceNumberSelect
      // eslint-disable-next-line no-param-reassign
      session.courtAppearances[nomsId] = courtAppearance
    }
    return errors
  }

  getCaseReferenceNumber(session: Partial<SessionData>, nomsId: string, appearanceUuid: string): string {
    return this.getCourtAppearance(session, nomsId, appearanceUuid).caseReferenceNumber
  }

  async setWarrantDate(
    session: Partial<SessionData>,
    nomsId: string,
    courtCaseWarrantDateForm: CourtCaseWarrantDateForm,
    courtCaseReference: string,
    appearanceUuid: string,
    addOrEditCourtCase: string,
    addOrEditCourtAppearance: string,
    username: string,
  ): Promise<
    {
      text?: string
      html?: string
      href: string
    }[]
  > {
    const courtAppearance = this.getCourtAppearance(session, nomsId, appearanceUuid)
    let isValidWarrantDateRule = ''
    if (
      courtCaseWarrantDateForm['warrantDate-day'] &&
      courtCaseWarrantDateForm['warrantDate-month'] &&
      courtCaseWarrantDateForm['warrantDate-year']
    ) {
      const warrantDateString = toDateString(
        courtCaseWarrantDateForm['warrantDate-year'],
        courtCaseWarrantDateForm['warrantDate-month'],
        courtCaseWarrantDateForm['warrantDate-day'],
      )
      isValidWarrantDateRule = `|isValidDate:${warrantDateString}|isPastOrCurrentDate:${warrantDateString}|isWithinLast100Years:${warrantDateString}`
    }

    const errors = validate(
      { ...courtCaseWarrantDateForm, appearanceInformationAccepted: courtAppearance.appearanceInformationAccepted },
      {
        'warrantDate-day': `required${isValidWarrantDateRule}`,
        'warrantDate-month': `required`,
        'warrantDate-year': `required`,
        ...(courtAppearance.warrantType === 'SENTENCING' && { appearanceInformationAccepted: 'isNotTrue' }),
      },
      {
        'required.warrantDate-year': 'Warrant date must include year',
        'required.warrantDate-month': 'Warrant date must include month',
        'required.warrantDate-day': 'Warrant date must include day',
        'isValidDate.warrantDate-day': 'This date does not exist.',
        'isPastOrCurrentDate.warrantDate-day': 'The warrant date cannot be a date in the future',
        'isNotTrue.appearanceInformationAccepted': 'You cannot submit after confirming appearance information',
        'isWithinLast100Years.warrantDate-day': 'All dates must be within the last 100 years from today’s date',
      },
    )
    if (errors.length === 0) {
      const warrantDate = dayjs({
        year: courtCaseWarrantDateForm['warrantDate-year'],
        month: parseInt(courtCaseWarrantDateForm['warrantDate-month'], 10) - 1,
        day: courtCaseWarrantDateForm['warrantDate-day'],
      })

      const offenceDateErrors = await this.validateAgainstLatestOffence(
        warrantDate,
        courtCaseReference,
        appearanceUuid,
        username,
        session,
        nomsId,
        addOrEditCourtCase,
        addOrEditCourtAppearance,
      )

      if (offenceDateErrors) return offenceDateErrors

      if (courtAppearance.nextHearingDate) {
        const nextHearingDate = dayjs(courtAppearance.nextHearingDate)
        if (!warrantDate.isBefore(nextHearingDate)) {
          return [
            {
              text: 'The warrant date must be before the next court appearance date',
              href: '#warrantDate',
            },
          ]
        }
      }

      courtAppearance.warrantDate = warrantDate.toDate()
      // eslint-disable-next-line no-param-reassign
      session.courtAppearances[nomsId] = courtAppearance
    }
    return errors
  }

  private async validateAgainstLatestOffence(
    warrantDate: dayjs.Dayjs,
    courtCaseReference: string,
    appearanceUuid: string,
    username: string,
    session: Partial<SessionData>,
    nomsId: string,
    addOrEditCourtCase: string,
    addOrEditCourtAppearance: string,
  ): Promise<{ text: string; href: string }[] | null> {
    let latestOffenceDate = null
    if (addOrEditCourtCase === 'edit-court-case') {
      // For the edit-court-appearance journey we omit the appearance from getLatestOffenceDate call
      const latestOffenceDateStr =
        addOrEditCourtAppearance === 'add-court-appearance'
          ? await this.remandAndSentencingService.getLatestOffenceDateForCourtCase(courtCaseReference, username)
          : await this.remandAndSentencingService.getLatestOffenceDateForCourtCase(
              courtCaseReference,
              username,
              appearanceUuid,
            )
      latestOffenceDate = latestOffenceDateStr ? dayjs(latestOffenceDateStr) : null
    }

    const sessionOffenceDateRaw = this.getLatestOffenceDateInSession(session, nomsId, appearanceUuid)
    const sessionOffenceDate = sessionOffenceDateRaw ? dayjs(sessionOffenceDateRaw) : null

    if (
      (latestOffenceDate && !warrantDate.isAfter(latestOffenceDate)) ||
      (sessionOffenceDate && !warrantDate.isAfter(sessionOffenceDate))
    ) {
      return [
        {
          text: 'The warrant date must be after any existing offence dates in the court case',
          href: '#warrantDate',
        },
      ]
    }
    return null
  }

  private async validateOverallConvictionDateAgainstOffences(
    overallConvictionDate: dayjs.Dayjs,
    courtCaseReference: string,
    username: string,
  ): Promise<{ text: string; href: string }[] | null> {
    const latestOffenceDateStr = await this.remandAndSentencingService.getLatestOffenceDateForCourtCase(
      courtCaseReference,
      username,
    )
    if (latestOffenceDateStr) {
      const latestOffenceDate = dayjs(latestOffenceDateStr)
      if (!overallConvictionDate.isAfter(latestOffenceDate)) {
        return [
          {
            text: `The conviction date must be after any existing offence dates in the court case`,
            href: '#overallConvictionDate',
          },
        ]
      }
    }
    return null
  }

  getWarrantDate(session: Partial<SessionData>, nomsId: string, appearanceUuid: string): Date {
    const { warrantDate } = this.getCourtAppearance(session, nomsId, appearanceUuid)
    return warrantDate ? new Date(warrantDate) : undefined
  }

  setCourtName(
    session: Partial<SessionData>,
    nomsId: string,
    courtNameForm: CourtCaseCourtNameForm,
    appearanceUuid: string,
  ) {
    const errors = validate(
      courtNameForm,
      { courtCode: 'required' },
      { 'required.courtCode': 'You must enter the court name' },
    )
    if (errors.length === 0) {
      const courtAppearance = this.getCourtAppearance(session, nomsId, appearanceUuid)
      courtAppearance.courtCode = courtNameForm.courtCode
      // eslint-disable-next-line no-param-reassign
      session.courtAppearances[nomsId] = courtAppearance
    }
    return errors
  }

  setCourtNameFromSelect(
    session: Partial<SessionData>,
    nomsId: string,
    selectCourtNameForm: CourtCaseSelectCourtNameForm,
    appearanceUuid: string,
  ) {
    const errors = validate(
      selectCourtNameForm,
      { courtNameSelect: 'required' },
      { 'required.courtNameSelect': "Select 'Yes' if the appearance was at this court." },
    )
    if (errors.length === 0 && selectCourtNameForm.courtNameSelect === 'true') {
      const courtAppearance = this.getCourtAppearance(session, nomsId, appearanceUuid)
      courtAppearance.courtCode = selectCourtNameForm.previousCourtCode
      // eslint-disable-next-line no-param-reassign
      session.courtAppearances[nomsId] = courtAppearance
    }
    return errors
  }

  getCourtCode(session: Partial<SessionData>, nomsId: string, appearanceUuid: string): string {
    return this.getCourtAppearance(session, nomsId, appearanceUuid).courtCode
  }

  setWarrantType(session: Partial<SessionData>, nomsId: string, warrantType: string, appearanceUuid: string) {
    const courtAppearance = this.getCourtAppearance(session, nomsId, appearanceUuid)
    courtAppearance.warrantType = warrantType
    // eslint-disable-next-line no-param-reassign
    session.courtAppearances[nomsId] = courtAppearance
  }

  getWarrantType(session: Partial<SessionData>, nomsId: string, appearanceUuid: string): string {
    return this.getCourtAppearance(session, nomsId, appearanceUuid).warrantType
  }

  setWarrantId(session: Partial<SessionData>, nomsId: string, warrantId: string, appearanceUuid: string) {
    const courtAppearance = this.getCourtAppearance(session, nomsId, appearanceUuid)
    courtAppearance.warrantId = warrantId
    // eslint-disable-next-line no-param-reassign
    session.courtAppearances[nomsId] = courtAppearance
  }

  getNextHearingCourtSelect(session: Partial<SessionData>, nomsId: string, appearanceUuid: string): string {
    return this.getCourtAppearance(session, nomsId, appearanceUuid).nextHearingCourtSelect
  }

  setNextHearingCourtSelect(
    session: Partial<SessionData>,
    nomsId: string,
    nextHearingCourtSelectForm: CourtCaseNextHearingCourtSelectForm,
    appearanceUuid: string,
  ) {
    const errors = validate(
      nextHearingCourtSelectForm,
      { nextHearingCourtSelect: 'required' },
      { 'required.nextHearingCourtSelect': "Select 'Yes' if the next hearing will be at this same court." },
    )
    if (errors.length === 0) {
      const courtAppearance = this.getCourtAppearance(session, nomsId, appearanceUuid)
      courtAppearance.nextHearingCourtSelect = nextHearingCourtSelectForm.nextHearingCourtSelect
      if (nextHearingCourtSelectForm.nextHearingCourtSelect === 'true') {
        courtAppearance.nextHearingCourtCode = courtAppearance.courtCode
      }
      // eslint-disable-next-line no-param-reassign
      session.courtAppearances[nomsId] = courtAppearance
    }
    return errors
  }

  getNextHearingCourtCode(session: Partial<SessionData>, nomsId: string, appearanceUuid: string): string {
    return this.getCourtAppearance(session, nomsId, appearanceUuid).nextHearingCourtCode
  }

  setNextHearingCourtName(
    session: Partial<SessionData>,
    nomsId: string,
    nextHearingCourtNameForm: CourtCaseNextHearingCourtNameForm,
    appearanceUuid: string,
  ) {
    const errors = validate(
      nextHearingCourtNameForm,
      { courtCode: 'required' },
      { 'required.courtCode': 'You must enter the court name' },
    )
    if (errors.length === 0) {
      const courtAppearance = this.getCourtAppearance(session, nomsId, appearanceUuid)
      courtAppearance.nextHearingCourtCode = nextHearingCourtNameForm.courtCode
      // eslint-disable-next-line no-param-reassign
      session.courtAppearances[nomsId] = courtAppearance
    }

    return errors
  }

  setAppearanceOutcomeUuid(
    session: Partial<SessionData>,
    nomsId: string,
    overallCaseOutcomeForm: CourtCaseOverallCaseOutcomeForm,
    appearanceUuid: string,
  ) {
    const courtAppearance = this.getCourtAppearance(session, nomsId, appearanceUuid)
    const errors = validate(
      { ...overallCaseOutcomeForm, appearanceInformationAccepted: courtAppearance.appearanceInformationAccepted },
      { overallCaseOutcome: 'required', appearanceInformationAccepted: 'isNotTrue' },
      {
        'required.overallCaseOutcome': 'You must select the overall case outcome',
        'isNotTrue.appearanceInformationAccepted': 'You cannot submit after confirming appearance information',
      },
    )
    if (errors.length === 0) {
      const [appearanceOutcomeUuid, relatedOffenceOutcomeUuid] = overallCaseOutcomeForm.overallCaseOutcome.split('|')

      courtAppearance.appearanceOutcomeUuid = appearanceOutcomeUuid
      courtAppearance.relatedOffenceOutcomeUuid = relatedOffenceOutcomeUuid
      // eslint-disable-next-line no-param-reassign
      session.courtAppearances[nomsId] = courtAppearance
    }
    return errors
  }

  setSentencingAppearanceOutcomeUuid(
    session: Partial<SessionData>,
    nomsId: string,
    overallCaseOutcomeForm: CourtCaseOverallCaseOutcomeForm,
    appearanceUuid: string,
  ) {
    const courtAppearance = this.getCourtAppearance(session, nomsId, appearanceUuid)
    const errors = validate(
      { ...overallCaseOutcomeForm },
      { overallCaseOutcome: 'required' },
      {
        'required.overallCaseOutcome': 'You must select the overall case outcome',
      },
    )
    if (errors.length === 0) {
      const [appearanceOutcomeUuid, relatedOffenceOutcomeUuid] = overallCaseOutcomeForm.overallCaseOutcome.split('|')

      courtAppearance.appearanceOutcomeUuid = appearanceOutcomeUuid
      courtAppearance.relatedOffenceOutcomeUuid = relatedOffenceOutcomeUuid
      // eslint-disable-next-line no-param-reassign
      session.courtAppearances[nomsId] = courtAppearance
    }
    return errors
  }

  getAppearanceOutcomeUuid(session: Partial<SessionData>, nomsId: string, appearanceUuid: string): string {
    return this.getCourtAppearance(session, nomsId, appearanceUuid).appearanceOutcomeUuid
  }

  getRelatedOffenceOutcomeUuid(session: Partial<SessionData>, nomsId: string, appearanceUuid: string): string {
    return this.getCourtAppearance(session, nomsId, appearanceUuid).relatedOffenceOutcomeUuid
  }

  setCaseOutcomeAppliedAll(
    session: Partial<SessionData>,
    nomsId: string,
    caseOutcomeAppliedAllForm: CourtCaseCaseOutcomeAppliedAllForm,
    appearanceUuid: string,
  ) {
    const courtAppearance = this.getCourtAppearance(session, nomsId, appearanceUuid)
    const errors = validate(
      { ...caseOutcomeAppliedAllForm, appearanceInformationAccepted: courtAppearance.appearanceInformationAccepted },
      {
        caseOutcomeAppliedAll: 'required',
        ...(courtAppearance.warrantType === 'REMAND' && { appearanceInformationAccepted: 'isNotTrue' }),
      },
      {
        'required.caseOutcomeAppliedAll': 'Select ‘Yes’ if this outcome applies to all offences on the warrant.',
        'isNotTrue.appearanceInformationAccepted': 'You cannot submit after confirming appearance information',
      },
    )
    if (errors.length === 0) {
      courtAppearance.caseOutcomeAppliedAll = caseOutcomeAppliedAllForm.caseOutcomeAppliedAll
      if (caseOutcomeAppliedAllForm.caseOutcomeAppliedAll === 'true') {
        courtAppearance.offences = courtAppearance.offences.map(offence => {
          // eslint-disable-next-line no-param-reassign
          offence.outcomeUuid = courtAppearance.relatedOffenceOutcomeUuid
          // eslint-disable-next-line no-param-reassign
          offence.updatedOutcome = true
          return offence
        })
      }
      // eslint-disable-next-line no-param-reassign
      session.courtAppearances[nomsId] = courtAppearance
    }
    return errors
  }

  getCaseOutcomeAppliedAll(session: Partial<SessionData>, nomsId: string, appearanceUuid: string): string {
    return this.getCourtAppearance(session, nomsId, appearanceUuid).caseOutcomeAppliedAll
  }

  getOverallCustodialSentenceLength(
    session: Partial<SessionData>,
    nomsId: string,
    appearanceUuid: string,
  ): SentenceLength {
    return this.getCourtAppearance(session, nomsId, appearanceUuid).overallSentenceLength
  }

  getHasOverallSentenceLength(session: Partial<SessionData>, nomsId: string, appearanceUuid: string): string {
    return this.getCourtAppearance(session, nomsId, appearanceUuid).hasOverallSentenceLength
  }

  setHasOverallSentenceLengthTrue(session: Partial<SessionData>, nomsId: string, appearanceUuid: string) {
    const courtAppearance = this.getCourtAppearance(session, nomsId, appearanceUuid)
    courtAppearance.hasOverallSentenceLength = 'true'
    // eslint-disable-next-line no-param-reassign
    session.courtAppearances[nomsId] = courtAppearance
  }

  setOverallSentenceLength(
    session: Partial<SessionData>,
    nomsId: string,
    courtCaseOverallSentenceLengthForm: SentenceLengthForm,
    appearanceUuid: string,
  ) {
    const errors = validate(
      courtCaseOverallSentenceLengthForm,
      {
        hasOverallSentenceLength: 'required',
        'sentenceLength-years':
          'requireSentenceLength_if:hasOverallSentenceLength,true|minWholeNumber:0|requireOneNonZeroSentenceLength_if:hasOverallSentenceLength,true',
        'sentenceLength-months': 'minWholeNumber:0',
        'sentenceLength-weeks': 'minWholeNumber:0',
        'sentenceLength-days': 'minWholeNumber:0',
      },
      {
        'required.hasOverallSentenceLength': 'You must select if there is an overall sentence length or not',
        'requireSentenceLength_if.sentenceLength-years': 'You must enter the overall sentence length',
        'minWholeNumber.sentenceLength-years': 'The number must be a whole number, or 0',
        'minWholeNumber.sentenceLength-months': 'The number must be a whole number, or 0',
        'minWholeNumber.sentenceLength-weeks': 'The number must be a whole number, or 0',
        'minWholeNumber.sentenceLength-days': 'The number must be a whole number, or 0',
        'requireOneNonZeroSentenceLength_if.sentenceLength-years': 'The sentence length cannot be 0',
      },
    )

    if (errors.length === 0) {
      const courtAppearance = this.getCourtAppearance(session, nomsId, appearanceUuid)
      if (courtCaseOverallSentenceLengthForm.hasOverallSentenceLength === 'true') {
        courtAppearance.overallSentenceLength = {
          ...sentenceLengthFormToSentenceLength(
            courtCaseOverallSentenceLengthForm,
            'OVERALL_SENTENCE_LENGTH',
            periodLengthTypeHeadings.OVERALL_SENTENCE_LENGTH,
          ),
          uuid: courtAppearance.overallSentenceLength?.uuid,
        }
      } else {
        delete courtAppearance.overallSentenceLength
      }

      courtAppearance.hasOverallSentenceLength = courtCaseOverallSentenceLengthForm.hasOverallSentenceLength
      // eslint-disable-next-line no-param-reassign
      session.courtAppearances[nomsId] = courtAppearance
    }
    return errors
  }

  setOverallAlternativeSentenceLength(
    session: Partial<SessionData>,
    nomsId: string,
    courtCaseAlternativeSentenceLengthForm: CourtCaseAlternativeSentenceLengthForm,
    appearanceUuid: string,
  ) {
    const errors = validate(
      courtCaseAlternativeSentenceLengthForm,
      {
        'firstSentenceLength-value':
          'requireAlternativeSentenceLength|minWholeNumber:0|requireOneNonZeroAlternativeSentenceLength',
        'secondSentenceLength-value': 'minWholeNumber:0',
        'thirdSentenceLength-value': 'minWholeNumber:0',
        'fourthSentenceLength-value': 'minWholeNumber:0',
        'firstSentenceLength-period': 'isUniqueTimePeriod',
        'secondSentenceLength-period': 'isUniqueTimePeriod',
        'thirdSentenceLength-period': 'isUniqueTimePeriod',
        'fourthSentenceLength-period': 'isUniqueTimePeriod',
      },
      {
        'requireAlternativeSentenceLength.firstSentenceLength-value': 'You must enter the overall sentence length',
        'minWholeNumber.firstSentenceLength-value': 'The number must be a whole number, or 0',
        'minWholeNumber.secondSentenceLength-value': 'The number must be a whole number, or 0',
        'minWholeNumber.thirdSentenceLength-value': 'The number must be a whole number, or 0',
        'minWholeNumber.fourthSentenceLength-value': 'The number must be a whole number, or 0',
        'requireOneNonZeroAlternativeSentenceLength.firstSentenceLength-value': 'The sentence length cannot be 0',
      },
    )
    if (errors.length === 0) {
      const sentenceLength = alternativeSentenceLengthFormToSentenceLength<CourtCaseAlternativeSentenceLengthForm>(
        courtCaseAlternativeSentenceLengthForm,
        'OVERALL_SENTENCE_LENGTH',
        periodLengthTypeHeadings.OVERALL_SENTENCE_LENGTH,
      )
      const courtAppearance = this.getCourtAppearance(session, nomsId, appearanceUuid)
      courtAppearance.overallSentenceLength = sentenceLength
      courtAppearance.hasOverallSentenceLength = 'true'
      // eslint-disable-next-line no-param-reassign
      session.courtAppearances[nomsId] = courtAppearance
    }
    return errors
  }

  setAppearanceInformationAcceptedTrue(session: Partial<SessionData>, nomsId: string, appearanceUuid: string) {
    const courtAppearance = this.getCourtAppearance(session, nomsId, appearanceUuid)
    courtAppearance.appearanceInformationAccepted = true
    // eslint-disable-next-line no-param-reassign
    session.courtAppearances[nomsId] = courtAppearance
  }

  setWarrantInformationAccepted(session: Partial<SessionData>, nomsId: string, appearanceUuid: string) {
    const courtAppearance = this.getCourtAppearance(session, nomsId, appearanceUuid)
    courtAppearance.warrantInformationAccepted = true
    // eslint-disable-next-line no-param-reassign
    session.courtAppearances[nomsId] = courtAppearance
  }

  setOffenceSentenceAccepted(
    session: Partial<SessionData>,
    nomsId: string,
    completed: boolean,
    appearanceUuid: string,
  ) {
    const courtAppearance = this.getCourtAppearance(session, nomsId, appearanceUuid)

    courtAppearance.offenceSentenceAccepted = completed
    // eslint-disable-next-line no-param-reassign
    session.courtAppearances[nomsId] = courtAppearance
  }

  setNextCourtAppearanceAcceptedTrue(session: Partial<SessionData>, nomsId: string, appearanceUuid: string) {
    const courtAppearance = this.getCourtAppearance(session, nomsId, appearanceUuid)
    courtAppearance.nextCourtAppearanceAccepted = true
    // eslint-disable-next-line no-param-reassign
    session.courtAppearances[nomsId] = courtAppearance
  }

  isNextCourtAppearanceAccepted(session: Partial<SessionData>, nomsId: string, appearanceUuid: string): boolean {
    const courtAppearance = this.getCourtAppearance(session, nomsId, appearanceUuid)
    return courtAppearance.nextCourtAppearanceAccepted
  }

  getNextHearingSelect(session: Partial<SessionData>, nomsId: string, appearanceUuid: string): boolean {
    return this.getCourtAppearance(session, nomsId, appearanceUuid).nextHearingSelect
  }

  setNextHearingSelect(
    session: Partial<SessionData>,
    nomsId: string,
    nextHearingSelectForm: CourtCaseNextHearingSelectForm,
    appearanceUuid: string,
  ) {
    const errors = validate(
      nextHearingSelectForm,
      {
        nextHearingSelect: 'required',
      },
      {
        'required.nextHearingSelect': 'You must select the hearing has been set',
      },
    )
    if (errors.length === 0) {
      const courtAppearance = this.getCourtAppearance(session, nomsId, appearanceUuid)
      const previousNextHearingSelect = courtAppearance.nextHearingSelect
      courtAppearance.nextHearingSelect = nextHearingSelectForm.nextHearingSelect === 'true'
      if (!courtAppearance.nextHearingSelect) {
        delete courtAppearance.nextHearingCourtCode
        delete courtAppearance.nextHearingDate
        delete courtAppearance.nextHearingTimeSet
        delete courtAppearance.nextHearingTypeUuid
      }
      if (previousNextHearingSelect !== courtAppearance.nextHearingSelect) {
        courtAppearance.nextCourtAppearanceAccepted = !courtAppearance.nextHearingSelect
      }
      // eslint-disable-next-line no-param-reassign
      session.courtAppearances[nomsId] = courtAppearance
    }
    return errors
  }

  getNextHearingTypeUuid(session: Partial<SessionData>, nomsId: string, appearanceUuid: string): string {
    return this.getCourtAppearance(session, nomsId, appearanceUuid).nextHearingTypeUuid
  }

  setNextHearingType(
    session: Partial<SessionData>,
    nomsId: string,
    nextHearingTypeForm: CourtCaseNextHearingTypeForm,
    appearanceUuid: string,
  ) {
    const errors = validate(
      nextHearingTypeForm,
      {
        nextHearingType: 'required',
      },
      {
        'required.nextHearingType': 'You must select the next hearing type',
      },
    )
    if (errors.length === 0) {
      const courtAppearance = this.getCourtAppearance(session, nomsId, appearanceUuid)
      courtAppearance.nextHearingTypeUuid = nextHearingTypeForm.nextHearingType
      // eslint-disable-next-line no-param-reassign
      session.courtAppearances[nomsId] = courtAppearance
    }
    return errors
  }

  getNextHearingDate(session: Partial<SessionData>, nomsId: string, appearanceUuid: string): Date {
    return this.getCourtAppearance(session, nomsId, appearanceUuid).nextHearingDate
  }

  hasNextHearingTimeSet(session: Partial<SessionData>, nomsId: string, appearanceUuid: string): boolean {
    return this.getCourtAppearance(session, nomsId, appearanceUuid).nextHearingTimeSet
  }

  setNextHearingDate(
    session: Partial<SessionData>,
    nomsId: string,
    nextHearingDateForm: CourtCaseNextHearingDateForm,
    appearanceUuid: string,
  ) {
    let isValidDateRule = ''
    if (
      nextHearingDateForm['nextHearingDate-day'] !== undefined &&
      nextHearingDateForm['nextHearingDate-month'] !== undefined &&
      nextHearingDateForm['nextHearingDate-year'] !== undefined
    ) {
      const nextHearingDateString = toDateString(
        nextHearingDateForm['nextHearingDate-year'],
        nextHearingDateForm['nextHearingDate-month'],
        nextHearingDateForm['nextHearingDate-day'],
      )
      isValidDateRule = `|isValidDate:${nextHearingDateString}|isFutureOrCurrentDate:${nextHearingDateString}|isWithinNextOneYear:${nextHearingDateString}`
    }
    const errors = validate(
      nextHearingDateForm,
      {
        'nextHearingDate-day': `required${isValidDateRule}`,
        'nextHearingDate-month': `required`,
        'nextHearingDate-year': `required`,
        nextHearingTime: ['regex:/^([0-9]|0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/'],
      },
      {
        'required.nextHearingDate-year': 'Next court date must include year',
        'required.nextHearingDate-month': 'Next court date must include month',
        'required.nextHearingDate-day': 'Next court date must include day',
        'isValidDate.nextHearingDate-day': 'This date does not exist.',
        'regex.nextHearingTime': 'Time must be in 1:00 or 13:00 format',
        'isFutureOrCurrentDate.nextHearingDate-day': 'The next court date must be in the future',
        'isWithinNextOneYear.nextHearingDate-day': 'The next court appearance must be within 1 year of today’s date',
      },
    )
    if (errors.length === 0) {
      let nextHearingDate = dayjs({
        year: nextHearingDateForm['nextHearingDate-year'],
        month: parseInt(nextHearingDateForm['nextHearingDate-month'], 10) - 1,
        day: nextHearingDateForm['nextHearingDate-day'],
      })
      if (nextHearingDateForm.nextHearingTime) {
        const [nextHearingHour, nextHearingMinute] = nextHearingDateForm.nextHearingTime.split(':')
        nextHearingDate = nextHearingDate.set('hour', parseInt(nextHearingHour, 10))
        nextHearingDate = nextHearingDate.set('minute', parseInt(nextHearingMinute, 10))
      }
      const courtAppearance = this.getCourtAppearance(session, nomsId, appearanceUuid)
      courtAppearance.nextHearingDate = nextHearingDate.toDate()
      courtAppearance.nextHearingTimeSet = Boolean(nextHearingDateForm.nextHearingTime)
      // eslint-disable-next-line no-param-reassign
      session.courtAppearances[nomsId] = courtAppearance
    }
    return errors
  }

  async setOverallConvictionDate(
    session: Partial<SessionData>,
    nomsId: string,
    overallConvictionDateForm: CourtCaseOverallConvictionDateForm,
    courtCaseReference: string,
    addOrEditCourtCase: string,
    addOrEditCourtAppearance: string,
    username: string,
    appearanceUuid: string,
  ): Promise<
    {
      text?: string
      html?: string
      href: string
    }[]
  > {
    let isValidOverallConvictionDateRule = ''
    if (
      overallConvictionDateForm['overallConvictionDate-day'] &&
      overallConvictionDateForm['overallConvictionDate-month'] &&
      overallConvictionDateForm['overallConvictionDate-year']
    ) {
      const overallConvictionDateString = toDateString(
        overallConvictionDateForm['overallConvictionDate-year'],
        overallConvictionDateForm['overallConvictionDate-month'],
        overallConvictionDateForm['overallConvictionDate-day'],
      )
      isValidOverallConvictionDateRule = `|isValidDate:${overallConvictionDateString}|isPastOrCurrentDate:${overallConvictionDateString}|isWithinLast100Years:${overallConvictionDateString}`
    }
    const courtAppearance = this.getCourtAppearance(session, nomsId, appearanceUuid)
    const errors = validate(
      { ...overallConvictionDateForm, warrantInformationAccepted: courtAppearance.warrantInformationAccepted },
      {
        'overallConvictionDate-day': `required_if:overallConvictionDateAppliedAll,true${isValidOverallConvictionDateRule}`,
        'overallConvictionDate-month': `required_if:overallConvictionDateAppliedAll,true`,
        'overallConvictionDate-year': `required_if:overallConvictionDateAppliedAll,true`,
        overallConvictionDateAppliedAll: 'required',
        warrantInformationAccepted: 'isNotTrue',
      },
      {
        'required_if.overallConvictionDate-year': 'Conviction date must include year',
        'required_if.overallConvictionDate-month': 'Conviction date must include month',
        'required_if.overallConvictionDate-day': 'Conviction date must include day',
        'isValidDate.overallConvictionDate-day': 'This date does not exist.',
        'isPastOrCurrentDate.overallConvictionDate-day': 'The conviction date cannot be a date in the future',
        'isWithinLast100Years.overallConvictionDate-day':
          'All dates must be within the last 100 years from today’s date',
        'required.overallConvictionDateAppliedAll':
          'Select yes if the conviction date is the same for all offences on the warrant',
        'isNotTrue.warrantInformationAccepted': 'You cannot submit after confirming overall warrant information',
      },
    )
    if (errors.length === 0) {
      courtAppearance.overallConvictionDateAppliedAll = overallConvictionDateForm.overallConvictionDateAppliedAll
      if (overallConvictionDateForm.overallConvictionDateAppliedAll === 'true') {
        const overallConvictionDate = dayjs({
          year: overallConvictionDateForm['overallConvictionDate-year'],
          month: parseInt(overallConvictionDateForm['overallConvictionDate-month'], 10) - 1,
          day: overallConvictionDateForm['overallConvictionDate-day'],
        })
        const warrantDate = dayjs(courtAppearance.warrantDate)
        if (courtAppearance.warrantDate && overallConvictionDate.isAfter(warrantDate)) {
          return [
            {
              text: 'The conviction date must be on or before the warrant date',
              href: '#overallConvictionDate',
            },
          ]
        }

        // This validation related to the latestOffenceDate only applies in the REMAND-to-SENTENCING journey
        // That was defined as being when latest court appearance is REMAND and the new appearance being created is SENTENCING
        if (
          addOrEditCourtCase === 'edit-court-case' &&
          addOrEditCourtAppearance === 'add-court-appearance' &&
          this.getCourtAppearance(session, nomsId, appearanceUuid).warrantType === 'SENTENCING'
        ) {
          const latestCourtAppearance = await this.remandAndSentencingService.getLatestCourtAppearanceByCourtCaseUuid(
            username,
            courtCaseReference,
          )

          if (latestCourtAppearance.warrantType === 'REMAND') {
            const offenceDateErrors = await this.validateOverallConvictionDateAgainstOffences(
              overallConvictionDate,
              courtCaseReference,
              username,
            )
            if (offenceDateErrors) return offenceDateErrors
          }
        }

        courtAppearance.overallConvictionDate = overallConvictionDate.toDate()
      } else {
        delete courtAppearance.overallConvictionDate
      }
      // eslint-disable-next-line no-param-reassign
      session.courtAppearances[nomsId] = courtAppearance
    }
    return errors
  }

  getOverallConvictionDate(session: Partial<SessionData>, nomsId: string, appearanceUuid: string): Date {
    const { overallConvictionDate } = this.getCourtAppearance(session, nomsId, appearanceUuid)
    return overallConvictionDate ? new Date(overallConvictionDate) : undefined
  }

  getOverallConvictionDateAppliedAll(session: Partial<SessionData>, nomsId: string, appearanceUuid: string): string {
    return this.getCourtAppearance(session, nomsId, appearanceUuid).overallConvictionDateAppliedAll
  }

  sessionCourtAppearanceExists(session: Partial<SessionData>, nomsId: string, appearanceReference: string): boolean {
    return (
      session.courtAppearances[nomsId] !== undefined &&
      session.courtAppearances[nomsId].appearanceUuid === appearanceReference
    )
  }

  setSessionCourtAppearance(session: Partial<SessionData>, nomsId: string, courtAppearance: CourtAppearance) {
    // eslint-disable-next-line no-param-reassign
    session.courtAppearances[nomsId] = courtAppearance
  }

  getSessionCourtAppearance(session: Partial<SessionData>, nomsId: string, appearanceUuid: string): CourtAppearance {
    return this.getCourtAppearance(session, nomsId, appearanceUuid)
  }

  isForwithAlreadySelected(
    session: Partial<SessionData>,
    nomsId: string,
    excludeOffenceReference: number,
    appearanceUuid: string,
  ): boolean {
    const courtAppearance = this.getCourtAppearance(session, nomsId, appearanceUuid)
    const offences = Object.assign([], courtAppearance.offences)

    offences.splice(excludeOffenceReference, 1)
    return offences.some(offence => offence.sentence?.sentenceServeType === 'FORTHWITH')
  }

  hasNoSentences(session: Partial<SessionData>, nomsId: string, appearanceUuid: string): boolean {
    const courtAppearance = this.getCourtAppearance(session, nomsId, appearanceUuid)
    return !courtAppearance.offences.some(offence => offence.sentence)
  }

  addOffence(
    session: Partial<SessionData>,
    nomsId: string,
    offenceReference: number,
    offence: Offence,
    appearanceUuid: string,
  ) {
    const courtAppearance = this.getCourtAppearance(session, nomsId, appearanceUuid)
    if (courtAppearance.offences.length > offenceReference) {
      const existingOffence = { ...courtAppearance.offences[offenceReference] }
      courtAppearance.offences[offenceReference] = offence
      if (existingOffence.sentence && !offence.sentence) {
        this.resetChain(existingOffence.sentence.sentenceReference, courtAppearance)
      }
    } else {
      courtAppearance.offences.push(offence)
    }
    // eslint-disable-next-line no-param-reassign
    session.courtAppearances[nomsId] = courtAppearance
  }

  setCountNumber(
    session: Partial<SessionData>,
    nomsId: string,
    offenceReference: number,
    countNumberForm: OffenceCountNumberForm,
    appearanceUuid: string,
  ) {
    const courtAppearance = this.getCourtAppearance(session, nomsId, appearanceUuid)
    if (courtAppearance.offences.length > offenceReference) {
      const offence = courtAppearance.offences[offenceReference]
      const sentence = offence.sentence ?? { sentenceReference: offenceReference.toString() }
      sentence.hasCountNumber = countNumberForm.hasCountNumber
      if (countNumberForm.hasCountNumber === 'true') {
        sentence.countNumber = countNumberForm.countNumber
      } else {
        delete sentence.countNumber
      }
      offence.sentence = sentence
      courtAppearance.offences[offenceReference] = offence
      // eslint-disable-next-line no-param-reassign
      session.courtAppearances[nomsId] = courtAppearance
    }
  }

  setOffenceOutcome(
    session: Partial<SessionData>,
    nomsId: string,
    offenceReference: number,
    offenceOutcome: OffenceOutcome,
    appearanceUuid: string,
  ) {
    const courtAppearance = this.getCourtAppearance(session, nomsId, appearanceUuid)
    if (courtAppearance.offences.length > offenceReference) {
      const offence = courtAppearance.offences[offenceReference]
      offence.outcomeUuid = offenceOutcome.outcomeUuid
      offence.updatedOutcome = true
      if (offenceOutcome.outcomeType !== 'SENTENCING') {
        delete offence.sentence
      }
      courtAppearance.offences[offenceReference] = offence
      // eslint-disable-next-line no-param-reassign
      session.courtAppearances[nomsId] = courtAppearance
    }
  }

  deleteOffence(session: Partial<SessionData>, nomsId: string, offenceReference: number, appearanceUuid: string) {
    const courtAppearance = this.getCourtAppearance(session, nomsId, appearanceUuid)
    courtAppearance.offences.splice(offenceReference, 1)
    // eslint-disable-next-line no-param-reassign
    session.courtAppearances[nomsId] = courtAppearance
  }

  getOffence(session: Partial<SessionData>, nomsId: string, offenceReference: number, appearanceUuid: string): Offence {
    const courtAppearance = this.getCourtAppearance(session, nomsId, appearanceUuid)
    return courtAppearance.offences[offenceReference]
  }

  getOffenceBySentenceReference(
    session: Partial<SessionData>,
    nomsId: string,
    sentenceReference: string,
    appearanceUuid: string,
  ): Offence {
    const courtAppearance = this.getCourtAppearance(session, nomsId, appearanceUuid)
    return courtAppearance.offences.find(offence => offence.sentence?.sentenceReference === sentenceReference)
  }

  getCountNumbers(
    session: Partial<SessionData>,
    nomsId: string,
    excludeOffenceReference: number,
    appearanceUuid: string,
  ): string[] {
    const courtAppearance = this.getCourtAppearance(session, nomsId, appearanceUuid)
    const { offences } = courtAppearance
    return offences
      .filter(
        (offence, index) =>
          offence.sentence?.countNumber && offence.sentence?.countNumber !== '-1' && excludeOffenceReference !== index,
      )
      .map(offence => offence.sentence.countNumber)
  }

  addUploadedDocument(
    session: Partial<SessionData>,
    nomsId: string,
    document: UploadedDocument,
    appearanceUuid: string,
  ) {
    const courtAppearance = this.getCourtAppearance(session, nomsId, appearanceUuid)
    // Ensure courtAppearance.uploadedDocuments is an array, then push
    if (!courtAppearance.uploadedDocuments) {
      courtAppearance.uploadedDocuments = [] // Initialize if null/undefined
    }
    courtAppearance.uploadedDocuments.push(document)
    // eslint-disable-next-line no-param-reassign
    session.courtAppearances[nomsId] = courtAppearance
  }

  getUploadedDocuments(session: Partial<SessionData>, nomsId: string, appearanceUuid: string): UploadedDocument[] {
    return this.getCourtAppearance(session, nomsId, appearanceUuid).uploadedDocuments ?? []
  }

  getUploadedDocument(
    session: Partial<SessionData>,
    nomsId: string,
    documentId: string,
    appearanceUuid: string,
  ): UploadedDocument | undefined {
    const courtAppearance = this.getCourtAppearance(session, nomsId, appearanceUuid)
    return courtAppearance.uploadedDocuments?.find(doc => doc.documentUUID === documentId)
  }

  async removeUploadedDocument(
    session: Partial<SessionData>,
    nomsId: string,
    documentId: string,
    deleteDocumentForm: DeleteDocumentForm,
    username: string,
    appearanceUuid: string,
  ): Promise<
    {
      text?: string
      html?: string
      href: string
    }[]
  > {
    let errors = validate(
      deleteDocumentForm,
      {
        deleteDocument: 'required',
      },
      {
        'required.deleteDocument': 'You must select an option.',
      },
    )
    if (deleteDocumentForm.deleteDocument === 'true') {
      try {
        await this.documentManagementService.deleteDocument(documentId, username)
        const courtAppearance = this.getCourtAppearance(session, nomsId, appearanceUuid)
        if (courtAppearance.uploadedDocuments) {
          courtAppearance.uploadedDocuments = courtAppearance.uploadedDocuments.filter(
            doc => doc.documentUUID !== documentId,
          )
          // eslint-disable-next-line no-param-reassign
          session.courtAppearances[nomsId] = courtAppearance
        }
      } catch (error) {
        logger.error(`Error deleting document: ${error.message}`)
        errors = [{ text: 'File could not be deleted', href: '#document-upload' }]
      }
    }
    return errors
  }

  setDocumentUploadedTrue(session: Partial<SessionData>, nomsId: string, appearanceUuid: string) {
    const courtAppearance = this.getCourtAppearance(session, nomsId, appearanceUuid)
    courtAppearance.documentUploadAccepted = true
    // eslint-disable-next-line no-param-reassign
    session.courtAppearances[nomsId] = courtAppearance
  }

  async checkOffenceDatesHaveInvalidatedOffence(
    session: Partial<SessionData>,
    nomsId: string,
    offenceReference: number,
    offence: Offence,
    dateOfBirth: string,
    username: string,
    appearanceUuid: string,
  ): Promise<boolean> {
    let hasInvalidated: boolean = false
    const courtAppearance = this.getCourtAppearance(session, nomsId, appearanceUuid)
    if (courtAppearance.offences.length > offenceReference) {
      if (offence.sentence && offence.sentence.convictionDate) {
        const { sentence } = offence
        const offenceDate = dayjs(offence.offenceEndDate ?? offence.offenceStartDate)
        const convictionDate = dayjs(sentence.convictionDate)
        if (offenceDate.isAfter(convictionDate)) {
          hasInvalidated = true
          delete sentence.convictionDate
          delete sentence.sentenceTypeClassification
          delete sentence.sentenceTypeId
          delete sentence.periodLengths
        } else if (sentence.sentenceTypeId) {
          const prisonerDateOfBirth = dayjs(dateOfBirth)
          const ageAtConviction = convictionDate.diff(prisonerDateOfBirth, 'years')
          const sentenceTypeStillValid = await this.remandAndSentencingService.getIsSentenceTypeStillValid(
            sentence.sentenceTypeId,
            ageAtConviction,
            convictionDate,
            offenceDate,
            username,
          )
          if (!sentenceTypeStillValid.isStillValid) {
            hasInvalidated = true
            delete sentence.convictionDate
            delete sentence.sentenceTypeClassification
            delete sentence.sentenceTypeId
            delete sentence.periodLengths
          }
        }
        const appearanceOffence = courtAppearance.offences[offenceReference]
        appearanceOffence.sentence = sentence
        courtAppearance.offences[offenceReference] = appearanceOffence
        // eslint-disable-next-line no-param-reassign
        session.courtAppearances[nomsId] = courtAppearance
      }
    }
    return hasInvalidated
  }

  async checkConvictionDateHasInvalidatedOffence(
    session: Partial<SessionData>,
    nomsId: string,
    offenceReference: number,
    offence: Offence,
    dateOfBirth: string,
    username: string,
    appearanceUuid: string,
  ): Promise<boolean> {
    let hasInvalidated: boolean = false
    const courtAppearance = this.getCourtAppearance(session, nomsId, appearanceUuid)
    if (courtAppearance.offences.length > offenceReference) {
      const { sentence } = offence
      const offenceDate = dayjs(offence.offenceEndDate ?? offence.offenceStartDate)
      const potentialConvictionDate = dayjs(offence.sentence.convictionDate)
      if (sentence.sentenceTypeId) {
        const prisonerDateOfBirth = dayjs(dateOfBirth)
        const ageAtConviction = potentialConvictionDate.diff(prisonerDateOfBirth, 'years')
        const sentenceTypeStillValid = await this.remandAndSentencingService.getIsSentenceTypeStillValid(
          sentence.sentenceTypeId,
          ageAtConviction,
          potentialConvictionDate,
          offenceDate,
          username,
        )
        if (!sentenceTypeStillValid.isStillValid) {
          hasInvalidated = true
          delete sentence.sentenceTypeClassification
          delete sentence.sentenceTypeId
          delete sentence.periodLengths
        }
      }
      const appearanceOffence = courtAppearance.offences[offenceReference]
      appearanceOffence.sentence = sentence
      courtAppearance.offences[offenceReference] = appearanceOffence
      // eslint-disable-next-line no-param-reassign
      session.courtAppearances[nomsId] = courtAppearance
    }
    return hasInvalidated
  }

  sentenceIsInChain(
    session: Partial<SessionData>,
    nomsId: string,
    offenceReference: number,
    appearanceUuid: string,
  ): boolean {
    let sentenceInChain: boolean = false
    const courtAppearance = this.getCourtAppearance(session, nomsId, appearanceUuid)
    if (courtAppearance.offences.length > offenceReference) {
      const offence = courtAppearance.offences[offenceReference]
      const { sentence } = offence
      if (sentence) {
        sentenceInChain = courtAppearance.offences.some(
          otherOffence => otherOffence.sentence?.consecutiveToSentenceReference === sentence.sentenceReference,
        )
      }
    }
    return sentenceInChain
  }

  setSentenceToConcurrent(
    session: Partial<SessionData>,
    nomsId: string,
    offenceReference: number,
    appearanceUuid: string,
  ) {
    const courtAppearance = this.getCourtAppearance(session, nomsId, appearanceUuid)
    if (courtAppearance.offences.length > offenceReference) {
      const offence = courtAppearance.offences[offenceReference]
      const { sentence } = offence
      sentence.sentenceServeType = extractKeyValue(sentenceServeTypes, sentenceServeTypes.CONCURRENT)
      delete sentence.consecutiveToSentenceReference
      delete sentence.consecutiveToSentenceUuid
      offence.sentence = sentence
      courtAppearance.offences[offenceReference] = offence
    }
  }

  resetConsecutiveFields(
    session: Partial<SessionData>,
    nomsId: string,
    offenceReference: number,
    appearanceUuid: string,
  ) {
    const courtAppearance = this.getCourtAppearance(session, nomsId, appearanceUuid)
    if (courtAppearance.offences.length > offenceReference) {
      const offence = courtAppearance.offences[offenceReference]
      const sentence = offence.sentence ?? { sentenceReference: offenceReference.toString() }
      delete sentence.consecutiveToSentenceReference
      delete sentence.consecutiveToSentenceUuid
      offence.sentence = sentence
      courtAppearance.offences[offenceReference] = offence
      // eslint-disable-next-line no-param-reassign
      session.courtAppearances[nomsId] = courtAppearance
    }
  }

  setSentenceToForthwith(
    session: Partial<SessionData>,
    nomsId: string,
    offenceReference: number,
    appearanceUuid: string,
  ) {
    const courtAppearance = this.getCourtAppearance(session, nomsId, appearanceUuid)
    if (courtAppearance.offences.length > offenceReference) {
      const offence = courtAppearance.offences[offenceReference]
      const { sentence } = offence
      sentence.sentenceServeType = extractKeyValue(sentenceServeTypes, sentenceServeTypes.FORTHWITH)
      delete sentence.consecutiveToSentenceReference
      delete sentence.consecutiveToSentenceUuid
      offence.sentence = sentence
      courtAppearance.offences[offenceReference] = offence
    }
  }

  setSentenceToConsecutive(
    session: Partial<SessionData>,
    nomsId: string,
    offenceReference: number,
    appearanceUuid: string,
  ) {
    const courtAppearance = this.getCourtAppearance(session, nomsId, appearanceUuid)
    if (courtAppearance.offences.length > offenceReference) {
      const offence = courtAppearance.offences[offenceReference]
      const { sentence } = offence
      sentence.sentenceServeType = extractKeyValue(sentenceServeTypes, sentenceServeTypes.CONSECUTIVE)
      delete sentence.consecutiveToSentenceReference
      delete sentence.consecutiveToSentenceUuid
      offence.sentence = sentence
      courtAppearance.offences[offenceReference] = offence
    }
  }

  deleteSentenceInChain(
    session: Partial<SessionData>,
    nomsId: string,
    offenceReference: number,
    appearanceUuid: string,
  ) {
    const courtAppearance = this.getCourtAppearance(session, nomsId, appearanceUuid)
    const { offences } = courtAppearance
    if (courtAppearance.offences.length > offenceReference) {
      const { sentenceReference } = courtAppearance.offences[offenceReference].sentence
      offences.splice(offenceReference, 1)
      this.resetChain(sentenceReference, courtAppearance)
      courtAppearance.offences = offences
      // eslint-disable-next-line no-param-reassign
      session.courtAppearances[nomsId] = courtAppearance
    }
  }

  private resetChain(deletedSentenceReference: string, courtAppearance: CourtAppearance) {
    const { offences } = courtAppearance
    let nextSentenceInChainIndex = offences.findIndex(
      offence => offence.sentence?.consecutiveToSentenceReference === deletedSentenceReference,
    )
    while (nextSentenceInChainIndex !== -1) {
      const nextChainOffence = courtAppearance.offences[nextSentenceInChainIndex]
      const { sentence } = nextChainOffence
      const nextSentenceInChainSentenceReference = sentence.sentenceReference
      delete sentence.consecutiveToSentenceReference
      delete sentence.consecutiveToSentenceUuid
      delete sentence.sentenceServeType
      delete sentence.isSentenceConsecutiveToAnotherCase
      nextChainOffence.sentence = sentence
      offences[nextSentenceInChainIndex] = nextChainOffence
      nextSentenceInChainIndex = offences.findIndex(
        offence => offence.sentence?.consecutiveToSentenceReference === nextSentenceInChainSentenceReference,
      )
    }
  }

  checkFinishingOffences(offenceFinishedAddingForm: OffenceFinishedAddingForm): {
    text?: string
    html?: string
    href: string
  }[] {
    return validate(
      offenceFinishedAddingForm,
      {
        finishedAddingOffences: 'required',
      },
      {
        'required.finishedAddingOffences': `You must select whether you have finished adding offences`,
      },
    )
  }

  checkOffencesHaveMandatoryFields(
    session: Partial<SessionData>,
    nomsId: string,
    appearanceUuid: string,
  ): {
    text?: string
    html?: string
    href: string
  }[] {
    const courtAppearance = this.getCourtAppearance(session, nomsId, appearanceUuid)
    const errors = validate(
      courtAppearance,
      {
        'offences.*.sentence.sentenceServeType': 'required_with:offences.*.sentence',
      },
      {
        'required_with.offences.*.sentence.sentenceServeType': 'Select consecutive or concurrent',
      },
    )
    return errors.map(error => {
      const href = error.href.replace('.sentence.sentenceServeType', '')
      return { ...error, href }
    })
  }

  clearSessionCourtAppearance(session: Partial<SessionData>, nomsId: string) {
    // eslint-disable-next-line no-param-reassign
    delete session.courtAppearances[nomsId]
  }

  private getCourtAppearance(session: Partial<SessionData>, nomsId: string, appearanceUuid: string): CourtAppearance {
    return session.courtAppearances[nomsId] ?? { offences: [], appearanceUuid }
  }

  private getLatestOffenceDateInSession(
    session: Partial<SessionData>,
    nomsId: string,
    appearanceUuid: string,
  ): Date | null {
    const courtAppearance = this.getCourtAppearance(session, nomsId, appearanceUuid)
    if (!courtAppearance?.offences?.length) return null

    const offenceDates: Date[] = courtAppearance.offences.map(
      offence => offence.offenceEndDate || offence.offenceStartDate,
    )

    return offenceDates.reduce((latest, current) => (current > latest ? current : latest))
  }
}
