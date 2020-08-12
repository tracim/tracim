import React from 'react'
import sinon from 'sinon'
import { expect } from 'chai'
import { contentFromApi } from '../../fixture/content/content.js'
import { firstWorkspaceFromApi } from '../../fixture/workspace/firstWorkspace.js'
import { isFunction } from '../../hocMock/helper'
import { NotificationWall } from '../../../src/container/NotificationWall.jsx'
import { shallow } from 'enzyme'
import { user } from '../../hocMock/redux/user/user'
import {
  APPEND,
  NOTIFICATION,
  NOTIFICATION_LIST,
  UPDATE
} from '../../../src/action-creator.sync.js'
import { FETCH_CONFIG } from '../../../src/util/helper.js'
import {
  buildTracimLiveMessageEventType,
  TLM_CORE_EVENT_TYPE as TLM_CET,
  TLM_ENTITY_TYPE as TLM_ET,
  TLM_SUB_TYPE as TLM_ST
} from 'tracim_frontend_lib'
import { mockPutNotificationAsRead204 } from '../../apiMock.js'

describe('<NotificationWall />', () => {
  const updateNotificationCallBack = sinon.spy()
  const appendNotificationListCallBack = sinon.spy()

  const dispatchCallBack = (param) => {
    if (isFunction(param)) {
      return param(dispatchCallBack)
    }

    switch (param.type) {
      case `${UPDATE}/${NOTIFICATION}`: updateNotificationCallBack(); break
      case `${APPEND}/${NOTIFICATION_LIST}`: appendNotificationListCallBack(); break
      default:
        return param
    }
  }

  const props = {
    dispatch: dispatchCallBack,
    notificationPage: {
      list: [{
        id: 1
      }]
    },
    t: tradKey => tradKey,
    user: user
  }

  const wrapper = shallow(<NotificationWall {...props} />)
  const NotificationWallInstance = wrapper.instance()

  describe('its internal functions', () => {
    describe('getNotificationDetails', () => {
      const baseNotification = {
        workspace: firstWorkspaceFromApi,
        content: contentFromApi
      }
      it(`should return type comment object if type is ${buildTracimLiveMessageEventType(TLM_ET.CONTENT, TLM_CET.CREATED, TLM_ST.COMMENT)}`, () => {
        expect(NotificationWallInstance.getNotificationDetails({
          ...baseNotification,
          type: buildTracimLiveMessageEventType(TLM_ET.CONTENT, TLM_CET.CREATED, TLM_ST.COMMENT)
        }))
          .to.deep.equal({
            icon: 'fa-comments-o',
            text: '{{author}} commented on {{content}} at {{workspace}}',
            url: `/ui/workspaces/${baseNotification.workspace.workspace_id}/contents/${baseNotification.content.parent_content_type}/${baseNotification.content.content_id}`
          })
      })

      it(`should return type content.created object if type is ${buildTracimLiveMessageEventType(TLM_ET.CONTENT, TLM_CET.CREATED, TLM_ST.THREAD)}`, () => {
        expect(NotificationWallInstance.getNotificationDetails({
          ...baseNotification,
          type: buildTracimLiveMessageEventType(TLM_ET.CONTENT, TLM_CET.CREATED, TLM_ST.THREAD)
        }))
          .to.deep.equal({
            icon: 'fa-magic',
            text: '{{author}} created {{content}} at {{workspace}}',
            url: `/ui/workspaces/${baseNotification.workspace.workspace_id}/contents/${baseNotification.content.content_type}/${baseNotification.content.content_id}`
          })
      })

      it(`should return type content.modified object if type is ${buildTracimLiveMessageEventType(TLM_ET.CONTENT, TLM_CET.MODIFIED, TLM_ST.THREAD)}`, () => {
        expect(NotificationWallInstance.getNotificationDetails({
          ...baseNotification,
          type: buildTracimLiveMessageEventType(TLM_ET.CONTENT, TLM_CET.MODIFIED, TLM_ST.THREAD)
        }))
          .to.deep.equal({
            icon: 'fa-history',
            text: '{{author}} updated a new version of {{content}} at {{workspace}}',
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
            text: '{{author}} added you to {{workspace}}',
            url: `/ui/workspaces/${baseNotification.workspace.workspace_id}/dashboard`
          })
      })
    })

    describe('handleCloseNotificationWall', () => {
      it('should set isNotificationWallOpen state as false', () => {
        NotificationWallInstance.handleCloseNotificationWall()
        expect(wrapper.state('isNotificationWallOpen')).to.equal(false)
      })
    })

    describe('handleClickNotification', () => {
      it('should call updateNotification()', (done) => {
        mockPutNotificationAsRead204(FETCH_CONFIG.apiUrl, props.user.userId, 1)
        NotificationWallInstance.handleClickNotification(1).then(() => {
          expect(updateNotificationCallBack.called).to.equal(true)
        }).then(done, done)
      })
    })

    describe('handleClickMarkAllAsRead', () => {
      it('should call updateNotification()', (done) => {
        mockPutNotificationAsRead204(FETCH_CONFIG.apiUrl, props.user.userId, 1)
        NotificationWallInstance.handleClickMarkAllAsRead().then(() => {
          expect(updateNotificationCallBack.called).to.equal(true)
        }).then(done, done)
      })
    })
  })
})
