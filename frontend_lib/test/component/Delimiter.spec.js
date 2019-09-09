import React from 'react'
import { expect } from 'chai'
import { shallow } from 'enzyme'
import Delimiter from '../../src/component/Delimiter/Delimiter.jsx'
require('../../src/component/Delimiter/Delimiter.styl')

describe('<Delimiter />', () => {
  const props = {
    customClass: 'randomTestClass'
  }

  const wrapper = shallow(
    <Delimiter
      {...props}
    />
  )

  describe('Static design', () => {
    it(`should have the class "${props.customClass}"`, () =>
      expect(wrapper.find(`div.${props.customClass}.delimiter`)).to.have.lengthOf(1)
    )
  })
})
