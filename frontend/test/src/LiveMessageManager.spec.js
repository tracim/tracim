import { expect } from 'chai'
import {
  LiveMessageManager,
  LIVE_MESSAGE_STATUS
} from '../../src/util/LiveMessageManager.js'

const apiUrl = 'http://localhost/api'
const userId = 1

const openedManager = (heartbeatTimeOut, reconnectionInterval) => {
  const manager = new LiveMessageManager(heartbeatTimeOut, reconnectionInterval)
  manager.openLiveMessageConnection(userId, apiUrl)
  const mockEventSource = manager.eventSource
  mockEventSource.emitOpen()
  return { manager, mockEventSource }
}

const waitForStatus = async (manager, status, timeout = 25) => {
  // NOTE SG 2020-07-03 - have to wait a small amount as manager status changes
  // can be done via a setTimeout
  var retries = 10
  while (manager.status !== status && retries > 0) {
    await new Promise(resolve => setTimeout(resolve, timeout / 10))
    retries--
  }
  return manager.status
}

describe('LiveMessageManager class', () => {
  const managers = []

  describe('the openLiveMessageConnection() method', () => {
    const manager = new LiveMessageManager(30000, 0)
    managers.push(manager)
    manager.openLiveMessageConnection(userId, apiUrl)
    const mockEventSource = manager.eventSource
    it('should set the create an EventSource and set manager status to PENDING when called', () => {
      expect(mockEventSource).to.not.be.equal(null)
      expect(mockEventSource.readyState).to.be.equal(0)
      expect(manager.status).to.be.equal(LIVE_MESSAGE_STATUS.PENDING)
    })
    it('should set manager status to OPENED when initial event is received', () => {
      mockEventSource.emitOpen()
      mockEventSource.emit('stream-open')
      expect(mockEventSource.readyState).to.be.equal(1)
      expect(manager.status).to.be.equal(LIVE_MESSAGE_STATUS.OPENED)
    })
    it('should restart connection when an error is raised by EventSource', async () => {
      mockEventSource.emitError()
      expect(manager.status).to.be.equal(LIVE_MESSAGE_STATUS.ERROR)
      expect(await waitForStatus(manager, LIVE_MESSAGE_STATUS.PENDING)).to.be.equal(LIVE_MESSAGE_STATUS.PENDING)
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
      expect(await waitForStatus(manager, LIVE_MESSAGE_STATUS.HEARTBEAT_FAILED)).to.be.equal(LIVE_MESSAGE_STATUS.HEARTBEAT_FAILED)
      expect(await waitForStatus(manager, LIVE_MESSAGE_STATUS.PENDING)).to.be.equal(LIVE_MESSAGE_STATUS.PENDING)
    })
  })

  after(() => {
    // NOTE SG 2020-07-03 - close all connections to clear timeouts so that mocha exits properly
    for (const manager of managers) {
      manager.closeLiveMessageConnection()
    }
  })
})
