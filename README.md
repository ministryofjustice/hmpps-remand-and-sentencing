# hmpps-remand-and-sentencing
[![Ministry of Justice Repository Compliance Badge](https://github-community.service.justice.gov.uk/repository-standards/api/hmpps-remand-and-sentencing/badge?style=flat)](https://github-community.service.justice.gov.uk/repository-standards/hmpps-remand-and-sentencing)
[![Pipeline [test -> build -> deploy]](https://github.com/ministryofjustice/hmpps-remand-and-sentencing/actions/workflows/pipeline.yml/badge.svg?branch=main)](https://github.com/ministryofjustice/hmpps-remand-and-sentencing/actions/workflows/pipeline.yml)
[![Docker Repository on ghcr](https://img.shields.io/badge/ghcr.io-repository-2496ED.svg?logo=docker)](https://ghcr.io/ministryofjustice/hmpps-remand-and-sentencing)

UI for Remand and Sentencing

# Instructions

If this is a HMPPS project then the project will be created as part of bootstrapping -
see https://github.com/ministryofjustice/hmpps-project-bootstrap. You are able to specify a template application using
the `github_template_repo` attribute to clone without the need to manually do this yourself within GitHub.

This project is community managed by the mojdt `#typescript` slack channel.
Please raise any questions or queries there. Contributions welcome!

Our security policy is located [here](https://github.com/ministryofjustice/hmpps-remand-and-sentencing/security/policy).
If this is a HMPPS project then the project will be created as part of bootstrapping -
see https://github.com/ministryofjustice/hmpps-project-bootstrap. You are able to specify a template application using the `github_template_repo` attribute to clone without the need to manually do this yourself within GitHub.
This bootstrap is community managed by the mojdt `#typescript` slack channel.
Our security policy is located [here](https://github.com/ministryofjustice/hmpps-remand-and-sentencing/security/policy).

More information about the template project including features can be
found [here](https://dsdmoj.atlassian.net/wiki/spaces/NDSS/pages/3488677932/Typescript+template+project).

## Creating a Cloud Platform namespace

When deploying to a new namespace, you may wish to use the
[templates project namespace](https://github.com/ministryofjustice/cloud-platform-environments/tree/main/namespaces/live.cloud-platform.service.justice.gov.uk/hmpps-templates-dev)
as the basis for your new namespace. This namespace contains both the kotlin and typescript template projects, which
is the usual way that projects are setup. This namespace includes an AWS elasticache setup - which is required by this
template project.

Copy this folder and update all the existing namespace references. If you only need the typescript configuration then
remove all kotlin references. Submit a PR to the Cloud Platform team in #ask-cloud-platform. Further instructions from
the Cloud Platform team can be found in
the [Cloud Platform User Guide](https://user-guide.cloud-platform.service.justice.gov.uk/#cloud-platform-user-guide)

## Customising the new project

As part of the automation to create the new service, various parts of the codebase will be updated to reflect it's specific name.

## Filling in the `productId`

These credentials are configured using the following env variables:

## DPS common front-end components

In order to ensure consistency across services, DPS services import shared front-end components using the [frontend-components service](https://github.com/ministryofjustice/hmpps-micro-frontend-components).

The header and footer components have been incorporated into this application but can be switched off by setting the `COMMON_COMPONENTS_ENABLED` environment variable to `'false'`

Fallback html must be included for all imported components for instances when the api call fails. These should be kept within the calling project, but should remain consistent with the designs detailed [here](https://github.com/ministryofjustice/hmpps-micro-frontend-components/blob/main/readme/incorporating.md#fallbacks-services-with-prison-and-external-users).

### Running the App Locally Against Dev Services (for Development)

1. **Copy `.env.example` to a `.env` file** in the root directory (most of these values come from `values-dev.yaml`).
   The `client_ids` and `secrets` are from the dev namespace.

2. **Start the app** by running:
   ```sh
   npm run start:dev
   ```

3. **Access the application** in your browser:
   ```
   http://localhost:3000/person/XXX
   ```
   _(Replace `XXX` with a valid prisoner ID from the dev environment.)_

### Run linter

- `npm run lint` runs `eslint`.
- `npm run typecheck` runs the TypeScript compiler `tsc`.

### Run unit tests

`npm run test`

### Running integration tests

For local running, start a wiremock instance by:

`docker compose -f docker-compose-test.yml up -d`

Then run the server in test mode by:

`npm run start-feature` (or `npm run start-feature:dev` to run with auto-restart on changes)

And then either, run tests in headless mode with:

`npm run int-test`

Or run tests with the cypress UI:

`npm run int-test-ui`

## Change log

A changelog for the service is available [here](./CHANGELOG.md)
