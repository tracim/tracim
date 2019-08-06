import React from 'react'
import ReactDOM from 'react-dom'
import 'core-js/stable'
import 'regenerator-runtime/runtime'
import PopupCreateOfficeDocument from './container/PopupCreateOfficeDocument.jsx'
import CollaborativeEditionFrame from './container/CollaborativeEditionFrame.jsx'
import { Router } from 'react-router'
import { CUSTOM_EVENT } from 'tracim_frontend_lib'

// @TODO make a file that contains all events implemented by this App.
// @todo add this file to appInterface
// @todo app shall make it's customReducer from the events of this app
// so it will be testable by tracim_frontend

require('./css/index.styl')

const ACTION_EDIT = 'edit'

const appInterface = {
  name: 'office_document',
  isRendered: false,
  renderAppPopupCreation: data => {
    return ReactDOM.render(
      <Router history={data.config.history}>
        <PopupCreateOfficeDocument data={data} />
      </Router>
      , document.getElementById(data.config.domContainer)
    )
  },
  renderAppFullscreen: data => {
    document.getElementById(data.config.domContainer).classList.add('fullWidthFullHeight')

    return ReactDOM.render(
      <Router history={data.config.history}>
        <CollaborativeEditionFrame data={data} />
      </Router>
      , document.getElementById(data.config.domContainer)
    )
  },
  unmountApp: domId => {
    document.getElementById(domId).classList.remove('fullWidthFullHeight')

    return ReactDOM.unmountComponentAtNode(document.getElementById(domId)) // returns bool
  },
  getOnlineEditionAction: (content, collaborativeDocumentEdition) => {
    if (!(content.file_extension && collaborativeDocumentEdition)) {
      return null
    }
    const editorType = collaborativeDocumentEdition.supported_file_types.filter(
      (type) => type.extension === content.file_extension.substr(1) && type.associated_action === ACTION_EDIT
    )

    if (editorType.length === 0) {
      return null
    }

    return () => {
      GLOBAL_dispatchEvent({
        type: CUSTOM_EVENT.REDIRECT,
        data: { url: `/ui/online_edition/workspaces/${content.workspace_id}/contents/${content.content_id}` }
      })
    }
  }
}

export default appInterface
