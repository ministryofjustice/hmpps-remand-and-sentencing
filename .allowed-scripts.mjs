import { configureAllowedScripts } from '@ministryofjustice/hmpps-npm-script-allowlist'

export default configureAllowedScripts({
  allowlist: {
    // A native Node.js module used for subscribing to and querying filesystem events, often used by build tools.
    'node_modules/@parcel/watcher@2.5.1': 'ALLOW',
    // Used for dynamic tracing and performance analysis on DTrace-supported operating systems.
    'node_modules/dtrace-provider@0.8.8': 'ALLOW',
    // A macOS-specific module providing notifications about changes to the file system (File System Events).
    'node_modules/fsevents@2.3.3': 'ALLOW',
    // A Rust-based module resolver that implements the ESM and CommonJS module resolution algorithm.
    'node_modules/unrs-resolver@1.11.1': 'ALLOW',
    // A modern, all-in-one end-to-end (E2E) testing framework for web applications.
    'node_modules/cypress@15.7.1': 'ALLOW',
    // An extremely fast module bundler, minifier, and compiler for JavaScript and CSS.
    'node_modules/esbuild@0.25.12': 'ALLOW',
  },
})
