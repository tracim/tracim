#!/usr/bin/env node

const fs = require("fs")
const path = require("path")

const distDir = path.join(__dirname , '..', 'dist')

fs.mkdir(distDir, { recursive: true }, function (err) {
  if (err) {
    throw err;
  }

  const dependencies = require('../package.json').dependencies

  dependencies['core-js/stable'] = dependencies['core-js']
  delete dependencies['core-js']
  dependencies['regenerator-runtime/runtime'] = dependencies['regenerator-runtime']
  delete dependencies['regenerator-runtime']

  fs.writeFile(
    path.join(distDir, 'externals.json'),
    JSON.stringify(Object.assign({}, ...Object.keys(dependencies).map(
      dep => ({[dep]: "tracim_frontend_vendors['" + dep + "']"})
    ))),
    function (err) {
      if (err) {
        throw err;
      }

      let indexFile = 'module.exports = {'
      let first = true
      for (const dep of Object.keys(dependencies)) {
        if (first) {
          first = false
        } else {
          indexFile += ','
        }

        const depKey = dep.indexOf('-') === -1 ? dep : "'" + dep + "'"
        indexFile += '\n  ' +  depKey + ": require('" + dep + "')"
      }

      indexFile += '\n}\n'

      fs.writeFile(path.join(distDir, 'index.js'), indexFile, (err) => {
        if (err) {
          throw err;
        }
      })
    }
  )
})
