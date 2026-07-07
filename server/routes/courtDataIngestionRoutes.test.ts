import { Request, Response } from 'express'
import CourtDataIngestionRoutes from './courtDataIngestionRoutes'
import AuditService from '../services/auditService'
import CourtAppearanceService from '../services/courtAppearanceService'
import ManageOffencesService from '../services/manageOffencesService'
import OffenceService from '../services/offenceService'
import RemandAndSentencingService from '../services/remandAndSentencingService'
import CourtRegisterService from '../services/courtRegisterService'
import DocumentManagementService from '../services/documentManagementService'
import JourneyUrls from './data/JourneyUrls'
import { pageCourtCaseAppearanceToCourtAppearance } from '../utils/mappingUtils'

jest.mock('../services/auditService')
jest.mock('../services/courtAppearanceService')
jest.mock('../services/manageOffencesService')
jest.mock('../services/offenceService')
jest.mock('../services/remandAndSentencingService')
jest.mock('../services/courtRegisterService')
jest.mock('../services/documentManagementService')
jest.mock('./data/JourneyUrls')
jest.mock('../utils/mappingUtils')
jest.mock('../resources/documentTypes', () => ({
  REMAND: [{ type: 'WARRANT', name: 'Warrant' }],
}))

const username = 'user1'

describe('CourtDataIngestionRoutes', () => {
  let courtAppearanceService: jest.Mocked<CourtAppearanceService>
  let offenceService: jest.Mocked<OffenceService>
  let remandAndSentencingService: jest.Mocked<RemandAndSentencingService>
  let manageOffencesService: jest.Mocked<ManageOffencesService>
  let auditService: jest.Mocked<AuditService>
  let documentManagementService: jest.Mocked<DocumentManagementService>
  let courtRegisterService: jest.Mocked<CourtRegisterService>
  let routes: CourtDataIngestionRoutes

  beforeEach(() => {
    jest.resetAllMocks()
    courtAppearanceService = new CourtAppearanceService(
      undefined,
      undefined,
      undefined,
    ) as jest.Mocked<CourtAppearanceService>
    offenceService = new OffenceService(undefined, undefined, undefined) as jest.Mocked<OffenceService>
    remandAndSentencingService = new RemandAndSentencingService(undefined) as jest.Mocked<RemandAndSentencingService>
    manageOffencesService = new ManageOffencesService(undefined) as jest.Mocked<ManageOffencesService>
    auditService = new AuditService(undefined) as jest.Mocked<AuditService>
    documentManagementService = new DocumentManagementService(undefined) as jest.Mocked<DocumentManagementService>
    courtRegisterService = new CourtRegisterService(undefined) as jest.Mocked<CourtRegisterService>

    routes = new CourtDataIngestionRoutes(
      courtAppearanceService,
      offenceService,
      remandAndSentencingService,
      manageOffencesService,
      auditService,
      documentManagementService,
      courtRegisterService,
    )
  })

  describe('landing', () => {
    it('maps document types onto each document and renders the landing page', async () => {
      remandAndSentencingService.getHmctsCourtData.mockResolvedValue({
        warrantType: 'REMAND',
        documents: [
          { documentUUID: 'doc-uuid-1', fileName: 'warrant.pdf', documentType: 'WARRANT' },
          { documentUUID: 'doc-uuid-2', fileName: 'unknown.pdf', documentType: 'UNKNOWN_TYPE' },
        ],
      } as never)

      const req = {
        params: { hmctsHearingId: 'hearing1', nomsId: 'A1234BC' },
        user: { username },
      } as never
      const res = { render: jest.fn() } as unknown as Response

      await routes.landing(req, res, undefined as never)

      expect(remandAndSentencingService.getHmctsCourtData).toHaveBeenCalledWith('hearing1', username)
      expect(res.render).toHaveBeenCalledWith('pages/courtDataIngestion/landing', {
        appearance: expect.objectContaining({
          documents: [
            expect.objectContaining({
              documentUUID: 'doc-uuid-1',
              fileName: 'warrant.pdf',
              documentType: 'WARRANT',
              documentTypeDescription: 'Warrant',
            }),
            expect.objectContaining({
              documentUUID: 'doc-uuid-2',
              fileName: 'unknown.pdf',
              documentType: 'UNKNOWN_TYPE',
              documentTypeDescription: 'Unknown document type',
            }),
          ],
        }),
        hmctsHearingId: 'hearing1',
        nomsId: 'A1234BC',
      })
    })

    it('preserves documentUUID so the template can build the view-document link', async () => {
      remandAndSentencingService.getHmctsCourtData.mockResolvedValue({
        warrantType: 'REMAND',
        documents: [{ documentUUID: 'doc-uuid-1', fileName: 'warrant.pdf', documentType: 'WARRANT' }],
      } as never)

      const req = {
        params: { hmctsHearingId: 'hearing1', nomsId: 'A1234BC' },
        user: { username },
      } as never
      const res = { render: jest.fn() } as unknown as Response

      await routes.landing(req, res, undefined as never)

      const [, viewData] = (res.render as jest.Mock).mock.calls[0]
      expect(viewData.appearance.documents[0]).toEqual(
        expect.objectContaining({
          documentUUID: 'doc-uuid-1',
          fileName: 'warrant.pdf',
        }),
      )
    })
  })

  describe('start', () => {
    const nomsId = 'A1234BC'
    const req = {
      params: { hmctsHearingId: 'hearing1', nomsId },
      user: { username },
      session: {},
    } as unknown as Request

    const mockRedirectResponse = () => ({ redirect: jest.fn() }) as unknown as Response

    beforeEach(() => {
      jest
        .spyOn(globalThis.crypto, 'randomUUID')
        .mockReturnValueOnce('court-case-uuid' as never)
        .mockReturnValueOnce('appearance-uuid' as never)
      remandAndSentencingService.getHmctsCourtData.mockResolvedValue({
        appearanceUuid: 'original-uuid',
        outcome: undefined,
      } as never)
      ;(pageCourtCaseAppearanceToCourtAppearance as jest.Mock).mockReturnValue({
        nextAppearanceSelect: 'yes',
        nextAppearanceTimeSet: 'yes',
        nextCourtAppearanceAccepted: 'yes',
        someField: 'value',
      })
    })

    it('clears session state for the appearance and offences', async () => {
      const res = mockRedirectResponse()

      await routes.start(req, res, undefined as never)

      expect(courtAppearanceService.clearSessionCourtAppearance).toHaveBeenCalledWith(req.session, nomsId)
      expect(offenceService.clearAllOffences).toHaveBeenCalledWith(req.session, nomsId, 'court-case-uuid')
    })

    it('strips next-appearance fields before saving the session appearance', async () => {
      const res = mockRedirectResponse()

      await routes.start(req, res, undefined as never)

      expect(courtAppearanceService.setSessionCourtAppearance).toHaveBeenCalledWith(req.session, nomsId, {
        someField: 'value',
      })
    })

    it('redirects to the task list when the appearance already has an outcome', async () => {
      remandAndSentencingService.getHmctsCourtData.mockResolvedValue({
        appearanceUuid: 'original-uuid',
        outcome: 'REMANDED',
      } as never)
      ;(JourneyUrls.taskList as jest.Mock).mockReturnValue('/task-list-url')

      const res = mockRedirectResponse()

      await routes.start(req, res, undefined as never)

      expect(JourneyUrls.taskList).toHaveBeenCalledWith(
        nomsId,
        'add-court-case',
        'court-case-uuid',
        'add-court-appearance',
        'appearance-uuid',
      )
      expect(res.redirect).toHaveBeenCalledWith('/task-list-url')
    })

    it('redirects to the overall case outcome page when there is no outcome yet', async () => {
      ;(JourneyUrls.overallCaseOutcome as jest.Mock).mockReturnValue('/overall-outcome-url')

      const res = mockRedirectResponse()

      await routes.start(req, res, undefined as never)

      expect(JourneyUrls.overallCaseOutcome).toHaveBeenCalledWith(
        nomsId,
        'add-court-case',
        'court-case-uuid',
        'add-court-appearance',
        'appearance-uuid',
      )
      expect(res.redirect).toHaveBeenCalledWith('/overall-outcome-url')
    })
  })
})
