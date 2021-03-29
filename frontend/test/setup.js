import { JSDOM } from 'jsdom'
import chai from 'chai'
import Enzyme from 'enzyme'
import chaiEnzyme from 'chai-enzyme'
import Adapter from 'enzyme-adapter-react-16'
import sinon from 'sinon'

process.env.NODE_ENV = 'test'

export const globalPrimaryColor = {
  hex: '#123456',
  rgb: 'rgb(18, 52, 86)'
}

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

  const nodeCrypto = require('crypto')
  global.crypto = {
    getRandomValues: (buffer) => { return nodeCrypto.randomFillSync(buffer) }
  }
  global.window = window
  global.document = window.document
  global.navigator = window.navigator
  global.GLOBAL_primaryColor = globalPrimaryColor.hex
  global.lastCustomEventTypes = new Set()
  global.GLOBAL_dispatchEvent = global.document.dispatchEvent = (e) => { global.lastCustomEventTypes.add(e.type) }
  global.CustomEvent = () => {}
  global.fetch = require('node-fetch')
  global.GLOBAL_excludedNotifications = []
  global.DOMParser = window.DOMParser
}

Enzyme.configure({ adapter: new Adapter() })
chai.use(chaiEnzyme())
sinon.stub(console, 'log')
