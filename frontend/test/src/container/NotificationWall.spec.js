// FIXME - MP - 16-03-2022 - We use enzime 3.10. The hooks support is in 3.11
// These tests are being removed since they are not working.
// https://github.com/tracim/tracim/issues/5223

/*
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
  buildTracimLiveMessageEventType,
  serialize,
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
        id: 1,
        type: '',
        created: '2020-03-04T00:03:04Z'
      }]
    },
    t: tradKey => tradKey,
    user: user,
    onCloseNotificationWall: onCloseNotificationWallCallBack
  }

  const wrapper = shallow(<NotificationWall {...props} />)
  const NotificationWallInstance = wrapper.instance()

  describe('getNotificationDetails', () => {
    const baseNotification = {
      content: serialize(contentFromApi, serializeContentProps),
      workspace: serialize(firstWorkspaceFromApi, serializeWorkspaceListProps),
      user: serialize(globalManagerFromApi, serializeUserProps),
      author: {
        publicName: globalManagerFromApi.public_name,
        userId: globalManagerFromApi.user_id
      }
    }
    it(`should return type comment object if type is ${buildTracimLiveMessageEventType(TLM_ET.CONTENT, TLM_CET.CREATED, TLM_ST.COMMENT)}`, () => {
      expect(NotificationWallInstance.getNotificationDetails({
        ...baseNotification,
        type: buildTracimLiveMessageEventType(TLM_ET.CONTENT, TLM_CET.CREATED, TLM_ST.COMMENT)
      }))
        .to.deep.equal({
          text: '{{author}} commented on {{content}}{{workspaceInfo}}',
          title: 'Comment_noun',
          url: `/ui/contents/${baseNotification.content.parentId}`
        })
    })

    it(`should return type content.created object if type is ${buildTracimLiveMessageEventType(TLM_ET.CONTENT, TLM_CET.CREATED, TLM_ST.THREAD)}`, () => {
      expect(NotificationWallInstance.getNotificationDetails({
        ...baseNotification,
        type: buildTracimLiveMessageEventType(TLM_ET.CONTENT, TLM_CET.CREATED, TLM_ST.THREAD)
      }))
        .to.deep.equal({
          text: '{{author}} created {{content}}{{workspaceInfo}}',
          title: 'New content',
          url: `/ui/contents/${baseNotification.content.id}`
        })
    })

    it(`should return type content.modified object if type is ${buildTracimLiveMessageEventType(TLM_ET.CONTENT, TLM_CET.MODIFIED, TLM_ST.THREAD)}`, () => {
      expect(NotificationWallInstance.getNotificationDetails({
        ...baseNotification,
        type: buildTracimLiveMessageEventType(TLM_ET.CONTENT, TLM_CET.MODIFIED, TLM_ST.THREAD)
      }))
        .to.deep.equal({
          text: '{{author}} updated {{content}}{{workspaceInfo}}',
          title: 'Content updated',
          url: `/ui/contents/${baseNotification.content.id}`
        })
    })

    it(`should return type workspace_member.created if type is ${buildTracimLiveMessageEventType(TLM_ET.SHAREDSPACE_MEMBER, TLM_CET.CREATED)}`, () => {
      expect(NotificationWallInstance.getNotificationDetails({
        ...baseNotification,
        type: buildTracimLiveMessageEventType(TLM_ET.SHAREDSPACE_MEMBER, TLM_CET.CREATED),
        user: user
      }))
        .to.deep.equal({
          text: '{{author}} added you to a space',
          title: 'New access',
          url: `/ui/workspaces/${baseNotification.workspace.id}/dashboard`
        })
    })

    it('should produce span tags, and have title attributes on them', () => {
      function mocki18nextT (text, opts) {
        if (!opts) return text

        if (opts.interpolation.escapeValue !== false) {
          throw new Error('Expected interpolation.escapeValue to be false')
        }

        for (const p of Object.keys(opts)) {
          text = text.replace(new RegExp('\\{\\{' + p + '\\}\\}', 'g'), opts[p])
        }

        return text
      }

      const translatedNotificationWallInstance = shallow(<NotificationWall {...{ ...props, t: mocki18nextT }} />).instance()

      const htmlText = translatedNotificationWallInstance.getNotificationDetails({
        ...baseNotification,
        type: buildTracimLiveMessageEventType(TLM_ET.CONTENT, TLM_CET.CREATED, TLM_ST.THREAD)
      }).text

      const div = document.createElement('div')
      div.innerHTML = htmlText
      const spanList = [...div.querySelectorAll('span')]

      expect(spanList.length).to.be.greaterThan(0)
      expect(spanList.every(span => span.title && span.title === span.textContent)).to.equal(true)
    })
  })

  describe('handleClickNotification', () => {
    it('should call onCloseNotificationWallCallBack()', (done) => {
      mockPutNotificationAsRead204(FETCH_CONFIG.apiUrl, props.user.userId, 1)
      NotificationWallInstance.handleClickNotification({}, 1, { url: '/ui' }).then(() => {
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

  describe('hasSameAuthor', () => {
    it('should return false if list has a null or undefined element', () => {
      expect(NotificationWallInstance.hasSameAuthor([null, { userId: 1 }, { userId: 1 }])).to.be.equal(false)
    })

    it('should return false if a element has a different author id', () => {
      expect(NotificationWallInstance.hasSameAuthor([{ userId: 2 }, { userId: 1 }])).to.be.equal(false)
    })

    it('should return true if all elements has same authorid', () => {
      expect(NotificationWallInstance.hasSameAuthor([{ userId: 1 }, { userId: 1 }])).to.be.equal(true)
    })
  })

  describe('hasSameWorkspace', () => {
    it('should return false if list has a null or undefined element', () => {
      expect(NotificationWallInstance.hasSameWorkspace([null, { id: 1 }, { id: 1 }])).to.be.equal(false)
    })

    it('should return false if a element has a different workspace id', () => {
      expect(NotificationWallInstance.hasSameWorkspace([{ id: 2 }, { id: 1 }])).to.be.equal(false)
    })

    it('should return true if all elements has same workspace id', () => {
      expect(NotificationWallInstance.hasSameWorkspace([{ id: 1 }, { id: 1 }])).to.be.equal(true)
    })
  })

  describe('hasSameContent', () => {
    it('should return false if list has a element with null or undefined content', () => {
      expect(NotificationWallInstance.hasSameContent([
        { content: null },
        { content: { id: 1, parentId: 2 }, type: 'content' },
        { content: { id: 1, parentId: 2 }, type: 'content' }
      ])).to.be.equal(false)
    })

    describe('only with contents', () => {
      it('should return false if a element has a different content id', () => {
        expect(NotificationWallInstance.hasSameContent([
          { content: { id: 2, parentId: 2 }, type: 'content' },
          { content: { id: 1, parentId: 2 }, type: 'content' }
        ])).to.be.equal(false)
      })

      it('should return true if all elements has same content id', () => {
        expect(NotificationWallInstance.hasSameContent([
          { content: { id: 1, parentId: 2 }, type: 'content' },
          { content: { id: 1, parentId: 3 }, type: 'content' }
        ])).to.be.equal(true)
      })
    })

    describe('with contents and comments', () => {
      it('should return false if a element has a different content id or parentId', () => {
        expect(NotificationWallInstance.hasSameContent([
          { content: { id: 2, parentId: 3 }, type: 'content' },
          { content: { id: 1, parentId: 3 }, type: 'comment' }
        ])).to.be.equal(false)
      })

      it('should return true if all elements has same content', () => {
        expect(NotificationWallInstance.hasSameContent([
          { content: { id: 2, parentId: 3 }, type: 'content' },
          { content: { id: 1, parentId: 2 }, type: 'comment' }
        ])).to.be.equal(true)
      })
    })

    describe('only with comments', () => {
      it('should return false if a element has a different content id or parentId', () => {
        expect(NotificationWallInstance.hasSameContent([
          { content: { id: 2, parentId: 1 }, type: 'comment' },
          { content: { id: 1, parentId: 2 }, type: 'comment' }
        ])).to.be.equal(false)
      })

      it('should return true if all elements has same content', () => {
        expect(NotificationWallInstance.hasSameContent([
          { content: { id: 2, parentId: 3 }, type: 'comment' },
          { content: { id: 1, parentId: 3 }, type: 'comment' }
        ])).to.be.equal(true)
      })
    })
  })

  describe('belongsToGroup', () => {
    const defaultElement = {
      author: { userId: 1 },
      content: { id: 2 },
      type: 'content',
      workspace: { id: 3 }
    }

    it('should return false if groupedNotification is null', () => {
      expect(belongsToGroup(defaultElement, null, 2)).to.be.equal(false)
    })

    it('should return false if groupedNotification has no group', () => {
      expect(belongsToGroup(defaultElement, {}, 2)).to.be.equal(false)
    })
  })

  describe('sortByCreatedDate', () => {
    it('should return the array sorted by created', () => {
      expect(sortByCreatedDate([{ created: 5 }, { created: 2 }, { created: 9 }])).to.deep.equal([{ created: 9 }, { created: 5 }, { created: 2 }])
    })
  })
})
*/
