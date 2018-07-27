import React from 'react'
import {
  addAllResourceI18n,
  CardPopupCreateContent,
  handleFetchResult
} from 'tracim_frontend_lib'
import { postThreadContent } from '../action.async.js'

const debug = { // outdated
  config: {
    label: 'Thread',
    slug: 'thread',
    faIcon: 'file-text-o',
    hexcolor: '#ad4cf9',
    creationLabel: 'Write a thread',
    domContainer: 'appContainer',
    apiUrl: 'http://localhost:3001',
    mockApiUrl: 'http://localhost:8071',
    apiHeader: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization': 'Basic ' + btoa(`${'admin@admin.admin'}:${'admin@admin.admin'}`)
    },
    translation: {
      en: {
        translation: {}
      },
      fr: {
        translation: {}
      }
    }
  },
  loggedUser: {
    id: 1,
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
      appName: 'thread',
      config: props.data ? props.data.config : debug.config,
      loggedUser: props.data ? props.data.loggedUser : debug.loggedUser,
      idWorkspace: props.data ? props.data.idWorkspace : debug.idWorkspace,
      idFolder: props.data ? props.data.idFolder : debug.idFolder,
      newContentName: ''
    }

    // i18n has been init, add resources from frontend
    addAllResourceI18n(i18n, props.data ? props.data.config.translation : debug.config.translation)
  }

  handleChangeNewContentName = e => this.setState({newContentName: e.target.value})

  handleClose = () => GLOBAL_dispatchEvent({
    type: 'hide_popupCreateContent', // handled by tracim_front:dist/index.html
    data: {
      name: this.state.appName
    }
  })

  handleValidate = async () => {
    const { config, appName, idWorkspace, idFolder, newContentName } = this.state

    const fetchSaveThreadDoc = postThreadContent(config.apiUrl, idWorkspace, idFolder, config.slug, newContentName)

    handleFetchResult(await fetchSaveThreadDoc)
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
