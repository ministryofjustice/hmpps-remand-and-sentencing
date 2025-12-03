import { configureAllowedScripts } from '@ministryofjustice/hmpps-npm-script-allowlist'

export default configureAllowedScripts({
  allowlist: {
    // NOTE: You must confirm the choice (ALLOW/FORBID) for each package below.

    // Runs an install script to build from source. Usually required.
    "node_modules/@parcel/watcher@2.5.1": "ALLOW",

    // Cypress postinstall script downloads necessary binaries. Usually required for testing.
    "node_modules/cypress@15.7.0": "ALLOW",

    // Runs a node-gyp rebuild. Required if you need the native bindings.
    "node_modules/dtrace-provider@0.8.8": "ALLOW",

    // Runs an install script. Essential for esbuild to work correctly, as it ships its binary this way.
    "node_modules/esbuild@0.25.8": "ALLOW",

    // Runs a node-gyp rebuild. Often forbidden unless you are developing on or targeting macOS.
    "node_modules/fsevents@2.3.3": "FORBID",

    // Runs a postinstall check. Typically required for the package to function properly.
    "node_modules/unrs-resolver@1.11.1": "ALLOW"
  },
})
