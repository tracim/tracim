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

const openedManager = (heartbeatTimeOut, reconnectionInterval) => {
  const manager = new LiveMessageManager(heartbeatTimeOut, reconnectionInterval)
  manager.openLiveMessageConnection(userId, apiUrl)
  manager.eventSource.emitOpen()
  return manager
}

describe('LiveMessageManager class', () => {
  const managers = []

  describe('the openLiveMessageConnection() method', () => {
    const manager = new LiveMessageManager(30000, 0)
    managers.push(manager)
    manager.openLiveMessageConnection(userId, apiUrl)

    it('should set manager status to PENDING when called', () => {
      expect(manager.status).to.be.equal(LIVE_MESSAGE_STATUS.PENDING)
    })

    it('should create a BroadcastChannel', () => {
      expect(manager.broadcastChannel.constructor.name).to.not.be.equal('BroadcastChannel')
      manager.closeLiveMessageConnection()
    })
  })

  describe('the openEventSourceConnection() method', () => {
    const manager = new LiveMessageManager(30000, 0)
    managers.push(manager)
    manager.openLiveMessageConnection(userId, apiUrl)

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

    it('should restart connection when an error is raised by EventSource', async () => {
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
      managers.push(manager)
      manager.closeLiveMessageConnection()
      expect(manager.eventSource).to.be.equal(null)
    })

    it('should set manager status to CLOSED', () => {
      const manager = openedManager()
      managers.push(manager)
      manager.closeLiveMessageConnection()
      expect(manager.status).to.be.equal(LIVE_MESSAGE_STATUS.CLOSED)
      manager.closeLiveMessageConnection()
    })
  })

  describe('the heartbeat timer', async () => {
    it('should restart connection when the heartbeat event is not received in time', async () => {
      const manager = openedManager(2, 10)
      managers.push(manager)
      expect(await manager.onStatusChange()).to.be.equal(LIVE_MESSAGE_STATUS.HEARTBEAT_FAILED)
      expect(await manager.onStatusChange()).to.be.equal(LIVE_MESSAGE_STATUS.PENDING)
      manager.closeLiveMessageConnection()
    })
  })

  describe('after losing the connection', async function () {
    it('should restart connection with the after_event_id parameter', async () => {
      const manager = new LiveMessageManager(30000, 0)
      managers.push(manager)

      manager.openLiveMessageConnection(userId, apiUrl)
      manager.eventSource.emitOpen()
      manager.eventSource.emit('stream-open')
      expect(manager.eventSource.readyState).to.be.equal(1)
      expect(manager.status).to.be.equal(LIVE_MESSAGE_STATUS.OPENED)

      manager.eventSource.emitMessage({ data: '{ "event_id": 42 }' })
      expect(manager.lastEventId).to.be.equal(42)

      const promiseStatus = manager.onStatusChange()
      manager.eventSource.emitError()
      expect(await promiseStatus).to.be.equal(LIVE_MESSAGE_STATUS.ERROR)
      expect(await manager.onStatusChange()).to.be.equal(LIVE_MESSAGE_STATUS.PENDING)

      manager.eventSource.emitOpen()
      manager.eventSource.emit('stream-open')
      expect(manager.eventSource.readyState).to.be.equal(1)
      expect(manager.status).to.be.equal(LIVE_MESSAGE_STATUS.OPENED)

      expect(manager.eventSource.url).to.be.equal(
         `${apiUrl}/users/${userId}/live_messages?after_event_id=42`
      )

      manager.closeLiveMessageConnection()
    })
  })

  describe('after closing and re-opening the connection', async function () {
    it('should restart connection with the after_event_id parameter', async () => {
      const manager = new LiveMessageManager(30000, 0)
      managers.push(manager)

      manager.openLiveMessageConnection(userId, apiUrl)
      manager.eventSource.emitOpen()
      manager.eventSource.emit('stream-open')
      expect(manager.eventSource.readyState).to.be.equal(1)
      expect(manager.status).to.be.equal(LIVE_MESSAGE_STATUS.OPENED)

      manager.eventSource.emitMessage({ data: '{ "event_id": 1337 }' })
      expect(manager.lastEventId).to.be.equal(1337)

      manager.closeLiveMessageConnection()
      manager.openLiveMessageConnection(userId, apiUrl)

      manager.eventSource.emitOpen()
      manager.eventSource.emit('stream-open')
      expect(manager.eventSource.readyState).to.be.equal(1)
      expect(manager.status).to.be.equal(LIVE_MESSAGE_STATUS.OPENED)

      expect(manager.eventSource.url).to.be.equal(
         `${apiUrl}/users/${userId}/live_messages?after_event_id=42`
      )

      manager.closeLiveMessageConnection()
    })
  })

  after(() => {
    // NOTE SG 2020-07-03 - close all connections to clear timeouts so that mocha exits properly
    // NOTE RJ 2020-08-19 - and between tests, so that managers from different tests do not interact with each other
    for (const manager of managers) {
      manager.closeLiveMessageConnection()
    }
  })
})
