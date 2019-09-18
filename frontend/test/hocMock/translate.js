import React from 'react'

// mock taken from a route /ui/workspaces/:id/contents?folder_open=

export function translateMock () {
  return function (WrappedComponent) {
    return class translateMock extends React.Component {
      render () {
        return (
          <WrappedComponent
            {...this.props}
            t={tradKey => tradKey}
          />
        )
      }
    }
  }
}
