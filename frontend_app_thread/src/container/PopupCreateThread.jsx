import React from 'react'
import i18n from '../i18n.js'
import { withTranslation } from 'react-i18next'
import {
  addAllResourceI18n,
  CardPopupCreateContent,
  handleFetchResult,
  CUSTOM_EVENT
} from 'tracim_frontend_lib'
import { postThreadContent } from '../action.async.js'

const debug = { // outdated
  config: {
    // label: 'PopupCreateThread',
    slug: 'New thread',
    faIcon: 'file-text-o',
    hexcolor: '#ad4cf9',
    creationLabel: 'Write a thread',
    domContainer: 'appFeatureContainer',
    apiUrl: 'http://localhost:3001',
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
  workspaceId: 1,
  folderId: null
}

class PopupCreateThread extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      appName: 'thread', // must remain 'thread' because it is the name of the react built app (which contains Threac and PopupCreateThread)
      config: props.data ? props.data.config : debug.config,
      loggedUser: props.data ? props.data.loggedUser : debug.loggedUser,
      workspaceId: props.data ? props.data.workspaceId : debug.workspaceId,
      folderId: props.data ? props.data.folderId : debug.folderId,
      newContentName: ''
    }

    // i18n has been init, add resources from frontend
    addAllResourceI18n(i18n, this.state.config.translation, this.state.loggedUser.lang)
    i18n.changeLanguage(this.state.loggedUser.lang)

    document.addEventListener(CUSTOM_EVENT.APP_CUSTOM_EVENT_LISTENER, this.customEventReducer)
  }

  componentWillUnmount () {
    document.removeEventListener(CUSTOM_EVENT.APP_CUSTOM_EVENT_LISTENER, this.customEventReducer)
  }

  customEventReducer = ({ detail: { type, data } }) => { // action: { type: '', data: {} }
    switch (type) {
      case CUSTOM_EVENT.ALL_APP_CHANGE_LANGUAGE:
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

  handleChangeNewContentName = e => this.setState({ newContentName: e.target.value })

  handleClose = () => GLOBAL_dispatchEvent({
    type: CUSTOM_EVENT.HIDE_POPUP_CREATE_CONTENT,
    data: {
      name: this.state.appName
    }
  })

  handleValidate = async () => {
    const { config, appName, workspaceId, folderId, newContentName } = this.state

    const fetchSaveThreadDoc = postThreadContent(config.apiUrl, workspaceId, folderId, config.slug, newContentName)

    const resSave = await handleFetchResult(await fetchSaveThreadDoc)

    switch (resSave.apiResponse.status) {
      case 200:
        this.handleClose()

        GLOBAL_dispatchEvent({ type: CUSTOM_EVENT.REFRESH_CONTENT_LIST, data: {} })

        GLOBAL_dispatchEvent({
          type: CUSTOM_EVENT.OPEN_CONTENT_URL,
          data: {
            workspaceId: resSave.body.workspace_id,
            contentType: appName,
            contentId: resSave.body.content_id
          }
        })
        break
      case 400:
        switch (resSave.body.code) {
          case 3002:
            GLOBAL_dispatchEvent({
              type: CUSTOM_EVENT.ADD_FLASH_MSG,
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
        type: CUSTOM_EVENT.ADD_FLASH_MSG,
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

export default withTranslation()(PopupCreateThread)
