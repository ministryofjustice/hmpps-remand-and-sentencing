import type { Request, Response } from 'express'
import populateCurrentPrisoner from './populateCurrentPrisoner'
import PrisonerSearchService from '../services/prisonerSearchService'
import { restoreAndClearSession } from '../data/sessionRecoveryStore'
import { PrisonerSearchApiPrisoner } from '../@types/prisonerSearchApi/prisonerSearchTypes'

jest.mock('../data/sessionRecoveryStore')

describe('populateCurrentPrisoner', () => {
  const next = jest.fn()
  let prisonerSearchService: jest.Mocked<PrisonerSearchService>

  function createReqRes({
    nomsId,
    username,
    caseLoads = ['MDI'],
    session = {},
  }: {
    nomsId?: string
    username?: string
    caseLoads?: string[]
    session?: Record<string, unknown>
  }) {
    const req = {
      params: nomsId ? { nomsId } : {},
      session,
    } as unknown as Request

    const res = {
      locals: {
        user: username
          ? {
              username,
              caseLoads: caseLoads.map(caseLoadId => ({ caseLoadId })),
              hasInactiveBookingsAccess: false,
            }
          : undefined,
      },
    } as unknown as Response

    return { req, res }
  }

  beforeEach(() => {
    jest.clearAllMocks()
    prisonerSearchService = { getPrisonerDetails: jest.fn() } as unknown as jest.Mocked<PrisonerSearchService>
  })

  it('restores recovered session data and clears it after successfully loading the prisoner', async () => {
    prisonerSearchService.getPrisonerDetails.mockResolvedValue({ prisonId: 'MDI' } as PrisonerSearchApiPrisoner)
    ;(restoreAndClearSession as jest.Mock).mockResolvedValue({
      courtAppearances: { A1234BC: { appearanceUuid: '123' } },
    })

    const { req, res } = createReqRes({ nomsId: 'A1234BC', username: 'user1', session: { courtAppearances: {} } })

    await populateCurrentPrisoner(prisonerSearchService)(req, res, next)

    expect(restoreAndClearSession).toHaveBeenCalledWith('user1', 'A1234BC')
    expect(req.session.courtAppearances).toEqual({ A1234BC: { appearanceUuid: '123' } })
    expect(next).toHaveBeenCalledWith()
  })

  it('does not overwrite the new session cookie with the recovered one', async () => {
    prisonerSearchService.getPrisonerDetails.mockResolvedValue({ prisonId: 'MDI' } as PrisonerSearchApiPrisoner)
    ;(restoreAndClearSession as jest.Mock).mockResolvedValue({
      cookie: { maxAge: 999 },
      offences: { 'A1234BC-CASE1-charge1': {} },
    })

    const { req, res } = createReqRes({
      nomsId: 'A1234BC',
      username: 'user1',
      session: { cookie: { maxAge: 123 }, offences: {} },
    })

    await populateCurrentPrisoner(prisonerSearchService)(req, res, next)

    expect(req.session.cookie).toEqual({ maxAge: 123 })
    expect(req.session.offences).toEqual({ 'A1234BC-CASE1-charge1': {} })
  })

  it('leaves the session untouched when there is nothing to recover', async () => {
    prisonerSearchService.getPrisonerDetails.mockResolvedValue({ prisonId: 'MDI' } as PrisonerSearchApiPrisoner)
    ;(restoreAndClearSession as jest.Mock).mockResolvedValue(null)

    const { req, res } = createReqRes({
      nomsId: 'A1234BC',
      username: 'user1',
      session: { courtAppearances: { existing: true } },
    })

    await populateCurrentPrisoner(prisonerSearchService)(req, res, next)

    expect(req.session.courtAppearances).toEqual({ existing: true })
  })

  it('does not attempt to restore session data when the user cannot access the prisoner', async () => {
    prisonerSearchService.getPrisonerDetails.mockResolvedValue({ prisonId: 'XYZ' } as PrisonerSearchApiPrisoner)

    const { req, res } = createReqRes({ nomsId: 'A1234BC', username: 'user1', caseLoads: ['MDI'] })

    await populateCurrentPrisoner(prisonerSearchService)(req, res, next)

    expect(restoreAndClearSession).not.toHaveBeenCalled()
    expect(next).toHaveBeenCalledWith(expect.any(Error))
  })

  it('skips restoration entirely when nomsId is not present on the route', async () => {
    const { req, res } = createReqRes({ username: 'user1' })

    await populateCurrentPrisoner(prisonerSearchService)(req, res, next)

    expect(restoreAndClearSession).not.toHaveBeenCalled()
    expect(prisonerSearchService.getPrisonerDetails).not.toHaveBeenCalled()
    expect(next).toHaveBeenCalledWith()
  })
})
