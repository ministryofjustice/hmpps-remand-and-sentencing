declare module 'forms' {
  export interface CourtCaseReferenceForm {
    referenceNumber?: string
    noCaseReference?: string
  }

  export interface CourtCaseSelectReferenceForm {
    referenceNumberSelect?: string
  }

  export interface CourtCaseWarrantDateForm {
    'warrantDate-day'?: string
    'warrantDate-month'?: string
    'warrantDate-year'?: string
  }

  export interface CourtCaseSelectCourtNameForm {
    courtNameSelect?: string
    previousCourtCode?: string
  }

  export interface CourtCaseCourtNameForm {
    courtName?: string
    courtCode?: string
  }

  export interface CourtCaseOverallCaseOutcomeForm {
    overallCaseOutcome?: string
  }

  export interface CourtCaseCaseOutcomeAppliedAllForm {
    caseOutcomeAppliedAll?: string
  }

  export interface CourtCaseNextHearingSelectForm {
    nextHearingSelect?: string
  }

  export interface CourtCaseNextHearingTypeForm {
    nextHearingType?: string
  }

  export interface CourtCaseNextHearingDateForm {
    'nextHearingDate-year'?: string
    'nextHearingDate-month'?: string
    'nextHearingDate-day'?: string
    nextHearingTime?: string
  }

  export interface CourtCaseNextHearingCourtSelectForm {
    nextHearingCourtSelect?: string
  }

  export interface CourtCaseNextHearingCourtNameForm {
    nextHearingCourtName?: string
    courtCode?: string
  }

  export interface OffenceOffenceDateForm {
    'offenceStartDate-day'?: string
    'offenceStartDate-month'?: string
    'offenceStartDate-year'?: string
    'offenceEndDate-day'?: string
    'offenceEndDate-month'?: string
    'offenceEndDate-year'?: string
  }

  export interface OffenceOffenceCodeForm {
    offenceCode?: string
    unknownCode?: string
  }

  export interface OffenceOffenceNameForm {
    offenceName?: string
  }

  export interface OffenceConfirmOffenceForm {
    offenceCode?: string
    offenceName?: string
  }

  export interface OffenceOffenceOutcomeForm {
    offenceOutcome?: string
  }

  export interface DeleteDocumentForm {
    deleteDocument?: string
  }

  export interface OffenceFinishedAddingForm {
    finishedAddingOffences?: string
  }

  export interface ReviewOffencesForm {
    changeOffence?: string
  }

  export interface UpdateOffenceOutcomesForm {
    finishedReviewOffenceOutcomes?: string
  }

  export interface CourtCaseWarrantTypeForm {
    warrantType?: string
  }

  export interface OffenceCountNumberForm {
    countNumber?: string
    hasCountNumber?: string
  }

  export interface OffenceAlternativePeriodLengthForm {
    'firstSentenceLength-value'?: string
    'firstSentenceLength-period'?: string
    'secondSentenceLength-value'?: string
    'secondSentenceLength-period'?: string
    'thirdSentenceLength-value'?: string
    'thirdSentenceLength-period'?: string
    'fourthSentenceLength-value'?: string
    'fourthSentenceLength-period'?: string
  }

  export interface OffenceSentenceServeTypeForm {
    sentenceServeType?: string
  }

  export interface CourtCaseAlternativeSentenceLengthForm {
    'firstSentenceLength-value'?: string
    'firstSentenceLength-period'?: string
    'secondSentenceLength-value'?: string
    'secondSentenceLength-period'?: string
    'thirdSentenceLength-value'?: string
    'thirdSentenceLength-period'?: string
    'fourthSentenceLength-value'?: string
    'fourthSentenceLength-period'?: string
  }

  export interface SentenceLengthForm {
    'sentenceLength-years'?: string
    'sentenceLength-months'?: string
    'sentenceLength-weeks'?: string
    'sentenceLength-days'?: string
    hasOverallSentenceLength?: string
  }

  export interface OffenceSentenceTypeForm {
    sentenceType?: string
  }

  export interface OffenceFineAmountForm {
    fineAmount?: number
  }

  export interface CourtCaseOverallConvictionDateForm {
    'overallConvictionDate-day'?: string
    'overallConvictionDate-month'?: string
    'overallConvictionDate-year'?: string
    overallConvictionDateAppliedAll?: string
  }

  export interface OffenceConvictionDateForm {
    'convictionDate-day'?: string
    'convictionDate-month'?: string
    'convictionDate-year'?: string
  }

  export interface SentenceIsSentenceConsecutiveToForm {
    isSentenceConsecutiveToAnotherCase?: string
  }

  export interface FirstSentenceConsecutiveToForm {
    consecutiveToSentenceUuid?: string
  }

  export interface SentenceConsecutiveToForm {
    consecutiveToSentenceUuid?: string
  }

  export interface UploadedDocumentForm {
    _csrf?: string
  }
}
