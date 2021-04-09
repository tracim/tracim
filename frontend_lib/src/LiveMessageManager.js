import { CUSTOM_EVENT } from './customEvent.js'
import { BroadcastChannel, createLeaderElection } from 'broadcast-channel'

export const LIVE_MESSAGE_STATUS = {
  PENDING: 'pending', // INFO - CH - 2020-05-14 - "pending" means connecting started but not yet got the initial event from backend
  OPENED: 'opened',
  CLOSED: 'closed',
  ERROR: 'error',
  HEARTBEAT_FAILED: 'heartbeat_failed'
}

// INFO - RJ - 2020-08-12  - increment this number each time the channel protocol is changed in an incompatible way
const BROADCAST_CHANNEL_NAME = 'tracim-frontend-1'

/**
 * INFO - SG - 2020-07-02, RJ - 2020-08-12
 * This class manages the Tracim Live Messages:
 * - dispatches live messages through a custom event
 * - dispatches status changes through a custom event
 * - reconnects in case of error in EventSource
 * - reconnects if the keep-alive events are not received
 * - shares the connection with other pages of Tracim open in the same browser using a BroadcastChannel
 */
export class LiveMessageManager {
  // TODO - SG - 2020-07-03 - This interval could be provided by the backend
  constructor (heartBeatIntervalMs = 30000, reconnectionIntervalMs = 1000) {
    this.status = LIVE_MESSAGE_STATUS.CLOSED
    this.eventSource = null
    this.broadcastChannel = null
    this.heartbeatFailureTimerId = -1
    this.heartBeatIntervalMs = heartBeatIntervalMs
    this.reconnectionIntervalMs = reconnectionIntervalMs
    this.reconnectionTimerId = 0
    this.userId = null
    this.host = null
    this.lastEventId = 0
    this.leftoverEventIdList = []
  }

  openLiveMessageConnection (userId, host) {
    this.userId = userId
    this.host = host

    this.setStatus(LIVE_MESSAGE_STATUS.PENDING)
    this.openBroadcastChannel()
  }

  electLeader () {
    const elector = createLeaderElection(this.broadcastChannel)
    elector.awaitLeadership().then(this.openEventSourceConnection.bind(this))
  }

  broadcastChannelMessageReceived (message) {
    if (message.canIHaveStatus && this.eventSource) {
      this.broadcastChannel.postMessage({ status: this.status })
    }

    if (this.eventSource && (message.status || message.tlm)) {
      // NOTE - 2020-09-14 - RJ
      // There are two leaders. We reset the connection and
      // hope that a proper leader election will fix the situation.
      this.restartLiveMessageConnection()
    }

    if (message.status) {
      this.setStatus(message.status)
    }

    if (message.tlm) {
      this.dispatchLiveMessage(message.tlm)
    }
  }

  openEventSourceConnection () {
    const url = this.host

    this.closeEventSourceConnection()

    // INFO - SG - 2021-04-08 - restart from the last received event id
    // or from the predecessor of the last leftover event id if there are leftovers
    const afterId = this.leftoverEventIdList.length ? Math.min(...this.leftoverEventIdList) - 1 : this.lastEventId
    const afterEventFilter = afterId ? `?after_event_id=${afterId}` : ''

    this.eventSource = new EventSource(
      `${url}/users/${this.userId}/live_messages${afterEventFilter}`,
      { withCredentials: true }
    )

    this.broadcastStatus(LIVE_MESSAGE_STATUS.PENDING)

    this.eventSource.onopen = () => {
      console.log('%c.:. TLM Connected: ', 'color: #ccc0e2')
    }

    this.eventSource.onmessage = (e) => {
      const tlm = JSON.parse(e.data)
      console.log('%c.:. TLM received: ', 'color: #ccc0e2', { ...e, data: tlm })
      this.broadcastChannel.postMessage({ tlm })
      this.dispatchLiveMessage(tlm)
      this.stopHeartbeatFailureTimer()
      this.startHeartbeatFailureTimer()
    }

    this.eventSource.onerror = (e) => {
      console.log('%c.:. TLM Error: ', 'color: #ccc0e2', e)
      this.broadcastStatus(LIVE_MESSAGE_STATUS.ERROR)
      this.restartEventSourceConnection()
    }

    this.eventSource.addEventListener('stream-open', () => {
      console.log('%c.:. TLM StreamOpen: ', 'color: #ccc0e2')
      this.broadcastStatus(LIVE_MESSAGE_STATUS.OPENED)
    })

    this.eventSource.addEventListener('keep-alive', () => {
      console.log('%c.:. TLM KeepAlive: ', 'color: #ccc0e2')
      this.stopHeartbeatFailureTimer()
      this.startHeartbeatFailureTimer()
    })

    this.startHeartbeatFailureTimer()
  }

  closeEventSourceConnection () {
    if (this.eventSource) {
      this.eventSource.close()
      this.stopHeartbeatFailureTimer()
      if (this.reconnectionTimerId) {
        globalThis.clearTimeout(this.reconnectionTimerId)
        this.reconnectionTimerId = 0
      }
      this.eventSource = null
    }
  }

  closeBroadcastChannel () {
    if (this.broadcastChannel) {
      this.broadcastChannel.close()
      this.broadcastChannel = null
    }
  }

