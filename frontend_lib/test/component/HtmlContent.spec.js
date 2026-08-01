import React from 'react'
import { expect } from 'chai'
import { mount } from 'enzyme'
import HTMLContent from '../../src/component/HTMLContent/HTMLContent.jsx'
import { CUSTOM_EVENT } from '../../src/customEvent.js'

if (!global.HTMLAnchorElement) global.HTMLAnchorElement = global.window.HTMLAnchorElement
if (!global.location) global.location = global.window.location

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

  describe('internal link click', () => {
    const internalLinkProps = {
      ...props,
      htmlValue: '<a href="/ui/workspaces/1/contents/2">internal content</a>'
    }

    const mountInternalLink = () => mount(
      <HTMLContent {...internalLinkProps} />
    )

    beforeEach(() => {
      global.GLOBAL_dispatchEvent.resetHistory()
    })

    it('should dispatch redirect and prevent default on a plain left click', () => {
      const wrapper = mountInternalLink()
      const link = wrapper.getDOMNode().querySelector('a')
      let hasPreventedDefault = false

      wrapper.find('article').simulate('click', {
        target: link,
        button: 0,
        preventDefault: () => { hasPreventedDefault = true }
      })

      expect(global.GLOBAL_dispatchEvent.calledOnce).to.equal(true)
      expect(global.GLOBAL_dispatchEvent.firstCall.args[0]).to.deep.equal({
        type: CUSTOM_EVENT.REDIRECT,
        data: { url: '/ui/workspaces/1/contents/2' }
      })
      expect(hasPreventedDefault).to.equal(true)
    })

    it('should not dispatch redirect or prevent default on Ctrl+Click', () => {
      const wrapper = mountInternalLink()
      const link = wrapper.getDOMNode().querySelector('a')
      let hasPreventedDefault = false

      wrapper.find('article').simulate('click', {
        target: link,
        button: 0,
        ctrlKey: true,
        preventDefault: () => { hasPreventedDefault = true }
      })

      expect(global.GLOBAL_dispatchEvent.called).to.equal(false)
      expect(hasPreventedDefault).to.equal(false)
    })

    it('should not dispatch redirect or prevent default on middle click', () => {
      const wrapper = mountInternalLink()
      const link = wrapper.getDOMNode().querySelector('a')
      let hasPreventedDefault = false

      wrapper.find('article').simulate('click', {
        target: link,
        button: 1,
        preventDefault: () => { hasPreventedDefault = true }
      })

      expect(global.GLOBAL_dispatchEvent.called).to.equal(false)
      expect(hasPreventedDefault).to.equal(false)
    })

    it('should not dispatch redirect or prevent default on middle click', () => {
      const wrapper = mountInternalLink()
      const link = wrapper.getDOMNode().querySelector('a')
      let hasPreventedDefault = false

      wrapper.find('article').simulate('click', {
        target: link,
        button: 1,
        preventDefault: () => { hasPreventedDefault = true }
      })

      expect(global.GLOBAL_dispatchEvent.called).to.equal(false)
      expect(hasPreventedDefault).to.equal(false)
    })
  })
})
