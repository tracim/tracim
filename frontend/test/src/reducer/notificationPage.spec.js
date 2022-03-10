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
  readNotification,
  readNotificationList,
  SET,
  setNextPage,
  setNotificationList,
  UPDATE,
  updateNotification
} from '../../../src/action-creator.sync.js'
import notificationPage, {
  belongsToGroup,
  hasSameAuthor,
  hasSameContent,
  hasSameWorkspace,
  serializeNotification,
  sortByCreatedDate
} from '../../../src/reducer/notificationPage.js'
import { globalManagerFromApi } from '../../fixture/user/globalManagerFromApi.js'
import { firstWorkspaceFromApi } from '../../fixture/workspace/firstWorkspace.js'
import { serialize } from 'tracim_frontend_lib'
import { serializeUserProps } from '../../../src/reducer/user.js'
import { serializeWorkspaceListProps } from '../../../src/reducer/workspaceList.js'

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
    hasAvatar: false,
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
    hasAvatar: false,
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
      flattenList: [],
      hasNextPage: false,
      nextPageToken: '',
      unreadNotificationCount: 0,
      unreadMentionCount: 0
    }

    describe(`${SET}/${NOTIFICATION_LIST}`, () => {
      const listOfNotification = notificationPage(initialState, setNotificationList([TLM]))

      it('should return the list of notification from the objects passed as parameter', () => {
        expect(listOfNotification).to.deep.equal({
          ...initialState,
          list: [notification],
          flattenList: [notification]
        })
      })
    })

    describe(`${ADD}/${NOTIFICATION}`, () => {
      const listOfNotification = notificationPage(initialState, addNotification(TLM))
      const listOfMention = notificationPage(initialState, addNotification(TLMMention))

      it('should return the list of notification added from the object passed as parameter', () => {
        expect(listOfNotification).to.deep.equal({
          ...initialState,
          list: [notification],
          flattenList: [notification],
          unreadMentionCount: 0,
          unreadNotificationCount: 1
        })
      })

      it('should return the list of mentions', () => {
        expect(listOfMention).to.deep.equal({
          ...initialState,
          list: [mention],
          flattenList: [mention],
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
          list: [notification, notification],
          flattenList: [notification, notification]
        })
      })
    })

    describe(`${READ}/${NOTIFICATION}`, () => {
      it('should read a notification in a flat list', () => {
        const initState = { ...initialState, list: [notification], flattenList: [notification], unreadNotificationCount: 1 }
        const listOfNotification = notificationPage(initState, readNotification(notification.id))
        expect(listOfNotification).to.deep.equal({
          ...initialState,
          list: [{ ...notification, read: true }],
          flattenList: [{ ...notification, read: true }],
          unreadNotificationCount: 0
        })
      })

      it('should read a notification in a group', () => {
        const initGroup = {
          author: [
            {
              publicName: globalManagerFromApi.public_name,
              userId: globalManagerFromApi.user_id,
              hasAvatar: false,
              hasCover: false
            }
          ],
          created: '2020-07-23T12:44:50Z',
          id: 583, // NOTE - MP - 10-03-2022 - Group id must match notification id
          type: '2.author.workspace',
          group: [notification]
        }

        const initState = { ...initialState, list: [initGroup], flattenList: [notification], unreadNotificationCount: 1 }
        const listOfNotification = notificationPage(initState, readNotification(notification.id))

        expect(listOfNotification).to.deep.equal({
          ...initState,
          list: [{
            ...initGroup,
            group: [{
              ...notification,
              read: true
            }]
          }],
          flattenList: [{
            ...notification,
            read: true
          }],
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
        { ...initialState, list: [notificationWithContent], flattenList: [notificationWithContent], unreadNotificationCount: 1 },
        readContentNotification(5)
      )

      it('should return the list of objects with read set as true and counts as 0', () => {
        expect(listOfNotification).to.deep.equal(
          { ...initialState, list: [{ ...notificationWithContent, read: true }], flattenList: [{ ...notificationWithContent, read: true }], unreadNotificationCount: 0 })
      })
    })

    describe(`${READ}/${NOTIFICATION_LIST}`, () => {
      const listOfNotification = notificationPage({ ...initialState, list: [notification], flattenList: [notification], unreadNotificationCount: 1 }, readNotificationList())

      it('should return the list of objects passed as parameter', () => {
        expect(listOfNotification).to.deep.equal({ ...initialState, list: [{ ...notification, read: true }], flattenList: [{ ...notification, read: true }], unreadNotificationCount: 0 })
      })
    })

    describe(`${APPEND}/${NOTIFICATION_LIST}`, () => {
      const listOfNotification = notificationPage({ ...initialState, list: [notification], flattenList: [notification] }, appendNotificationList([{ ...TLM, event_id: 999 }]))

      it('should return the list of notifications appended with the list passed as parameter', () => {
        expect(listOfNotification).to.deep.equal({ ...initialState, list: [notification, { ...notification, id: 999 }], flattenList: [notification, { ...notification, id: 999 }] })
      })
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

describe('hasSameAuthor', () => {
  it('should return false if list has a null or undefined element', () => {
    expect(hasSameAuthor([null, { userId: 1 }, { userId: 1 }])).to.be.equal(false)
  })

  it('should return false if a element has a different author id', () => {
    expect(hasSameAuthor([{ userId: 2 }, { userId: 1 }])).to.be.equal(false)
  })

  it('should return true if all elements has same authorid', () => {
    expect(hasSameAuthor([{ userId: 1 }, { userId: 1 }])).to.be.equal(true)
  })
})

describe('hasSameWorkspace', () => {
  it('should return false if list has a null or undefined element', () => {
    expect(hasSameWorkspace([null, { id: 1 }, { id: 1 }])).to.be.equal(false)
  })

  it('should return false if a element has a different workspace id', () => {
    expect(hasSameWorkspace([{ id: 2 }, { id: 1 }])).to.be.equal(false)
  })

  it('should return true if all elements has same workspace id', () => {
    expect(hasSameWorkspace([{ id: 1 }, { id: 1 }])).to.be.equal(true)
  })
})

describe('hasSameContent', () => {
  it('should return false if list has a element with null or undefined content', () => {
    expect(hasSameContent([
      { content: null },
      { content: { id: 1, parentId: 2 }, type: 'content' },
      { content: { id: 1, parentId: 2 }, type: 'content' }
    ])).to.be.equal(false)
  })

  describe('only with contents', () => {
    it('should return false if a element has a different content id', () => {
      expect(hasSameContent([
        { content: { id: 2, parentId: 2 }, type: 'content' },
        { content: { id: 1, parentId: 2 }, type: 'content' }
      ])).to.be.equal(false)
    })

    it('should return true if all elements has same content id', () => {
      expect(hasSameContent([
        { content: { id: 1, parentId: 2 }, type: 'content' },
        { content: { id: 1, parentId: 3 }, type: 'content' }
      ])).to.be.equal(true)
    })
  })

  describe('with contents and comments', () => {
    it('should return false if a element has a different content id or parentId', () => {
      expect(hasSameContent([
        { content: { id: 2, parentId: 3 }, type: 'content' },
        { content: { id: 1, parentId: 3 }, type: 'comment' }
      ])).to.be.equal(false)
    })

    it('should return true if all elements has same content', () => {
      expect(hasSameContent([
        { content: { id: 2, parentId: 3 }, type: 'content' },
        { content: { id: 1, parentId: 2 }, type: 'comment' }
      ])).to.be.equal(true)
    })
  })

  describe('only with comments', () => {
    it('should return false if a element has a different content id or parentId', () => {
      expect(hasSameContent([
        { content: { id: 2, parentId: 1 }, type: 'comment' },
        { content: { id: 1, parentId: 2 }, type: 'comment' }
      ])).to.be.equal(false)
    })

    it('should return true if all elements has same content', () => {
      expect(hasSameContent([
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
