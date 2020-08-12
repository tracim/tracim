import { FETCH_CONFIG } from './helper.js'
import { CUSTOM_EVENT } from 'tracim_frontend_lib'
import { BroadcastChannel, createLeaderElection } from 'broadcast-channel'

export const LIVE_MESSAGE_STATUS = {
  PENDING: 'pending', // INFO - CH - 2020-05-14 - "pending" means connecting started but not yet got the initial event from backend
  OPENED: 'opened',
  CLOSED: 'closed',
  ERROR: 'error',
  HEARTBEAT_FAILED: 'heartbeat_failed'
}

// increment this number each time the channel protocol is changed in an incompatible way
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
    this.reconnectionTimerId = -1
    this.userId = null
    this.host = null
  }

  openLiveMessageConnection (userId, host = null) {
    this.userId = userId
    this.host = host

    if (!this.broadcastChannel) {
      this.broadcastChannel = new BroadcastChannel(BROADCAST_CHANNEL_NAME)
      this.broadcastChannel.addEventListener('message', this.broadcastChannelMessageReceived.bind(this))
    }

    const elector = createLeaderElection(this.broadcastChannel)
    elector.awaitLeadership().then(this.openEventSourceConnection.bind(this))
  }

  broadcastChannelMessageReceived (message) {
    if (message.status) {
      this.setStatus(message.status)
    }

    if (message.tlm) {
      this.dispatchLiveMessage(message.tlm)
    }
  }

  openEventSourceConnection () {
    const url = this.host || FETCH_CONFIG.apiUrl

    this.closeEventSourceConnection()

    this.eventSource = new EventSource(
      `${url}/users/${this.userId}/live_messages`,
      { withCredentials: true }
    )

    this.broadcastAndSetStatus(LIVE_MESSAGE_STATUS.PENDING)

    this.eventSource.onopen = () => {
      console.log('%c.:. TLM Connected: ', 'color: #ccc0e2')
    }

    this.eventSource.onmessage = (e) => {
      const tlm = JSON.parse(e.data)
      console.log('%c.:. TLM received: ', 'color: #ccc0e2', { ...e, data: tlm })
      this.broadcastChannel.postMessage({ tlm })
      this.stopHeartbeatFailureTimer()
      this.startHeartbeatFailureTimer()
    }

    this.eventSource.onerror = (e) => {
      console.log('%c.:. TLM Error: ', 'color: #ccc0e2', e)
      this.broadcastAndSetStatus(LIVE_MESSAGE_STATUS.ERROR)
      this.restartLiveMessageConnection()
    }

    this.eventSource.addEventListener('stream-open', () => {
      console.log('%c.:. TLM StreamOpen: ', 'color: #ccc0e2')
      this.broadcastAndSetStatus(LIVE_MESSAGE_STATUS.OPENED)
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
      console.log('%c.:. TLM Closed')
      this.stopHeartbeatFailureTimer()
      if (this.reconnectionTimerId !== -1) {
        globalThis.clearTimeout(this.reconnectionTimerId)
        this.reconnectionTimerId = -1
      }
      this.eventSource = null
    }
  }

  closeLiveMessageConnection () {
    this.closeEventSourceConnection()
    this.broadcastChannel.close()
    this.setStatus(LIVE_MESSAGE_STATUS.CLOSED)
    return true
  }

  restartLiveMessageConnection () {
    if (this.reconnectionTimerId >= 0) return

    this.reconnectionTimerId = globalThis.setTimeout(() => {
      this.closeLiveMessageConnection()
      this.openLiveMessageConnection(this.userId, this.host)
      this.reconnectionTimerId = -1
    }, this.reconnectionIntervalMs)
  }

  dispatchLiveMessage (tlm) {
    console.log('%cGLOBAL_dispatchLiveMessage', 'color: #ccc', tlm)

    const customEvent = new globalThis.CustomEvent(CUSTOM_EVENT.TRACIM_LIVE_MESSAGE, {
      detail: {
        type: tlm.event_type,
        data: tlm.fields
      }
    })

    document.dispatchEvent(customEvent)
  }

  startHeartbeatFailureTimer () {
    this.heartbeatFailureTimerId = globalThis.setTimeout(
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
    this.broadcastAndSetStatus(LIVE_MESSAGE_STATUS.HEARTBEAT_FAILED)
    this.restartLiveMessageConnection()
  }

  broadcastAndSetStatus (status) {
    this.setStatus(status)
    this.broadcastStatus(status)
  }

  broadcastStatus (status) {
    this.broadcastChannel.postMessage({ status })
  }

  setStatus (status) {
    if (this.status === status) return
    console.log('TLM STATUS: ', status)
    this.status = status
    globalThis.GLOBAL_dispatchEvent({
      type: CUSTOM_EVENT.TRACIM_LIVE_MESSAGE_STATUS_CHANGED,
      data: { status }
    })
  }
}
