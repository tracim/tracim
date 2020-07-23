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
import notificationList, { getNotificationFromTLM } from '../../../src/reducer/notificationList.js'
import { globalManagerFromApi } from '../../fixture/user/globalManagerFromApi.js'
import { firstWorkspaceFromApi } from '../../fixture/workspace/firstWorkspace.js'

const notificationfromAPI = {
  created: '2020-07-23T12:44:50Z',
  event_id: 583,
  event_type: 'workspace_member.created',
  fields: {
    author: globalManagerFromApi,
    workspace: firstWorkspaceFromApi
  },
  read: null
}

const notificationfromTLM = {
  created: '2020-07-23T12:44:50Z',
  event_id: 583,
  event_type: 'workspace_member.created',
  author: globalManagerFromApi,
  workspace: firstWorkspaceFromApi,
  read: null
}

const notNotificationTLM = {
  created: '2020-07-23T13:07:51Z',
  event_id: 21187,
  event_type: 'user.modified',
  fields: {},
  read: null
}

const notification = {
  author: 'Global manager',
  content: '',
  created: '2020-07-23T12:44:50Z',
  icon: 'fa-user-o',
  id: 583,
  type: 'member.created',
  url: '/ui/workspaces/1/dashboard',
  workspace: 'First workspace',
  read: null
}

describe('reducer notificationList.js', () => {
  describe('functions', () => {
    describe('getNotificationFromTLM', () => {
      it("should return null if type doesn't make a notification", () => {
        expect(getNotificationFromTLM(notNotificationTLM, notNotificationTLM.fields)).to.be.eq(null)
      })

      it('should return a notification object if type does make a notification', () => {
        expect(getNotificationFromTLM(notificationfromAPI, notificationfromAPI.fields)).to.be.deep.equal(notification)
      })
    })
  })

  describe('actions', () => {
    describe(`${SET}/${NOTIFICATION_LIST}`, () => {
      const listOfNotification = notificationList([], setNotificationList([notificationfromAPI]))

      it('should return the list of notification from the objects passed as parameter', () => {
        expect(listOfNotification).to.deep.equal([notification])
      })
    })

    describe(`${ADD}/${NOTIFICATION}`, () => {
      const listOfNotification = notificationList([], addNotification(notificationfromTLM))

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
