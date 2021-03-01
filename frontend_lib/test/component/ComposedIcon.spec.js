import React from 'react'
import { expect } from 'chai'
import { shallow } from 'enzyme'
import ComposedIcon from '../../src/component/Icon/ComposedIcon.jsx'
require('../../src/component/Icon/ComposedIcon.styl')

describe('<ComposedIcon />', () => {
  const props = {
    mainIcon: 'randomIcon',
    smallIcon: 'otherRandomIcon',
    mainIconCustomClass: 'randomTestClass',
    smallIconCustomClass: 'otherRandomTestClass',
    mainIconStyle: {
      color: 'yellow'
    },
    smallIconStyle: {
      color: 'red'
    },
    titleIcon: 'randomTitle'
  }

  const wrapper = shallow(
    <ComposedIcon
      {...props}
    />
  )

  describe('Static design', () => {
    it(`<i> should display the icon "${props.mainIcon}"`, () =>
      expect(wrapper.find(`i.${props.mainIcon}`)).to.have.lengthOf(1)
    )

    it(`should have the class "${props.mainIconCustomClass}"`, () =>
      expect(wrapper.find(`i.composedIcon.${props.mainIconCustomClass}`)).to.have.lengthOf(1)
    )

    it(`should display its text in color ${props.mainIconStyle.color}`, () =>
      expect(wrapper.find(`i.${props.mainIcon}`).prop('style')).to.deep.equal(props.mainIconStyle)
    )

    it(`should display the title ${props.titleIcon}`, () => {
      expect(wrapper.find('i.composedIcon').prop('title')).to.equal(props.titleIcon)
    })
  })
})
