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
  // SPACE_TYPE,
  SPACE_TYPE_LIST,
  TracimComponent
} from 'tracim_frontend_lib'
import { getUserSpaces, postSpace } from '../action.async.js'
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
      isFirstStep: true,
      loggedUser: props.data ? props.data.loggedUser : debug.loggedUser,
      newDefaultRole: '',
      newParentSpaceId: 0,
      newType: '',
      newName: '',
      parentOptions: [],
      showWarningMessage: false
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

  handleChangeNewName = e => this.setState({ newName: e.target.value })

  handleChangeNewDefaultRole = newRole => this.setState({ newDefaultRole: newRole })

  handleChangeSpacesType = newType => this.setState({ newType: newType })

  handleChangeParentSpace = newParentSpace => this.setState({
    newParentSpaceId: newParentSpace.spaceId,
    showWarningMessage: newParentSpace.parentId !== null
  })

  handleClickNextOrBack = async () => {
    const { props, state } = this

    if (state.isFirstStep) {
      const fetchGetUserSpaces = await handleFetchResult(await getUserSpaces(state.config.apiUrl, state.loggedUser.userId))

      switch (fetchGetUserSpaces.apiResponse.status) {
        case 200: {
          let spaceList = fetchGetUserSpaces.body
          /* FIXME - GB - 2020-10-08 - The code below is commented until we choose between keep it or delete it (filter of parent type according chosen type)
          if (state.newType === SPACE_TYPE.confidential.slug) {
            spaceList = spaceList.filter(space => space.access_type === SPACE_TYPE.confidential.slug)
          } else if (state.newType === SPACE_TYPE.onRequest.slug) {
            spaceList = spaceList.filter(space =>
              space.access_type === SPACE_TYPE.onRequest.slug || space.access_type === SPACE_TYPE.confidential.slug
            )
          } */
          spaceList = [
            { value: props.t('None'), label: props.t('None'), parentId: null, spaceId: null }, // INFO - GB - 2020-10-07 - Root
            ...spaceList.map(space => {
              const spaceType = SPACE_TYPE_LIST.find(type => type.slug === space.access_type)
              const spaceLabel = <span><i className={`fa fa-${spaceType.faIcon}`} /> {space.label}</span>
              return { value: space.label, label: spaceLabel, parentId: space.parent_id, spaceId: space.workspace_id }
            })
          ]

          this.setState({ parentOptions: spaceList, isFirstStep: false })
          break
        }
        default: this.sendGlobalFlashMessage(props.t('Error while getting user spaces')); break
      }
    } else this.setState({ isFirstStep: true })
  }

  handleClose = () => GLOBAL_dispatchEvent({
    type: CUSTOM_EVENT.HIDE_POPUP_CREATE_WORKSPACE, // handled by tracim_front:dist/index.html
    data: {
      name: this.state.appName
    }
  })

  handleValidate = async () => {
    const { props, state } = this

    const fetchPostSpace = await handleFetchResult(await postSpace(state.config.apiUrl, state.newDefaultRole, state.newParentSpaceId, state.newName, state.newType))

    switch (fetchPostSpace.apiResponse.status) {
      case 200: this.handleClose(); break
      case 400:
        switch (fetchPostSpace.body.code) {
          case 2001: this.sendGlobalFlashMessage(props.t('Some input are invalid')); break
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
              <i
                className={`fa fa-${state.config.faIcon}`}
                style={{ color: state.config.hexcolor }}
                title={props.t('New space')}
              />
            </div>
            <div className='newSpace__title__name' style={{ color: state.config.hexcolor }}>
              {props.t('New space')}
            </div>
          </div>

          {state.isFirstStep
            ? (
              <>
                <div className='newSpace__label'> {props.t("Space's name:")} </div>
                <input
                  type='text'
                  className='newSpace__input'
                  placeholder={props.t("Space's name")}
                  value={state.newName}
                  onChange={this.handleChangeNewName}
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
                    className='btn highlightBtn primaryColorBg primaryColorBorder primaryColorBgDarkenHover primaryColorBorderDarkenHover'
                    disabled={!state.newName || !state.newType}
                    onClick={this.handleClickNextOrBack}
                    title={props.t('Next')}
                    type='button'
                  >
                    {props.t('Next')} <i className='fa fa-arrow-right newSpace__icon__right' />
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
                  options={state.parentOptions}
                  defaultValue={state.parentOptions[0]}
                />
                {state.showWarningMessage && (
                  <div className='newSpace__warningMessage'>
                    <i className='fa fa-exclamation-triangle slowblink newSpace__icon__left' style={{ color: state.config.hexcolor }} />
                    {props.t('Be careful, we do not recommend creating more than two levels of spaces because it makes the information much less accessible.')}
                  </div>
                )}

                <div className='newSpace__label'> {props.t('Default role:')} </div>
                <SingleChoiceList
                  list={ROLE_LIST}
                  onChange={this.handleChangeNewDefaultRole}
                  currentValue={state.newDefaultRole}
                />

                <div className='newSpace__button'>
                  <button
                    className='btn newSpace__button__back highlightBtn primaryColorBg primaryColorBorder primaryColorBgDarkenHover primaryColorBorderDarkenHover'
                    disabled={!state.newName || state.newName.length === 0 || !state.newType || state.newType.length === 0}
                    onClick={this.handleClickNextOrBack}
                    title={props.t('Back')}
                    type='button'
                  >
                    <i className='fa fa-arrow-left newSpace__icon__left' /> {props.t('Back')}
                  </button>

                  <button
                    className='btn highlightBtn primaryColorBg primaryColorBorder primaryColorBgDarkenHover primaryColorBorderDarkenHover'
                    disabled={!state.newDefaultRole}
                    onClick={this.handleValidate}
                    title={props.t('Create')}
                    type='button'
                  >
                    {props.t('Create')} <i className='fa fa-check newSpace__icon__right' />
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
