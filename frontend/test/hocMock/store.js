import React from 'react'

export function connectMock (mapStateToProps, dispatchMock = null) {
  return function (WrappedComponent) {
    return class connectMock extends React.Component {
      render () {
        return (
          <WrappedComponent
            {...this.props}
            {...mapStateToProps}
            getState={() => {}}
            subscribe={() => {}}
            dispatch={dispatchMock || (() => {})}
          />
        )
      }
    }
  }
}
