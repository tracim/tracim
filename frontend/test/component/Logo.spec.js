import React from 'react'
import { expect, assert } from 'chai'
import { shallow } from 'enzyme'
import Logo from '../../src/component/Header/Logo.jsx'

describe('<Logo />', () => {
  const props = {
    logoSrc: 'randomLogoSrc',
    to: 'randomTo'
  }

  const wrapper = shallow(<Logo {...props} />)

  describe('static design', () => {
    it(`the Link should have the to property equal: ${props.to}`, () =>
      expect(wrapper.find('.header__logo').prop('to')).to.equal(props.to)
    )

    it(`the img should have the src property equal: ${props.logoSrc}`, () =>
      expect(wrapper.find('img.header__logo__img').prop('src')).to.equal(props.logoSrc)
    )
  })
})
