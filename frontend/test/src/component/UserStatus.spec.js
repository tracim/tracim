import React from 'react'
import { expect } from 'chai'
import { shallow } from 'enzyme'
import { UserStatus as UserStatusWithoutHOC } from '../../../src/component/Dashboard/UserStatus.jsx'
import sinon from 'sinon'
import { ROLE } from 'tracim_frontend_lib'

describe('<UserStatus />', () => {
  const onClickAddNotifyCallBack = sinon.spy()
  const onClickRemoveNotifyCallBack = sinon.spy()
  const testRole = ROLE.workspaceManager

  const props = {
    user: {
      publicName: 'randomPublicName',
      userId: 1
    },
    displayNotifBtn: true,
    curWs: {
      memberList: [{
        id: 1,
        role: testRole.slug,
        doNotify: true
      }]
    },
    onClickAddNotify: onClickAddNotifyCallBack,
    onClickRemoveNotify: onClickRemoveNotifyCallBack
  }

  const wrapper = shallow(<UserStatusWithoutHOC {...props} t={key => key} />)

  describe('static design', () => {
    it(`should display the user public name: ${props.user.publicName}`, () =>
      expect(wrapper.find('div.userstatus__username')).to.text().equal(props.user.publicName)
    )

    it(`should display his role icon: ${testRole.faIcon}`, () =>
      expect(wrapper.find('div.userstatus__role__icon').children('i').prop('className'))
        .include(testRole.faIcon)
    )

    it(`should display his role label: ${testRole.label}`, () =>
      expect(wrapper.find('div.userstatus__role__text')).to.text().equal(testRole.label)
    )

    it(`role label should have the color: ${testRole.hexcolor}`, () =>
      expect(wrapper.find('div.userstatus__role__text').prop('style').color).to.equal(testRole.hexcolor)
    )

    it(`role icon should have the color: ${testRole.hexcolor}`, () =>
      expect(wrapper.find('div.userstatus__role__icon').children('i').prop('style').color).to.equal(testRole.hexcolor)
    )

    it('should not display the notification button when displayNotifBtn is false', () => {
      wrapper.setProps({ displayNotifBtn: false })
      expect(wrapper.find('div.userstatus__notification').length).to.equal(0)
      wrapper.setProps({ displayNotifBtn: props.displayNotifBtn })
    })
  })

  describe('handlers', () => {
    it('onClickRemoveNotifyCallBack should be call when the notification button is clicked and doNotify is true', () => {
      wrapper.find('div.userstatus__notification').simulate('click')
      expect(onClickRemoveNotifyCallBack.called).to.equal(true)
      expect(onClickAddNotifyCallBack.called).to.equal(false)
      onClickRemoveNotifyCallBack.resetHistory()
    })

    it('onClickAddNotifyCallBack should be call when the notification button is clicked and doNotify is false', () => {
      wrapper.setProps({
        curWs: {
          memberList: [{
            ...props.curWs.memberList,
            doNotify: false
          }]
        }
      })
      wrapper.find('div.userstatus__notification').simulate('click')
      expect(onClickRemoveNotifyCallBack.called).to.equal(false)
      expect(onClickAddNotifyCallBack.called).to.equal(true)
      wrapper.setProps({ curWs: props.curWs })
    })
  })
})
