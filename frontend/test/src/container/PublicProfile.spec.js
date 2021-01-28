import React from 'react'
import { expect } from 'chai'
import { shallow } from 'enzyme'
import { PublicProfile } from '../../../src/container/PublicProfile.jsx'
import { user } from '../../hocMock/redux/user/user'
import { PROFILE } from 'tracim_frontend_lib'

describe('<PublicProfile />', () => {
  const props = {
    user: user,
    match: {
      params: {
        userid: 1
      }
    },
    registerLiveMessageHandlerList: () => {},
    registerCustomEventHandlerList: () => {},
    t: tradKey => tradKey
  }

  const wrapper = shallow(<PublicProfile {...props} />)

  describe('isPublicProfileEditable()', () => {
    it('should return false if schemaObject is empty', () => {
      expect(
        wrapper.instance().isPublicProfileEditable(props.user, props.user.userId, PROFILE, {})
      ).to.equal(false)
    })
  })
})
