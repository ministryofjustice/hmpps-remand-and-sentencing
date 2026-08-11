export enum Role {
  /** @deprecated */
  REMAND_AND_SENTENCING = 'ROLE_REMAND_AND_SENTENCING',
  COURT_CASES = 'ROLE_COURT_CASES',
  RELEASE_DATES_CALCULATOR = 'ROLE_RELEASE_DATES_CALCULATOR',
  RAS_REFERENCE_ADMIN = 'ROLE_RAS_REFERENCE_ADMIN',
  /** @deprecated */
  RECALL_MAINTAINER = 'ROLE_RECALL_MAINTAINER',
}

export const Roles = {
  getAuthority(role: Role): string {
    return role
  },

  getRole(role: Role): string {
    return role.replace(/^ROLE_/, '')
  },

  values(): Role[] {
    return Object.values(Role) as Role[]
  },
}
