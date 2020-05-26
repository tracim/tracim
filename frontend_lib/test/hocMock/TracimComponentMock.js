import React from 'react'

export function TracimComponentMock (callback) {
  return function (WrappedComponent) {
    return class TracimComponentMock extends React.Component {
      render () {
        return (
          <WrappedComponent
            {...this.props}
            registerLiveMessageHandlerList={(tlmList) => {
              const tlmHandlerList = {}
              tlmList.forEach(tlm => {
                tlmHandlerList[`${tlm.entityType}.${tlm.coreEntityType}`] = tlm.handler
              })
              const triggerTLM = (eventType, data) => {
                tlmHandlerList[eventType](data)
              }
              callback(triggerTLM)
            }}
          />
        )
      }
    }
  }
}
