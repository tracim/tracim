import React from 'react'
import { connect } from 'react-redux'
import { withRouter } from 'react-router-dom'
import { translate } from 'react-i18next'
import debounce from 'lodash/debounce'
import UserInfo from '../component/Account/UserInfo.jsx'
import MenuSubComponent from '../component/Account/MenuSubComponent.jsx'
import PersonalData from '../component/Account/PersonalData.jsx'
import UserSpacesConfig from '../component/Account/UserSpacesConfig.jsx'
import Password from '../component/Account/Password.jsx'
import {
  AgendaInfo,
  Delimiter,
  PageWrapper,
  PageTitle,
  PageContent,
  BREADCRUMBS_TYPE,
  CUSTOM_EVENT,
  buildHeadTitle,
  serialize,
  TLM_ENTITY_TYPE as TLM_ET,
  TLM_CORE_EVENT_TYPE as TLM_CET,
  TracimComponent,
  checkUsernameValidity,
  ALLOWED_CHARACTERS_USERNAME,
  MAXIMUM_CHARACTERS_USERNAME,
  MINIMUM_CHARACTERS_USERNAME,
  CHECK_USERNAME_DEBOUNCE_WAIT,
  PAGE
} from 'tracim_frontend_lib'
import {
  newFlashMessage,
  setBreadcrumbs,
  setHeadTitle
} from '../action-creator.sync.js'
import {
  getUser,
  putUserPublicName,
  putUserEmail,
  putUserUsername,
  putUserPassword,
  putUserWorkspaceDoNotify,
  getUserCalendar
} from '../action-creator.async.js'
import {
  editableUserAuthTypeList,
  MINIMUM_CHARACTERS_PUBLIC_NAME,
  FETCH_CONFIG
} from '../util/helper.js'
import { serializeUserProps } from '../reducer/user.js'

export class Account extends React.Component {
  constructor (props) {
    super(props)

    const builtSubComponentMenu = [{
      name: 'personalData',
      active: true,
      label: props.t('Account'),
      display: true
    }, {
      name: 'spacesConfig',
      active: false,
      label: props.t('Spaces'),
      display: true
    }, {
      name: 'password',
      active: false,
      label: props.t('Password'),
      display: true
    }, {
      name: 'agenda',
      active: false,
      label: props.t('Agenda'),
      display: props.appList.some(a => a.slug === 'agenda')
    }].filter(menu => menu.display)

    this.state = {
      userToEditId: props.match.params.userid,
      userToEdit: {
        publicName: '',
        authType: 'internal',
        agendaUrl: '',
        username: '',
        isUsernameValid: true,
        usernameInvalidMsg: '',
        email: ''
      },
      subComponentMenu: builtSubComponentMenu
    }

    props.registerCustomEventHandlerList([
      { name: CUSTOM_EVENT.ALL_APP_CHANGE_LANGUAGE, handler: this.handleAllAppChangeLanguage }
    ])

    props.registerLiveMessageHandlerList([
      { entityType: TLM_ET.USER, coreEntityType: TLM_CET.MODIFIED, handler: this.handleUserModifiedOrCreated },
      { entityType: TLM_ET.USER, coreEntityType: TLM_CET.CREATED, handler: this.handleUserModifiedOrCreated }
    ])
  }

  // TLM Handler
  handleUserModifiedOrCreated = async (data) => {
    const { state } = this
    if (Number(state.userToEditId) !== data.fields.user.user_id) return
    await this.getUserDetail()
  }

  // Custom Event Handler
  handleAllAppChangeLanguage = () => {
    this.buildBreadcrumbs()
    this.setHeadTitle()
  }

  async componentDidMount () {
    const { props, state } = this

    await this.getUserDetail()
    this.setHeadTitle()
    if (props.appList.some(a => a.slug === 'agenda')) this.loadAgendaUrl()
    this.buildBreadcrumbs()

    if (props.openSpacesManagement) {
      this.setState(prev => ({
        subComponentMenu: prev.subComponentMenu.map(component => ({ ...component, active: component.name === 'spacesConfig' }))
      }))
    } else {
      if (props.history.location.state && state.subComponentMenu.find(component => component.name === props.history.location.state)) {
        this.setState(prev => ({
          subComponentMenu: prev.subComponentMenu.map(component => ({ ...component, active: component.name === props.history.location.state }))
        }))
      }
    }
  }

  componentWillUnmount () {
    this.handleChangeUsername.cancel()
  }

  componentDidUpdate (prevProps, prevState) {
    const { props, state } = this

    if (prevProps.system.config.instance_name !== props.system.config.instance_name) {
      this.setHeadTitle()
    }
    if (state.userToEdit.publicName !== prevState.userToEdit.publicName) {
      this.buildBreadcrumbs()
    }
  }

  loadAgendaUrl = async () => {
    const { props, state } = this
    const fetchUserAgenda = await props.dispatch(getUserCalendar(state.userToEditId))

    switch (fetchUserAgenda.status) {
      case 200: {
        const newAgendaUrl = (fetchUserAgenda.json.find(a => a.agenda_type === 'private') || { agenda_url: '' }).agenda_url

        this.setState(prev => ({
          userToEdit: {
            ...prev.userToEdit,
            agendaUrl: newAgendaUrl
          }
        }))
        break
      }

      default:
        props.dispatch(newFlashMessage(props.t('Error while loading your agenda'), 'warning'))
    }
  }

