import type { CourtAppearance, Offence, SentenceLength, UploadedDocument, UrlParameters } from 'models'
import type {
  AppealCourtNameForm,
  AppealDateForm,
  AppealOffenceOutcomeForm,
  AppealOverallCaseOutcomeForm,
  BreachCourtNameForm,
  BreachDateForm,
  BreachTypeForm,
  CourtCaseAlternativeSentenceLengthForm,
  CourtCaseCaseOutcomeAppliedAllForm,
  CourtCaseCourtNameForm,
  CourtCaseNextAppearanceCourtNameForm,
  CourtCaseNextAppearanceCourtSelectForm,
  CourtCaseNextAppearanceDateForm,
  CourtCaseNextAppearanceSelectForm,
  CourtCaseNextAppearanceSubtypeForm,
  CourtCaseNextAppearanceTypeForm,
  CourtCaseOverallCaseOutcomeForm,
  CourtCaseOverallConvictionDateForm,
  CourtCaseReferenceForm,
  CourtCaseSelectCourtNameForm,
  CourtCaseSelectReferenceForm,
  CourtCaseWarrantDateForm,
  CriminalOfficeReferenceForm,
  DeleteDocumentForm,
  FinishedRecordingAppealsForm,
  OffenceFinishedAddingForm,
  ReceivedCustodialSentenceForm,
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
import { convertToTitleCase, toDateString } from '../utils/utils'
import periodLengthTypeHeadings from '../resources/PeriodLengthTypeHeadings'
import logger from '../../logger'
import DocumentManagementService from './documentManagementService'
import RefDataService from './refDataService'
import { DETENTION_TRAINING_ORDER_OUTCOME_UUID } from '../utils/constants'

export default class CourtAppearanceService {
  constructor(
    private readonly remandAndSentencingService: RemandAndSentencingService,
    private readonly documentManagementService: DocumentManagementService,
    private readonly refDataService: RefDataService,
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
          'max:13',
        ],
        noCaseReference: `onlyOne:${courtCaseReferenceForm.referenceNumber ?? ''}`,
      },
      {
        'required_without.referenceNumber': 'You must enter the case reference',
        'onlyOne.referenceNumber': 'Either reference number or no reference number must be submitted',
        'onlyOne.noCaseReference': 'Either reference number or no reference number must be submitted',
        'regex.referenceNumber': `html:<span aria-hidden='true' class="govuk-error-message">You can only use spaces, letters, numbers and symbols '/', '.' and '-' when entering a Case reference</span><span class="govuk-visually-hidden">You can only use spaces, letters, numbers, hyphens, forward slashes and full stops when entering a case reference.</span>`,
        'atLeastOneNumberInString.referenceNumber': 'Case references should include at least one number',
        'max.referenceNumber': 'Case references must not be longer than 13 characters',
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
        'required.referenceNumberSelect': 'Select ‘Yes’ if this hearing uses the same case reference.',
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

  setReceivedCustodialSentence(
    session: Partial<SessionData>,
    nomsId: string,
    appearanceUuid: string,
    receivedCustodialSentenceForm: ReceivedCustodialSentenceForm,
    prisonerName: string,
  ) {
    const errors = validate(
      receivedCustodialSentenceForm,
      { receivedCustodialSentence: 'required' },
      { 'required.receivedCustodialSentence': `You must select whether ${prisonerName} received a custodial sentence` },
    )
    if (errors.length === 0) {
      const courtAppearance = this.getCourtAppearance(session, nomsId, appearanceUuid)
      let warrantType = 'NON_SENTENCING'
      if (receivedCustodialSentenceForm.receivedCustodialSentence === 'true') {
        warrantType = 'SENTENCING'
      }
      courtAppearance.warrantType = warrantType
      // eslint-disable-next-line no-param-reassign
      courtAppearance.offences.forEach(offence => delete offence.outcomeUuid)
      // eslint-disable-next-line no-param-reassign
      session.courtAppearances[nomsId] = courtAppearance
    }
    return errors
  }

  async setWarrantDate(
    session: Partial<SessionData>,
    nomsId: string,
    courtCaseWarrantDateForm: CourtCaseWarrantDateForm,
    courtCaseReference: string,
    appearanceUuid: string,
    addOrEditCourtCase: string,
    username: string,
    warrantOrHearing: string,
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
        'required.warrantDate-year': `${convertToTitleCase(warrantOrHearing)} date must include year`,
        'required.warrantDate-month': `${convertToTitleCase(warrantOrHearing)} date must include month`,
        'required.warrantDate-day': `${convertToTitleCase(warrantOrHearing)} date must include day`,
        'isValidDate.warrantDate-day': 'This date does not exist.',
        'isPastOrCurrentDate.warrantDate-day': `The ${warrantOrHearing} date cannot be a date in the future`,
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

      const courtCaseDatesErrors = await this.validateAgainstCourtCaseDates(
        warrantDate,
        courtAppearance.warrantType,
        courtCaseReference,
        appearanceUuid,
        username,
        session,
        nomsId,
        addOrEditCourtCase,
        warrantOrHearing,
      )

      if (courtCaseDatesErrors.length) return courtCaseDatesErrors

      if (courtAppearance.nextAppearanceDate) {
        const nextAppearanceDate = dayjs(courtAppearance.nextAppearanceDate)
        if (!warrantDate.isBefore(nextAppearanceDate)) {
          return [
            {
              text: `The ${warrantOrHearing} date must be before the next court appearance date`,
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

  private async validateAgainstCourtCaseDates(
    warrantDate: dayjs.Dayjs,
    warrantType: string,
    courtCaseReference: string,
    appearanceUuid: string,
    username: string,
    session: Partial<SessionData>,
    nomsId: string,
    addOrEditCourtCase: string,
    warrantOrHearing: string,
  ): Promise<{ text: string; href: string }[] | null> {
    let latestOffenceDate = null
    let latestRemandAppearanceDate = null
    let latestSentencingAppearanceDate = null
    const errors = []
    if (addOrEditCourtCase === 'edit-court-case') {
      const courtCaseValidationDates = await this.remandAndSentencingService.getValidationDatesForCourtCase(
        courtCaseReference,
        username,
        appearanceUuid,
      )
      latestOffenceDate = courtCaseValidationDates.offenceDate ? dayjs(courtCaseValidationDates.offenceDate) : null
      latestRemandAppearanceDate = courtCaseValidationDates.latestRemandAppearanceDate
        ? dayjs(courtCaseValidationDates.latestRemandAppearanceDate)
        : null
      latestSentencingAppearanceDate = courtCaseValidationDates.latestSentenceAppearanceDate
        ? dayjs(courtCaseValidationDates.latestSentenceAppearanceDate)
        : null
    }

    const sessionOffenceDateRaw = this.getLatestOffenceDateInSession(session, nomsId, appearanceUuid)
    const sessionOffenceDate = sessionOffenceDateRaw ? dayjs(sessionOffenceDateRaw) : null

    if (
      (latestOffenceDate && !warrantDate.isAfter(latestOffenceDate)) ||
      (sessionOffenceDate && !warrantDate.isAfter(sessionOffenceDate))
    ) {
      errors.push({
        text: `The ${warrantOrHearing} date must be after any existing offence dates in the court case`,
        href: '#warrantDate',
      })
    }

    if (
      latestRemandAppearanceDate &&
      warrantType === 'SENTENCING' &&
      warrantDate.isBefore(latestRemandAppearanceDate)
    ) {
      errors.push({
        text: 'The date of a sentencing warrant cannot be before the date of a remand warrant',
        href: '#warrantDate',
      })
    }

    if (
      latestSentencingAppearanceDate &&
      warrantType === 'NON_SENTENCING' &&
      warrantDate.isAfter(latestSentencingAppearanceDate)
    ) {
      errors.push({
        text: 'The date of a hearing cannot be after the date of a sentencing warrant on the same court case',
        href: '#warrantDate',
      })
    }

    return errors
  }

  private async validateOverallConvictionDateAgainstOffences(
    overallConvictionDate: dayjs.Dayjs,
    courtCaseReference: string,
    username: string,
  ): Promise<{ text: string; href: string }[] | null> {
    const latestOffenceDateResponse = await this.remandAndSentencingService.getLatestOffenceDateForCourtCase(
      courtCaseReference,
      username,
    )
    if (latestOffenceDateResponse.offenceDate) {
      const latestOffenceDate = dayjs(latestOffenceDateResponse.offenceDate)
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
      { 'required.courtNameSelect': "Select 'Yes' if the hearing was at this court." },
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

  getWarrantType(session: Partial<SessionData>, nomsId: string, appearanceUuid: string): string {
    return this.getCourtAppearance(session, nomsId, appearanceUuid).warrantType
  }

  getNextAppearanceCourtSelect(session: Partial<SessionData>, nomsId: string, appearanceUuid: string): string {
    return this.getCourtAppearance(session, nomsId, appearanceUuid).nextAppearanceCourtSelect
  }

  setNextAppearanceCourtSelect(
    session: Partial<SessionData>,
    nomsId: string,
    nextAppearanceCourtSelectForm: CourtCaseNextAppearanceCourtSelectForm,
    appearanceUuid: string,
  ) {
    const errors = validate(
      nextAppearanceCourtSelectForm,
      { nextAppearanceCourtSelect: 'required' },
      { 'required.nextAppearanceCourtSelect': "Select 'Yes' if the next appearance will be at this same court." },
    )
    if (errors.length === 0) {
      const courtAppearance = this.getCourtAppearance(session, nomsId, appearanceUuid)
      courtAppearance.nextAppearanceCourtSelect = nextAppearanceCourtSelectForm.nextAppearanceCourtSelect
      if (nextAppearanceCourtSelectForm.nextAppearanceCourtSelect === 'true') {
        courtAppearance.nextAppearanceCourtCode = courtAppearance.courtCode
      }
      // eslint-disable-next-line no-param-reassign
      session.courtAppearances[nomsId] = courtAppearance
    }
    return errors
  }

  getNextAppearanceCourtCode(session: Partial<SessionData>, nomsId: string, appearanceUuid: string): string {
    return this.getCourtAppearance(session, nomsId, appearanceUuid).nextAppearanceCourtCode
  }

  setNextAppearanceCourtName(
    session: Partial<SessionData>,
    nomsId: string,
    nextAppearanceCourtNameForm: CourtCaseNextAppearanceCourtNameForm,
    appearanceUuid: string,
  ) {
    const errors = validate(
      nextAppearanceCourtNameForm,
      { courtCode: 'required' },
      { 'required.courtCode': 'You must enter the court name' },
    )
    if (errors.length === 0) {
      const courtAppearance = this.getCourtAppearance(session, nomsId, appearanceUuid)
      courtAppearance.nextAppearanceCourtCode = nextAppearanceCourtNameForm.courtCode
      // eslint-disable-next-line no-param-reassign
      session.courtAppearances[nomsId] = courtAppearance
    }

    return errors
  }

  async setAppearanceOutcomeUuid(
    session: Partial<SessionData>,
    nomsId: string,
    overallCaseOutcomeForm: CourtCaseOverallCaseOutcomeForm,
    appearanceUuid: string,
    username: string,
  ) {
    const courtAppearance = this.getCourtAppearance(session, nomsId, appearanceUuid)
    const errors = validate(
      { ...overallCaseOutcomeForm, appearanceInformationAccepted: courtAppearance.appearanceInformationAccepted },
      { overallCaseOutcome: 'required', appearanceInformationAccepted: 'isNotTrue' },
      {
        'required.overallCaseOutcome': 'You must select the overall case outcome',
        'isNotTrue.appearanceInformationAccepted': 'You cannot submit after confirming hearing information',
      },
    )
    if (errors.length === 0) {
      const [appearanceOutcomeUuid, relatedOffenceOutcomeUuid] = overallCaseOutcomeForm.overallCaseOutcome.split('|')

      const appearanceOutcome = await this.refDataService.getAppearanceOutcomeByUuid(appearanceOutcomeUuid, username)

      if (appearanceOutcome.outcomeType === 'NON_CUSTODIAL') {
        const chargeOutcomeUuids = courtAppearance.offences
          .filter(offence => offence.outcomeUuid)
          .map(offence => offence.outcomeUuid)
        const anyRemandChargeOutcomes = Object.values(
          await this.refDataService.getChargeOutcomeMap(chargeOutcomeUuids, username),
        )
          .map(chargeOutcome => chargeOutcome.outcomeType)
          .includes('REMAND')
        if (anyRemandChargeOutcomes) {
          return [
            {
              text: 'You cannot select a non-custodial overall case outcome as an offence with a remand outcome exists',
              href: '#overallCaseOutcome',
            },
          ]
        }
      }

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
      caseOutcomeAppliedAllForm,
      {
        caseOutcomeAppliedAll: 'required',
      },
      {
        'required.caseOutcomeAppliedAll': 'You must select if the outcome is the same for all offences.',
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
          uuid: courtAppearance.overallSentenceLength?.uuid ?? crypto.randomUUID(),
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

  setAggravatingFactors(session: Partial<SessionData>, nomsId: string, completed: boolean, appearanceUuid: string) {
    const courtAppearance = this.getCourtAppearance(session, nomsId, appearanceUuid)
    courtAppearance.aggravatingFactorsAccepted = completed
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

  getNextAppearanceSelect(session: Partial<SessionData>, nomsId: string, appearanceUuid: string): boolean {
    return this.getCourtAppearance(session, nomsId, appearanceUuid).nextAppearanceSelect
  }

  setNextAppearanceSelect(
    session: Partial<SessionData>,
    nomsId: string,
    nextAppearanceSelectForm: CourtCaseNextAppearanceSelectForm,
    appearanceUuid: string,
  ) {
    const errors = validate(
      nextAppearanceSelectForm,
      {
        nextAppearanceSelect: 'required',
      },
      {
        'required.nextAppearanceSelect': 'You must select whether the appearance has been set',
      },
    )
    if (errors.length === 0) {
      const courtAppearance = this.getCourtAppearance(session, nomsId, appearanceUuid)
      const previousNextHearingSelect = courtAppearance.nextAppearanceSelect
      courtAppearance.nextAppearanceSelect = nextAppearanceSelectForm.nextAppearanceSelect === 'true'
      if (!courtAppearance.nextAppearanceSelect) {
        delete courtAppearance.nextAppearanceCourtCode
        delete courtAppearance.nextAppearanceDate
        delete courtAppearance.nextAppearanceTimeSet
        delete courtAppearance.nextAppearanceTypeUuid
      }
      if (previousNextHearingSelect !== courtAppearance.nextAppearanceSelect) {
        courtAppearance.nextCourtAppearanceAccepted = !courtAppearance.nextAppearanceSelect
      }
      // eslint-disable-next-line no-param-reassign
      session.courtAppearances[nomsId] = courtAppearance
    }
    return errors
  }

  getNextAppearanceTypeUuid(session: Partial<SessionData>, nomsId: string, appearanceUuid: string): string {
    return this.getCourtAppearance(session, nomsId, appearanceUuid).nextAppearanceTypeUuid
  }

  setNextAppearanceType(
    session: Partial<SessionData>,
    nomsId: string,
    nextAppearanceTypeForm: CourtCaseNextAppearanceTypeForm,
    appearanceUuid: string,
  ) {
    const errors = validate(
      nextAppearanceTypeForm,
      {
        nextAppearanceType: 'required',
      },
      {
        'required.nextAppearanceType': 'You must select the next appearance type',
      },
    )
    if (errors.length === 0) {
      const courtAppearance = this.getCourtAppearance(session, nomsId, appearanceUuid)
      if (courtAppearance.nextAppearanceTypeUuid !== nextAppearanceTypeForm.nextAppearanceType) {
        delete courtAppearance.nextAppearanceSubTypeUuid
      }
      courtAppearance.nextAppearanceTypeUuid = nextAppearanceTypeForm.nextAppearanceType
      // eslint-disable-next-line no-param-reassign
      session.courtAppearances[nomsId] = courtAppearance
    }
    return errors
  }

  setNextAppearanceSubtype(
    session: Partial<SessionData>,
    nomsId: string,
    appearanceUuid: string,
    nextAppearanceSubtypeForm: CourtCaseNextAppearanceSubtypeForm,
  ) {
    const errors = validate(
      nextAppearanceSubtypeForm,
      {
        nextAppearanceSubtype: 'required',
      },
      {
        'required.nextAppearanceSubtype': 'You must select the type of discharge',
      },
    )
    if (errors.length === 0) {
      const courtAppearance = this.getCourtAppearance(session, nomsId, appearanceUuid)
      if (nextAppearanceSubtypeForm.nextAppearanceSubtype) {
        courtAppearance.nextAppearanceSubTypeUuid = nextAppearanceSubtypeForm.nextAppearanceSubtype
      } else {
        delete courtAppearance.nextAppearanceSubTypeUuid
      }

      // eslint-disable-next-line no-param-reassign
      session.courtAppearances[nomsId] = courtAppearance
    }
    return errors
  }

  getNextAppearanceDate(session: Partial<SessionData>, nomsId: string, appearanceUuid: string): Date {
    return this.getCourtAppearance(session, nomsId, appearanceUuid).nextAppearanceDate
  }

  hasNextHearingTimeSet(session: Partial<SessionData>, nomsId: string, appearanceUuid: string): boolean {
    return this.getCourtAppearance(session, nomsId, appearanceUuid).nextAppearanceTimeSet
  }

  setNextAppearanceDate(
    session: Partial<SessionData>,
    nomsId: string,
    nextAppearanceDateForm: CourtCaseNextAppearanceDateForm,
    appearanceUuid: string,
  ) {
    let isValidDateRule = ''
    if (
      nextAppearanceDateForm['nextAppearanceDate-day'] !== undefined &&
      nextAppearanceDateForm['nextAppearanceDate-month'] !== undefined &&
      nextAppearanceDateForm['nextAppearanceDate-year'] !== undefined
    ) {
      const nextAppearanceDateString = toDateString(
        nextAppearanceDateForm['nextAppearanceDate-year'],
        nextAppearanceDateForm['nextAppearanceDate-month'],
        nextAppearanceDateForm['nextAppearanceDate-day'],
      )
      isValidDateRule = `|isValidDate:${nextAppearanceDateString}|isFutureOrCurrentDate:${nextAppearanceDateString}|isWithinNextOneYear:${nextAppearanceDateString}`
    }
    const errors = validate(
      nextAppearanceDateForm,
      {
        'nextAppearanceDate-day': `required${isValidDateRule}`,
        'nextAppearanceDate-month': `required`,
        'nextAppearanceDate-year': `required`,
        nextAppearanceTime: ['regex:/^([0-9]|0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/'],
      },
      {
        'required.nextAppearanceDate-year': 'Next court date must include year',
        'required.nextAppearanceDate-month': 'Next court date must include month',
        'required.nextAppearanceDate-day': 'Next court date must include day',
        'isValidDate.nextAppearanceDate-day': 'This date does not exist.',
        'regex.nextAppearanceTime': 'Time must be in 1:00 or 13:00 format',
        'isFutureOrCurrentDate.nextAppearanceDate-day': 'The next court date must be in the future',
        'isWithinNextOneYear.nextAppearanceDate-day': 'The next court appearance must be within 1 year of today’s date',
      },
    )
    if (errors.length === 0) {
      let nextAppearanceDate = dayjs({
        year: nextAppearanceDateForm['nextAppearanceDate-year'],
        month: parseInt(nextAppearanceDateForm['nextAppearanceDate-month'], 10) - 1,
        day: nextAppearanceDateForm['nextAppearanceDate-day'],
      })
      if (nextAppearanceDateForm.nextAppearanceTime) {
        const [nextAppearanceHour, nextAppearanceMinute] = nextAppearanceDateForm.nextAppearanceTime.split(':')
        nextAppearanceDate = nextAppearanceDate.set('hour', parseInt(nextAppearanceHour, 10))
        nextAppearanceDate = nextAppearanceDate.set('minute', parseInt(nextAppearanceMinute, 10))
      }
      const courtAppearance = this.getCourtAppearance(session, nomsId, appearanceUuid)
      courtAppearance.nextAppearanceDate = nextAppearanceDate.toDate()
      courtAppearance.nextAppearanceTimeSet = Boolean(nextAppearanceDateForm.nextAppearanceTime)
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

          if (latestCourtAppearance.warrantType === 'NON_SENTENCING') {
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

  getSentenceUuidsInChain(
    session: Partial<SessionData>,
    nomsId: string,
    appearanceUuid: string,
    chargeUuid: string,
  ): string[] {
    const courtAppearance = this.getCourtAppearance(session, nomsId, appearanceUuid)
    const { offences } = courtAppearance
    const offence = offences.find(sessionOffence => sessionOffence.chargeUuid === chargeUuid)
    const sentenceUuids: string[] = []
    if (offence?.sentence) {
      sentenceUuids.push(offence.sentence.sentenceUuid)
      const checkedSentenceUuids = [offence.sentence.sentenceUuid]
      while (checkedSentenceUuids.length) {
        const nextChainSentenceUuid = checkedSentenceUuids.pop()
        offences
          .flatMap(sessionOffence => {
            if (
              sessionOffence.sentence?.consecutiveToSentenceUuid === nextChainSentenceUuid &&
              !sentenceUuids.includes(sessionOffence.sentence.sentenceUuid)
            ) {
              return sessionOffence.sentence.sentenceUuid
            }
            return []
          })
          .forEach(sentenceUuid => {
            sentenceUuids.push(sentenceUuid)
            checkedSentenceUuids.push(sentenceUuid)
          })
      }
    }
    return sentenceUuids
  }

  isForthwithAlreadySelected(
    session: Partial<SessionData>,
    nomsId: string,
    chargeUuid: string,
    appearanceUuid: string,
  ): boolean {
    const courtAppearance = this.getCourtAppearance(session, nomsId, appearanceUuid)
    const offences = Object.assign([], courtAppearance.offences)
    const index = courtAppearance.offences.findIndex(o => o.chargeUuid === chargeUuid)
    if (index !== -1) {
      offences.splice(index, 1)
    }

    return offences.some(offence => offence.sentence?.sentenceServeType === 'FORTHWITH')
  }

  anySentenceConsecutiveToAnotherCase(
    session: Partial<SessionData>,
    nomsId: string,
    chargeUuid: string,
    appearanceUuid: string,
  ): boolean {
    const courtAppearance = this.getCourtAppearance(session, nomsId, appearanceUuid)
    const offences = Object.assign([], courtAppearance.offences)
    const index = courtAppearance.offences.findIndex(o => o.chargeUuid === chargeUuid)
    if (index !== -1) {
      offences.splice(index, 1)
    }

    const sentenceUuidsInSession = courtAppearance.offences.filter(o => o.sentence).map(o => o.sentence.sentenceUuid)
    return offences.some(
      offence =>
        offence.sentence?.consecutiveToSentenceUuid &&
        !sentenceUuidsInSession.some(uuid => uuid === offence.sentence?.consecutiveToSentenceUuid),
    )
  }

  hasNoSentences(session: Partial<SessionData>, nomsId: string, appearanceUuid: string): boolean {
    const courtAppearance = this.getCourtAppearance(session, nomsId, appearanceUuid)
    return !courtAppearance.offences.some(offence => offence.sentence)
  }

  addOffence(
    session: Partial<SessionData>,
    nomsId: string,
    chargeUuid: string,
    offence: Offence,
    appearanceUuid: string,
  ) {
    const courtAppearance = this.getCourtAppearance(session, nomsId, appearanceUuid)
    const offenceReference = courtAppearance.offences.findIndex(o => o.chargeUuid === chargeUuid)
    if (offenceReference === -1 || offenceReference > courtAppearance.offences.length) {
      // eslint-disable-next-line no-param-reassign
      offence.createChargeOrder = this.getNextCreateChargeOrder(courtAppearance)
      courtAppearance.offences.push(offence)
    } else {
      const existingOffence = courtAppearance.offences.find(o => o.chargeUuid === chargeUuid)
      courtAppearance.offences[offenceReference] = offence
      if (existingOffence.sentence && !offence.sentence) {
        this.resetChain(existingOffence.sentence.sentenceUuid, courtAppearance)
      }
    }

    // eslint-disable-next-line no-param-reassign
    session.courtAppearances[nomsId] = courtAppearance
  }

  getNextCreateChargeOrder(courtAppearance: CourtAppearance): number {
    const allCreateChargeOrderNumbers = courtAppearance.offences
      .filter(offence => offence.createChargeOrder !== undefined)
      .map(offence => offence.createChargeOrder)
    if (allCreateChargeOrderNumbers.length) {
      return Math.max(...allCreateChargeOrderNumbers) + 1
    }
    return 0
  }

  deleteOffence(session: Partial<SessionData>, nomsId: string, chargeUuid: string, appearanceUuid: string): Offence {
    const courtAppearance = this.getCourtAppearance(session, nomsId, appearanceUuid)
    const index = courtAppearance.offences.findIndex(o => o.chargeUuid === chargeUuid)
    let offence: Offence
    if (index !== -1) {
      offence = courtAppearance.offences[index]
      courtAppearance.offences.splice(index, 1)
    }
    // eslint-disable-next-line no-param-reassign
    session.courtAppearances[nomsId] = courtAppearance
    return offence
  }

  getOffence(session: Partial<SessionData>, nomsId: string, chargeUuid: string, appearanceUuid: string): Offence {
    const courtAppearance = this.getCourtAppearance(session, nomsId, appearanceUuid)
    return courtAppearance.offences.find(offence => offence.chargeUuid === chargeUuid)
  }

  getSessionOffenceBySentenceUuid(
    session: Partial<SessionData>,
    nomsId: string,
    sentenceUuid: string,
    appearanceUuid: string,
  ): Offence {
    const courtAppearance = this.getCourtAppearance(session, nomsId, appearanceUuid)
    return courtAppearance.offences.find(offence => offence.sentence?.sentenceUuid === sentenceUuid)
  }

  getCountNumbers(
    session: Partial<SessionData>,
    nomsId: string,
    excludeChargeUuid: string,
    appearanceUuid: string,
  ): string[] {
    const courtAppearance = this.getCourtAppearance(session, nomsId, appearanceUuid)
    const { offences } = courtAppearance
    return offences
      .filter(
        offence =>
          offence.sentence?.countNumber &&
          offence.sentence?.countNumber !== '-1' &&
          offence.chargeUuid !== excludeChargeUuid,
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
    if (courtAppearance.uploadedDocuments?.length > 0) courtAppearance.documentUploadAccepted = true
    // eslint-disable-next-line no-param-reassign
    session.courtAppearances[nomsId] = courtAppearance
  }

  async checkOffenceDatesHaveInvalidatedOffence(
    session: Partial<SessionData>,
    nomsId: string,
    chargeUuid: string,
    offence: Offence,
    dateOfBirth: string,
    username: string,
    appearanceUuid: string,
  ): Promise<boolean> {
    let hasInvalidated: boolean = false
    const courtAppearance = this.getCourtAppearance(session, nomsId, appearanceUuid)
    const offenceReference = courtAppearance.offences.findIndex(o => o.chargeUuid === chargeUuid)
    if (offenceReference !== -1 && courtAppearance.offences.length > offenceReference) {
      if (offence.sentence && offence.sentence.convictionDate) {
        const { sentence } = offence
        const offenceDate = dayjs(offence.offenceEndDate ?? offence.offenceStartDate)
        const convictionDate = dayjs(sentence.convictionDate)
        if (sentence.sentenceTypeId) {
          const prisonerDateOfBirth = dayjs(dateOfBirth)
          const ageAtConviction = convictionDate.diff(prisonerDateOfBirth, 'years')
          const sentenceTypeStillValid = await this.remandAndSentencingService.getIsSentenceTypeStillValid(
            sentence.sentenceTypeId,
            ageAtConviction,
            convictionDate,
            offenceDate,
            username,
          )
          hasInvalidated = !sentenceTypeStillValid.isStillValid
        }
      }
    }
    return hasInvalidated
  }

  async checkConvictionDateHasInvalidatedOffence(
    session: Partial<SessionData>,
    nomsId: string,
    chargeUuid: string,
    offence: Offence,
    dateOfBirth: string,
    username: string,
    appearanceUuid: string,
  ): Promise<boolean> {
    let hasInvalidated: boolean = false
    const courtAppearance = this.getCourtAppearance(session, nomsId, appearanceUuid)
    const offenceReference = courtAppearance.offences.findIndex(o => o.chargeUuid === chargeUuid)
    if (offenceReference !== -1 && courtAppearance.offences.length > offenceReference) {
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
        hasInvalidated = !sentenceTypeStillValid.isStillValid
      }
    }
    return hasInvalidated
  }

  sentenceIsInChain(
    session: Partial<SessionData>,
    nomsId: string,
    chargeUuid: string,
    appearanceUuid: string,
  ): boolean {
    let sentenceInChain: boolean = false
    const courtAppearance = this.getCourtAppearance(session, nomsId, appearanceUuid)
    const offenceReference = courtAppearance.offences.findIndex(o => o.chargeUuid === chargeUuid)
    if (offenceReference !== -1 && courtAppearance.offences.length > offenceReference) {
      const offence = courtAppearance.offences[offenceReference]
      const { sentence } = offence
      if (sentence) {
        sentenceInChain = courtAppearance.offences.some(
          otherOffence => otherOffence.sentence?.consecutiveToSentenceUuid === sentence.sentenceUuid,
        )
      }
    }
    return sentenceInChain
  }

  deleteSentenceInChain(session: Partial<SessionData>, nomsId: string, chargeUuid: string, appearanceUuid: string) {
    const courtAppearance = this.getCourtAppearance(session, nomsId, appearanceUuid)
    const { offences } = courtAppearance
    const offenceReference = courtAppearance.offences.findIndex(o => o.chargeUuid === chargeUuid)
    if (offenceReference !== -1 && courtAppearance.offences.length > offenceReference) {
      const { sentenceUuid } = courtAppearance.offences[offenceReference].sentence
      offences.splice(offenceReference, 1)
      this.resetChain(sentenceUuid, courtAppearance)
      courtAppearance.offences = offences
      // eslint-disable-next-line no-param-reassign
      session.courtAppearances[nomsId] = courtAppearance
    }
  }

  private resetChain(deletedSentenceUuid: string, courtAppearance: CourtAppearance) {
    const { offences } = courtAppearance
    const nextSentencesInChainIndexes = offences.flatMap((offence, index) =>
      offence.sentence?.consecutiveToSentenceUuid === deletedSentenceUuid ? index : [],
    )
    while (nextSentencesInChainIndexes.length) {
      const nextChainIndex = nextSentencesInChainIndexes.pop()
      const nextChainOffence = courtAppearance.offences[nextChainIndex]
      const { sentence } = nextChainOffence
      const nextSentenceInChainUuid = sentence.sentenceUuid
      delete sentence.consecutiveToSentenceUuid
      delete sentence.sentenceServeType
      delete sentence.isSentenceConsecutiveToAnotherCase
      nextChainOffence.sentence = sentence
      offences[nextChainIndex] = nextChainOffence
      offences
        .flatMap((offence, index) => {
          if (
            offence.sentence?.consecutiveToSentenceUuid === nextSentenceInChainUuid &&
            !nextSentencesInChainIndexes.includes(index)
          ) {
            return index
          }
          return []
        })
        .forEach(index => nextSentencesInChainIndexes.push(index))
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

  checkAppearanceCanEditOffences(
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
        appearanceOutcomeUuid: 'required_without:legacyData.nomisOutcomeCode',
      },
      {
        'required_without.appearanceOutcomeUuid': 'You must enter an overall case outcome before editing an offence',
      },
    )
    return errors
  }

  checkAllOffencesHaveUpdatedOutcomes(
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
        'offences.*.outcomeUuid': 'required_with:offences',
      },
      {
        'required_with.offences.*.outcomeUuid': 'Update the offence outcome',
      },
    )
    return errors.map(error => {
      const href = error.href.replace('.outcomeUuid', '')
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

  initialiseAppeals(session: Partial<SessionData>, nomsId: string, appearanceUuid: string, offences: Offence[]) {
    const courtAppearance = this.getCourtAppearance(session, nomsId, appearanceUuid)
    courtAppearance.warrantType = 'APPEAL'
    courtAppearance.offences = offences
    // eslint-disable-next-line no-param-reassign
    session.courtAppearances[nomsId] = courtAppearance
  }

  setCriminalOfficeReference(
    session: Partial<SessionData>,
    urlParameters: UrlParameters,
    criminalOfficeReferenceForm: CriminalOfficeReferenceForm,
  ): {
    text?: string
    html?: string
    href: string
  }[] {
    const errors = validate(
      criminalOfficeReferenceForm,
      {
        referenceNumber: ['required', 'regex:/^[A-Za-z0-9\\/\\.\\- ]+$/'],
      },
      {
        'required.referenceNumber': 'You must enter the Criminal Appeal Office reference number',
        'regex.referenceNumber': `html:<span aria-hidden='true' class="govuk-error-message">You can only use spaces, letters, numbers and symbols '/', '.' and '-' when entering a Criminal Appeal Office reference number</span><span class="govuk-visually-hidden">You can only use spaces, letters, numbers, hyphens, forward slashes and full stops when entering a criminal appeal office reference number.</span>`,
      },
    )
    if (errors.length === 0) {
      const courtAppearance = this.getCourtAppearance(session, urlParameters.nomsId, urlParameters.appearanceReference)
      courtAppearance.criminalAppealOfficeReference = criminalOfficeReferenceForm.referenceNumber
      // eslint-disable-next-line no-param-reassign
      session.courtAppearances[urlParameters.nomsId] = courtAppearance
    }
    return errors
  }

  async setAppealDate(
    session: Partial<SessionData>,
    urlParameters: UrlParameters,
    appealDateForm: AppealDateForm,
    username: string,
  ): Promise<
    {
      text?: string
      html?: string
      href: string
    }[]
  > {
    let isValidWarrantDateRule = ''
    if (appealDateForm['appealDate-day'] && appealDateForm['appealDate-month'] && appealDateForm['appealDate-year']) {
      const appealDateString = toDateString(
        appealDateForm['appealDate-year'],
        appealDateForm['appealDate-month'],
        appealDateForm['appealDate-day'],
      )
      isValidWarrantDateRule = `|isValidDate:${appealDateString}|isPastOrCurrentDate:${appealDateString}|isWithinLast100Years:${appealDateString}`
    }
    const errors = validate(
      appealDateForm,
      {
        'appealDate-day': `required${isValidWarrantDateRule}`,
        'appealDate-month': `required`,
        'appealDate-year': `required`,
      },
      {
        'required.appealDate-year': 'Appeal hearing date must include year',
        'required.appealDate-month': 'Appeal hearing date must include month',
        'required.appealDate-day': 'Appeal hearing date must include day',
        'isValidDate.appealDate-day': 'This date does not exist.',
        'isPastOrCurrentDate.appealDate-day': `The appeal hearing date cannot be a date in the future`,
        'isWithinLast100Years.appealDate-day': 'All dates must be within the last 100 years from today’s date',
      },
    )

    if (errors.length === 0) {
      const appealDate = dayjs({
        year: appealDateForm['appealDate-year'],
        month: parseInt(appealDateForm['appealDate-month'], 10) - 1,
        day: appealDateForm['appealDate-day'],
      })
      let latestSentencingAppearanceDate = null
      const courtCaseValidationDates = await this.remandAndSentencingService.getValidationDatesForCourtCase(
        urlParameters.courtCaseReference,
        username,
        urlParameters.appearanceReference,
      )
      if (courtCaseValidationDates.latestSentenceAppearanceDate) {
        latestSentencingAppearanceDate = dayjs(courtCaseValidationDates.latestSentenceAppearanceDate)
        if (appealDate.isBefore(latestSentencingAppearanceDate)) {
          errors.push({
            text: 'The appeal hearing date must be after the sentencing warrant date in the court case',
            href: '#appealDate',
          })
        }
      }

      if (errors.length === 0) {
        const courtAppearance = this.getCourtAppearance(
          session,
          urlParameters.nomsId,
          urlParameters.appearanceReference,
        )
        courtAppearance.warrantDate = appealDate.toDate()
        // eslint-disable-next-line no-param-reassign
        session.courtAppearances[urlParameters.nomsId] = courtAppearance
      }
    }
    return errors
  }

  setAppealCourtName(
    session: Partial<SessionData>,
    urlParameter: UrlParameters,
    appealCourtNameForm: AppealCourtNameForm,
  ): {
    text?: string
    html?: string
    href: string
  }[] {
    const errors = validate(
      appealCourtNameForm,
      { courtCode: 'required' },
      { 'required.courtCode': 'You must enter the court that heard the appeal' },
    )
    if (errors.length === 0) {
      const courtAppearance = this.getCourtAppearance(session, urlParameter.nomsId, urlParameter.appearanceReference)
      courtAppearance.courtCode = appealCourtNameForm.courtCode
      // eslint-disable-next-line no-param-reassign
      session.courtAppearances[urlParameter.nomsId] = courtAppearance
    }
    return errors
  }

  setAppealAppearanceOutcome(
    session: Partial<SessionData>,
    urlParameters: UrlParameters,
    overallCaseOutcomeForm: AppealOverallCaseOutcomeForm,
  ): {
    text?: string
    html?: string
    href: string
  }[] {
    const errors = validate(
      overallCaseOutcomeForm,
      {
        overallCaseOutcome: 'required',
      },
      {
        'required.overallCaseOutcome': 'You must select the overall case outcome',
      },
    )
    if (errors.length === 0) {
      const courtAppearance = this.getCourtAppearance(session, urlParameters.nomsId, urlParameters.appearanceReference)
      courtAppearance.appearanceOutcomeUuid = overallCaseOutcomeForm.overallCaseOutcome
      // eslint-disable-next-line no-param-reassign
      session.courtAppearances[urlParameters.nomsId] = courtAppearance
    }
    return errors
  }

  setOffenceAppealOutcome(
    session: Partial<SessionData>,
    urlParameters: UrlParameters,
    appealOffenceOutcomeForm: AppealOffenceOutcomeForm,
  ): {
    text?: string
    html?: string
    href: string
  }[] {
    const errors = validate(
      appealOffenceOutcomeForm,
      {
        offenceOutcome: 'required',
      },
      {
        'required.offenceOutcome': 'You must select an appeal outcome for this offence',
      },
    )
    if (errors.length === 0) {
      const { nomsId, chargeUuid, appearanceReference } = urlParameters
      const offence = this.getOffence(session, nomsId, chargeUuid, appearanceReference)
      offence.outcomeUuid = appealOffenceOutcomeForm.offenceOutcome
      offence.updatedOutcome = true
      delete offence.sentence
      delete offence.aggravatingFactors
      this.addOffence(session, nomsId, chargeUuid, offence, appearanceReference)
    }
    return errors
  }

  finishRecordingAppeals(
    session: Partial<SessionData>,
    urlParameters: UrlParameters,
    finishedRecordingAppealsForm: FinishedRecordingAppealsForm,
  ): {
    text?: string
    html?: string
    href: string
  }[] {
    const { nomsId, appearanceReference } = urlParameters
    const courtAppearance = this.getCourtAppearance(session, nomsId, appearanceReference)
    const errors = validate(
      finishedRecordingAppealsForm,
      {
        finishedRecordAppeal: 'required',
      },
      {
        'required.finishedRecordAppeal':
          'You must confirm that you have finished recording appeal outcomes before you can continue.',
      },
    )
    if (
      finishedRecordingAppealsForm.finishedRecordAppeal === 'true' &&
      !courtAppearance.offences.some(offence => offence.updatedOutcome)
    ) {
      errors.push({
        text: 'You must record at least one appeal outcome before you can continue.',
        href: '#withoutAppealHeading',
      })
    }
    if (errors.length === 0) {
      courtAppearance.offenceSentenceAccepted = finishedRecordingAppealsForm.finishedRecordAppeal === 'true'
      // eslint-disable-next-line no-param-reassign
      session.courtAppearances[nomsId] = courtAppearance
    }
    return errors
  }

  setBreachType(
    session: Partial<SessionData>,
    urlParameters: UrlParameters,
    breachTypeForm: BreachTypeForm,
  ): {
    text?: string
    html?: string
    href: string
  }[] {
    const errors = validate(
      breachTypeForm,
      {
        breachType: 'required',
      },
      {
        'required.breachType': 'You must select the breach type',
      },
    )
    if (errors.length === 0) {
      const courtAppearance = this.getCourtAppearance(session, urlParameters.nomsId, urlParameters.appearanceReference)
      courtAppearance.warrantType = breachTypeForm.breachType
      // eslint-disable-next-line no-param-reassign
      session.courtAppearances[urlParameters.nomsId] = courtAppearance
    }
    return errors
  }

  async setBreachDate(
    session: Partial<SessionData>,
    urlParameters: UrlParameters,
    breachDateForm: BreachDateForm,
    username: string,
  ): Promise<
    {
      text?: string
      html?: string
      href: string
    }[]
  > {
    let isValidWarrantDateRule = ''
    if (breachDateForm['breachDate-day'] && breachDateForm['breachDate-month'] && breachDateForm['breachDate-year']) {
      const breachDateString = toDateString(
        breachDateForm['breachDate-year'],
        breachDateForm['breachDate-month'],
        breachDateForm['breachDate-day'],
      )
      isValidWarrantDateRule = `|isValidDate:${breachDateString}|isPastOrCurrentDate:${breachDateString}|isWithinLast100Years:${breachDateString}`
    }
    const errors = validate(
      breachDateForm,
      {
        'breachDate-day': `required${isValidWarrantDateRule}`,
        'breachDate-month': `required`,
        'breachDate-year': `required`,
      },
      {
        'required.breachDate-year': 'Hearing date must include year',
        'required.breachDate-month': 'Hearing date must include month',
        'required.breachDate-day': 'Hearing date must include day',
        'isValidDate.breachDate-day': 'This date does not exist.',
        'isPastOrCurrentDate.breachDate-day': `The hearing date cannot be a date in the future`,
        'isWithinLast100Years.breachDate-day': 'All dates must be within the last 100 years from today’s date',
      },
    )

    if (errors.length === 0) {
      const breachDate = dayjs({
        year: breachDateForm['breachDate-year'],
        month: parseInt(breachDateForm['breachDate-month'], 10) - 1,
        day: breachDateForm['breachDate-day'],
      })
      let latestSentencingAppearanceDate = null
      const courtCaseValidationDates = await this.remandAndSentencingService.getValidationDatesForCourtCase(
        urlParameters.courtCaseReference,
        username,
        urlParameters.appearanceReference,
      )
      if (courtCaseValidationDates.latestSentenceAppearanceDate) {
        latestSentencingAppearanceDate = dayjs(courtCaseValidationDates.latestSentenceAppearanceDate)
        if (breachDate.isBefore(latestSentencingAppearanceDate)) {
          errors.push({
            text: 'The hearing date must be after the sentencing warrant date in the court case',
            href: '#breachDate',
          })
        }
      }

      if (errors.length === 0) {
        const courtAppearance = this.getCourtAppearance(
          session,
          urlParameters.nomsId,
          urlParameters.appearanceReference,
        )
        courtAppearance.warrantDate = breachDate.toDate()
        // eslint-disable-next-line no-param-reassign
        session.courtAppearances[urlParameters.nomsId] = courtAppearance
      }
    }
    return errors
  }

  setBreachCourtName(
    session: Partial<SessionData>,
    urlParameter: UrlParameters,
    breachCourtNameForm: BreachCourtNameForm,
  ): {
    text?: string
    html?: string
    href: string
  }[] {
    const errors = validate(
      breachCourtNameForm,
      { courtCode: 'required' },
      { 'required.courtCode': 'You must enter the court that heard the breach' },
    )
    if (errors.length === 0) {
      const courtAppearance = this.getCourtAppearance(session, urlParameter.nomsId, urlParameter.appearanceReference)
      courtAppearance.courtCode = breachCourtNameForm.courtCode
      // eslint-disable-next-line no-param-reassign
      session.courtAppearances[urlParameter.nomsId] = courtAppearance
    }
    return errors
  }

  initialiseBreach(session: Partial<SessionData>, urlParameter: UrlParameters, offences: Offence[]) {
    const courtAppearance = this.getCourtAppearance(session, urlParameter.nomsId, urlParameter.appearanceReference)
    courtAppearance.appearanceOutcomeUuid = DETENTION_TRAINING_ORDER_OUTCOME_UUID
    courtAppearance.offences = offences
    // eslint-disable-next-line no-param-reassign
    session.courtAppearances[urlParameter.nomsId] = courtAppearance
  }
}
