import { defineConfig } from 'cypress'
import { resetStubs } from './integration_tests/mockApis/wiremock'
import auth from './integration_tests/mockApis/auth'
import tokenVerification from './integration_tests/mockApis/tokenVerification'
import manageOffencesApi from './integration_tests/mockApis/manageOffencesApi'
import components from './integration_tests/mockApis/components'
import remandAndSentencingApi from './integration_tests/mockApis/remandAndSentencingApi'
import documentManagementApi from './integration_tests/mockApis/documentManagementApi'
import prisonerSearchApi from './integration_tests/mockApis/prisonerSearchApi'
import prisonApi from './integration_tests/mockApis/prisonApi'
import courtRegisterApi from './integration_tests/mockApis/courtRegisterApi'
import calculateReleaseDatesApi from './integration_tests/mockApis/calculateReleaseDatesApi'
import courtCasesReleaseDatesApi from './integration_tests/mockApis/courtCasesReleaseDatesApi'

export default defineConfig({
  chromeWebSecurity: false,
  fixturesFolder: 'integration_tests/fixtures',
  screenshotsFolder: 'integration_tests/screenshots',
  videosFolder: 'integration_tests/videos',
  reporter: 'cypress-multi-reporters',
  reporterOptions: {
    configFile: 'reporter-config.json',
  },
  taskTimeout: 60000,
  e2e: {
    setupNodeEvents(on) {
      on('task', {
        reset: resetStubs,
        happyPathStubs: async () => {
          await resetStubs()
          return Promise.all([
            auth.stubSignIn(),
            prisonerSearchApi.stubGetPrisonerDetails(),
            components.stubComponents(),
            prisonApi.stubGetPrisonerImage(),
            prisonApi.stubGetUserCaseload(),
            courtRegisterApi.stubSearchCourt(),
            remandAndSentencingApi.stubSearchSentenceTypes(),
            remandAndSentencingApi.stubGetAllAppearanceTypes(),
            remandAndSentencingApi.stubGetAppearanceOutcomeImprisonmentById({
              outcomeUuid: '62412083-9892-48c9-bf01-7864af4a8b3c',
              outcomeName: 'Imprisonment',
              outcomeType: 'SENTENCING',
            }),
            courtCasesReleaseDatesApi.stubGetServiceDefinitions(),
          ])
        },
        ...auth,
        ...tokenVerification,
        ...manageOffencesApi,
        ...components,
        ...remandAndSentencingApi,
        ...documentManagementApi,
        ...prisonerSearchApi,
        ...prisonApi,
        ...courtRegisterApi,
        ...calculateReleaseDatesApi,
        ...courtCasesReleaseDatesApi,
      })
    },
    baseUrl: 'http://localhost:3007',
    excludeSpecPattern: '**/!(*.cy).ts',
    specPattern: 'integration_tests/e2e/**/*.cy.{js,jsx,ts,tsx}',
    supportFile: 'integration_tests/support/index.ts',
  },
})
