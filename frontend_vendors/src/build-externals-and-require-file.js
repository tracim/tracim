#!/usr/bin/env node

const fs = require("fs")
const path = require("path")

const distDir = path.join(__dirname , '..', 'dist')

fs.mkdir(distDir, { recursive: true }, function (err) {
  if (err) {
    throw err;
  }

  const dependencies = require(path.join(__dirname, 'bundle.json'))

  const externalsJson = JSON.stringify(Object.assign({}, ...dependencies.map(
    dep => ({[dep]: "tracim_frontend_vendors['" + dep + "']"})
  )))

  fs.writeFile(
    path.join(distDir, 'externals.json'), externalsJson, function (err) {
      if (err) {
        throw err;
      }

      let indexFile = 'module.exports = {'
      let first = true
      for (const dep of dependencies) {
        if (first) {
          first = false
        } else {
          indexFile += ','
        }

        const depKey = dep.indexOf('-') === -1 ? dep : "'" + dep + "'"
        indexFile += '\n  ' +  depKey + ": require('" + dep + "')"
      }

      indexFile += '\n}\n'

      fs.writeFile(path.join(distDir, 'require-file.js'), indexFile, (err) => {
        if (err) {
          throw err;
        }
      })
    }
  )
})
