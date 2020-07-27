import React from 'react'
import sinon from 'sinon'
import { expect } from 'chai'
import { contentFromApi } from '../../fixture/content/content.js'
import { firstWorkspaceFromApi } from '../../fixture/workspace/firstWorkspace.js'
import { isFunction } from '../../hocMock/helper'
import { NotificationWall } from '../../../src/container/NotificationWall.jsx'
import { shallow } from 'enzyme'
import { user } from '../../hocMock/redux/user/user'
import { UPDATE, NOTIFICATION } from '../../../src/action-creator.sync.js'
import {
  buildTracimLiveMessageEventType,
  TLM_CORE_EVENT_TYPE as TLM_CET,
  TLM_ENTITY_TYPE as TLM_ET,
  TLM_SUB_TYPE as TLM_ST
} from 'tracim_frontend_lib'

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
    describe('getNotificationDetails', () => {
      const baseNotification = {
        workspace: firstWorkspaceFromApi,
        content: contentFromApi,

      }
      it(`should return type comment object if type is ${buildTracimLiveMessageEventType(TLM_ET.CONTENT, TLM_CET.CREATED, TLM_ST.COMMENT)}`, () => {
        expect(NotificationWallInstance.getNotificationDetails({
          ...baseNotification,
          type: buildTracimLiveMessageEventType(TLM_ET.CONTENT, TLM_CET.CREATED, TLM_ST.COMMENT)
        }))
          .to.deep.equal({
            icon:'fa-comments-o',
            text:' commented on ',
            url:`/ui/workspaces/${baseNotification.workspace.workspace_id}/dashboard`
          })
      })

      it(`should return type content.created object if type is ${buildTracimLiveMessageEventType(TLM_ET.CONTENT, TLM_CET.CREATED, TLM_ST.THREAD)}`, () => {
        expect(NotificationWallInstance.getNotificationDetails({
          ...baseNotification,
          type: buildTracimLiveMessageEventType(TLM_ET.CONTENT, TLM_CET.CREATED, TLM_ST.THREAD)
        }))
          .to.deep.equal({
            icon:'fa-magic',
            text:' created ',
            url:`/ui/workspaces/${baseNotification.workspace.workspace_id}/contents/${baseNotification.content.content_type}/${baseNotification.content.content_id}`
          })
      })

      it(`should return type content.modified object if type is ${buildTracimLiveMessageEventType(TLM_ET.CONTENT, TLM_CET.MODIFIED, TLM_ST.THREAD)}`, () => {
        expect(NotificationWallInstance.getNotificationDetails({
          ...baseNotification,
          type: buildTracimLiveMessageEventType(TLM_ET.CONTENT, TLM_CET.MODIFIED, TLM_ST.THREAD)
        }))
          .to.deep.equal({
            icon: 'fa-history',
            text: ' updated a new version of ',
            url: `/ui/workspaces/${baseNotification.workspace.workspace_id}/contents/${baseNotification.content.content_type}/${baseNotification.content.content_id}`
          })
      })

      it(`should return type workspace_member.created if type is ${buildTracimLiveMessageEventType(TLM_ET.SHAREDSPACE_MEMBER, TLM_CET.CREATED)}`, () => {
        expect(NotificationWallInstance.getNotificationDetails({
          ...baseNotification,
          type: buildTracimLiveMessageEventType(TLM_ET.SHAREDSPACE_MEMBER, TLM_CET.CREATED)
        }))
          .to.deep.equal({
            icon: 'fa-user-o',
            text:' added you ',
            url: `/ui/workspaces/${baseNotification.workspace.workspace_id}/dashboard`
          })
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
