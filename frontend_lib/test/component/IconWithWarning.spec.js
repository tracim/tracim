import React from 'react'
import { expect } from 'chai'
import { shallow, configure } from 'enzyme'
import IconWithWarning from '../../src/component/Icon/IconWithWarning.jsx'
require('../../src/component/Icon/IconWithWarning.styl')

describe('<IconWithWarning />', () => {
  const props = {
    icon: 'randomIcon',
    customClass: 'randomTestClass',
    style: {
      color: 'yellow'
    }
  }

  const wrapper = shallow(
    <IconWithWarning
      {...props}
    />
  )

  describe('Static design test', () => {
    it(`<i> should display the icon "${props.icon}"`, () =>
      expect(wrapper.find(`i.fa-${props.icon}`)).to.have.lengthOf(1)
    )

    it(`should have the class "${props.customClass}"`, () =>
      expect(wrapper.find(`i.fa.iconWithWarning.${props.customClass}`)).to.have.lengthOf(1)
    )

    it(`should display its text in color ${props.style.color}`, () =>
      expect(wrapper.find(`i.fa-${props.icon}`).prop('style')).to.deep.equal(props.style)
    )
  })
})
