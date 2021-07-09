import React from 'react'
import { CUSTOM_EVENT } from './customEvent.js'
import { buildTracimLiveMessageEventType, updateTLMUser } from './helper.js'

export function TracimComponent (WrappedComponent) {
  return class TracimComponent extends React.Component {
    constructor (props) {
      super(props)

      this.customEventHandlerList = {}
      document.addEventListener(CUSTOM_EVENT.APP_CUSTOM_EVENT_LISTENER, this.execCustomEventHandler)

      this.liveMessageHandlerList = {}
      this.globalLiveMessageHandlerList = []
      document.addEventListener(CUSTOM_EVENT.TRACIM_LIVE_MESSAGE, this.execLiveMessageHandler)
    }

    componentWillUnmount () {
      document.removeEventListener(CUSTOM_EVENT.APP_CUSTOM_EVENT_LISTENER, this.execCustomEventHandler)
      document.removeEventListener(CUSTOM_EVENT.TRACIM_LIVE_MESSAGE, this.execLiveMessageHandler)
    }

    registerCustomEventHandlerList = (customEventList) => {
      customEventList.forEach(customEvent => {
        this.customEventHandlerList[customEvent.name] = customEvent.handler
      })
    }

    execCustomEventHandler = ({ detail: { type, data } }) => {
      if (Object.hasOwnProperty.call(this.customEventHandlerList, type)) {
        this.customEventHandlerList[type](data)
      }
    }

    registerLiveMessageHandlerList = (liveMessageList) => {
      liveMessageList.forEach(({ entityType, coreEntityType, optionalSubType, handler }) => {
        const eventType = buildTracimLiveMessageEventType(entityType, coreEntityType, optionalSubType)
        this.liveMessageHandlerList[eventType] = handler
      })
    }

    // NOTE - S.G. - 2020/11/05
    // Register a handler that will be called for any tlm type
    // the handler will be called with the tlm as argument.
    registerGlobalLiveMessageHandler = (handler) => {
      this.globalLiveMessageHandlerList.push(handler)
    }

    execLiveMessageHandler = ({ detail: { type, data } }) => {
      const typeHandler = this.liveMessageHandlerList[type]
      const hasGlobalHandler = this.globalLiveMessageHandlerList.length > 0
      if (typeHandler || hasGlobalHandler) data.fields.author = updateTLMUser(data.fields.author, true)
      if (typeHandler) typeHandler(data)
      if (hasGlobalHandler) {
        for (const handler of this.globalLiveMessageHandlerList) {
          handler(data)
        }
      }
    }

    render () {
      return (
        <WrappedComponent
          {...this.props}
          registerCustomEventHandlerList={this.registerCustomEventHandlerList}
          registerLiveMessageHandlerList={this.registerLiveMessageHandlerList}
          registerGlobalLiveMessageHandler={this.registerGlobalLiveMessageHandler}
        />
      )
    }
  }
}
