import React from 'react'

export function connectMock (mapStateToProps) {
  return function (WrappedComponent) {
    return class connectMock extends React.Component {
      render () {
        return (
          <WrappedComponent
            {...this.props}
            {...mapStateToProps}
            getState={() => {}}
            subscribe={() => {}}
            dispatch={() => {}}
          />
        )
      }
    }
  }
}