  getUserDetail = async () => {
    const { props, state } = this

    const fetchGetUser = await props.dispatch(getUser(state.userToEditId))

    switch (fetchGetUser.status) {
      case 200:
        this.setState(prev => ({
          userToEdit: {
            ...prev.userToEdit,
            ...serialize(fetchGetUser.json, serializeUserProps)
          },
          subComponentMenu: prev.subComponentMenu
            .filter(menu => editableUserAuthTypeList.includes(fetchGetUser.json.auth_type) ? true : menu.name !== 'password')
        }))
        break
      default: props.dispatch(newFlashMessage(props.t('Error while loading user')))
    }
  }

  buildBreadcrumbs = () => {
    const { props, state } = this

    props.dispatch(setBreadcrumbs([{
      link: PAGE.ADMIN.USER,
      type: BREADCRUMBS_TYPE.CORE,
      label: props.t('User account management'),
      isALink: true
    }, {
      link: PAGE.ADMIN.USER,
      type: BREADCRUMBS_TYPE.CORE,
      label: state.userToEdit.publicName,
      isALink: true
    }]))
  }

  handleClickSubComponentMenuItem = subMenuItemName => this.setState(prev => ({
    subComponentMenu: prev.subComponentMenu.map(m => ({ ...m, active: m.name === subMenuItemName })),
    userToEdit: { ...prev.userToEdit, isUsernameValid: true }
  }))

  handleSubmitPersonalData = async (newPublicName, newUsername, newEmailWithoutTrim, checkPassword) => {
    const { props, state } = this
    const newEmail = newEmailWithoutTrim.trim()

    if (newPublicName !== '') {
      if (newPublicName.length < MINIMUM_CHARACTERS_PUBLIC_NAME) {
        props.dispatch(newFlashMessage(
          props.t('Full name must be at least {{minimumCharactersPublicName}} characters', { minimumCharactersPublicName: MINIMUM_CHARACTERS_PUBLIC_NAME }),
          'warning')
        )
        return false
      }

      const fetchPutUserPublicName = await props.dispatch(putUserPublicName(state.userToEdit, newPublicName))
      switch (fetchPutUserPublicName.status) {
        case 200:
          if (newEmail === '' && newUsername === '') {
            props.dispatch(newFlashMessage(props.t('Name has been changed'), 'info'))
            return true
          }
          // else, if email also has been changed, flash msg is handled bellow to not display 2 flash msg
          break
        default: props.dispatch(newFlashMessage(props.t('Error while changing name'), 'warning')); break
      }
    }
    if (newUsername !== '') {
      const fetchPutUsername = await props.dispatch(putUserUsername(state.userToEdit, newUsername, checkPassword))
      switch (fetchPutUsername.status) {
        case 200:
          if (newEmail === '') {
            if (newPublicName !== '') props.dispatch(newFlashMessage(props.t('Username and name has been changed'), 'info'))
            else props.dispatch(newFlashMessage(props.t('Username has been changed'), 'info'))
            return true
          }
          break
        case 400:
          switch (fetchPutUsername.json.code) {
            case 2001:
              props.dispatch(newFlashMessage(
                props.t('Username must be between {{minimumCharactersUsername}} and {{maximumCharactersUsername}} characters long', { minimumCharactersUsername: MINIMUM_CHARACTERS_USERNAME, maximumCharactersUsername: MAXIMUM_CHARACTERS_USERNAME }), 'warning'
              ))
              break
            case 2062:
              props.dispatch(newFlashMessage(
                props.t(
                  'Your username is incorrect, the allowed characters are {{allowedCharactersUsername}}',
                  { allowedCharactersUsername: ALLOWED_CHARACTERS_USERNAME }
                ),
                'warning'
              ))
              break
            default: props.dispatch(newFlashMessage(props.t('Error while changing username'), 'warning'))
          }
          return false
        case 403:
          props.dispatch(newFlashMessage(props.t('Invalid password'), 'warning'))
          return false
        default: props.dispatch(newFlashMessage(props.t('Error while changing username'), 'warning')); return false
      }
    }

    if (newEmail !== '') {
      const fetchPutUserEmail = await props.dispatch(putUserEmail(state.userToEdit, newEmail, checkPassword))
      switch (fetchPutUserEmail.status) {
        case 200:
          if (newUsername !== '' || newPublicName !== '') props.dispatch(newFlashMessage(props.t('Personal data has been changed'), 'info'))
          else props.dispatch(newFlashMessage(props.t('Email has been changed'), 'info'))
          return true
        default: props.dispatch(newFlashMessage(props.t('Error while changing email'), 'warning')); break
      }
    }

    return false
  }

