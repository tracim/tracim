import React from 'react'


export function tracimLiveMessageMock (cb) {
  return function (WrappedComponent) {
    return class tracimLiveMessageMock extends React.Component {
      render () {
        return (
          <WrappedComponent
            {...this.props}
            registerLiveMessageHandlerList={(tlmList) => {
              const tlmHandlerList = {}
              tlmList.forEach(tlm => {
                if (!tlmHandlerList[tlm.entityType]) tlmHandlerList[tlm.entityType] = {}
                tlmHandlerList[tlm.entityType][tlm.coreEntityType] = tlm.handler
              })
              cb(tlmHandlerList)
            }}
          />
        )
      }
    }
  }
}
