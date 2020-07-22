import { FETCH_CONFIG } from './helper.js'
import { CUSTOM_EVENT } from 'tracim_frontend_lib'

export const LIVE_MESSAGE_STATUS = {
  PENDING: 'pending', // INFO - CH - 2020-05-14 - "pending" means connecting started but not yet got the initial event from backend
  OPENED: 'opened',
  CLOSED: 'closed',
  ERROR: 'error',
  HEARTBEAT_FAILED: 'heartbeat_failed'
}

/**
 * INFO - SG - 2020-07-02
 * This class manages the Tracim Live Messages:
 * - dispatches live messages through a custom event
 * - dispatches status changes through a custom event
 * - reconnects in case of error in EventSource
 * - reconnects if the keep-alive events are not received
 */
export class LiveMessageManager {
  // TODO - SG - 2020-07-03 - This interval could be provided by the backend
  constructor (heartBeatIntervalMs = 30000, reconnectionIntervalMs = 1000) {
    this.status = LIVE_MESSAGE_STATUS.CLOSED
    this.eventSource = null
    this.heartbeatFailureTimerId = -1
    this.heartBeatIntervalMs = heartBeatIntervalMs
    this.reconnectionIntervalMs = reconnectionIntervalMs
    this.reconnectionTimerId = -1
    this.userId = null
    this.host = null
  }

  openLiveMessageConnection (userId, host = null) {
    if (this.status !== LIVE_MESSAGE_STATUS.CLOSED) {
      console.error('LiveMessage already connected.')
      return false
    }
    this.userId = userId
    this.host = host
    const url = host || FETCH_CONFIG.apiUrl

    this.eventSource = new globalThis.EventSource(
      `${url}/users/${userId}/live_messages`,
      { withCredentials: true }
    )
    this.setStatus(LIVE_MESSAGE_STATUS.PENDING)

    this.eventSource.onopen = () => {
      console.log('%c.:. TLM Connected: ', 'color: #ccc0e2')
    }

    this.eventSource.onmessage = (e) => {
      console.log('%c.:. TLM received: ', 'color: #ccc0e2', { ...e, data: JSON.parse(e.data) })
      this.dispatchLiveMessage(e)
      this.stopHeartbeatFailureTimer()
      this.startHeartbeatFailureTimer()
    }

    this.eventSource.onerror = (e) => {
      console.log('%c.:. TLM Error: ', 'color: #ccc0e2', e)
      this.setStatus(LIVE_MESSAGE_STATUS.ERROR)
      this.restartLiveMessageConnection()
    }

    this.eventSource.addEventListener('stream-open', () => {
      console.log('%c.:. TLM StreamOpen: ', 'color: #ccc0e2')
      this.setStatus(LIVE_MESSAGE_STATUS.OPENED)
    })

    this.eventSource.addEventListener('keep-alive', () => {
      console.log('%c.:. TLM KeepAlive: ', 'color: #ccc0e2')
      this.stopHeartbeatFailureTimer()
      this.startHeartbeatFailureTimer()
    })

    this.startHeartbeatFailureTimer()
  }

  closeLiveMessageConnection () {
    this.eventSource.close()
    console.log('%c.:. TLM Closed')
    this.stopHeartbeatFailureTimer()
    if (this.reconnectionTimerId !== -1) {
      globalThis.clearTimeout(this.reconnectionTimerId)
      this.reconnectionTimerId = -1
    }
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

  dispatchLiveMessage = function (event) {
    const data = JSON.parse(event.data)
    console.log('%cGLOBAL_dispatchLiveMessage', 'color: #ccc', data)

    const customEvent = new globalThis.CustomEvent(CUSTOM_EVENT.TRACIM_LIVE_MESSAGE, {
      detail: {
        type: data.event_type,
        data: { ...data.fields, event_id: data.event_id }
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
    this.setStatus(LIVE_MESSAGE_STATUS.HEARTBEAT_FAILED)
    this.restartLiveMessageConnection()
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
