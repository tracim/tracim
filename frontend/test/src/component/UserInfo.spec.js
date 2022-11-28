import React from 'react'
import { expect } from 'chai'
import { shallow } from 'enzyme'
import { UserInfo as UserInfoWithoutHOC } from '../../../src/component/Account/UserInfo.jsx'
import { PROFILE } from 'tracim_frontend_lib'
import { withRouterMock } from '../../hocMock/withRouter'

describe('<UserInfo />', () => {
  const props = {
    user: {
      userId: 1,
      publicName: 'randomPublicName',
      username: 'randomUsername',
      email: 'randomEmail',
      profile: 'administrators'
    }
  }

  const UserInfoWithHOC = withRouterMock(UserInfoWithoutHOC)
  const wrapper = shallow(<UserInfoWithHOC {...props} t={key => key} />).dive()

  describe('static design', () => {
    it('should display the publicName of the user in a div', () =>
      expect(wrapper.find('div.userinfo__name')).to.text().contains(props.user.publicName)
    )

    it('should display the username of the user in a div', () =>
      expect(wrapper.find('div.userinfo__username')).to.text().contains(props.user.username)
    )

    it('should display the email of the user in a div', () =>
      expect(wrapper.find('div.userinfo__email')).to.text().contains(props.user.email)
    )

    it('should display the profile label of the user in a div', () =>
      expect(wrapper.find('div.userinfo__profile')).to.text().contains(PROFILE.administrator.label)
    )

    it('should display the administrator icon', () =>
      expect(wrapper.find('div.userinfo__profile').children('i').prop('className'))
        .include(`${PROFILE.administrator.faIcon}`)
    )

    it('the icon should have the administrator hexcolor', () => {
      expect(wrapper.find('div.userinfo__profile').children('i').prop('style').color).to.equal(PROFILE.administrator.hexcolor)
    })
  })
})
