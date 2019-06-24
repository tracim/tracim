import React from 'react'

export function dropTargetMock (type, target, collect) {
  return function (WrappedComponent) {
    return class dropTargetMock extends React.Component {
      render () {
        return (
          <WrappedComponent
            {...this.props}
            {...target}
            {...collect}
          />
        )
      }
    }
  }
}
