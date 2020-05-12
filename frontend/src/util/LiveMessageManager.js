import {
  ROLE
} from 'tracim_frontend_lib'

export const LIVE_MESSAGE_STATUS = {
  OPEN: 'open',
  CLOSE: 'close'
}

export class LiveMessageManager {
  constructor() {
    this.status = LIVE_MESSAGE_STATUS.CLOSE
  }

  openLiveMessageConnection () {
    if (this.status !== LIVE_MESSAGE_STATUS.OPEN) {
      console.error('LiveMessage already connected.')
      return false
    }

    return new Promise((resolve) => {
      setTimeout(() => {
        console.log('resolving openLiveMessageConnection')

        this.mockRandomLiveEvents()

        this.status = LIVE_MESSAGE_STATUS.OPEN

        resolve(true)
      }, 200)
    })
  }

  closeLiveMessageConnection () {
    this.status = LIVE_MESSAGE_STATUS.CLOSE
    return true
  }

  dispatchLiveMessage = function (event) {
    const type = event.type
    const data = event.data
    console.log('%cGLOBAL_dispatchLiveMessage', 'color: #ccc', type, data)

    const customEvent = new globalThis.CustomEvent('TracimLiveMessage', { detail: { type, data } })

    document.dispatchEvent(customEvent)
  }

  mockRandomLiveEvents () {
    const eventFromBackend = {
      event_id: 42,
      event_type: 'sharedspace_user_role.created', // hierarchy in the naming: entity_type.core_event_type
      sent_datetime: '2012-05-29T18:25:43.511Z',
      read_datetime: null,
      sender_id: 54,
      fields: {
        user: {
          user_id: 23,
          username: 'jdoe',
          public_name: 'John Doe',
          is_active: true,
          is_deleted: false,
        },
        workspace: {
          workspace_id:  42,
          label: 'Un truc sympa',
          is_deleted: false
        },
        role: ROLE.contributor.slug
      }
    }

    globalThis.setTimeout(() => {
      this.dispatchLiveMessage({
        type: eventFromBackend.event_type,
        data: eventFromBackend
      })
    }, 5000)

    // globalThis.setInterval(() => {
    //   const rdm = Math.floor(Math.random() * 100)
    //   if (rdm % 2 === 0) {
    //     this.dispatchLiveMessage({
    //       type: eventFromBackend.event_type,
    //       data: eventFromBackend.fields
    //     })
    //   }
    // }, 3000)
  }
}
