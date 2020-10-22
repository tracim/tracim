import React from 'react'
import { expect } from 'chai'
import { shallow } from 'enzyme'
import UserInfo from '../../src/component/UserInfo/UserInfo.jsx'
import Avatar from '../../src/component/Avatar/Avatar.jsx'

describe('<UserInfo />', () => {
  const props = {
    publicName: 'randomName',
    username: 'randomUsername'
  }

  const wrapper = shallow(<UserInfo {...props} />)

  it(`should have the name: "${props.publicName}"`, () =>
    expect(wrapper.find('.userInfo__name')).to.contain(props.publicName)
  )

  it(`should have the username: "${props.username}"`, () =>
    expect(wrapper.find('.userInfo__username')).to.contain(props.username)
  )

  it('should have an @ if the username is not empty', () =>
    expect(wrapper.find('.userInfo__username')).to.contain('@')
  )

  it('should not show the username if it is empty', () => {
    wrapper.setProps({ username: '' })
    expect(wrapper.find('.userInfo__username').length).equal(0)
  })

  it('should have an Avatar', () =>
    expect(wrapper.find('.userInfo').find(Avatar).length).equal(1)
  )
})
