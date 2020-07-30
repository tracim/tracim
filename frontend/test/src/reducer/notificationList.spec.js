import { expect } from 'chai'
import {
  ADD,
  addNotification,
  APPEND,
  appendNotificationList,
  NEXT_PAGE,
  NOTIFICATION,
  NOTIFICATION_LIST,
  SET,
  setNextPage,
  setNotificationList,
  UPDATE,
  updateNotification
} from '../../../src/action-creator.sync.js'
import notificationPage from '../../../src/reducer/notificationPage.js'
import { globalManagerFromApi } from '../../fixture/user/globalManagerFromApi.js'
import { firstWorkspaceFromApi } from '../../fixture/workspace/firstWorkspace.js'

const TLM = {
  created: '2020-07-23T12:44:50Z',
  event_id: 583,
  event_type: 'workspace_member.created',
  fields: {
    author: globalManagerFromApi,
    workspace: firstWorkspaceFromApi
  },
  read: null
}

const notification = {
  author: 'Global manager',
  content: null,
  created: '2020-07-23T12:44:50Z',
  id: 583,
  type: 'workspace_member.created',
  workspace: firstWorkspaceFromApi,
  read: null
}

describe('reducer notificationPage.js', () => {
  describe('actions', () => {
    describe(`${SET}/${NOTIFICATION_LIST}`, () => {
      const listOfNotification = notificationPage({ list: [], hasNextPage: false, nextPageToken: '' }, setNotificationList([TLM]))

      it('should return the list of notification from the objects passed as parameter', () => {
        expect(listOfNotification).to.deep.equal({ list: [notification], hasNextPage: false, nextPageToken: '' })
      })
    })

    describe(`${ADD}/${NOTIFICATION}`, () => {
      const listOfNotification = notificationPage({ list: [], hasNextPage: false, nextPageToken: '' }, addNotification(TLM))

      it('should return the list of notification added from the object passed as parameter', () => {
        expect(listOfNotification).to.deep.equal({ list: [notification], hasNextPage: false, nextPageToken: '' })
      })
    })

    describe(`${UPDATE}/${NOTIFICATION}`, () => {
      const listOfNotification = notificationPage({ list: [notification], hasNextPage: false, nextPageToken: '' }, updateNotification({ ...notification, read: true }))

      it('should return the list of objects passed as parameter', () => {
        expect(listOfNotification).to.deep.equal({ list: [{ ...notification, read: true }], hasNextPage: false, nextPageToken: '' })
      })
    })

    describe(`${APPEND}/${NOTIFICATION_LIST}`, () => {
      const listOfNotification = notificationPage({ list: [notification], hasNextPage: false, nextPageToken: '' }, appendNotificationList([{ ...TLM, event_id: 999 }]))

      it('should return the list of notifications appended with the list passed as parameter', () => {
        expect(listOfNotification).to.deep.equal({ list: [notification, { ...notification, id: 999 }], hasNextPage: false, nextPageToken: '' })
      })
    })

    describe(`${SET}/${NEXT_PAGE}`, () => {
      const listOfNotification = notificationPage({ list: [], hasNextPage: false, nextPageToken: '' }, setNextPage(true, 'token'))

      it('should return the object with the parameters hasNextPage and nextPageToken updated', () => {
        expect(listOfNotification).to.deep.equal({ list: [], hasNextPage: true, nextPageToken: 'token' })
      })
    })
  })
})
