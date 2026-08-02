import React from 'react'
import { expect } from 'chai'
import sinon from 'sinon'
import { mount } from 'enzyme'
import { CUSTOM_EVENT } from '../../src/customEvent.js'
import HTMLContent from '../../src/component/HTMLContent/HTMLContent.jsx'

describe('<HTMLContent />', () => {
  const props = {
    iframeWhitelist: [],
    htmlValue: "Hi, I'm a Html Content.",
    isTranslated: false,
    showImageBorder: true
  }

  const wrapper = mount(
    <HTMLContent {...props} />
  )

  before(() => {
    global.HTMLAnchorElement = window.HTMLAnchorElement
    global.location = window.location
  })

  afterEach(() => {
    global.GLOBAL_dispatchEvent.resetHistory()
  })

  it('should display the content of the text', () => {
    expect(wrapper.render().text()).to.contains(props.htmlValue)
  })

  it('should dispatch REDIRECT and prevent default on a normal left click on an internal link', () => {
    const preventDefault = sinon.spy()
    const internalPath = '/ui/workspaces/1'
    const wrapper = mount(
      <HTMLContent {...props} htmlValue={`<a href="${location.origin}${internalPath}">link</a>`} />
    )

    wrapper.simulate('click', {
      button: 0,
      target: wrapper.getDOMNode().querySelector('a'),
      preventDefault
    })

    expect(global.GLOBAL_dispatchEvent.calledOnce).to.equal(true)
    expect(global.GLOBAL_dispatchEvent.args[0][0]).to.deep.equal({
      type: CUSTOM_EVENT.REDIRECT,
      data: { url: internalPath }
    })
    expect(preventDefault.calledOnce).to.equal(true)
  })

  it('should not dispatch REDIRECT or prevent default for Ctrl+Click/Meta+Click on an internal link', () => {
    const ctrlClickPreventDefault = sinon.spy()
    const metaClickPreventDefault = sinon.spy()
    const wrapper = mount(
      <HTMLContent {...props} htmlValue={`<a href="${location.origin}/ui/workspaces/1">link</a>`} />
    )
    const link = wrapper.getDOMNode().querySelector('a')

    wrapper.simulate('click', {
      button: 0,
      ctrlKey: true,
      target: link,
      preventDefault: ctrlClickPreventDefault
    })
    wrapper.simulate('click', {
      button: 0,
      metaKey: true,
      target: link,
      preventDefault: metaClickPreventDefault
    })

    expect(global.GLOBAL_dispatchEvent.notCalled).to.equal(true)
    expect(ctrlClickPreventDefault.notCalled).to.equal(true)
    expect(metaClickPreventDefault.notCalled).to.equal(true)
  })

  it('should not dispatch REDIRECT or prevent default for an internal link with another target', () => {
    const preventDefault = sinon.spy()
    const wrapper = mount(
      <HTMLContent {...props} htmlValue={`<a href="${location.origin}/ui/workspaces/1" target="_blank">link</a>`} />
    )

    wrapper.simulate('click', {
      button: 0,
      target: wrapper.getDOMNode().querySelector('a'),
      preventDefault
    })

    expect(global.GLOBAL_dispatchEvent.notCalled).to.equal(true)
    expect(preventDefault.notCalled).to.equal(true)
  })
})
