import { expect } from 'chai'
import { mockGetWhoami, mockGetWhoamiWithDelay, mockGetWhoamiFailure } from './apiMock.js'
import { CUSTOM_EVENT } from '../src/customEvent.js'

import {
  LiveMessageManager,
  LIVE_MESSAGE_STATUS
} from '../src/LiveMessageManager.js'

import { enforceOptions } from 'broadcast-channel'

// RJ - 2020-09-13 - NOTE: Makes the tests run faster.
// See https://github.com/pubkey/broadcast-channel#enforce-a-options-globally
enforceOptions({ type: 'simulate' })

const apiUrl = 'http://localhost/api'
const userId = 1

// RJ - 2020-09-13 - NOTE: The next two methods are used to track status changes
// in this test suite.

const setStatusOrig = LiveMessageManager.prototype.setStatus
LiveMessageManager.prototype.setStatus = function (status) {
  const statusIsNew = this.status !== status

  setStatusOrig.call(this, status)

  if (statusIsNew) {
    const resolve = (this.statuscallbacks && this.statuscallbacks.shift())
    resolve && resolve(this.status)
  }
}

LiveMessageManager.prototype.onStatusChange = async function () {
  if (!this.statuscallbacks) this.statuscallbacks = []
  return new Promise(resolve => this.statuscallbacks.push(resolve))
}

// RJ - 2020-09-13 - NOTE: We don't want the election of a leader to take place here
// We directly open an EventSource connection. We are alone.
LiveMessageManager.prototype.electLeader = LiveMessageManager.prototype.openEventSourceConnection

const managers = []

const createManager = (heartbeatTimeOut, reconnectionInterval) => {
  closeManagers()
  const manager = new LiveMessageManager(heartbeatTimeOut, reconnectionInterval)
  managers.push(manager)
  return manager
}

const openedManager = (heartbeatTimeOut, reconnectionInterval) => {
  const manager = createManager(heartbeatTimeOut, reconnectionInterval)
  manager.openLiveMessageConnection(userId, apiUrl)
  manager.eventSource.emitOpen()
  return manager
}

const closeManagers = () => {
  for (const manager of managers) {
    manager.closeLiveMessageConnection()
  }
}