  openBroadcastChannel () {
    if (!this.broadcastChannel) {
      this.broadcastChannel = new BroadcastChannel(BROADCAST_CHANNEL_NAME)
      this.broadcastChannel.addEventListener('message', this.broadcastChannelMessageReceived.bind(this))
      this.broadcastChannel.postMessage({ canIHaveStatus: true })
      this.electLeader()
    }
  }

  restartLiveMessageConnection () {
    this.closeEventSourceConnection()
    this.closeBroadcastChannel()
    this.openBroadcastChannel()
  }

  closeLiveMessageConnection () {
    this.closeEventSourceConnection()
    this.closeBroadcastChannel()

    console.log('%c.:. TLM Closed')
    this.setStatus(LIVE_MESSAGE_STATUS.CLOSED)
    return true
  }

  restartEventSourceConnection () {
    if (this.reconnectionTimerId) return

    // NOTE - 2020-08-19 - RJ
    // We must not let the browser auto-reconnect. We need to
    // use an URL containing the last received event id when
    // reconnecting. We therefore close the connection.
    // NOTE - 2020-08-20 - RJ
    // And we also need to check whether the disconnection was
    // not caused because the user has been logged out
    this.closeEventSourceConnection()

    this.reconnectionTimerId = setTimeout(async () => {
      // NOTE - 2020-08-19 - RJ
      // The live message manager can be closed during the timeout.
      if (this.status === LIVE_MESSAGE_STATUS.CLOSED) return

      // NOTE - 2020-08-20 - RJ
      // Let's check that the user has not been logged out. We do this by
      // pinging whoami. In a perfect world, we would have checked the status of
      // the EventSource request. The world is not perfect and sadly, EventSource
      // does not expose the HTTP status.
      try {
        // NOTE - 2020-08-26 - SG
        // setup a timeout for this fetch: in some cases when resuming a computer
        // the request isn't transmitted at all (so the response is never received)
        const controller = new globalThis.AbortController()
        const fetchTimeoutId = setTimeout(() => {
          controller.abort()
        }, this.reconnectionIntervalMs)
        const response = await fetch(`${this.host}/auth/whoami`, { signal: controller.signal })
        clearTimeout(fetchTimeoutId)
        if (response.status === 401) {
          this.reconnectionTimerId = 0
          GLOBAL_dispatchEvent({ type: CUSTOM_EVENT.DISCONNECTED_FROM_API, data: {} })
          this.closeLiveMessageConnection()
          return
        }
      } catch (e) {
        // NOTE - 2020-08-26 - SG
        // An error while fetching whoami, do not retry directly
        // but instead re-open the connection
        // if the re-opening fails, the reconnection will
        // happen once more (and thus retry the whoami)
        console.log('%c.:. Got Error while checking user connection state: ', 'color: #ccc0e2', e)
      }

      this.openEventSourceConnection()
      this.reconnectionTimerId = 0
    }, this.reconnectionIntervalMs)
  }

  dispatchLiveMessage (tlm) {
    const isLeftover = this.leftoverEventIdList.includes(tlm.event_id)
    if (this.lastEventId >= tlm.event_id && !isLeftover) {
      console.log('INFO: prevented a live message to be dispatched a second time:', tlm)
      return
    }

    if (isLeftover) {
      this.leftoverEventIdList = this.leftoverEventIdList.filter(id => id !== tlm.event_id)
    }

    // NOTE - SG - 2021-04-08 - keep track of event ids we didn't receive yet
    // So that we can dispatch them when they arrive (see above)
    // The loop won't do anything if tlm.event_id === this.lastEventId + 1
    if (this.lastEventId) {
      for (let eventId = this.lastEventId + 1; eventId < tlm.event_id; ++eventId) {
        this.leftoverEventIdList.push(eventId)
      }
    }
    this.lastEventId = Math.max(this.lastEventId, tlm.event_id)

    const customEvent = new CustomEvent(CUSTOM_EVENT.TRACIM_LIVE_MESSAGE, {
      detail: {
        type: tlm.event_type,
        data: tlm
      }
    })
    console.log('%cGLOBAL_dispatchLiveMessage', 'color: #ccc', tlm)
    document.dispatchEvent(customEvent)
  }

  startHeartbeatFailureTimer () {
    this.heartbeatFailureTimerId = setTimeout(
      this.handleHeartbeatFailure.bind(this),
      1.5 * this.heartBeatIntervalMs
    )
  }

  stopHeartbeatFailureTimer () {
    if (this.heartbeatFailureTimerId === -1) return
    globalThis.clearTimeout(this.heartbeatFailureTimerId)
    this.heartbeatFailureTimerId = -1
  }

  handleHeartbeatFailure () {
    this.broadcastStatus(LIVE_MESSAGE_STATUS.HEARTBEAT_FAILED)
    this.restartEventSourceConnection()
  }

  broadcastStatus (status) {
    if (this.status === status) return
    this.setStatus(status)
    this.broadcastChannel.postMessage({ status })
  }

  setStatus (status) {
    if (this.status === status) return
    console.log('TLM STATUS: ', status)
    this.status = status
    GLOBAL_dispatchEvent({
      type: CUSTOM_EVENT.TRACIM_LIVE_MESSAGE_STATUS_CHANGED,
      data: { status }
    })
  }
}
