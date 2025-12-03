import { configureAllowedScripts } from '@ministryofjustice/hmpps-npm-script-allowlist'

export default configureAllowedScripts({
  allowlist: {
    // Retained the configuration for packages that did not change versions:
    "node_modules/@parcel/watcher@2.5.1": "ALLOW",
    "node_modules/dtrace-provider@0.8.8": "ALLOW",
    "node_modules/fsevents@2.3.3": "FORBID",
    "node_modules/unrs-resolver@1.11.1": "ALLOW",

    // UPDATED: cypress@15.7.1 (Replaced 15.7.0)
    "node_modules/cypress@15.7.1": "ALLOW",

    // UPDATED: esbuild@0.25.12 (Replaced 0.25.8). This script is required to install the binary.
    "node_modules/esbuild@0.25.12": "ALLOW"
  },
})
