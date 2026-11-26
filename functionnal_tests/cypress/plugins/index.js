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

const fs = require('fs')
const path = require('path')

const FAILED_TESTS_SUMMARY_PATH = path.join(__dirname, '..', 'failed-tests-summary.txt')

// No dependency on a table-formatting package just for this -- a couple of
// padded columns is all that's needed.
const formatFailedTestsTable = (failedTests) => {
  const columns = ['Spec', 'Test']
  const widths = columns.map((col) => Math.max(col.length, ...failedTests.map((row) => row[col].length)))
  const formatRow = (cells) => '| ' + cells.map((cell, i) => cell.padEnd(widths[i])).join(' | ') + ' |'
  const separator = '+-' + widths.map((w) => '-'.repeat(w)).join('-+-') + '-+'
  return [
    separator,
    formatRow(columns),
    separator,
    ...failedTests.map((row) => formatRow(columns.map((col) => row[col]))),
    separator
  ].join('\n')
}

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

  // INFO - PGO - 2026-08-21
  // Add a summary of failed tests at the end of the log. Cypress's own
  // per-spec results table (Spec/Tests/Passing/Failing/Pending/Skipped) has
  // no documented way to sort, filter, or append to it, and `after:run`
  // fires before that table is printed -- so instead of logging here (which
  // would land *above* that table), write the summary to a file. The
  // "cypress-run" yarn script cats it once `cypress run` has exited, which
  // puts it after that table, at the very end of the build log.
  on('after:run', (results) => {
    if (!results || !results.totalFailed) {
      fs.rmSync(FAILED_TESTS_SUMMARY_PATH, { force: true })
      return
    }

    const failedTests = []
    for (const run of results.runs) {
      for (const test of run.tests) {
        if (test.state === 'failed') {
          failedTests.push({ Spec: run.spec.relative, Test: test.title.join(' > ') })
        }
      }
    }

    const summary = `\n===== FAILED TESTS (${results.totalFailed}) =====\n` +
      formatFailedTestsTable(failedTests) + '\n'
    fs.writeFileSync(FAILED_TESTS_SUMMARY_PATH, summary)
  })
}
