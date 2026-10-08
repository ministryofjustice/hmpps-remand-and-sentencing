import RemandAndSentencingService from './remandAndSentencingService'
import PrisonerService from './prisonerService'
import DocumentGeneratorService from './documentGeneratorService'

jest.mock('./remandAndSentencingService')
jest.mock('./prisonerService')

describe('DocumentGeneratorService', () => {
  let remandAndSentencingService: jest.Mocked<RemandAndSentencingService>
  let prisonerService: jest.Mocked<PrisonerService>
  let documentGeneratorService: DocumentGeneratorService

  const req = {
    params: { appearanceUuid: '60B6BB03-549A-4A2C-8874-85ACCFA62880' },
    user: { username: 'jbloggs' },
  } as never

  const res = {
    locals: {
      user: { username: 'res-user', activeCaseLoadId: 'MDI' },
    },
  } as never

  beforeEach(() => {
    remandAndSentencingService = new RemandAndSentencingService(null) as jest.Mocked<RemandAndSentencingService>
    prisonerService = new PrisonerService(null) as jest.Mocked<PrisonerService>
    documentGeneratorService = new DocumentGeneratorService(remandAndSentencingService, prisonerService)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('streamDocumentGeneratedDocument', () => {
    it('throws for an unsupported document type without calling any collaborators', async () => {
      await expect(
        documentGeneratorService.streamDocumentGeneratedDocument(req, res, 'not-a-real-type'),
      ).rejects.toThrow('Unsupported document type')

      expect(remandAndSentencingService.getCourtAppearanceByAppearanceUuid).not.toHaveBeenCalled()
      expect(prisonerService.getAgencyDetails).not.toHaveBeenCalled()
    })

    describe('f986', () => {
      const courtAppearance = { courtCode: 'ACCRYC' } as never

      const courtDetailsWithAddress = {
        addresses: [
          {
            addressType: 'Business Address',
            premise: 'Court Premise',
            street: 'Court Street',
            town: 'Court Town',
            county: 'Court County',
            postalCode: 'CO1 1RT',
          },
        ],
      } as never

      const prisonDetailsWithPhone = {
        addresses: [
          {
            addressType: 'Business Address',
            phones: [{ type: 'BUS', number: '01234567890' }],
          },
        ],
      } as never

      beforeEach(() => {
        remandAndSentencingService.getCourtAppearanceByAppearanceUuid.mockResolvedValue(courtAppearance)
      })

      it('should look up the court appearance using the appearanceUuid param and req user', async () => {
        prisonerService.getAgencyDetails.mockResolvedValue({} as never)
        remandAndSentencingService.generateF986Document.mockResolvedValue({ body: Buffer.from('') } as never)

        await documentGeneratorService.streamDocumentGeneratedDocument(req, res, 'f986')

        expect(remandAndSentencingService.getCourtAppearanceByAppearanceUuid).toHaveBeenCalledWith(
          '60B6BB03-549A-4A2C-8874-85ACCFA62880',
          'jbloggs',
        )
      })

      it('should fetch prison and court agency details in parallel using the active caseload and court code', async () => {
        prisonerService.getAgencyDetails.mockResolvedValue({} as never)
        remandAndSentencingService.generateF986Document.mockResolvedValue({ body: Buffer.from('') } as never)

        await documentGeneratorService.streamDocumentGeneratedDocument(req, res, 'f986')

        expect(prisonerService.getAgencyDetails).toHaveBeenCalledWith('MDI', 'jbloggs')
        expect(prisonerService.getAgencyDetails).toHaveBeenCalledWith('ACCRYC', 'jbloggs')
        expect(prisonerService.getAgencyDetails).toHaveBeenCalledTimes(2)
      })

      it('should build the request payload from the court and prison business address details', async () => {
        prisonerService.getAgencyDetails
          .mockResolvedValueOnce(prisonDetailsWithPhone) // prison on first call
          .mockResolvedValueOnce(courtDetailsWithAddress) // court on second call
        remandAndSentencingService.generateF986Document.mockResolvedValue({ body: Buffer.from('') } as never)

        await documentGeneratorService.streamDocumentGeneratedDocument(req, res, 'f986')

        expect(remandAndSentencingService.generateF986Document).toHaveBeenCalledWith(
          {
            courtAppearanceUuid: '60B6BB03-549A-4A2C-8874-85ACCFA62880',
            courtPremise: 'Court Premise',
            courtStreet: 'Court Street',
            courtTown: 'Court Town',
            courtCounty: 'Court County',
            courtPostalCode: 'CO1 1RT',
            prisonTelephoneNumber: '01234567890',
          },
          'res-user',
        )
      })

      it('should fall back to null fields when the court has no addresses', async () => {
        prisonerService.getAgencyDetails
          .mockResolvedValueOnce(prisonDetailsWithPhone)
          .mockResolvedValueOnce({ addresses: [] } as never)
        remandAndSentencingService.generateF986Document.mockResolvedValue({ body: Buffer.from('') } as never)

        await documentGeneratorService.streamDocumentGeneratedDocument(req, res, 'f986')

        expect(remandAndSentencingService.generateF986Document).toHaveBeenCalledWith(
          expect.objectContaining({
            courtPremise: null,
            courtStreet: null,
            courtTown: null,
            courtCounty: null,
            courtPostalCode: null,
          }),
          'res-user',
        )
      })

      it('should fall back to null fields when the court has no Business Address entry', async () => {
        prisonerService.getAgencyDetails
          .mockResolvedValueOnce(prisonDetailsWithPhone)
          .mockResolvedValueOnce({ addresses: [{ addressType: 'Home Address', premise: 'Nope' }] } as never)
        remandAndSentencingService.generateF986Document.mockResolvedValue({ body: Buffer.from('') } as never)

        await documentGeneratorService.streamDocumentGeneratedDocument(req, res, 'f986')

        expect(remandAndSentencingService.generateF986Document).toHaveBeenCalledWith(
          expect.objectContaining({ courtPremise: null }),
          'res-user',
        )
      })

      it('should fall back to a null prison telephone number when the prison has no addresses', async () => {
        prisonerService.getAgencyDetails
          .mockResolvedValueOnce({ addresses: [] } as never)
          .mockResolvedValueOnce(courtDetailsWithAddress)
        remandAndSentencingService.generateF986Document.mockResolvedValue({ body: Buffer.from('') } as never)

        await documentGeneratorService.streamDocumentGeneratedDocument(req, res, 'f986')

        expect(remandAndSentencingService.generateF986Document).toHaveBeenCalledWith(
          expect.objectContaining({ prisonTelephoneNumber: null }),
          'res-user',
        )
      })

      it('should fall back to a null prison telephone number when the Business Address has no BUS phone', async () => {
        prisonerService.getAgencyDetails
          .mockResolvedValueOnce({
            addresses: [{ addressType: 'Business Address', phones: [{ type: 'FAX', number: '000' }] }],
          } as never)
          .mockResolvedValueOnce(courtDetailsWithAddress)
        remandAndSentencingService.generateF986Document.mockResolvedValue({ body: Buffer.from('') } as never)

        await documentGeneratorService.streamDocumentGeneratedDocument(req, res, 'f986')

        expect(remandAndSentencingService.generateF986Document).toHaveBeenCalledWith(
          expect.objectContaining({ prisonTelephoneNumber: null }),
          'res-user',
        )
      })

      it('should pick the first Business Address and first BUS phone when multiple phone numbers present', async () => {
        prisonerService.getAgencyDetails
          .mockResolvedValueOnce({
            addresses: [
              {
                addressType: 'Business Address',
                phones: [
                  { type: 'BUS', number: 'first-number' },
                  { type: 'FAX', number: 'second-number' },
                ],
              },
            ],
          } as never)
          .mockResolvedValueOnce({
            addresses: [
              { addressType: 'Business Address', premise: 'First Premise' },
              { addressType: 'Another Address', premise: 'Second Premise' },
            ],
          } as never)
        remandAndSentencingService.generateF986Document.mockResolvedValue({ body: Buffer.from('') } as never)

        await documentGeneratorService.streamDocumentGeneratedDocument(req, res, 'f986')

        expect(remandAndSentencingService.generateF986Document).toHaveBeenCalledWith(
          expect.objectContaining({ courtPremise: 'First Premise', prisonTelephoneNumber: 'first-number' }),
          'res-user',
        )
      })

      it('should return the FileDownload result from generateF986Document unchanged', async () => {
        const fileDownload = { body: Buffer.from('pdf-bytes'), header: { 'content-type': 'application/pdf' } }
        prisonerService.getAgencyDetails.mockResolvedValue({} as never)
        remandAndSentencingService.generateF986Document.mockResolvedValue(fileDownload as never)

        const result = await documentGeneratorService.streamDocumentGeneratedDocument(req, res, 'f986')

        expect(result).toBe(fileDownload)
      })

      it('should propagate a rejection from getCourtAppearanceByAppearanceUuid without calling getAgencyDetails', async () => {
        remandAndSentencingService.getCourtAppearanceByAppearanceUuid.mockRejectedValue(new Error('not found'))

        await expect(documentGeneratorService.streamDocumentGeneratedDocument(req, res, 'f986')).rejects.toThrow(
          'not found',
        )

        expect(prisonerService.getAgencyDetails).not.toHaveBeenCalled()
        expect(remandAndSentencingService.generateF986Document).not.toHaveBeenCalled()
      })

      it('should propagate a rejection from getAgencyDetails without calling generateF986Document', async () => {
        prisonerService.getAgencyDetails.mockRejectedValue(new Error('agency lookup failed'))

        await expect(documentGeneratorService.streamDocumentGeneratedDocument(req, res, 'f986')).rejects.toThrow(
          'agency lookup failed',
        )

        expect(remandAndSentencingService.generateF986Document).not.toHaveBeenCalled()
      })

      it('should propagate a rejection from generateF986Document', async () => {
        prisonerService.getAgencyDetails.mockResolvedValue({} as never)
        remandAndSentencingService.generateF986Document.mockRejectedValue(new Error('generation failed'))

        await expect(documentGeneratorService.streamDocumentGeneratedDocument(req, res, 'f986')).rejects.toThrow(
          'generation failed',
        )
      })
    })
  })
})
