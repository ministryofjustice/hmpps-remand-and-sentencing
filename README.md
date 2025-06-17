# hmpps-remand-and-sentencing
[![repo standards badge](https://img.shields.io/badge/endpoint.svg?&style=flat&logo=github&url=https%3A%2F%2Foperations-engineering-reports.cloud-platform.service.justice.gov.uk%2Fapi%2Fv1%2Fcompliant_public_repositories%2Fhmpps-remand-and-sentencing)](https://operations-engineering-reports.cloud-platform.service.justice.gov.uk/public-github-repositories.html#hmpps-remand-and-sentencing "Link to report")
[![Pipeline [test -> build -> deploy]](https://github.com/ministryofjustice/hmpps-remand-and-sentencing/actions/workflows/pipeline.yml/badge.svg?branch=main)](https://github.com/ministryofjustice/hmpps-remand-and-sentencing/actions/workflows/pipeline.yml)
[![Docker Repository on ghcr](https://img.shields.io/badge/ghcr.io-repository-2496ED.svg?logo=docker)](https://ghcr.io/ministryofjustice/hmpps-remand-and-sentencing)

UI for Remand and Sentencing

# Instructions

## Filling in the `productId`

To allow easy identification of an application, the product Id of the overall product should be set in `values.yaml`. The Service Catalogue contains a list of these IDs and is currently in development here https://developer-portal.hmpps.service.justice.gov.uk/products

## DPS common front-end components

In order to ensure consistency across services, DPS services import shared front-end components using the [frontend-components service](https://github.com/ministryofjustice/hmpps-micro-frontend-components). 

The header and footer components have been incorporated into this application but can be switched off by setting the `COMMON_COMPONENTS_ENABLED` environment variable to `'false'`

Fallback html must be included for all imported components for instances when the api call fails. These should be kept within the calling project, but should remain consistent with the designs detailed [here](https://github.com/ministryofjustice/hmpps-micro-frontend-components/blob/main/readme/incorporating.md#fallbacks-services-with-prison-and-external-users).

### Running the App Locally Against Dev Services (for Development)

1. **Create a `.env` file** in the root directory (most of these values come from `values-dev.yaml`).  
   The `client_ids` and `secrets` are from the dev namespace.

   ```ini
   API_CLIENT_ID="XXX_CLIENT_ID_FROM_DEV_K8S_SECRETS_XXX"
   API_CLIENT_SECRET="XXX_CLIENT_SECRET_FROM_DEV_K8S_SECRETS_XXX"
   SYSTEM_CLIENT_ID="XXX_SYSTEM_CLIENT_ID_FROM_DEV_K8S_SECRETS_XXX"
   SYSTEM_CLIENT_SECRET="XXX_SYSTEM_CLIENT_SECRET_FROM_DEV_K8S_SECRETS_XXX"
   HMPPS_AUTH_URL="https://sign-in-dev.hmpps.service.justice.gov.uk/auth"
   TOKEN_VERIFICATION_API_URL="https://token-verification-api-dev.prison.service.justice.gov.uk"
   MANAGE_OFFENCES_API_URL="https://manage-offences-api-dev.hmpps.service.justice.gov.uk"
   PRISON_API_URL="https://prison-api-dev.prison.service.justice.gov.uk"
   PRISONER_SEARCH_API_URL="https://prisoner-search-dev.prison.service.justice.gov.uk"
   COURT_CASES_RELEASE_DATES_API_URL="https://court-cases-release-dates-api-dev.hmpps.service.justice.gov.uk"
   DIGITAL_PRISON_SERVICES_URL="https://digital-dev.prison.service.justice.gov.uk"
   COURT_REGISTER_API_URL="https://court-register-api-dev.hmpps.service.justice.gov.uk"
   ENVIRONMENT_NAME="DEV"
   COMPONENT_API_URL="https://frontend-components-dev.hmpps.service.justice.gov.uk"
   COMMON_COMPONENTS_ENABLED="true"
   REMAND_AND_SENTENCING_API_URL="https://remand-and-sentencing-api-dev.hmpps.service.justice.gov.uk"
   DOCUMENT_MANAGEMENT_API_URL="https://document-api-dev.hmpps.service.justice.gov.uk"
   ADJUSTMENTS_UI_URL="https://adjust-release-dates-dev.hmpps.service.justice.gov.uk"
   CALCULATE_RELEASE_DATES_API_URL="https://calculate-release-dates-api-dev.hmpps.service.justice.gov.uk"
   AUDIT_ENABLED="false"
   ```

2. **Ensure the `NODE_OPTIONS` environment variable is set** to allow the `.env` file to be read:
   ```sh
   export NODE_OPTIONS="-r dotenv/config"
   ```

3. **Start the app** by running:
   ```sh
   npm run start
   ```

4. **Access the application** in your browser:
   ```
   http://localhost:3000/person/XXX
   ```
   _(Replace `XXX` with a valid prisoner ID from the dev environment.)_

### Run linter

`npm run lint`

### Run tests

`npm run test`

### Running integration tests

For local running, start a test db and wiremock instance by:

`docker compose -f docker-compose-test.yml up -d`

Then run the server in test mode by:

`npm run start-feature` (or `npm run start-feature:dev` to run with nodemon)

And then either, run tests in headless mode with:

`npm run int-test`
 
Or run tests with the cypress UI:

`npm run int-test-ui`


## Dependency Checks

The template project has implemented some scheduled checks to ensure that key dependencies are kept up to date.
If these are not desired in the cloned project, remove references to `check_outdated` job from `.circleci/config.yml`
