export enum Role {
  COURT_CASES = 'ROLE_COURT_CASES',
  RELEASE_DATES_CALCULATOR = 'ROLE_RELEASE_DATES_CALCULATOR',
  RAS_REFERENCE_ADMIN = 'ROLE_RAS_REFERENCE_ADMIN',
  INACTIVE_BOOKINGS = 'ROLE_INACTIVE_BOOKINGS',
  PECS_PRISON = 'ROLE_PECS_PRISON',
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
