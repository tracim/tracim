import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import {
  TracimComponent,
  CUSTOM_EVENT
} from 'tracim_frontend_lib'

export const TriggerPageView = props => {
  const location = useLocation()

  // INFO - CH - 2025-09-15 - Tracim.jsx fire CUSTOM_EVENT.HEAD_TITLE_CHANGED on every page title change.
  // This component listen to this event but deregister the listener right after triggering it.
  // It register it again on location change (using useLocation hook).
  // This makes CUSTOM_EVENT.NEW_PAGE_VIEWED to be fired only when both the location and the page title
  // have changed. Which allow to fire a "Page View" event that include the up-to-date page title.
  useEffect(() => {
    props.registerCustomEventHandlerList([
      {
        name: CUSTOM_EVENT.HEAD_TITLE_CHANGED,
        handler: (data) => {
          const customEvent = new globalThis.CustomEvent(CUSTOM_EVENT.NEW_PAGE_VIEWED, {
            detail: { newTitle: data }
          })

          document.dispatchEvent(customEvent)

          props.unregisterCustomEventHandlerList([{ name: CUSTOM_EVENT.HEAD_TITLE_CHANGED }])
        }
      }
    ])
  }, [location])

  return null
}

export default TracimComponent(TriggerPageView)
