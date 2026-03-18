import FullPageErrorType from './FullPageErrorType'

class FullPageError extends Error {
  errorKey: FullPageErrorType

  status: number

  nomsId: string

  static notInCaseLoadError(): FullPageError {
    const error = new FullPageError('Prisoner is not in caseload')
    error.errorKey = FullPageErrorType.NOT_IN_CASELOAD
    error.status = 404
    return error
  }

  static notFoundError(): FullPageError {
    const error = new FullPageError('Not found')
    error.errorKey = FullPageErrorType.NOT_FOUND
    error.status = 404
    return error
  }

  static appearanceDeletedError(nomsId: string): FullPageError {
    const error = new FullPageError(
      "This appearance has been deleted. You cannot make an update to an appearance that's been deleted.",
    )
    error.errorKey = FullPageErrorType.APPEARANCE_DELETED
    error.status = 409
    error.nomsId = nomsId
    return error
  }
}

export default FullPageError
