import React from 'react'
import { translate } from 'react-i18next'
import {
  addAllResourceI18n,
  CardPopupCreateContent,
  handleFetchResult
} from 'tracim_frontend_lib'
import { postThreadContent } from '../action.async.js'
import i18n from '../i18n.js'

const debug = { // outdated
  config: {
    // label: 'PopupCreateThread',
    slug: 'New thread',
    faIcon: 'file-text-o',
    hexcolor: '#ad4cf9',
    creationLabel: 'Write a thread',
    domContainer: 'appFeatureContainer',
    apiUrl: 'http://localhost:3001',
    mockApiUrl: 'http://localhost:8071',
    apiHeader: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
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

class PopupCreateThread extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      appName: 'thread', // must remain 'thread' because it is the name of the react built app (which contains Threac and PopupCreateThread)
      config: props.data ? props.data.config : debug.config,
      loggedUser: props.data ? props.data.loggedUser : debug.loggedUser,
      idWorkspace: props.data ? props.data.idWorkspace : debug.idWorkspace,
      idFolder: props.data ? props.data.idFolder : debug.idFolder,
      newContentName: ''
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
        console.log('%c<PopupCreateThread> Custom event', 'color: #28a745', type, data)
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
    const { config, appName, idWorkspace, idFolder, newContentName } = this.state

    const fetchSaveThreadDoc = postThreadContent(config.apiUrl, idWorkspace, idFolder, config.slug, newContentName)

    const resSave = await handleFetchResult(await fetchSaveThreadDoc)

    switch (resSave.apiResponse.status) {
      case 200:
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
        break
      case 400:
        switch (resSave.body.code) {
          case 3002:
            GLOBAL_dispatchEvent({
              type: 'addFlashMsg',
              data: {
                msg: this.props.t('A content with the same name already exists'),
                type: 'warning',
                delay: undefined
              }
            })
            break
        }
        break
      default: GLOBAL_dispatchEvent({
        type: 'addFlashMsg',
        data: {
          msg: this.props.t('Error while creating thread'),
          type: 'warning',
          delay: undefined
        }
      })
    }
  }

  render () {
    return (
      <CardPopupCreateContent
        onClose={this.handleClose}
        onValidate={this.handleValidate}
        label={this.props.t('New Thread')} // @TODO get the lang of user
        customColor={this.state.config.hexcolor}
        faIcon={this.state.config.faIcon}
        contentName={this.state.newContentName}
        onChangeContentName={this.handleChangeNewContentName}
        btnValidateLabel={this.props.t('Validate and create')}
        inputPlaceholder={this.props.t("Topic's subject")}
      />
    )
  }
}

export default translate()(PopupCreateThread)
