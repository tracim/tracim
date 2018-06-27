import React from 'react'
import {
  CardPopupCreateContent,
  handleFetchResult
} from 'tracim_lib'
import { FETCH_CONFIG } from '../helper.js'

const debug = {
  config: {
    label: 'Text Document',
    slug: 'page',
    faIcon: 'file-text-o',
    hexcolor: '#3f52e3',
    creationLabel: 'Write a document',
    domContainer: 'appContainer',
    apiUrl: 'http://localhost:3001',
    mockApiUrl: 'http://localhost:8071',
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

class PopupCreatePageHtml extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      appName: 'page',
      config: props.data ? props.data.config : debug.config,
      loggedUser: props.data ? props.data.loggedUser : debug.loggedUser,
      idWorkspace: props.data ? props.data.idWorkspace : debug.idWorkspace,
      idFolder: props.data ? props.data.idFolder : debug.idFolder,
      newContentName: ''
    }
    this.handleValidate = this.handleValidate.bind(this)
  }

  handleChangeNewContentName = e => this.setState({newContentName: e.target.value})

  handleClose = () => GLOBAL_dispatchEvent({
    type: 'hide_popupCreateContent',
    data: {
      name: this.state.appName
    }
  })

  async handleValidate () {
    const fetchSaveNewHtmlDoc = await fetch(`${this.state.config.apiUrl}/workspaces/${this.state.idWorkspace}/contents`, {
      ...FETCH_CONFIG,
      method: 'POST',
      body: JSON.stringify({
        parent_id: this.state.idFolder,
        content_type_slug: this.state.config.slug,
        label: this.state.newContentName
      })
    })

    if (fetchSaveNewHtmlDoc.status === 200) {
      const jsonSaveNewHtmlDoc = await fetchSaveNewHtmlDoc.json()

      console.log(jsonSaveNewHtmlDoc)

      this.handleClose()

      GLOBAL_dispatchEvent({
        type: 'openContentUrl',
        data: {
          idWorkspace: jsonSaveNewHtmlDoc.workspace_id,
          contentType: this.state.appName,
          idContent: jsonSaveNewHtmlDoc.id
        }
      })
    }
  }

  render () {
    return (
      <CardPopupCreateContent
        onClose={this.handleClose}
        onValidate={this.handleValidate}
        label={this.state.config.label} // @TODO get the lang of user
        hexcolor={this.state.config.hexcolor}
        faIcon={this.state.config.faIcon}
        contentName={this.state.newContentName}
        onChangeContentName={this.handleChangeNewContentName}
        btnValidateLabel='Valider et créer'
      />
    )
  }
}

export default PopupCreatePageHtml
