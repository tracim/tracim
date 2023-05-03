import React from 'react'
import { expect } from 'chai'
import { shallow } from 'enzyme'
import Logo from '../../../src/component/Logo.jsx'

describe('<Logo />', () => {
  const props = {
    logoSrc: '/assets/branding/images/tracim-logo.png',
    to: 'randomTo'
  }

  const wrapper = shallow(<Logo {...props} />)

  describe('static design', () => {
    it(`the Link should have the to property equal: ${props.to}`, () =>
      expect(wrapper.find('.tracimLogo').prop('to')).to.equal(props.to)
    )

    it(`the img should have the src property equal: ${props.logoSrc}`, () =>
      expect(wrapper.find('.tracimLogo__img').prop('src')).to.equal(props.logoSrc)
    )
  })
})
