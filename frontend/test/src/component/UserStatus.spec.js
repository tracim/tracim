import React from 'react'
import { expect } from 'chai'
import { shallow } from 'enzyme'
import { UserStatus as UserStatusWithoutHOC } from '../../../src/component/Dashboard/UserStatus.jsx'
import sinon from 'sinon'
import { ROLE } from 'tracim_frontend_lib'

describe('<UserStatus />', () => {
  const handleClickChangeEmailNotificationTypeCallBack = sinon.spy()
  const testRole = ROLE.workspaceManager

  const props = {
    user: {
      publicName: 'randomPublicName',
      userId: 1,
      config: {}
    },
    displayNotifBtn: true,
    newSubscriptionRequestsNumber: true,
    currentWorkspace: {
      memberList: [{
        id: 1,
        role: testRole.slug,
        emailNotificationType: 'summary'
      }]
    },
    handleClickChangeEmailNotificationType: handleClickChangeEmailNotificationTypeCallBack
  }

  const wrapper = shallow(<UserStatusWithoutHOC {...props} t={key => key} />)

  describe('static design', () => {
    it(`should display his role label: ${testRole.label}`, () =>
      expect(wrapper.find('.userstatus__role__text')).to.text().equal(testRole.label)
    )

    it('should not display the notification button when displayNotifBtn is false', () => {
      wrapper.setProps({ displayNotifBtn: false })
      expect(wrapper.find('.userstatus__informations__notification').length).to.equal(0)
      wrapper.setProps({ displayNotifBtn: props.displayNotifBtn })
    })
  })
})
