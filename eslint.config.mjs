import hmppsConfig from '@ministryofjustice/eslint-config-hmpps'

export default hmppsConfig({
  extraIgnorePaths: ['assets/js/*.js', 'esbuild/*.js'],
  extraPathsAllowingDevDependencies: ['.allowed-scripts.mjs'],
})
