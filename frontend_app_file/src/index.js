import React from 'react'
import ReactDOM from 'react-dom'
import File from './container/File.jsx'
import CollaboraFrame from './component/CollaboraFrame.jsx'
import PopupCreateFile from './container/PopupCreateFile.jsx'
import { Router, Switch, Route } from 'react-router'

// @TODO make a file that contains all events implemented by this App.
// @todo add this file to appInterface
// @todo app shall make it's customReducer from the events of this app
// so it will be testable by tracim_frontend

require('./css/index.styl')

const appInterface = {
  name: 'file',
  isRendered: false,
  renderAppFeature: data => {
    return ReactDOM.render(
      <Router history={data.config.history}>
        <Switch>
          <Route path='*/online_edition' render={() =>
            <CollaboraFrame
              content={data.content}
              config={data.config}
              history={data.config.history}
            />
          } />
          <Route path='*' render={() =>
            <File data={data} />
          } />
        </Switch>
      </Router>
      , document.getElementById(data.config.domContainer)
    )
  },
  unmountApp: domId => {
    return ReactDOM.unmountComponentAtNode(document.getElementById(domId)) // returns bool
  },
  renderAppPopupCreation: data => {
    return ReactDOM.render(
      <PopupCreateFile data={data} />
      , document.getElementById(data.config.domContainer)
    )
  }
}

export default appInterface
