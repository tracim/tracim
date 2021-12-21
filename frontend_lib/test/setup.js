import { JSDOM } from 'jsdom'
import chai from 'chai'
import sinon from 'sinon'
import Enzyme from 'enzyme'
import chaiEnzyme from 'chai-enzyme'
import Adapter from 'enzyme-adapter-react-16'
import EventSource from 'eventsourcemock'
import AbortController from 'abort-controller'

require('es6-promise').polyfill()
require('isomorphic-fetch')

process.env.NODE_ENV = 'test'

const newResizeObserverSpy = () => {
  const disconnect = sinon.spy()
  const observe = sinon.spy()
  const unobserve = sinon.spy()
  const resetHistory = () => {
    disconnect.resetHistory()
    observe.resetHistory()
    unobserve.resetHistory()
  }

  return { disconnect, observe, unobserve, resetHistory }
}

// INFO - CH - 2019-06-24 - Example from https://medium.com/riipen-engineering/testing-react-with-enzyme-part-1-setup-ff49e51f8ff0
if (!global.window && !global.document) {
  const { window } = new JSDOM('<!doctype html><html><body></body></html>', {
    beforeParse (win) {
      win.scrollTo = () => { }
    },
    pretendToBeVisual: false,
    userAgent: 'mocha',
    url: 'http://localhost'
  })

  global.CustomEvent = window.CustomEvent
  global.Element = window.Element
  global.EventSource = EventSource
  global.window = window
  global.document = window.document
  global.navigator = window.navigator
  global.DOMParser = window.DOMParser
  global.ResizeObserver = newResizeObserverSpy
  global.GLOBAL_primaryColor = '#aaaaaa'
  global.AbortController = AbortController
  global.lastCustomEventTypes = new Set()
  global.GLOBAL_dispatchEvent = sinon.spy()
  global.FormData = window.FormData
  document.dispatchEvent = sinon.spy()
}

Enzyme.configure({ adapter: new Adapter() })
chai.use(chaiEnzyme())
// sinon.stub(console, 'log')
