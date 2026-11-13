export const SuccessNotificationEnum = {
  REPLACED_OUTCOME_CHANGED: 'REPLACED_OUTCOME_CHANGED',
  REPLACED_OUTCOME_DELETED: 'REPLACED_OUTCOME_DELETED',
  OFFENCE_DELETED: 'OFFENCE_DELETED',
} as const

export type SuccessNotificationTypes = keyof typeof SuccessNotificationEnum
