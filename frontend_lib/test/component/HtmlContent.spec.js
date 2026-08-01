import React from 'react'
import { expect } from 'chai'
import { mount } from 'enzyme'
import sinon from 'sinon'
import HTMLContent from '../../src/component/HTMLContent/HTMLContent.jsx'
import { CUSTOM_EVENT } from '../../src/customEvent.js'

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

  it('should display the content of the text', () => {
    expect(wrapper.render().text()).to.contains(props.htmlValue)
  })

  it('should dispatch redirect and prevent default on plain same-origin internal link click', () => {
    const htmlValue = '<a href="/ui/workspaces/1">Workspace</a>'
    const wrapperWithLink = mount(<HTMLContent {...props} htmlValue={htmlValue} />)
    const clickEvent = new window.MouseEvent('click', { bubbles: true, cancelable: true, button: 0 })

    global.GLOBAL_dispatchEvent.resetHistory()
    wrapperWithLink.find('a').getDOMNode().dispatchEvent(clickEvent)

    sinon.assert.calledWith(global.GLOBAL_dispatchEvent, {
      type: CUSTOM_EVENT.REDIRECT,
      data: { url: '/ui/workspaces/1' }
    })
    expect(clickEvent.defaultPrevented).to.equal(true)
  })

  it('should not dispatch redirect or prevent default on Ctrl+Click same-origin internal link click', () => {
    const htmlValue = '<a href="/ui/workspaces/1">Workspace</a>'
    const wrapperWithLink = mount(<HTMLContent {...props} htmlValue={htmlValue} />)
    const clickEvent = new window.MouseEvent('click', { bubbles: true, cancelable: true, button: 0, ctrlKey: true })

    global.GLOBAL_dispatchEvent.resetHistory()
    wrapperWithLink.find('a').getDOMNode().dispatchEvent(clickEvent)

    sinon.assert.notCalled(global.GLOBAL_dispatchEvent)
    expect(clickEvent.defaultPrevented).to.equal(false)
  })
})
