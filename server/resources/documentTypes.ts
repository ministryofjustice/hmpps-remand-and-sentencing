const expectedTypes = {
  REMAND: [
    {
      type: 'HMCTS_WARRANT',
      name: 'Remand warrant',
      uploadLinkSegment: 'warrant',
    },
    {
      type: 'PRISON_COURT_REGISTER',
      name: 'Prison court register',
      uploadLinkSegment: 'prison-court-register',
    },
  ],
  SENTENCING: [
    {
      type: 'HMCTS_WARRANT',
      name: 'Sentencing warrant',
      uploadLinkSegment: 'warrant',
    },
    {
      type: 'TRIAL_RECORD_SHEET',
      name: 'Trial record sheet',
      uploadLinkSegment: 'trial-record-sheet',
    },
    {
      type: 'INDICTMENT',
      name: 'Indictment',
      uploadLinkSegment: 'indictment',
    },
    {
      type: 'PRISON_COURT_REGISTER',
      name: 'Prison court register',
      uploadLinkSegment: 'prison-court-register',
    },
  ],
}

export default expectedTypes
