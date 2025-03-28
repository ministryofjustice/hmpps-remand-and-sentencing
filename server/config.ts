const production = process.env.NODE_ENV === 'production'

function get<T>(name: string, fallback: T, options = { requireInProduction: false }): T | string {
  if (process.env[name]) {
    return process.env[name]
  }
  if (fallback !== undefined && (!production || !options.requireInProduction)) {
    return fallback
  }
  throw new Error(`Missing env var ${name}`)
}

const requiredInProduction = { requireInProduction: true }

export class AgentConfig {
  // Sets the working socket to timeout after timeout milliseconds of inactivity on the working socket.
  timeout: number

  constructor(timeout = 8000) {
    this.timeout = timeout
  }
}

export interface ApiConfig {
  url: string
  timeout: {
    // sets maximum time to wait for the first byte to arrive from the server, but it does not limit how long the
    // entire download can take.
    response: number
    // sets a deadline for the entire request (including all uploads, redirects, server processing time) to complete.
    // If the response isn't fully downloaded within that time, the request will be aborted.
    deadline: number
  }
  agent: AgentConfig
}

const auditConfig = () => {
  const auditEnabled = get('AUDIT_ENABLED', 'false') === 'true'
  return {
    enabled: auditEnabled,
    queueUrl: get(
      'AUDIT_SQS_QUEUE_URL',
      'http://localhost:4566/000000000000/mainQueue',
      auditEnabled && requiredInProduction,
    ),
    serviceName: get('AUDIT_SERVICE_NAME', 'UNASSIGNED', auditEnabled && requiredInProduction),
    region: get('AUDIT_SQS_REGION', 'eu-west-2'),
  }
}