describe('LiveMessageManager class', () => {
  describe('the openLiveMessageConnection() method', () => {
    it('should set manager status to PENDING when called', () => {
      const manager = createManager(30000, 0)
      manager.openLiveMessageConnection(userId, apiUrl)
      expect(manager.status).to.be.equal(LIVE_MESSAGE_STATUS.PENDING)
    })

    it('should create a BroadcastChannel', () => {
      const manager = createManager(30000, 0)
      manager.openLiveMessageConnection(userId, apiUrl)
      expect(manager.broadcastChannel.constructor.name).to.not.be.equal('BroadcastChannel')
    })
  })

  describe('the openEventSourceConnection() method', () => {
    it('should create an EventSource', () => {
      const manager = createManager(30000, 0)
      manager.openLiveMessageConnection(userId, apiUrl)
      expect(manager.eventSource).to.not.be.equal(null)
      expect(manager.eventSource.readyState).to.be.equal(0)
    })

    it('should set manager status to OPENED when initial event is received', () => {
      const manager = createManager(30000, 0)
      manager.openLiveMessageConnection(userId, apiUrl)

      manager.eventSource.emitOpen()
      manager.eventSource.emit('stream-open')
      expect(manager.eventSource.readyState).to.be.equal(1)
      expect(manager.status).to.be.equal(LIVE_MESSAGE_STATUS.OPENED)
    })

    it('should restart connection when an error is raised by EventSource', async () => {
      const manager = createManager(30000, 0)
      manager.openLiveMessageConnection(userId, apiUrl)

      mockGetWhoami(apiUrl, 200)
      const promiseStatus1 = manager.onStatusChange()
      const promiseStatus2 = manager.onStatusChange()
      manager.eventSource.emitError()
      expect(await promiseStatus1).to.be.equal(LIVE_MESSAGE_STATUS.ERROR)
      expect(await promiseStatus2).to.be.equal(LIVE_MESSAGE_STATUS.PENDING)
      manager.closeLiveMessageConnection()
    })
  })

  describe('the closeLiveMessageConnection() method', () => {
    it('should close the EventSource', () => {
      const manager = openedManager()
      manager.closeLiveMessageConnection()
      expect(manager.eventSource).to.be.equal(null)
    })

    it('should set manager status to CLOSED', () => {
      const manager = openedManager()
      manager.closeLiveMessageConnection()
      expect(manager.status).to.be.equal(LIVE_MESSAGE_STATUS.CLOSED)
      manager.closeLiveMessageConnection()
    })
  })

  describe('the heartbeat timer', async () => {
    it('should restart connection when the heartbeat event is not received in time', async () => {
      mockGetWhoami(apiUrl, 200)
      const manager = openedManager(2, 10)
      expect(await manager.onStatusChange()).to.be.equal(LIVE_MESSAGE_STATUS.HEARTBEAT_FAILED)
      expect(await manager.onStatusChange()).to.be.equal(LIVE_MESSAGE_STATUS.PENDING)
      manager.closeLiveMessageConnection()
    })
  })

  describe('after losing the connection', async function () {
    const testCases = [
      {
        description: 'nominal case',
        mockWhoami: () => { return mockGetWhoami(apiUrl, 200) },
        reconnectionInterval: 10
      },
      {
        description: 'whoami fetch fails',
        mockWhoami: () => { return mockGetWhoami(apiUrl, 500) },
        reconnectionInterval: 10
      },
      {
        description: 'whoami fetch timeouts',
        mockWhoami: () => { return mockGetWhoamiWithDelay(apiUrl, 200) },
        reconnectionInterval: 10
      },
      {
        description: 'whoami fetch errors',
        mockWhoami: () => { return mockGetWhoamiFailure(apiUrl) },
        reconnectionInterval: 10
      }
    ]
    for (const testCase of testCases) {
      it(`should restart connection with the after_event_id parameter (${testCase.description})`, async () => {
        const mock = testCase.mockWhoami()
        const manager = openedManager(30000, testCase.reconnectionInterval)

        manager.eventSource.emitMessage({ data: '{ "event_id": 42 }' })
        expect(manager.lastEventId).to.be.equal(42)

        const promiseStatus = manager.onStatusChange()
        manager.eventSource.emitError()
        expect(await promiseStatus).to.be.equal(LIVE_MESSAGE_STATUS.ERROR)
        expect(await manager.onStatusChange()).to.be.equal(LIVE_MESSAGE_STATUS.PENDING)
        expect(mock.isDone()).to.be.equal(true)

        manager.eventSource.emitOpen()
        manager.eventSource.emit('stream-open')
        expect(manager.eventSource.readyState).to.be.equal(1)
        expect(manager.status).to.be.equal(LIVE_MESSAGE_STATUS.OPENED)

        expect(manager.eventSource.url).to.be.equal(
          `${apiUrl}/users/${userId}/live_messages?after_event_id=42`
        )

        manager.closeLiveMessageConnection()
      })
    }
  })

  describe('after closing and re-opening the connection', async () => {
    it('should restart connection with the after_event_id parameter', async () => {
      const manager = openedManager(30000, 0)
      manager.eventSource.emitMessage({ data: '{ "event_id": 1337 }' })
      expect(manager.lastEventId).to.be.equal(1337)

      manager.closeLiveMessageConnection()
      manager.openLiveMessageConnection(userId, apiUrl)

      manager.eventSource.emitOpen()
      manager.eventSource.emit('stream-open')
      expect(manager.eventSource.readyState).to.be.equal(1)
      expect(manager.status).to.be.equal(LIVE_MESSAGE_STATUS.OPENED)

      expect(manager.eventSource.url).to.be.equal(
         `${apiUrl}/users/${userId}/live_messages?after_event_id=1337`
      )

      manager.closeLiveMessageConnection()
    })
  })

  describe('after losing the connection due to a logout', async () => {
    it('should redirect to the login page (by sending a custom event)', async () => {
      mockGetWhoami(apiUrl, 401)
      const manager = openedManager(30000, 10)
      global.GLOBAL_dispatchEvent.resetHistory()
      const promiseStatus1 = manager.onStatusChange()
      const promiseStatus2 = manager.onStatusChange()
      manager.eventSource.emitError()
      expect(await promiseStatus1).to.be.equal(LIVE_MESSAGE_STATUS.ERROR)
      expect(await promiseStatus2).to.be.equal(LIVE_MESSAGE_STATUS.CLOSED)
      const customEventTypes = global.GLOBAL_dispatchEvent.args.map(args => args[0].type)
      expect(customEventTypes.includes(CUSTOM_EVENT.DISCONNECTED_FROM_API)).to.be.equal(true)

      manager.closeLiveMessageConnection()
    })
  })

  it('should kill extraneous leaders', () => {
    // we are faking two leaders by opening the event source connection on both managers

    const manager1 = createManager(30000, 0)
    manager1.openLiveMessageConnection(userId, apiUrl)
    manager1.openEventSourceConnection(userId, apiUrl)
    manager1.eventSource.emitOpen()
    manager1.eventSource.emit('stream-open')

    const manager2 = createManager(30000, 0)
    manager2.openLiveMessageConnection(userId, apiUrl)
    manager2.openEventSourceConnection(userId, apiUrl)
    manager2.eventSource.emitOpen()
    manager2.eventSource.emit('stream-open')

    expect(!manager1.eventSource || !manager2.eventSource).to.be.equal(true)

    manager1.closeLiveMessageConnection()
    manager2.closeLiveMessageConnection()
  })

  describe('the dispatchLiveMessage method', () => {
    it('should not dispatch the same message twice', () => {
      const manager = createManager(30000, 0)
      manager.openLiveMessageConnection(userId, apiUrl)

      document.dispatchEvent.resetHistory()
      manager.dispatchLiveMessage({ event_id: 42 })
      expect(document.dispatchEvent.callCount).to.equal(1)
      document.dispatchEvent.resetHistory()
      manager.dispatchLiveMessage({ event_id: 42 })
      expect(document.dispatchEvent.callCount).to.equal(0)

      manager.closeLiveMessageConnection()
    })

    it('should dispatch a leftover message (not received in ascending order)', () => {
      const manager = createManager(30000, 0)
      manager.openLiveMessageConnection(userId, apiUrl)

      for (const eventId of [42, 44, 43]) {
        document.dispatchEvent.resetHistory()
        manager.dispatchLiveMessage({ event_id: eventId })
        expect(document.dispatchEvent.callCount).to.equal(1)
      }
      manager.closeLiveMessageConnection()
    })
  })

  describe('the openEventSource method', () => {
    it('should take leftover event ids into account', () => {
      const manager = createManager(30000, 0)
      manager.openLiveMessageConnection(userId, apiUrl)
      manager.dispatchLiveMessage({ event_id: 42 })
      manager.dispatchLiveMessage({ event_id: 44 })
      manager.openEventSourceConnection()
      expect(manager.eventSource.url).to.be.equal(
        `${apiUrl}/users/${userId}/live_messages?after_event_id=42`
      )
    })
  })

  after(() => {
    // NOTE SG 2020-07-03 - close all connections to clear timeouts so that mocha exits properly
    // NOTE RJ 2020-08-19 - and between tests, so that managers from different tests do not interact with each other
    closeManagers()
  })
})
