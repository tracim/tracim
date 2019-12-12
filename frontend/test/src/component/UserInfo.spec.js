import React from 'react'
import { expect } from 'chai'
import { shallow } from 'enzyme'
import { UserInfo as UserInfoWithoutHOC } from '../../../src/component/Account/UserInfo.jsx'
import { PROFILE } from '../../../src/helper.js'

describe('<UserInfo />', () => {
  const props = {
    user: {
      public_name: 'randomPublicName',
      email: 'randomEmail',
      profile: 'administrators'
    }
  }

  const wrapper = shallow(<UserInfoWithoutHOC { ...props } t={key => key} />)

  describe('static design', () => {
    it('should display the publicName of the user in a div', () =>
      expect(wrapper.find('div.userinfo__name')).to.text().contains(props.user.public_name)
    )

    it('should display the email of the user in a <a/>', () =>
      expect(wrapper.find('a.userinfo__email')).to.text().contains(props.user.email)
    )

    it(`should display the profile label of the user in a div`, () =>
      expect(wrapper.find('div.userinfo__profile')).to.text().contains(PROFILE.ADMINISTRATOR.label)
    )

    it(`should display the administrator icon`, () =>
      expect(wrapper.find(`div.userinfo__profile > i.fa.fa-${PROFILE.ADMINISTRATOR.faIcon}`).length).to.equal(1)
    )

    it(`the icon should have the administrator hexcolor`, () => {
      expect(wrapper.find(`i.fa.fa-${PROFILE.ADMINISTRATOR.faIcon}`).prop('style').color).to.equal(PROFILE.ADMINISTRATOR.hexcolor)
    })
  })
})
