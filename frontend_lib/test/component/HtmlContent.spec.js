import React from 'react'
import { expect } from 'chai'
import { mount } from 'enzyme'
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

  it('should redirect same-origin links on plain left-click', () => {
    global.GLOBAL_dispatchEvent.resetHistory()
    const linkHref = '/ui/workspaces/1/contents/2'
    const wrapper = mount(
      <HTMLContent {...props} htmlValue={`<a href="${linkHref}">internal link</a>`} />
    )
    const anchor = wrapper.getDOMNode().querySelector('a')
    let isDefaultPrevented = false

    wrapper.find('article').simulate('click', {
      target: anchor,
      button: 0,
      preventDefault: () => { isDefaultPrevented = true }
    })

    expect(global.GLOBAL_dispatchEvent.calledOnce).to.equal(true)
    expect(global.GLOBAL_dispatchEvent.firstCall.args[0]).to.deep.equal({
      type: CUSTOM_EVENT.REDIRECT,
      data: { url: linkHref }
    })
    expect(isDefaultPrevented).to.equal(true)
  })

  it('should let the browser handle same-origin links on Ctrl+Click', () => {
    global.GLOBAL_dispatchEvent.resetHistory()
    const linkHref = '/ui/workspaces/1/contents/2'
    const wrapper = mount(
      <HTMLContent {...props} htmlValue={`<a href="${linkHref}">internal link</a>`} />
    )
    const anchor = wrapper.getDOMNode().querySelector('a')
    let isDefaultPrevented = false

    wrapper.find('article').simulate('click', {
      target: anchor,
      button: 0,
      ctrlKey: true,
      preventDefault: () => { isDefaultPrevented = true }
    })

    expect(global.GLOBAL_dispatchEvent.called).to.equal(false)
    expect(isDefaultPrevented).to.equal(false)
  })
})
