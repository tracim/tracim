import { expect } from 'chai'
import {
  LiveMessageManager,
  LIVE_MESSAGE_STATUS
} from '../../src/util/LiveMessageManager.js'

import { enforceOptions } from 'broadcast-channel'

// RJ - 2020-09-13 - NOTE: Makes the tests run faster.
// See https://github.com/pubkey/broadcast-channel#enforce-a-options-globally
enforceOptions({ type: 'simulate' })

const apiUrl = 'http://localhost/api'
const userId = 1

// RJ - 2020-09-13 - NOTE: The next two methods are used to track status changes
// in this test suit.

const setStatusOrig = LiveMessageManager.prototype.setStatus
LiveMessageManager.prototype.setStatus = function (status) {
  setStatusOrig.call(this, status)

  const resolve = (this.statuscallbacks && this.statuscallbacks.shift())
  resolve && resolve()
}

LiveMessageManager.prototype.onstatuschange = function (callback) {
  if (!this.statuscallbacks) this.statuscallbacks = []
  this.statuscallbacks.push(callback)
}

// RJ - 2020-09-13 - NOTE: We don't want the election of a leader to take place here
// We directly open an EventSource connection. We are alone.
LiveMessageManager.prototype.electLeader = LiveMessageManager.prototype.openEventSourceConnection

const openedManager = (heartbeatTimeOut, reconnectionInterval) => {
  const manager = new LiveMessageManager(heartbeatTimeOut, reconnectionInterval)
  manager.openLiveMessageConnection(userId, apiUrl, true)
  const mockEventSource = manager.eventSource
  mockEventSource.emitOpen()
  return { manager, mockEventSource }
}

const waitForStatus = async (manager) => {
  await new Promise(resolve => { manager.onstatuschange(resolve) })
  return manager.status
}

describe('LiveMessageManager class', () => {
  const managers = []

  describe('the openLiveMessageConnection() method', () => {
    const manager = new LiveMessageManager(30000, 0)
    managers.push(manager)
    manager.openLiveMessageConnection(userId, apiUrl, true)
    it('should set manager status to PENDING when called', () => {
      expect(manager.status).to.be.equal(LIVE_MESSAGE_STATUS.PENDING)
    })
    it('should create a BroadcastChannel', () => {
      expect(managers.broadcastChannel).to.not.be.equal(null)
    })
  })

  describe('the openEventSourceConnection() method', () => {
    const manager = new LiveMessageManager(30000, 0)
    managers.push(manager)
    manager.openLiveMessageConnection(userId, apiUrl, true)
    it('should create an EventSource', () => {
      expect(manager.eventSource).to.not.be.equal(null)
      expect(manager.eventSource.readyState).to.be.equal(0)
    })
    it('should set manager status to OPENED when initial event is received', () => {
      manager.eventSource.emitOpen()
      manager.eventSource.emit('stream-open')
      expect(manager.eventSource.readyState).to.be.equal(1)
      expect(manager.status).to.be.equal(LIVE_MESSAGE_STATUS.OPENED)
    })
    it('should restart connection when an error is raised by EventSource', async function () {
      const promiseStatus1 = waitForStatus(manager)
      const promiseStatus2 = waitForStatus(manager)
      manager.eventSource.emitError()
      expect(await promiseStatus1).to.be.equal(LIVE_MESSAGE_STATUS.ERROR)
      expect(await promiseStatus2).to.be.equal(LIVE_MESSAGE_STATUS.PENDING)
    })
  })

  describe('the closeLiveMessageConnection() method', () => {
    it('should close the EventSource', () => {
      const { manager, mockEventSource } = openedManager()
      managers.push(manager)
      manager.closeLiveMessageConnection()
      expect(mockEventSource.readyState).to.be.equal(2)
    })
    it('should set manager status to CLOSED', () => {
      const { manager } = openedManager()
      managers.push(manager)
      manager.closeLiveMessageConnection()
      expect(manager.status).to.be.equal(LIVE_MESSAGE_STATUS.CLOSED)
    })
  })

  describe('the heartbeat timer', () => {
    it('should restart connection when the heartbeat event is not received in time', async () => {
      const { manager } = openedManager(2, 10)
      managers.push(manager)
      expect(await waitForStatus(manager)).to.be.equal(LIVE_MESSAGE_STATUS.HEARTBEAT_FAILED)
      expect(await waitForStatus(manager)).to.be.equal(LIVE_MESSAGE_STATUS.PENDING)
    })
  })

  after(() => {
    // NOTE SG 2020-07-03 - close all connections to clear timeouts so that mocha exits properly
    for (const manager of managers) {
      manager.closeLiveMessageConnection()
    }
  })
})
