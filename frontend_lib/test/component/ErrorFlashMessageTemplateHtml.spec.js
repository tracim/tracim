import React from 'react'
import { expect } from 'chai'
import { shallow, configure } from 'enzyme'
import ErrorFlashMessageTemplateHtml from '../../src/component/ErrorFlashMessageTemplateHtml/ErrorFlashMessageTemplateHtml.jsx'
require('../../src/component/ErrorFlashMessageTemplateHtml/ErrorFlashMessageTemplateHtml.styl')

describe('<ErrorFlashMessageTemplateHtml />', () => {
  const props = {
    errorMsg: 'randomErrorMsg'
  }

  const wrapper = shallow(
    <ErrorFlashMessageTemplateHtml
      {...props}
    />
  ).dive()

  it(`should display "${props.errorMsg}"`, () =>
    expect(wrapper.find('.flashMessageHtml')).to.have.text().contains(props.errorMsg)
  )
})
