import React from 'react'
import { expect } from 'chai'
import { mount } from 'enzyme'
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

  it('should display the content of the text', () => {
    expect(wrapper.render().text()).to.contains(props.htmlValue)
  })
})
