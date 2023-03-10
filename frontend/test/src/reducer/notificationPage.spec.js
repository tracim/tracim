import { expect } from 'chai'
import {
  ADD,
  addNotification,
  APPEND,
  appendNotificationList,
  CONTENT,
  NEXT_PAGE,
  NOTIFICATION,
  NOTIFICATION_LIST,
  READ,
  readContentNotification,
  readNotificationList,
  readEveryNotification,
  SET,
  setNextPage,
  UPDATE,
  updateNotification
} from '../../../src/action-creator.sync.js'
import notificationPage, {
  serializeNotification
} from '../../../src/reducer/notificationPage.js'
import { globalManagerFromApi } from '../../fixture/user/globalManagerFromApi.js'
import { firstWorkspaceFromApi } from '../../fixture/workspace/firstWorkspace.js'
import { serialize } from 'tracim_frontend_lib'
import { serializeUserProps } from '../../../src/reducer/user.js'
import { serializeWorkspaceListProps } from '../../../src/reducer/workspaceList.js'
import { workspaceList } from '../../hocMock/redux/workspaceList/workspaceList.js'

const TLM = {
  created: '2020-07-23T12:44:50Z',
  event_id: 583,
  event_type: 'workspace_member.created',
  fields: {
    author: globalManagerFromApi,
    workspace: firstWorkspaceFromApi,
    user: globalManagerFromApi
  },
  read: null
}

const notification = {
  author: {
    publicName: globalManagerFromApi.public_name,
    userId: globalManagerFromApi.user_id,
    hasAvatar: true,
    hasCover: false
  },
  content: null,
  created: '2020-07-23T12:44:50Z',
  id: 583,
  type: 'workspace_member.created',
  workspace: serialize(firstWorkspaceFromApi, serializeWorkspaceListProps),
  read: null,
  subscription: null,
  user: serialize(globalManagerFromApi, serializeUserProps)
}

const TLMMention = {
  created: '2020-07-23T12:44:50Z',
  event_id: 523,
  event_type: 'mention.created',
  fields: {
    author: globalManagerFromApi,
    workspace: firstWorkspaceFromApi,
    user: globalManagerFromApi
  },
  read: null
}

const mention = {
  author: {
    publicName: globalManagerFromApi.public_name,
    userId: globalManagerFromApi.user_id,
    hasAvatar: true,
    hasCover: false
  },
  content: null,
  created: '2020-07-23T12:44:50Z',
  id: 523,
  type: 'mention.created',
  workspace: serialize(firstWorkspaceFromApi, serializeWorkspaceListProps),
  read: null,
  subscription: null,
  user: serialize(globalManagerFromApi, serializeUserProps)
}

describe('reducer notificationPage.js', () => {
  describe('actions', () => {
    const initialState = {
      list: [],
      hasNextPage: false,
      nextPageToken: '',
      unreadNotificationCount: 0,
      unreadMentionCount: 0
    }

    describe(`${ADD}/${NOTIFICATION}`, () => {
      const listOfNotification = notificationPage(initialState, addNotification(TLM, workspaceList.workspaceList))
      const listOfMention = notificationPage(initialState, addNotification(TLMMention, workspaceList.workspaceList))

      it('should return the list of notification added from the object passed as parameter', () => {
        expect(listOfNotification).to.deep.equal({
          ...initialState,
          list: [notification],
          unreadMentionCount: 0,
          unreadNotificationCount: 1
        })
      })

      it('should return the list of mentions', () => {
        expect(listOfMention).to.deep.equal({
          ...initialState,
          list: [mention],
          unreadMentionCount: 1,
          unreadNotificationCount: 1
        })
      })
    })

    describe(`${UPDATE}/${NOTIFICATION}`, () => {
      const listOfNotification = notificationPage(initialState, updateNotification(notification.id, [notification, notification]))

      it('should return the list of notification with the notification replaced by the list', () => {
        expect(listOfNotification).to.deep.equal({
          ...initialState,
          list: [notification, notification]
        })
      })
    })

    describe(`${READ}/${NOTIFICATION}`, () => {
      it('should read a notification in a flat list', () => {
        const initState = { ...initialState, list: [notification], unreadNotificationCount: 1 }
        const listOfNotification = notificationPage(initState, readNotificationList([notification.id]))
        expect(listOfNotification).to.deep.equal({
          ...initialState,
          list: [{ ...notification, read: true }],
          unreadNotificationCount: 0
        })
      })
    })

    describe(`${READ}/${CONTENT}/${NOTIFICATION}`, () => {
      const notificationWithContent = {
        ...notification,
        content: { label: 'test', id: 5 }
      }
      const listOfNotification = notificationPage(
        { ...initialState, list: [notificationWithContent], unreadNotificationCount: 1 },
        readContentNotification(5)
      )

      it('should return the list of objects with read set as true and counts as 0', () => {
        expect(listOfNotification).to.deep.equal(
          { ...initialState, list: [{ ...notificationWithContent, read: true }], unreadNotificationCount: 0 })
      })
    })

    describe(`${READ}/${NOTIFICATION_LIST}`, () => {
      const listOfNotification = notificationPage({ ...initialState, list: [notification], unreadNotificationCount: 1 }, readEveryNotification())

      it('should return the list of objects passed as parameter', () => {
        expect(listOfNotification).to.deep.equal({ ...initialState, list: [{ ...notification, read: true }], unreadNotificationCount: 0 })
      })
    })

    describe(`${APPEND}/${NOTIFICATION_LIST}`, () => {
      const listOfNotification = notificationPage(
        { ...initialState, list: [notification] },
        appendNotificationList(-1, [{ ...TLM, event_id: 999 }], workspaceList.workspaceList)
      )

      it('should return the list of notifications appended with the list passed as parameter',
        () => {
          expect(listOfNotification).to.deep.equal(
            { ...initialState, list: [notification, { ...notification, id: 999 }] }
          )
        }
      )
    })

    describe(`${SET}/${NEXT_PAGE}`, () => {
      const listOfNotification = notificationPage(initialState, setNextPage(true, 'token'))

      it('should return the object with the parameters hasNextPage and nextPageToken updated', () => {
        expect(listOfNotification).to.deep.equal({ ...initialState, hasNextPage: true, nextPageToken: 'token' })
      })
    })
  })
})

describe('serializeNotification', () => {
  it('should return an object (in camelCase)', () => {
    expect(serializeNotification(TLM)).to.deep.equal(notification)
  })

  it('should return an object (in camelCase)', () => {
    expect(serializeNotification(TLMMention)).to.deep.equal(mention)
  })
})
