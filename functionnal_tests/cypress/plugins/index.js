// ***********************************************************
// This example plugins/index.js can be used to load plugins
//
// You can change the location of this file or turn off loading
// the plugins file with the 'pluginsFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/plugins-guide
// ***********************************************************

// This function is called when a project is opened or re-opened (e.g. due to
// the project's config changing)

module.exports = (on, config) => {
  // `on` is used to hook into various events Cypress emits
  // `config` is the resolved Cypress config
  on('task', {
    log (message) {
      console.log(message)
      return null
    }
  })

  // HACK - PGO - 2026-08-19
  // The whole Concourse CI task tree (this script, Node, Cypress, and any browser it spawns)
  // runs as root (see tools_docker/concourse/Dockerfile)
  // A real Chromium binary (unlike Cypress's bundled Electron) refuses to start as root
  // ("Running as root without --no-sandbox is not supported", https://crbug.com/638180),
  // so the sandbox has to be explicitly disabled for it here.
  on('before:browser:launch', (browser, launchOptions) => {
    if (browser.family === 'chromium' && browser.name !== 'electron') {
      launchOptions.args.push('--no-sandbox')
    }
    return launchOptions
  })

  // Cypress interleaves each spec's own failures with the rest of that
  // spec's output, so finding every failed test in a big `cypress run` log
  // means scrolling through all of it. `after:run` fires once, after every
  // spec has run, with the results of the whole run -- print a single flat
  // list of the failed tests there so it's easy to find at the end of the
  // build log.
  on('after:run', (results) => {
    if (!results || !results.totalFailed) return

    console.log(`\n===== FAILED TESTS (${results.totalFailed}) =====`)
    for (const run of results.runs) {
      for (const test of run.tests) {
        if (test.state === 'failed') {
          console.log(`  FAIL  ${run.spec.relative} :: ${test.title.join(' > ')}`)
        }
      }
    }
    console.log('=====================================\n')
  })
}
