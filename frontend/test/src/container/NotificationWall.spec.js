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
  NOTIFICATION_LIST,
  READ
} from '../../../src/action-creator.sync.js'
import { FETCH_CONFIG } from '../../../src/util/helper.js'
import {
  buildTracimLiveMessageEventType, serialize,
  TLM_CORE_EVENT_TYPE as TLM_CET,
  TLM_ENTITY_TYPE as TLM_ET,
  TLM_SUB_TYPE as TLM_ST
} from 'tracim_frontend_lib'
import {
  mockPutAllNotificationAsRead204,
  mockPutNotificationAsRead204
} from '../../apiMock.js'
import { serializeWorkspaceListProps } from '../../../src/reducer/workspaceList.js'
import { globalManagerFromApi } from '../../fixture/user/globalManagerFromApi.js'
import { serializeUserProps } from '../../../src/reducer/user.js'
import { serializeContentProps } from '../../../src/reducer/workspaceContentList.js'

describe('<NotificationWall />', () => {
  const readNotificationListCallBack = sinon.spy()
  const appendNotificationListCallBack = sinon.spy()
  const onCloseNotificationWallCallBack = sinon.spy()

  const dispatchCallBack = (param) => {
    if (isFunction(param)) {
      return param(dispatchCallBack)
    }

    switch (param.type) {
      case `${READ}/${NOTIFICATION_LIST}`: readNotificationListCallBack(); break
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
    user: user,
    onCloseNotificationWall: onCloseNotificationWallCallBack
  }

  const wrapper = shallow(<NotificationWall {...props} />)
  const NotificationWallInstance = wrapper.instance()

  describe('its internal functions', () => {
    describe('getNotificationDetails', () => {
      const baseNotification = {
        content: serialize(contentFromApi, serializeContentProps),
        workspace: serialize(firstWorkspaceFromApi, serializeWorkspaceListProps),
        user: serialize(globalManagerFromApi, serializeUserProps)
      }
      it(`should return type comment object if type is ${buildTracimLiveMessageEventType(TLM_ET.CONTENT, TLM_CET.CREATED, TLM_ST.COMMENT)}`, () => {
        expect(NotificationWallInstance.getNotificationDetails({
          ...baseNotification,
          type: buildTracimLiveMessageEventType(TLM_ET.CONTENT, TLM_CET.CREATED, TLM_ST.COMMENT)
        }))
          .to.deep.equal({
            icon: 'fa-comments-o',
            text: '{{author}} commented on {{content}} in {{workspace}}',
            url: `/ui/workspaces/${baseNotification.workspace.id}/contents/${baseNotification.content.parentContentType}/${baseNotification.content.id}`
          })
      })

      it(`should return type content.created object if type is ${buildTracimLiveMessageEventType(TLM_ET.CONTENT, TLM_CET.CREATED, TLM_ST.THREAD)}`, () => {
        expect(NotificationWallInstance.getNotificationDetails({
          ...baseNotification,
          type: buildTracimLiveMessageEventType(TLM_ET.CONTENT, TLM_CET.CREATED, TLM_ST.THREAD)
        }))
          .to.deep.equal({
            icon: 'fa-magic',
            text: '{{author}} created {{content}} in {{workspace}}',
            url: `/ui/workspaces/${baseNotification.workspace.id}/contents/${baseNotification.content.type}/${baseNotification.content.id}`
          })
      })

      it(`should return type content.modified object if type is ${buildTracimLiveMessageEventType(TLM_ET.CONTENT, TLM_CET.MODIFIED, TLM_ST.THREAD)}`, () => {
        expect(NotificationWallInstance.getNotificationDetails({
          ...baseNotification,
          type: buildTracimLiveMessageEventType(TLM_ET.CONTENT, TLM_CET.MODIFIED, TLM_ST.THREAD)
        }))
          .to.deep.equal({
            icon: 'fa-history',
            text: '{{author}} updated a new version of {{content}} in {{workspace}}',
            url: `/ui/workspaces/${baseNotification.workspace.id}/contents/${baseNotification.content.type}/${baseNotification.content.id}`
          })
      })

      it(`should return type workspace_member.created if type is ${buildTracimLiveMessageEventType(TLM_ET.SHAREDSPACE_MEMBER, TLM_CET.CREATED)}`, () => {
        expect(NotificationWallInstance.getNotificationDetails({
          ...baseNotification,
          type: buildTracimLiveMessageEventType(TLM_ET.SHAREDSPACE_MEMBER, TLM_CET.CREATED),
          user: user
        }))
          .to.deep.equal({
            icon: 'fa-user-o',
            text: '{{author}} added you to {{workspace}}',
            url: `/ui/workspaces/${baseNotification.workspace.id}/dashboard`
          })
      })
    })

    describe('handleClickNotification', () => {
      it('should call onCloseNotificationWallCallBack()', (done) => {
        mockPutNotificationAsRead204(FETCH_CONFIG.apiUrl, props.user.userId, 1)
        NotificationWallInstance.handleClickNotification(1).then(() => {
          expect(onCloseNotificationWallCallBack.called).to.equal(true)
        }).then(done, done)
      })
    })

    describe('handleClickMarkAllAsRead', () => {
      it('should call readNotificationList()', (done) => {
        mockPutAllNotificationAsRead204(FETCH_CONFIG.apiUrl, props.user.userId, 1)
        NotificationWallInstance.handleClickMarkAllAsRead().then(() => {
          expect(readNotificationListCallBack.called).to.equal(true)
        }).then(done, done)
      })
    })
  })
})
