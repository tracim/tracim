import React from 'react'
import { expect } from 'chai'
import { shallow } from 'enzyme'
import UserInfo from '../../src/component/UserInfo/UserInfo.jsx'

describe('<UserInfo />', () => {
  const props = {
    user: {
      publicName: 'randomName',
      username: 'randomUsername'
    },
    apiUrl: '/'
  }

  const wrapper = shallow(<UserInfo {...props} />)

  it(`should have the name: "${props.publicName}"`, () =>
    expect(wrapper.find('.userInfo__name')).to.contain(props.user.publicName)
  )

  it(`should have the username: "${props.username}"`, () =>
    expect(wrapper.find('.userInfo__username')).to.contain(props.user.username)
  )

  it('should have an @ if the username is not empty', () =>
    expect(wrapper.find('.userInfo__username')).to.contain('@')
  )

  it('should not show the username if it is empty', () => {
    wrapper.setProps({ user: { username: '' } })
    expect(wrapper.find('.userInfo__username').length).equal(0)
  })

  it('should have an Avatar', () =>
    expect(wrapper.find('.userInfo').find('Avatar').length).equal(1)
  )
})
