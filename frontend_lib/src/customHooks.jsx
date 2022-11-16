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

export const usePublishLifecycle = (componentName, data, dispatchEvent) => {
  useLifecycle({
    mountedEvent: () => dispatchEvent(CUSTOM_EVENT.TRACIM_COMP_MOUNTED(componentName), data),
    unmountedEvent: () => dispatchEvent(CUSTOM_EVENT.TRACIM_COMP_UNMOUNTED(componentName), data)
  })
}

/* NOTE - ML - 2022-10-24 This is a HOC to allow the use of hooks inside a class component.
  * This one particularly adds the usePublishLifecycle custom hook in a class component.
  * It needs to be inside appFactory and to be connected to the 'user' state.
  * See frontend/src/container/Sidebar.jsx for a concrete example
*/
export const withUsePublishLifecycle = (WrappedComponent, componentName) => {
  return (props) => {
    if (props.dispatchCustomEvent === undefined) {
      console.error(`withUsePublishLifecycle error:
      dispatchCustomEvent is not a function, got: ${props.dispatchCustomEvent}`)
    }

    if (props.user === undefined || props.user.lang === undefined) {
      console.error(`withUsePublishLifecycle error:
      user is invalid, got: ${props.user}`)
    }

    usePublishLifecycle(componentName, { lang: props.user.lang }, props.dispatchCustomEvent)
    return (
      <WrappedComponent {...props} />
    )
  }
}
