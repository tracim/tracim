import React from 'react'
import { Router } from 'react-router-dom'

export const RouterMock = props => {
  const history = require('history').createBrowserHistory()
  return (
    <Router history={history}>
      {props.children}
    </Router>
  )
}

// mock taken from a route /ui/workspaces/:id/contents?folder_open=

export function withRouterMock (WrappedComponent) {
  return class withRouterMock extends React.Component {
    render () {
      return (
        <WrappedComponent
          history={{
            action: 'POP',
            block: () => {},
            createHref: () => {},
            go: () => {},
            goBack: () => {},
            goForward: () => {},
            length: 7,
            listen: () => {},
            location: {
              hash: '',
              key: '3v4nbu',
              pathname: '/ui/workspaces/1/contents',
              search: '?folder_open='
            },
            push: () => {},
            replace: () => {}
          }}
          location={{
            hash: '',
            key: '3v4nbu',
            pathname: '/ui/workspaces/1/contents',
            search: '?folder_open='
          }}
          match={{
            params: {}
          }}
          {...this.props}
        />
      )
    }
  }
}