export default {
  buildNumber: get('BUILD_NUMBER', '1_0_0', requiredInProduction),
  productId: get('PRODUCT_ID', 'UNASSIGNED', requiredInProduction),
  gitRef: get('GIT_REF', 'xxxxxxxxxxxxxxxxxxx', requiredInProduction),
  branchName: get('GIT_BRANCH', 'xxxxxxxxxxxxxxxxxxx', requiredInProduction),
  production,
  https: production,
  staticResourceCacheDuration: '1h',
  dateFormat: 'DD/MM/YYYY',
  dateTimeFormat: 'DD/MM/YYYY HH:mm',
  redis: {
    enabled: get('REDIS_ENABLED', 'false', requiredInProduction) === 'true',
    host: get('REDIS_HOST', '127.0.0.1', requiredInProduction),
    port: parseInt(process.env.REDIS_PORT, 10) || 6379,
    password: process.env.REDIS_AUTH_TOKEN,
    tls_enabled: get('REDIS_TLS_ENABLED', 'false'),
  },
  session: {
    secret: get('SESSION_SECRET', 'app-insecure-default-session', requiredInProduction),
    expiryMinutes: Number(get('WEB_SESSION_TIMEOUT_IN_MINUTES', 120)),
  },
  apis: {
    hmppsAuth: {
      url: get('HMPPS_AUTH_URL', 'http://127.0.0.1:9090/auth', requiredInProduction),
      externalUrl: get('HMPPS_AUTH_EXTERNAL_URL', get('HMPPS_AUTH_URL', 'http://127.0.0.1:9090/auth')),
      timeout: {
        response: Number(get('HMPPS_AUTH_TIMEOUT_RESPONSE', 10000)),
        deadline: Number(get('HMPPS_AUTH_TIMEOUT_DEADLINE', 10000)),
      },
      agent: new AgentConfig(Number(get('HMPPS_AUTH_TIMEOUT_RESPONSE', 10000))),
      apiClientId: get('API_CLIENT_ID', 'clientid', requiredInProduction),
      apiClientSecret: get('API_CLIENT_SECRET', 'clientsecret', requiredInProduction),
      systemClientId: get('SYSTEM_CLIENT_ID', 'clientid', requiredInProduction),
      systemClientSecret: get('SYSTEM_CLIENT_SECRET', 'clientsecret', requiredInProduction),
    },
    tokenVerification: {
      url: get('TOKEN_VERIFICATION_API_URL', 'http://127.0.0.1:8100', requiredInProduction),
      timeout: {
        response: Number(get('TOKEN_VERIFICATION_API_TIMEOUT_RESPONSE', 5000)),
        deadline: Number(get('TOKEN_VERIFICATION_API_TIMEOUT_DEADLINE', 5000)),
      },
      agent: new AgentConfig(Number(get('TOKEN_VERIFICATION_API_TIMEOUT_RESPONSE', 5000))),
      enabled: get('TOKEN_VERIFICATION_ENABLED', 'false') === 'true',
    },
    prisonApi: {
      url: get('PRISON_API_URL', 'http://127.0.0.1:8080', requiredInProduction),
      timeout: {
        response: get('PRISON_API_TIMEOUT_RESPONSE', 10000),
        deadline: get('PRISON_API_TIMEOUT_DEADLINE', 10000),
      },
      agent: new AgentConfig(),
    },
    courtRegisterApi: {
      url: get('COURT_REGISTER_API_URL', 'http://127.0.0.1:8080', requiredInProduction),
      timeout: {
        response: get('COURT_REGISTER_API_TIMEOUT_RESPONSE', 10000),
        deadline: get('COURT_REGISTER_API_TIMEOUT_DEADLINE', 10000),
      },
      agent: new AgentConfig(),
    },
    manageOffencesApi: {
      url: get('MANAGE_OFFENCES_API_URL', 'http://127.0.0.1:8080', requiredInProduction),
      timeout: {
        response: get('MANAGE_OFFENCES_API_TIMEOUT_RESPONSE', 10000),
        deadline: get('MANAGE_OFFENCES_API_TIMEOUT_DEADLINE', 10000),
      },
      agent: new AgentConfig(),
    },
    frontendComponents: {
      url: get('COMPONENT_API_URL', 'http://127.0.0.1:8082', requiredInProduction),
      timeout: {
        response: Number(get('COMPONENT_API_TIMEOUT_SECONDS', 10000)),
        deadline: Number(get('COMPONENT_API_TIMEOUT_SECONDS', 10000)),
      },
      agent: new AgentConfig(Number(get('COMPONENT_API_TIMEOUT_SECONDS', 10000))),
      enabled: get('COMMON_COMPONENTS_ENABLED', 'false') === 'true',
    },
    remandAndSentencingApi: {
      url: get('REMAND_AND_SENTENCING_API_URL', 'http://127.0.0.1:8080', requiredInProduction),
      timeout: {
        response: get('REMAND_AND_SENTENCING_API_TIMEOUT_RESPONSE', 10000),
        deadline: get('REMAND_AND_SENTENCING_API_TIMEOUT_DEADLINE', 10000),
      },
      agent: new AgentConfig(10000),
    },
    documentManagementApi: {
      url: get('DOCUMENT_MANAGEMENT_API_URL', 'http://127.0.0.1:8080', requiredInProduction),
      timeout: {
        response: get('DOCUMENT_MANAGEMENT_API_TIMEOUT_RESPONSE', 10000),
        deadline: get('DOCUMENT_MANAGEMENT_API_TIMEOUT_DEADLINE', 10000),
      },
      agent: new AgentConfig(10000),
    },
    prisonerSearchApi: {
      url: get('PRISONER_SEARCH_API_URL', 'http://localhost:8110', requiredInProduction),
      timeout: {
        response: Number(get('PRISONER_SEARCH_API_TIMEOUT_RESPONSE', 10000)),
        deadline: Number(get('PRISONER_SEARCH_API_TIMEOUT_DEADLINE', 10000)),
      },
      agent: new AgentConfig(Number(get('PRISONER_SEARCH_API_TIMEOUT_RESPONSE', 10000))),
    },
    calculateReleaseDatesApi: {
      url: get('CALCULATE_RELEASE_DATES_API_URL', 'http://localhost:8110', requiredInProduction),
      timeout: {
        response: Number(get('CALCULATE_RELEASE_DATES_API_TIMEOUT_RESPONSE', 10000)),
        deadline: Number(get('CALCULATE_RELEASE_DATES_API_TIMEOUT_DEADLINE', 10000)),
      },
      agent: new AgentConfig(Number(get('CALCULATE_RELEASE_DATES_API_TIMEOUT_RESPONSE', 10000))),
    },
    courtCasesReleaseDatesApi: {
      url: get('COURT_CASES_RELEASE_DATES_API_URL', 'http://localhost:8083', requiredInProduction),
      timeout: {
        response: Number(get('COURT_CASES_RELEASE_DATES_API_TIMEOUT_RESPONSE', 10000)),
        deadline: Number(get('COURT_CASES_RELEASE_DATES_API_TIMEOUT_DEADLINE', 10000)),
      },
      agent: new AgentConfig(Number(get('COURT_CASES_RELEASE_DATES_API_TIMEOUT_RESPONSE', 10000))),
    },
  },
  digitalPrisonServices: {
    ui_url: get('DIGITAL_PRISON_SERVICES_URL', 'http://127.0.0.1:3000/dps', requiredInProduction),
  },
  adjustmentService: {
    ui_url: get('ADJUSTMENTS_UI_URL', 'http://127.0.0.1:3000/adjustments', requiredInProduction),
  },
  domain: get('INGRESS_URL', 'http://localhost:3000', requiredInProduction),
  sqs: {
    audit: auditConfig(),
  },
  featureToggles: {
    saveAsDraftEnabled: get('SAVE_AS_DRAFT_ENABLED', 'false') === 'true',
  },

  environmentName: get('ENVIRONMENT_NAME', ''),
  appInsightsConnectionString: get('APPLICATIONINSIGHTS_CONNECTION_STRING', '', requiredInProduction),
}
