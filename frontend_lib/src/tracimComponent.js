import React from 'react'
import { CUSTOM_EVENT } from './customEvent.js'
import { buildTracimLiveMessageEventType, updateTLMAuthor } from './helper.js'

export function TracimComponent (WrappedComponent) {
  return class TracimComponent extends React.Component {
    constructor (props) {
      super(props)

      this.registeredCustomEventHandlerList = {}
      document.addEventListener(CUSTOM_EVENT.APP_CUSTOM_EVENT_LISTENER, this.execRegisteredCustomEventHandler)

      this.registeredLiveMessageHandlerList = {}
      document.addEventListener(CUSTOM_EVENT.TRACIM_LIVE_MESSAGE, this.execRegisteredLiveMessageHandler)
    }

    componentWillUnmount () {
      document.removeEventListener(CUSTOM_EVENT.APP_CUSTOM_EVENT_LISTENER, this.execRegisteredCustomEventHandler)
      document.removeEventListener(CUSTOM_EVENT.TRACIM_LIVE_MESSAGE, this.execRegisteredLiveMessageHandler)
    }

    registerCustomEventHandlerList = (customEventList) => {
      customEventList.forEach(customEvent => {
        this.registeredCustomEventHandlerList[customEvent.name] = customEvent.handler
      })
    }

    execRegisteredCustomEventHandler = ({ detail: { type, data } }) => {
      if (Object.hasOwnProperty.call(this.registeredCustomEventHandlerList, type)) {
        this.registeredCustomEventHandlerList[type](data)
      }
    }

    registerLiveMessageHandlerList = (liveMessageList) => {
      liveMessageList.forEach(({ entityType, coreEntityType, optionalSubType, handler }) => {
        const eventType = buildTracimLiveMessageEventType(entityType, coreEntityType, optionalSubType)
        this.registeredLiveMessageHandlerList[eventType] = handler
      })
    }

    execRegisteredLiveMessageHandler = ({ detail: { type, data } }) => {
      if (Object.prototype.hasOwnProperty.call(this.registeredLiveMessageHandlerList, type)) {
        data.fields.author = updateTLMAuthor(data.fields.author)
        this.registeredLiveMessageHandlerList[type](data)
      }
    }

    render () {
      return (
        <WrappedComponent
          {...this.props}
          registerCustomEventHandlerList={this.registerCustomEventHandlerList}
          registerLiveMessageHandlerList={this.registerLiveMessageHandlerList}
        />
      )
    }
  }
}
