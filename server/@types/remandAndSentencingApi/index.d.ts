/**
 * This file was auto-generated by openapi-typescript.
 * Do not make direct changes to the file.
 */

export interface paths {
  '/court-case/{courtCaseUuid}': {
    /**
     * Retrieve court case details
     * @description This endpoint will retrieve court case details
     */
    get: operations['getCourtCaseDetails']
    /**
     * Create Court case
     * @description This endpoint will create a court case
     */
    put: operations['putCourtCase']
  }
  '/court-appearance/{appearanceUuid}': {
    /**
     * Retrieve court appearance details
     * @description This endpoint will retrieve court appearance details
     */
    get: operations['getCourtAppearanceDetails']
    /**
     * Create Court appearance
     * @description This endpoint will create a court appearance in a given court case
     */
    put: operations['updateCourtAppearance']
  }
  '/court-case': {
    /**
     * Create Court case
     * @description This endpoint will create a court case
     */
    post: operations['createCourtCase']
  }
  '/court-appearance': {
    /**
     * Create Court appearance
     * @description This endpoint will create a court appearance in a given court case
     */
    post: operations['createCourtAppearance']
  }
  '/person/{prisonerId}': {
    /**
     * Retrieve person details
     * @description This endpoint will retrieve person details
     */
    get: operations['getPersonDetails']
  }
  '/court-case/search': {
    /**
     * Retrieve all court cases for person
     * @description This endpoint will retrieve all court cases for a person
     */
    get: operations['searchCourtCases']
  }
  '/charge/{chargeUuid}': {
    /**
     * Retrieve charge details
     * @description This endpoint will retrieve charge details
     */
    get: operations['getChargeDetails']
  }
}

export type webhooks = Record<string, never>

export interface components {
  schemas: {
    CreateCharge: {
      /** Format: uuid */
      chargeUuid?: string
      offenceCode: string
      /** Format: date */
      offenceStartDate: string
      /** Format: date */
      offenceEndDate?: string
      outcome: string
    }
    CreateCourtAppearance: {
      courtCaseUuid?: string
      /** Format: uuid */
      appearanceUuid?: string
      outcome: string
      courtCode: string
      courtCaseReference: string
      /** Format: date */
      appearanceDate: string
      warrantId?: string
      warrantType: string
      nextCourtAppearance?: components['schemas']['CreateNextCourtAppearance']
      charges: components['schemas']['CreateCharge'][]
    }
    CreateCourtCase: {
      prisonerId: string
      appearances: components['schemas']['CreateCourtAppearance'][]
    }
    CreateNextCourtAppearance: {
      /** Format: date */
      appearanceDate: string
      courtCode: string
      appearanceType: string
    }
    CreateCourtCaseResponse: {
      courtCaseUuid: string
    }
    CreateCourtAppearanceResponse: {
      /** Format: uuid */
      appearanceUuid: string
    }
    PersonDetails: {
      personId: string
      firstName: string
      lastName: string
      establishment?: string
      cellNumber?: string
      /** Format: date */
      dateOfBirth: string
      pncNumber?: string
      status?: string
    }
    Charge: {
      /** Format: uuid */
      chargeUuid: string
      offenceCode: string
      /** Format: date */
      offenceStartDate: string
      /** Format: date */
      offenceEndDate?: string
      outcome: string
    }
    CourtAppearance: {
      /** Format: uuid */
      appearanceUuid: string
      outcome: string
      courtCode: string
      courtCaseReference: string
      /** Format: date */
      appearanceDate: string
      warrantId?: string
      warrantType: string
      nextCourtAppearance?: components['schemas']['NextCourtAppearance']
      charges: components['schemas']['Charge'][]
    }
    CourtCase: {
      prisonerId: string
      courtCaseUuid: string
      latestAppearance: components['schemas']['CourtAppearance']
      appearances: components['schemas']['CourtAppearance'][]
    }
    NextCourtAppearance: {
      /** Format: date */
      appearanceDate: string
      courtCode: string
      appearanceType: string
    }
    Pageable: {
      /** Format: int32 */
      page?: number
      /** Format: int32 */
      size?: number
      sort?: string[]
    }
    PageCourtCase: {
      /** Format: int32 */
      totalPages?: number
      /** Format: int64 */
      totalElements?: number
      /** Format: int32 */
      size?: number
      content?: components['schemas']['CourtCase'][]
      first?: boolean
      last?: boolean
      sort?: components['schemas']['SortObject']
      /** Format: int32 */
      number?: number
      pageable?: components['schemas']['PageableObject']
      /** Format: int32 */
      numberOfElements?: number
      empty?: boolean
    }
    PageableObject: {
      /** Format: int64 */
      offset?: number
      sort?: components['schemas']['SortObject']
      /** Format: int32 */
      pageNumber?: number
      /** Format: int32 */
      pageSize?: number
      paged?: boolean
      unpaged?: boolean
    }
    SortObject: {
      empty?: boolean
      unsorted?: boolean
      sorted?: boolean
    }
  }
  responses: never
  parameters: never
  requestBodies: never
  headers: never
  pathItems: never
}

