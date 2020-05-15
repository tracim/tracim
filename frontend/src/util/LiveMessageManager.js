import { FETCH_CONFIG } from './helper.js'
import { CUSTOM_EVENT } from 'tracim_frontend_lib'

export const LIVE_MESSAGE_STATUS = {
  OPEN: 'open',
  PENDING: 'pending', // INFO - CH - 2020-05-14 - "pending" means connecting started but not yet got the opened confirmation from backend
  CLOSE: 'close'
}

export class LiveMessageManager {
  constructor () {
    this.status = LIVE_MESSAGE_STATUS.CLOSE
    this.eventSource = null
  }

  openLiveMessageConnection (userId) {
    if (this.status !== LIVE_MESSAGE_STATUS.CLOSE) {
      console.error('LiveMessage already connected.')
      return false
    }

    this.eventSource = new globalThis.EventSource(
      `${FETCH_CONFIG.apiUrl}/users/${userId}/live_messages`,
      { withCredentials: true }
    )

    this.eventSource.onopen = () => {
      console.log('%c.:. TLM Connected: ', 'color: #ccc0e2')
      this.status = LIVE_MESSAGE_STATUS.OPEN
    }

    this.eventSource.onmessage = (e) => {
      console.log('%c.:. TLM received: ', 'color: #ccc0e2', e)
      this.dispatchLiveMessage(e)
    }

    this.eventSource.onerror = (e) => {
      console.log('%c.:. TLM Error: ', 'color: #ccc0e2', e)
    }
  }

  closeLiveMessageConnection () {
    this.eventSource.close()
    console.log('%c.:. TLM Closed')
    this.status = LIVE_MESSAGE_STATUS.CLOSE
    return true
  }

  dispatchLiveMessage = function (event) {
    const data = JSON.parse(event.data)
    console.log('%cGLOBAL_dispatchLiveMessage', 'color: #ccc', data)

    const customEvent = new globalThis.CustomEvent(CUSTOM_EVENT.TRACIM_LIVE_MESSAGE, {
      detail: {
        type: data.event_type,
        data: data.fields
      }
    })

    document.dispatchEvent(customEvent)
  }
}
