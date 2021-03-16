import { JSDOM } from 'jsdom'
import chai from 'chai'
import sinon from 'sinon'
import Enzyme from 'enzyme'
import chaiEnzyme from 'chai-enzyme'
import Adapter from 'enzyme-adapter-react-16'

process.env.NODE_ENV = 'test'

// eslint-disable-next-line camelcase
export const GLOBAL_primaryColor = {
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

  global.window = window
  global.document = window.document
  global.navigator = window.navigator
  global.GLOBAL_primaryColor = GLOBAL_primaryColor.hex
  global.FormData = window.FormData

  const nodeCrypto = require('crypto')
  global.crypto = {
    getRandomValues: (buffer) => { return nodeCrypto.randomFillSync(buffer) }
  }
  global.GLOBAL_dispatchEvent = () => {}
}

sinon.stub(console, 'log')
Enzyme.configure({ adapter: new Adapter() })
chai.use(chaiEnzyme())
