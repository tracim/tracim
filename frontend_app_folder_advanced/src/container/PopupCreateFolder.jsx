import React from 'react'
import { translate } from 'react-i18next'
import {
  CardPopupCreateContent,
  handleFetchResult,
  addAllResourceI18n
} from 'tracim_frontend_lib'
import { postFolder } from '../action.async.js'
import i18n from '../i18n.js'

const debug = { // outdated
  config: {
    slug: 'folder',
    faIcon: 'folder-open-o',
    hexcolor: '#7d4e24',
    creationLabel: 'Create a folder',
    domContainer: 'appFeatureContainer',
    apiUrl: 'http://localhost:6543',
    apiHeader: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
    translation: {
      en: {},
      fr: {}
    }
  },
  loggedUser: {
    id: 5,
    username: 'Smoi',
    firstname: 'Côme',
    lastname: 'Stoilenom',
    email: 'osef@algoo.fr',
    avatar: ''
  },
  idWorkspace: 1,
  idFolder: null
}

class PopupCreateFolder extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      appName: 'folder',
      config: props.data ? props.data.config : debug.config,
      loggedUser: props.data ? props.data.loggedUser : debug.loggedUser,
      idWorkspace: props.data ? props.data.idWorkspace : debug.idWorkspace,
      idFolder: props.data ? props.data.idFolder : debug.idFolder,
      newFolderName: ''
    }

    // i18n has been init, add resources from frontend
    addAllResourceI18n(i18n, this.state.config.translation, this.state.loggedUser.lang)
    i18n.changeLanguage(this.state.loggedUser.lang)

    document.addEventListener('appCustomEvent', this.customEventReducer)
  }

  componentWillUnmount () {
    document.removeEventListener('appCustomEvent', this.customEventReducer)
  }

  customEventReducer = ({ detail: { type, data } }) => { // action: { type: '', data: {} }
    switch (type) {
      case 'allApp_changeLang':
        console.log('%c<PopupCreateFolder> Custom event', 'color: #28a745', type, data)
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

  sendGlobalFlashMessage = msg => GLOBAL_dispatchEvent({
    type: 'addFlashMsg',
    data: {
      msg: msg,
      type: 'warning',
      delay: undefined
    }
  })

  handleChangeNewFolderName = e => this.setState({newFolderName: e.target.value})

  handleClose = () => GLOBAL_dispatchEvent({
    type: 'hide_popupCreateContent', // handled by tracim_front:dist/index.html
    data: {
      name: this.state.appName
    }
  })

  handleValidate = async () => {
    const { props, state } = this

    const fetchSaveNewFolder = await handleFetchResult(await postFolder(state.config.apiUrl, state.idWorkspace, state.idFolder, state.config.slug, state.newFolderName))

    switch (fetchSaveNewFolder.apiResponse.status) {
      case 200:
        this.handleClose()
        GLOBAL_dispatchEvent({ type: 'refreshContentList', data: {} })
        // GLOBAL_dispatchEvent({type: 'redirect', data: {url: `/ui/workspaces/${fetchSaveNewFolder.body.workspace_id}/dashboard`}})
        break
      case 400:
        switch (fetchSaveNewFolder.body.code) {
          default: this.sendGlobalFlashMessage(props.t('Error while saving new folder')); break
        }
        break
      default: this.sendGlobalFlashMessage(props.t('Error while saving new folder')); break
    }
  }

  render () {
    const { props, state } = this
    return (
      <CardPopupCreateContent
        customColor={state.config.hexcolor}
        onClose={this.handleClose}
        onValidate={this.handleValidate}
        label={props.t('New folder')}
        faIcon={state.config.faIcon}
        contentName={state.newFolderName}
        onChangeContentName={this.handleChangeNewFolderName}
        btnValidateLabel={props.t('Validate and create')}
        inputPlaceholder={props.t("Folder's name")}
      />
    )
  }
}

export default translate()(PopupCreateFolder)
