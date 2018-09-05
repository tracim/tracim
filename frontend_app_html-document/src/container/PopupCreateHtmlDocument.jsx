import React from 'react'
import { translate } from 'react-i18next'
import {
  CardPopupCreateContent,
  handleFetchResult,
  addAllResourceI18n
} from 'tracim_frontend_lib'
import { postHtmlDocContent } from '../action.async.js'
import i18n from '../i18n.js'

const debug = { // outdated
  config: {
    // label: 'New Document',
    slug: 'html-document',
    faIcon: 'file-text-o',
    hexcolor: '#3f52e3',
    creationLabel: 'Write a document',
    domContainer: 'appFeatureContainer',
    apiUrl: 'http://localhost:3001',
    apiHeader: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization': 'Basic ' + btoa(`${'admin@admin.admin'}:${'admin@admin.admin'}`)
    },
    translation: {
      en: {translation: {}},
      fr: {translation: {}}
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
      appName: 'html-document', // must remain 'html-document' because it is the name of the react built app (which contains HtmlDocument and PopupCreateHtmlDocument)
      config: props.data ? props.data.config : debug.config,
      loggedUser: props.data ? props.data.loggedUser : debug.loggedUser,
      idWorkspace: props.data ? props.data.idWorkspace : debug.idWorkspace,
      idFolder: props.data ? props.data.idFolder : debug.idFolder,
      newContentName: ''
    }

    // i18n has been init, add resources from frontend
    addAllResourceI18n(i18n, this.state.config.translation)
    i18n.changeLanguage(this.state.loggedUser.lang)

    document.addEventListener('appCustomEvent', this.customEventReducer)
  }

  customEventReducer = ({ detail: { type, data } }) => { // action: { type: '', data: {} }
    switch (type) {
      case 'allApp_changeLang':
        console.log('%c<PopupCreateHtmlDocument> Custom event', 'color: #28a745', type, data)
        this.setState(prev => ({
          loggedUser: {
            ...prev.loggedUser,
            lang: data
          }
        }))
        i18n.changeLanguage(data)
        break
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
        label={this.props.t('New Document')} // @TODO get the lang of user
        customColor={this.state.config.hexcolor}
        faIcon={this.state.config.faIcon}
        contentName={this.state.newContentName}
        onChangeContentName={this.handleChangeNewContentName}
        btnValidateLabel={this.props.t('Validate and create')}
        inputPlaceholder={this.props.t("Document's title")}
      />
    )
  }
}

export default translate()(PopupCreateHtmlDocument)
