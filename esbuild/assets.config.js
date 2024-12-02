const { copy } = require('esbuild-plugin-copy')
const { sassPlugin } = require('esbuild-sass-plugin')
const { clean } = require('esbuild-plugin-clean')
const esbuild = require('esbuild')
const path = require('path')
const { glob } = require('glob')

const buildAdditionalAssets = buildConfig =>
  esbuild.build({
    outdir: buildConfig.assets.outDir,
    plugins: [
      copy({
        resolveFrom: 'cwd',
        assets: buildConfig.assets.copy,
      }),
    ],
  })

const buildAssets = buildConfig => {
  return esbuild.build({
    entryPoints: buildConfig.assets.entryPoints,
    outdir: buildConfig.assets.outDir,
    entryNames: '[ext]/app',
    minify: buildConfig.isProduction,
    sourcemap: !buildConfig.isProduction,
    platform: 'browser',
    target: 'es2018',
    external: ['/assets/*'],
    bundle: true,
    plugins: [
      clean({
        patterns: glob.sync(buildConfig.assets.clear),
      }),
      sassPlugin({
        quietDeps: true,
        loadPaths: [
          process.cwd(),
          path.join(process.cwd(), 'node_modules/govuk-frontend/dist'),
          path.join(process.cwd(), 'node_modules/@ministryofjustice/frontend'),
          path.join(process.cwd(), 'node_modules/accessible-autocomplete'),
          path.join(process.cwd(), 'node_modules/hmpps-court-cases-release-dates-design'),
        ],
      }),
    ],
  })
}

module.exports = buildConfig => {
  // eslint-disable-next-line no-console
  console.log('\u{1b}[1m\u{2728}  Building assets....\u{1b}[0m')

  Promise.all([buildAssets(buildConfig), buildAdditionalAssets(buildConfig)]).catch(e => {
    // eslint-disable-next-line no-console
    console.log(e)

    process.exit(1)
  })
}
