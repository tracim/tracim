import { JSDOM } from 'jsdom'
import chai from 'chai'
import Enzyme from 'enzyme'
import chaiEnzyme from 'chai-enzyme'
import Adapter from 'enzyme-adapter-react-16'

process.env.NODE_ENV = 'test'

// INFO - CH - 2019-06-24 - Example from https://medium.com/riipen-engineering/testing-react-with-enzyme-part-1-setup-ff49e51f8ff0
if (!global.window && !global.document) {
  const { window } = new JSDOM('<!doctype html><html><body></body></html>', {
    beforeParse (win) {
      win.scrollTo = () => {}
    },
    pretendToBeVisual: false,
    userAgent: 'mocha',
    url: 'http://localhost'
  })

  global.window = window
  global.document = window.document
  global.navigator = window.navigator
  global.GLOBAL_dispatchEvent = () => {}
  global.GLOBAL_primaryColor = '#aaaaaa'
  global.FormData = window.FormData
  const nodeCrypto = require('crypto')
  global.crypto = {
    getRandomValues: (buffer) => { return nodeCrypto.randomFillSync(buffer) }
  }
}

Enzyme.configure({ adapter: new Adapter() })
chai.use(chaiEnzyme())

// INFO - GM - 2019- 12-09 - Fix for react-slick test from https://github.com/akiran/react-slick/issues/742#issuecomment-298992238
window.matchMedia = window.matchMedia || function () {
  return {
    matches: false,
    addListener: function () {},
    removeListener: function () {}
  }
}
// INFO - GM - 2020/04/15 - Mock some window functions used by MainPreview
window.requestAnimationFrame = window.requestAnimationFrame || function (cb) { setTimeout(cb, 10) }
window.getComputedStyle = window.getComputedStyle || function () { return {} }
console.log = () => {}
