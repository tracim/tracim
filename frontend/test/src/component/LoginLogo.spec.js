import React from 'react'
import { expect } from 'chai'
import { shallow } from 'enzyme'
import LoginLogo from '../../../src/component/Login/LoginLogo.jsx'

describe('<LoginLogo />', () => {
  const props = {
    logoSrc: 'randomlogoSrc',
    customClass: 'randomCustomClass'
  }

  const wrapper = shallow(<LoginLogo {...props} />)

  describe('static design', () => {
    it(`the div should have the class: ${props.customClass}`, () =>
      expect(wrapper.find(`div.${props.customClass}`).length).to.equal(1)
    )

    it(`img should have the src: ${props.logoSrc}`, () =>
      expect(wrapper.find('img').prop('src')).to.equal(props.logoSrc)
    )
  })
})
