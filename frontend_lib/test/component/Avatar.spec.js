import React from 'react'
import { expect } from 'chai'
import { mount } from 'enzyme'
import Avatar, { AVATAR_SIZE } from '../../src/component/Avatar/Avatar.jsx'

require('../../src/component/Avatar/Avatar.styl')

describe('<Avatar />', () => {
  const props = {
    user: { publicName: 'myName' },
    apiUrl: '/',
    size: AVATAR_SIZE.BIG,
    style: {
      color: 'yellow'
    }
  }

  const wrapper = mount(<Avatar {...props} />).find('Avatar')

  describe('Static design', () => {
    it(`should have the title "${props.user.publicName}"`, () => {
      expect(wrapper.find('.avatar-wrapper').prop('title')).to.equal(props.user.publicName)
    })

    it('should have the same style object', () => {
      expect(wrapper.find('.avatar-wrapper').prop('style')).to.deep.equal(props.style)
    })

    it('should display its avatar in width, height', () => {
      const sizeWithoutPx = props.size.substring(0, props.size.length - 2)
      expect(wrapper.find('.avatar').prop('src')).to.include(`${sizeWithoutPx}x${sizeWithoutPx}`)
    })
  })
})
