import type { FileDownload } from 'models'
import logger from '../../logger'
import RemandAndSentencingService from './remandAndSentencingService'
import PrisonerService from './prisonerService'

/**
 * Mutually exclusive with DocumentManagementService.
 * This exists to support 'just in time' document generation only.
 */
export default class DocumentGeneratorService {
  constructor(
    private readonly remandAndSentencingService: RemandAndSentencingService,
    private readonly prisonerService: PrisonerService,
  ) {}

  public async streamDocumentGeneratedDocument(req, res, documentType): Promise<FileDownload> {
    let result: FileDownload = null
    switch (documentType) {
      case 'f986': {
        result = await this.generateF986(req, res)
        break
      }
      default:
        throw new Error('Unsupported document type')
    }

    return result
  }

  private async generateF986(req, res): Promise<FileDownload> {
    const { appearanceUuid, nomsId } = req.params

    const courtAppearance = await this.remandAndSentencingService.getCourtAppearanceByAppearanceUuid(
      appearanceUuid,
      req.user.username,
    )

    const [prisonDetails, courtDetails] = await Promise.all([
      this.getAgencyDetailsOrNullOnNotFound(res.locals.user.activeCaseLoadId, req.user.username),
      this.getAgencyDetailsOrNullOnNotFound(courtAppearance.courtCode, req.user.username),
    ])

    const courtAddressDetails = courtDetails?.addresses?.filter(p => p.addressType === 'Business Address')[0]
    const prisonTelephone = prisonDetails?.addresses
      ?.filter(p => p.addressType === 'Business Address')[0]
      ?.phones?.filter(p => p.type === 'BUS')[0]?.number

    return this.remandAndSentencingService.generateF986Document(
      nomsId,
      {
        courtAppearanceUuid: appearanceUuid,
        courtPremise: courtAddressDetails?.premise ?? null,
        courtStreet: courtAddressDetails?.street ?? null,
        courtTown: courtAddressDetails?.town ?? null,
        courtCounty: courtAddressDetails?.county ?? null,
        courtPostalCode: courtAddressDetails?.postalCode ?? null,
        prisonTelephoneNumber: prisonTelephone ?? null,
      },
      res.locals.user.username,
    )
  }

  private async getAgencyDetailsOrNullOnNotFound(agencyId: string, username: string) {
    try {
      return await this.prisonerService.getAgencyDetails(agencyId, username)
    } catch (error) {
      if (typeof error !== 'object' || error === null || !('responseStatus' in error) || error.responseStatus !== 404) {
        throw error
      }

      logger.warn(`Agency details not found for agency ID ${agencyId}; generating F986 without those details`)
      return null
    }
  }
}
