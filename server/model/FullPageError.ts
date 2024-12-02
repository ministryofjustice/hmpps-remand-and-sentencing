import FullPageErrorType from './FullPageErrorType'

class FullPageError extends Error {
  errorKey: FullPageErrorType

  status: number

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
}

export default FullPageError