export type $defs = Record<string, never>

export type external = Record<string, never>

export interface operations {
  /**
   * Retrieve court case details
   * @description This endpoint will retrieve court case details
   */
  getCourtCaseDetails: {
    parameters: {
      path: {
        courtCaseUuid: string
      }
    }
    responses: {
      /** @description Returns court case details */
      200: {
        content: {
          'application/json': components['schemas']['CourtCase']
        }
      }
      /** @description Unauthorised, requires a valid Oauth2 token */
      401: {
        content: {
          'application/json': components['schemas']['CourtCase']
        }
      }
      /** @description Forbidden, requires an appropriate role */
      403: {
        content: {
          'application/json': components['schemas']['CourtCase']
        }
      }
      /** @description Not found if no court case at uuid */
      404: {
        content: {
          'application/json': components['schemas']['CourtCase']
        }
      }
    }
  }
  /**
   * Create Court case
   * @description This endpoint will create a court case
   */
  putCourtCase: {
    parameters: {
      path: {
        courtCaseUuid: string
      }
    }
    requestBody: {
      content: {
        'application/json': components['schemas']['CreateCourtCase']
      }
    }
    responses: {
      /** @description OK */
      200: {
        content: {
          'application/json': components['schemas']['CreateCourtCaseResponse']
        }
      }
      /** @description Returns court case UUID */
      201: {
        content: {
          'application/json': components['schemas']['CreateCourtCaseResponse']
        }
      }
      /** @description Unauthorised, requires a valid Oauth2 token */
      401: {
        content: {
          'application/json': components['schemas']['CreateCourtCaseResponse']
        }
      }
      /** @description Forbidden, requires an appropriate role */
      403: {
        content: {
          'application/json': components['schemas']['CreateCourtCaseResponse']
        }
      }
    }
  }
  /**
   * Retrieve court appearance details
   * @description This endpoint will retrieve court appearance details
   */
  getCourtAppearanceDetails: {
    parameters: {
      path: {
        appearanceUuid: string
      }
    }
    responses: {
      /** @description Returns court appearance details */
      200: {
        content: {
          'application/json': components['schemas']['CourtAppearance']
        }
      }
      /** @description Unauthorised, requires a valid Oauth2 token */
      401: {
        content: {
          'application/json': components['schemas']['CourtAppearance']
        }
      }
      /** @description Forbidden, requires an appropriate role */
      403: {
        content: {
          'application/json': components['schemas']['CourtAppearance']
        }
      }
      /** @description Not found if no court appearance at uuid */
      404: {
        content: {
          'application/json': components['schemas']['CourtAppearance']
        }
      }
    }
  }
  /**
   * Create Court appearance
   * @description This endpoint will create a court appearance in a given court case
   */
  updateCourtAppearance: {
    parameters: {
      path: {
        appearanceUuid: string
      }
    }
    requestBody: {
      content: {
        'application/json': components['schemas']['CreateCourtAppearance']
      }
    }
    responses: {
      /** @description OK */
      200: {
        content: {
          'application/json': components['schemas']['CreateCourtAppearanceResponse']
        }
      }
      /** @description Returns court case UUID */
      201: {
        content: {
          'application/json': components['schemas']['CreateCourtAppearanceResponse']
        }
      }
      /** @description Unauthorised, requires a valid Oauth2 token */
      401: {
        content: {
          'application/json': components['schemas']['CreateCourtAppearanceResponse']
        }
      }
      /** @description Forbidden, requires an appropriate role */
      403: {
        content: {
          'application/json': components['schemas']['CreateCourtAppearanceResponse']
        }
      }
    }
  }
  /**
   * Create Court case
   * @description This endpoint will create a court case
   */
  createCourtCase: {
    requestBody: {
      content: {
        'application/json': components['schemas']['CreateCourtCase']
      }
    }
    responses: {
      /** @description Returns court case UUID */
      201: {
        content: {
          'application/json': components['schemas']['CreateCourtCaseResponse']
        }
      }
      /** @description Unauthorised, requires a valid Oauth2 token */
      401: {
        content: {
          'application/json': components['schemas']['CreateCourtCaseResponse']
        }
      }
      /** @description Forbidden, requires an appropriate role */
      403: {
        content: {
          'application/json': components['schemas']['CreateCourtCaseResponse']
        }
      }
    }
  }
  /**
   * Create Court appearance
   * @description This endpoint will create a court appearance in a given court case
   */
  createCourtAppearance: {
    requestBody: {
      content: {
        'application/json': components['schemas']['CreateCourtAppearance']
      }
    }
    responses: {
      /** @description Returns court case UUID */
      201: {
        content: {
          'application/json': components['schemas']['CreateCourtAppearanceResponse']
        }
      }
      /** @description Unauthorised, requires a valid Oauth2 token */
      401: {
        content: {
          'application/json': components['schemas']['CreateCourtAppearanceResponse']
        }
      }
      /** @description Forbidden, requires an appropriate role */
      403: {
        content: {
          'application/json': components['schemas']['CreateCourtAppearanceResponse']
        }
      }
    }
  }
  /**
   * Retrieve person details
   * @description This endpoint will retrieve person details
   */
  getPersonDetails: {
    parameters: {
      path: {
        prisonerId: string
      }
    }
    responses: {
      /** @description Returns person details */
      200: {
        content: {
          'application/json': components['schemas']['PersonDetails']
        }
      }
      /** @description Unauthorised, requires a valid Oauth2 token */
      401: {
        content: {
          'application/json': components['schemas']['PersonDetails']
        }
      }
      /** @description Forbidden, requires an appropriate role */
      403: {
        content: {
          'application/json': components['schemas']['PersonDetails']
        }
      }
    }
  }
  /**
   * Retrieve all court cases for person
   * @description This endpoint will retrieve all court cases for a person
   */
  searchCourtCases: {
    parameters: {
      query: {
        prisonerId: string
        pageable: components['schemas']['Pageable']
      }
    }
    responses: {
      /** @description Returns court cases */
      200: {
        content: {
          'application/json': components['schemas']['PageCourtCase']
        }
      }
      /** @description Unauthorised, requires a valid Oauth2 token */
      401: {
        content: {
          'application/json': components['schemas']['PageCourtCase']
        }
      }
      /** @description Forbidden, requires an appropriate role */
      403: {
        content: {
          'application/json': components['schemas']['PageCourtCase']
        }
      }
    }
  }
  /**
   * Retrieve charge details
   * @description This endpoint will retrieve charge details
   */
  getChargeDetails: {
    parameters: {
      path: {
        chargeUuid: string
      }
    }
    responses: {
      /** @description Returns charge details */
      200: {
        content: {
          'application/json': components['schemas']['Charge']
        }
      }
      /** @description Unauthorised, requires a valid Oauth2 token */
      401: {
        content: {
          'application/json': components['schemas']['Charge']
        }
      }
      /** @description Forbidden, requires an appropriate role */
      403: {
        content: {
          'application/json': components['schemas']['Charge']
        }
      }
      /** @description Not found if no charge at uuid */
      404: {
        content: {
          'application/json': components['schemas']['Charge']
        }
      }
    }
  }
}
