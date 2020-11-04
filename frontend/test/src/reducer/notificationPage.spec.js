import { expect } from 'chai'
import {
  ADD,
  addNotification,
  APPEND,
  appendNotificationList,
  NEXT_PAGE,
  NOTIFICATION,
  NOTIFICATION_LIST,
  READ,
  readNotification,
  readNotificationList,
  SET,
  setNextPage,
  setNotificationList
} from '../../../src/action-creator.sync.js'
import notificationPage from '../../../src/reducer/notificationPage.js'
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
  author: 'Global manager',
  content: null,
  created: '2020-07-23T12:44:50Z',
  id: 583,
  type: 'workspace_member.created',
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
      notificationNotReadCount: 0
    }

    describe(`${SET}/${NOTIFICATION_LIST}`, () => {
      const listOfNotification = notificationPage(initialState, setNotificationList([TLM]))

      it('should return the list of notification from the objects passed as parameter', () => {
        expect(listOfNotification).to.deep.equal({ ...initialState, list: [notification] })
      })
    })

    describe(`${ADD}/${NOTIFICATION}`, () => {
      const listOfNotification = notificationPage(initialState, addNotification(TLM))

      it('should return the list of notification added from the object passed as parameter', () => {
        expect(listOfNotification).to.deep.equal({ ...initialState, list: [notification], notificationNotReadCount: 1 })
      })
    })

    describe(`${READ}/${NOTIFICATION}`, () => {
      const listOfNotification = notificationPage({ ...initialState, list: [notification], notificationNotReadCount: 1 }, readNotification(notification.id))

      it('should return the list of objects passed as parameter', () => {
        expect(listOfNotification).to.deep.equal({ ...initialState, list: [{ ...notification, read: true }], notificationNotReadCount: 0 })
      })
    })

    describe(`${READ}/${NOTIFICATION_LIST}`, () => {
      const listOfNotification = notificationPage({ ...initialState, list: [notification], notificationNotReadCount: 1 }, readNotificationList())

      it('should return the list of objects passed as parameter', () => {
        expect(listOfNotification).to.deep.equal({ ...initialState, list: [{ ...notification, read: true }], notificationNotReadCount: 0 })
      })
    })

    describe(`${APPEND}/${NOTIFICATION_LIST}`, () => {
      const listOfNotification = notificationPage({ ...initialState, list: [notification] }, appendNotificationList([{ ...TLM, event_id: 999 }]))

      it('should return the list of notifications appended with the list passed as parameter', () => {
        expect(listOfNotification).to.deep.equal({ ...initialState, list: [notification, { ...notification, id: 999 }] })
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
