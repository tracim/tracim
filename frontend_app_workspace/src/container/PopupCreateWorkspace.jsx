import React from 'react'
import { translate } from 'react-i18next'
import {
  CardPopup,
  handleFetchResult,
  addAllResourceI18n,
  CUSTOM_EVENT,
  TracimComponent
} from 'tracim_frontend_lib'
import { postWorkspace } from '../action.async.js'
import i18n from '../i18n.js'

// FIXME - GB - 2019-07-04 - The debug process for creation popups are outdated
// https://github.com/tracim/tracim/issues/2066
const debug = {
  config: {
    slug: 'workspace',
    faIcon: 'bank',
    hexcolor: '#7d4e24',
    creationLabel: 'Create a space',
    domContainer: 'appFeatureContainer',
    apiUrl: 'http://localhost:6543',
    apiHeader: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    },
    translation: {
      en: {},
      fr: {}
    }
  },
  loggedUser: {
    userId: 5,
    username: 'Smoi',
    firstname: 'Côme',
    lastname: 'Stoilenom',
    email: 'osef@algoo.fr',
    avatar: ''
  },
  workspaceId: 1,
  folderId: null
}

export class PopupCreateWorkspace extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      appName: 'workspace',
      config: props.data ? props.data.config : debug.config,
      loggedUser: props.data ? props.data.loggedUser : debug.loggedUser,
      newWorkspaceName: ''
    }

    // i18n has been init, add resources from frontend
    addAllResourceI18n(i18n, this.state.config.translation, this.state.loggedUser.lang)
    i18n.changeLanguage(this.state.loggedUser.lang)

    props.registerCustomEventHandlerList([
      { name: CUSTOM_EVENT.ALL_APP_CHANGE_LANGUAGE, handler: this.handleAllAppChangeLanguage }
    ])
  }

  // Custom Event Handlers
  handleAllAppChangeLanguage = data => {
    console.log('%c<PopupCreateWorkspace> Custom event', CUSTOM_EVENT.APP_CUSTOM_EVENT_LISTENER, data)
    this.setState(prev => ({
      loggedUser: {
        ...prev.loggedUser,
        lang: data
      }
    }))
    i18n.changeLanguage(data)
  }

  sendGlobalFlashMessage = msg => GLOBAL_dispatchEvent({
    type: CUSTOM_EVENT.ADD_FLASH_MSG,
    data: {
      msg: msg,
      type: 'warning',
      delay: undefined
    }
  })

  handleChangeNewWorkspaceName = e => this.setState({ newWorkspaceName: e.target.value })

  handleClose = () => GLOBAL_dispatchEvent({
    type: CUSTOM_EVENT.HIDE_POPUP_CREATE_WORKSPACE, // handled by tracim_front:dist/index.html
    data: {
      name: this.state.appName
    }
  })

  handleValidate = async () => {
    const { props, state } = this

    const fetchSaveNewWorkspace = await handleFetchResult(await postWorkspace(state.config.apiUrl, state.newWorkspaceName))

    switch (fetchSaveNewWorkspace.apiResponse.status) {
      case 200: this.handleClose(); break
      case 400:
        switch (fetchSaveNewWorkspace.body.code) {
          case 3007: this.sendGlobalFlashMessage(props.t('A space with that name already exists')); break
          case 6001: this.sendGlobalFlashMessage(props.t('You cannot create anymore space')); break
          default: this.sendGlobalFlashMessage(props.t('Error while saving new space')); break
        }
        break
      default: this.sendGlobalFlashMessage(props.t('Error while saving new space')); break
    }
  }

  render () {
    const { props, state } = this
    return (
      <CardPopup
        customClass='popupCreateContent'
        customColor={state.config.hexcolor}
        onClose={this.handleClose}
      >
        <div className='createcontent'>
          <div className='createcontent__contentname mb-4'>
            <div className='createcontent__contentname__icon ml-1 mr-3'>
              <i className={`fa fa-${state.config.faIcon}`} style={{ color: state.config.hexcolor }} />
            </div>

            <div className='createcontent__contentname__title' style={{ color: state.config.hexcolor }}>
              {props.t('New space')}
            </div>
          </div>
          <span> {props.t("Space's name")} </span>
          <input
            type='text'
            className='createcontent__form__input'
            data-cy='createcontent__form__input'
            placeholder={props.t("Space's name")}
            value={state.newWorkspaceName}
            onChange={this.handleChangeNewWorkspaceName}
            onKeyDown={this.handleInputKeyDown}
            autoFocus
          />
          <span> {props.t("Space's type")} </span>

          <span> {props.t('Parent space')} </span>
          <div className='createcontent__form__button'>
            <button
              type='button'
              className='createcontent__form__button btn highlightBtn primaryColorBg primaryColorBorder primaryColorBgDarkenHover primaryColorBorderDarkenHover'
              data-cy='popup__createcontent__form__button'
              onClick={this.handleValidate}
              disabled={!state.newWorkspaceName || state.newWorkspaceName.length === 0}
            >
              {props.t('Validate and create')}
            </button>
          </div>
        </div>
      </CardPopup>
    )
  }
}

export default translate()(TracimComponent(PopupCreateWorkspace))
