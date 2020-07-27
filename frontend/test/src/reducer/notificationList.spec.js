import { expect } from 'chai'
import {
  ADD,
  addNotification,
  NOTIFICATION,
  NOTIFICATION_LIST,
  SET,
  setNotificationList,
  UPDATE,
  updateNotification
} from '../../../src/action-creator.sync.js'
import notificationList from '../../../src/reducer/notificationList.js'
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

describe('reducer notificationList.js', () => {
  describe('actions', () => {
    describe(`${SET}/${NOTIFICATION_LIST}`, () => {
      const listOfNotification = notificationList([], setNotificationList([TLM]))

      it('should return the list of notification from the objects passed as parameter', () => {
        expect(listOfNotification).to.deep.equal([notification])
      })
    })

    describe(`${ADD}/${NOTIFICATION}`, () => {
      const listOfNotification = notificationList([], addNotification(TLM))

      it('should return the list of notification added from the object passed as parameter', () => {
        expect(listOfNotification).to.deep.equal([notification])
      })
    })

    describe(`${UPDATE}/${NOTIFICATION}`, () => {
      const listOfNotification = notificationList([notification], updateNotification({ ...notification, read: true }))

      it('should return the list of objects passed as parameter', () => {
        expect(listOfNotification).to.deep.equal([{ ...notification, read: true }])
      })
    })
  })
})
