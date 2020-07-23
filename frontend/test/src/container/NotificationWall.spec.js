import React from 'react'
import sinon from 'sinon'
import { expect } from 'chai'
import { isFunction } from '../../hocMock/helper'
import { NotificationWall } from '../../../src/container/NotificationWall.jsx'
import { shallow } from 'enzyme'
import { user } from '../../hocMock/redux/user/user'
import { UPDATE, NOTIFICATION } from '../../../src/action-creator.sync.js'

describe('<NotificationWall />', () => {
  const updateNotificationCallBack = sinon.spy()

  const dispatchCallBack = (param) => {
    if (isFunction(param)) {
      return param(dispatchCallBack)
    }

    switch (param.type) {
      case `${UPDATE}/${NOTIFICATION}`: updateNotificationCallBack(); break
      default:
        return param
    }
  }

  const props = {
    dispatch: dispatchCallBack,
    notificationList: [{
      id: 0
    }],
    t: tradKey => tradKey,
    user: user
  }

  const wrapper = shallow(<NotificationWall {...props} />)
  const NotificationWallInstance = wrapper.instance()

  describe('its internal functions', () => {
    describe('getNotificationTypeText', () => {
      it('should return created if type is content.created', () => {
        expect(NotificationWallInstance.getNotificationTypeText({ type: 'content.created' }))
          .to.equal(' created ')
      })

      it('should return  updated a new version of  if type is content.modified', () => {
        expect(NotificationWallInstance.getNotificationTypeText({ type: 'content.modified' }))
          .to.equal(' updated a new version of ')
      })

      it('should return updated the status of if type is status.modified', () => {
        expect(NotificationWallInstance.getNotificationTypeText({ type: 'status.modified' }))
          .to.equal(' updated the status of ')
      })

      it('should return added you if type is member.created', () => {
        expect(NotificationWallInstance.getNotificationTypeText({ type: 'member.created' }))
          .to.equal(' added you ')
      })
    })

    describe('handleClickBtnClose', () => {
      it('should set isNotificationWallOpen state as false', () => {
        NotificationWallInstance.handleClickBtnClose(0)
        expect(wrapper.state('isNotificationWallOpen')).to.equal(false)
      })
    })
  })
})
