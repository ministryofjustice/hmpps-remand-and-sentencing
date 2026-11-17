import express from 'express'
import nunjucks from 'nunjucks'
import type { Offence } from 'models'
import nunjucksSetup from './nunjucksSetup'
import config from '../config'
import type { ApplicationInfo } from '../applicationInfo'

describe('nunjucksSetup - offenceToOffenceCard filter', () => {
  const originalChargeValue = config.featureToggles.chargeValue
  let offenceToOffenceCard: CallableFunction

  beforeEach(() => {
    const configureSpy = jest.spyOn(nunjucks, 'configure')
    const app = express()
    nunjucksSetup(app, { applicationName: 'test' } as ApplicationInfo)
    const njkEnv = configureSpy.mock.results[0].value as nunjucks.Environment
    offenceToOffenceCard = njkEnv.getFilter('offenceToOffenceCard')
  })

  afterEach(() => {
    config.featureToggles.chargeValue = originalChargeValue
    jest.restoreAllMocks()
  })

  it('displays formatted offence value for custodial offence when chargeValue feature toggle is enabled', () => {
    config.featureToggles.chargeValue = true
    const offence: Offence = {
      chargeUuid: '1',
      offenceCode: 'O1',
      offenceValue: 99.9,
      sentence: {
        sentenceUuid: 's1',
      },
    }

    const result = offenceToOffenceCard(offence, 'offences.0', { O1: 'Offence 1' }, {}, {}, {}, {}, [])
    expect(result.value).toBe('99.90')
  })

  it('displays formatted offence value for non-custodial offence when chargeValue feature toggle is enabled', () => {
    config.featureToggles.chargeValue = true
    const offence: Offence = {
      chargeUuid: '1',
      offenceCode: 'O1',
      offenceValue: 250.5,
    }

    const result = offenceToOffenceCard(offence, 'offences.0', { O1: 'Offence 1' }, {}, {}, {}, {}, [])
    expect(result.value).toBe('250.50')
  })

  it('does not display offence value when offenceValue is -1 (sentinel deletion value)', () => {
    config.featureToggles.chargeValue = true
    const offence: Offence = {
      chargeUuid: '1',
      offenceCode: 'O1',
      offenceValue: -1,
    }

    const result = offenceToOffenceCard(offence, 'offences.0', { O1: 'Offence 1' }, {}, {}, {}, {}, [])
    expect(result.value).toBeUndefined()
  })

  it('does not display offence value when chargeValue feature toggle is disabled', () => {
    config.featureToggles.chargeValue = false
    const offence: Offence = {
      chargeUuid: '1',
      offenceCode: 'O1',
      offenceValue: 100,
    }

    const result = offenceToOffenceCard(offence, 'offences.0', { O1: 'Offence 1' }, {}, {}, {}, {}, [])
    expect(result.value).toBeUndefined()
  })
})
