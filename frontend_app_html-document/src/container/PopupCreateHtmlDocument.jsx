import React from 'react'
import {
  CardPopupCreateContent, handleFetchResult
} from 'tracim_frontend_lib'
import { postHtmlDocContent } from '../action.async.js'

const debug = { // outdated
  config: {
    label: 'Text Document',
    slug: 'html-documents',
    faIcon: 'file-text-o',
    hexcolor: '#3f52e3',
    creationLabel: 'Write a document',
    domContainer: 'appContainer',
    apiUrl: 'http://localhost:3001',
    apiHeader: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization': 'Basic ' + btoa(`${'admin@admin.admin'}:${'admin@admin.admin'}`)
    }
  },
  loggedUser: {
    id: 5,
    username: 'Smoi',
    firstname: 'Côme',
    lastname: 'Stoilenom',
    email: 'osef@algoo.fr',
    avatar: 'https://avatars3.githubusercontent.com/u/11177014?s=460&v=4'
  },
  idWorkspace: 1,
  idFolder: null
}

class PopupCreateHtmlDocument extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      appName: 'html-documents',
      config: props.data ? props.data.config : debug.config,
      loggedUser: props.data ? props.data.loggedUser : debug.loggedUser,
      idWorkspace: props.data ? props.data.idWorkspace : debug.idWorkspace,
      idFolder: props.data ? props.data.idFolder : debug.idFolder,
      newContentName: ''
    }
  }

  handleChangeNewContentName = e => this.setState({newContentName: e.target.value})

  handleClose = () => GLOBAL_dispatchEvent({
    type: 'hide_popupCreateContent', // handled by tracim_front:dist/index.html
    data: {
      name: this.state.appName
    }
  })

  handleValidate = async () => {
    const { loggedUser, config, appName, idWorkspace, idFolder, newContentName } = this.state

    const fetchSaveNewHtmlDoc = postHtmlDocContent(loggedUser, config.apiUrl, idWorkspace, idFolder, config.slug, newContentName)

    handleFetchResult(await fetchSaveNewHtmlDoc)
      .then(resSave => {
        if (resSave.apiResponse.status === 200) {
          this.handleClose()

          GLOBAL_dispatchEvent({ type: 'refreshContentList', data: {} })

          GLOBAL_dispatchEvent({
            type: 'openContentUrl', // handled by tracim_front:src/container/WorkspaceContent.jsx
            data: {
              idWorkspace: resSave.body.workspace_id,
              contentType: appName,
              idContent: resSave.body.content_id
              // will be open in edit mode because revision.length === 1
            }
          })
        }
      })
  }

  render () {
    return (
      <CardPopupCreateContent
        onClose={this.handleClose}
        onValidate={this.handleValidate}
        label={this.state.config.label} // @TODO get the lang of user
        customColor={this.state.config.hexcolor}
        faIcon={this.state.config.faIcon}
        contentName={this.state.newContentName}
        onChangeContentName={this.handleChangeNewContentName}
        btnValidateLabel='Valider et créer'
      />
    )
  }
}

export default PopupCreateHtmlDocument
