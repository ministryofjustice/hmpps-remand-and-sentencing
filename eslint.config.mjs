import hmppsConfig from '@ministryofjustice/eslint-config-hmpps'

export default hmppsConfig({
  extraPathsAllowingDevDependencies: ['.allowed-scripts.mjs'],
  extraIgnorePaths: ['assets/js/*.js', 'esbuild/*.js'],
})