  changeUsername = async (newUsername) => {
    if (!newUsername) {
      this.setState(prev => ({
        userToEdit: {
          ...prev.userToEdit,
          isUsernameValid: true,
          usernameInvalidMsg: ''
        }
      }))
      return
    }
    const { props } = this
    try {
      const usernameValidity = await checkUsernameValidity(FETCH_CONFIG.apiUrl, newUsername, props)
      this.setState(prev => ({
        userToEdit: {
          ...prev.userToEdit,
          ...usernameValidity
        }
      }))
    } catch (errorWhileChecking) {
      props.dispatch(newFlashMessage(errorWhileChecking.message, 'warning'))
    }
  }

  handleChangeUsername = debounce(this.changeUsername, CHECK_USERNAME_DEBOUNCE_WAIT)

  handleChangeSubscriptionNotif = async (workspaceId, doNotify) => {
    const { props, state } = this

    const fetchPutUserWorkspaceDoNotify = await props.dispatch(putUserWorkspaceDoNotify(state.userToEdit, workspaceId, doNotify))
    switch (fetchPutUserWorkspaceDoNotify.status) {
      case 204: break
      default: props.dispatch(newFlashMessage(props.t('Error while changing subscription'), 'warning'))
    }
  }

  handleSubmitPassword = async (oldPassword, newPassword, newPassword2) => {
    const { props, state } = this

    const fetchPutUserPassword = await props.dispatch(putUserPassword(state.userToEditId, oldPassword, newPassword, newPassword2))
    switch (fetchPutUserPassword.status) {
      case 204: props.dispatch(newFlashMessage(props.t('Password has been changed'), 'info')); return true
      case 403: props.dispatch(newFlashMessage(props.t("Wrong administrator's password"), 'warning')); return false
      default: props.dispatch(newFlashMessage(props.t('Error while changing password'), 'warning')); return false
    }
  }

  handleChangeTimezone = newTimezone => console.log('(NYI) new timezone: ', newTimezone)

  // INFO - GB - 2019-06-11 - This tag dangerouslySetInnerHTML is needed to i18next be able to handle special characters
  // https://github.com/tracim/tracim/issues/1847
  setTitle () {
    const { props, state } = this
    return (
      <div
        dangerouslySetInnerHTML={{
          __html: props.t('{{userName}} account edition', { userName: state.userToEdit.publicName, interpolation: { escapeValue: false } })
        }}
      />
    )
  }

  setHeadTitle = () => {
    const { props, state } = this
    if (state.userToEdit.publicName) {
      const headTitle = buildHeadTitle(
        [this.props.t('User administration'), state.userToEdit.publicName]
      )

      props.dispatch(setHeadTitle(headTitle))
    }
  }

  render () {
    const { props, state } = this

    return (
      <div className='tracim__content fullWidthFullHeight'>
        <div className='tracim__content-scrollview'>
          <PageWrapper customClass='account'>
            <PageTitle
              parentClass='account'
              title={this.setTitle()}
              icon='user-o'
              breadcrumbsList={props.breadcrumbs}
            />

            <PageContent parentClass='account'>
              <UserInfo user={state.userToEdit} />

              <Delimiter customClass='account__delimiter' />

              <div className='account__userpreference'>
                <MenuSubComponent
                  menu={state.subComponentMenu}
                  onClickMenuItem={this.handleClickSubComponentMenuItem}
                />

                <div className='account__userpreference__setting'>
                  {(() => {
                    switch (state.subComponentMenu.find(({ active }) => active).name) {
                      case 'personalData':
                        return (
                          <PersonalData
                            userEmail={state.userToEdit.email}
                            userUsername={state.userToEdit.username}
                            userPublicName={state.userToEdit.publicName}
                            userAuthType={state.userToEdit.authType}
                            onClickSubmit={this.handleSubmitPersonalData}
                            onChangeUsername={this.handleChangeUsername}
                            isUsernameValid={state.userToEdit.isUsernameValid}
                            usernameInvalidMsg={state.userToEdit.usernameInvalidMsg}
                            displayAdminInfo
                          />
                        )

                      case 'spacesConfig':
                        return (
                          <UserSpacesConfig
                            userToEditId={Number(state.userToEditId)}
                            userEmail={state.userToEdit.email}
                            userPublicName={state.userToEdit.publicName}
                            userUsername={state.userToEdit.username}
                            onChangeSubscriptionNotif={this.handleChangeSubscriptionNotif}
                            openSpacesManagement={props.openSpacesManagement}
                            admin
                          />
                        )

                      case 'password':
                        return <Password onClickSubmit={this.handleSubmitPassword} displayAdminInfo />

                      case 'agenda':
                        return (
                          <AgendaInfo
                            customClass='account__agenda'
                            introText={props.t('Use this link to integrate this agenda to your')}
                            caldavText={props.t('CalDAV compatible software')}
                            agendaUrl={state.userToEdit.agendaUrl}
                          />
                        )
                    }
                  })()}
                </div>
              </div>

            </PageContent>
          </PageWrapper>
        </div>
      </div>
    )
  }
}

const mapStateToProps = ({ breadcrumbs, user, timezone, system, appList }) => ({
  breadcrumbs, user, timezone, system, appList
})
export default withRouter(connect(mapStateToProps)(translate()(TracimComponent(Account))))
