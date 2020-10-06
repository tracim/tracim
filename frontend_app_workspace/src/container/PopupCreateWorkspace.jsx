import React from 'react'
import { translate } from 'react-i18next'
import Select from 'react-select'
import {
  addAllResourceI18n,
  CardPopup,
  CUSTOM_EVENT,
  SingleChoiceList,
  handleFetchResult,
  ROLE_LIST,
  SPACE_TYPE_LIST,
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
      fr: {},
      pt: {}
    }
  },
  loggedUser: {
    userId: 5,
    username: '',
    firstname: '',
    lastname: '',
    email: '',
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
      isFirstPage: true,
      loggedUser: props.data ? props.data.loggedUser : debug.loggedUser,
      newDefaultRole: '',
      newParentSpace: 0,
      newType: '',
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

  handleChangeNewDefaultRole = newRole => this.setState({ newDefaultRole: newRole })

  handleChangeSpacesType = newType => this.setState({ newType: newType })

  handleChangeParentSpace = newParentSpace => this.setState({ newParentSpace: newParentSpace.value })

  handleClickNextOrBack = () => this.setState(prev => ({ isFirstPage: !prev.isFirstPage }))

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
        customClass='newSpace'
        customColor={state.config.hexcolor}
        onClose={this.handleClose}
      >
        <div className='newSpace__menu'>
          <div className='newSpace__title'>
            <div className='newSpace__title__icon'>
              <i className={`fa fa-${state.config.faIcon}`} style={{ color: state.config.hexcolor }} />
            </div>

            <div className='newSpace__title__name' style={{ color: state.config.hexcolor }}>
              {props.t('New space')}
            </div>
          </div>

          {state.isFirstPage
            ? (
              <>
                <div className='newSpace__label'> {props.t("Space's name:")} </div>
                <input
                  type='text'
                  className='newSpace__input'
                  placeholder={props.t("Space's name")}
                  value={state.newWorkspaceName}
                  onChange={this.handleChangeNewWorkspaceName}
                  onKeyDown={this.handleInputKeyDown}
                  autoFocus
                />

                <div className='newSpace__label'> {props.t("Space's type:")} </div>
                <SingleChoiceList
                  list={SPACE_TYPE_LIST}
                  onChange={this.handleChangeSpacesType}
                  currentValue={state.newType}
                />

                <div className='newSpace__button'>
                  <button
                    type='button'
                    className='btn highlightBtn primaryColorBg primaryColorBorder primaryColorBgDarkenHover primaryColorBorderDarkenHover'
                    onClick={this.handleClickNextOrBack}
                    disabled={!state.newWorkspaceName || state.newWorkspaceName.length === 0 || !state.newType || state.newType.length === 0}
                  >
                    {props.t('Next')} <i className='fa fa-arrow-right newSpace__button__icon' />
                  </button>
                </div>
              </>
            )
            : (
              <>
                <div className='newSpace__label'> {props.t('Parent space:')} </div>
                <Select
                  className='newSpace__input'
                  isSearchable
                  onChange={this.handleChangeParentSpace}
                  options={[
                    { value: 0, label: props.t('None') },
                    { value: 1, label: 'Chocolate' },
                    { value: 2, label: 'Strawberry' },
                    { value: 3, label: 'Very big name of a icecream flavor not just Chocolate, Strawberry or Vanilla, a very very very big name... very big name! I love icecream!' },
                    { value: 4, label: 'Chocolate' },
                    { value: 5, label: 'Strawberry' },
                    { value: 6, label: 'Vanilla' },
                    { value: 7, label: 'Strawberry' },
                    { value: 8, label: 'Vanilla' },
                    { value: 9, label: 'Strawberry' },
                    { value: 10, label: 'Strawberry' },
                    { value: 11, label: 'Chocolate' },
                    { value: 12, label: 'Strawberry' },
                    { value: 13, label: 'Chocolate' },
                    { value: 14, label: 'Vanilla' },
                    { value: 15, label: 'Strawberry' },
                    { value: 16, label: 'Chocolate' },
                    { value: 17, label: 'Vanilla' },
                    { value: 18, label: 'Vanilla' },
                    { value: 19, label: 'Chocolate' },
                    { value: 20, label: 'Vanilla' },
                    { value: 21, label: 'Chocolate' },
                    { value: 22, label: 'Strawberry' },
                    { value: 23, label: 'Strawberry' },
                    { value: 24, label: 'Chocolate' },
                    { value: 25, label: 'Strawberry' },
                    { value: 26, label: 'Vanilla' }
                  ]}
                  defaultValue={{ value: 0, label: props.t('None') }}
                />

                <div className='newSpace__label'> {props.t('Default role:')} </div>
                <SingleChoiceList
                  list={ROLE_LIST}
                  onChange={this.handleChangeNewDefaultRole}
                  currentValue={state.newDefaultRole}
                />

                <div className='newSpace__button'>
                  <button
                    type='button'
                    className='btn newSpace__button__back highlightBtn primaryColorBg primaryColorBorder primaryColorBgDarkenHover primaryColorBorderDarkenHover'
                    onClick={this.handleClickNextOrBack}
                    disabled={!state.newWorkspaceName || state.newWorkspaceName.length === 0 || !state.newType || state.newType.length === 0}
                  >
                    <i className='fa fa-arrow-left newSpace__button__back__icon' /> {props.t('Back')}
                  </button>

                  <button
                    type='button'
                    className='btn highlightBtn primaryColorBg primaryColorBorder primaryColorBgDarkenHover primaryColorBorderDarkenHover'
                    onClick={this.handleValidate}
                    disabled={!state.newDefaultRole || state.newDefaultRole.length === 0}
                  >
                    {props.t('Create')} <i className='fa fa-check newSpace__button__icon' />
                  </button>
                </div>
              </>
            )}
        </div>
      </CardPopup>
    )
  }
}

export default translate()(TracimComponent(PopupCreateWorkspace))
