import React from 'react'
import { expect } from 'chai'
import { mount } from 'enzyme'
import ErrorFlashMessageTemplateHtml from '../../src/component/ErrorFlashMessageTemplateHtml/ErrorFlashMessageTemplateHtml.jsx'
require('../../src/component/ErrorFlashMessageTemplateHtml/ErrorFlashMessageTemplateHtml.styl')

describe('<ErrorFlashMessageTemplateHtml />', () => {
  const props = {
    errorMsg: 'randomErrorMsg'
  }

  const wrapper = mount(
    <ErrorFlashMessageTemplateHtml
      {...props}
    />
  )

  it(`should display "${props.errorMsg}"`, () =>
    expect(wrapper.find('.flashMessageHtml')).to.have.text().contains(props.errorMsg)
  )
})
