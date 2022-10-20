import React, { useEffect } from 'react'
import { CUSTOM_EVENT } from './customEvent'

/* FIXME - ML - 2022-10-20 - Export useLifecycle hook when it's usage will be appropriate.
  * This hook is designed to bring a better syntax to the useEffect hook when it is
  * used to replace class component's didMount and willUnmount (passing [] as deps)
  * https://github.com/tracim/tracim/issues/5954
*/
const useLifecycle = ({ mountedEvent, unmountedEvent }) => {
  useEffect(() => {
    mountedEvent()
    return unmountedEvent
  }, [])
}

export const usePublishLifecycle = (name, data, dispatchEvent) => {
  useLifecycle({
    mountedEvent: () => dispatchEvent(CUSTOM_EVENT.TRACIM_COMP_MOUNTED(name), data),
    unmountedEvent: () => dispatchEvent(CUSTOM_EVENT.TRACIM_COMP_UNMOUNTED(name), data)
  })
}

export const withUsePublishLifecycle = (WrappedComponent, name) => {
  return (props) => {
    if (props.dispatchCustomEvent === undefined) {
      console.error(`withUsePublishLifecycle error:
      dispatchCustomEvent is not a function, got: ${props.dispatchCustomEvent}`)
    }

    if (props.user === undefined || props.user.lang === undefined) {
      console.error(`withUsePublishLifecycle error:
      user is invalid, got: ${props.user}`)
    }

    usePublishLifecycle(name, { lang: props.user.lang }, props.dispatchCustomEvent)
    return (
      <WrappedComponent {...props} />
    )
  }
}
