import React from 'react'
import { expect } from 'chai'
import { shallow, configure } from 'enzyme'
import Delimiter from '../../src/component/Delimiter/Delimiter.jsx'
require('../../src/component/Delimiter/Delimiter.styl')

describe('<Delimiter />', () => {
  const props = {
    customClass: 'randomTestClass'
  }

  const wrapper = shallow(
    <Delimiter
      customClass={props.customClass}
    />
  )

  it(`should have the class "${props.customClass}"`, () =>
    expect(wrapper.find(`.${props.customClass}`)).to.have.lengthOf(1)
  )
})
