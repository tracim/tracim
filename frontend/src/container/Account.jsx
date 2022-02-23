import React from 'react'
import { connect } from 'react-redux'
import { translate } from 'react-i18next'
import debounce from 'lodash/debounce'
import i18n from '../util/i18n.js'
import * as Cookies from 'js-cookie'
import appFactory from '../util/appFactory.js'
import UserInfo from '../component/Account/UserInfo.jsx'
import MenuSubComponent from '../component/Account/MenuSubComponent.jsx'
import PersonalData from '../component/Account/PersonalData.jsx'
import UserSpacesConfig from '../component/Account/UserSpacesConfig.jsx'
import Password from '../component/Account/Password.jsx'
import {
  Delimiter,
  PageWrapper,
  PageTitle,
  PageContent,
  BREADCRUMBS_TYPE,
  CUSTOM_EVENT,
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
  updateUserAgendaUrl,
  setBreadcrumbs,
  setHeadTitle
} from '../action-creator.sync.js'
import {
  putMyselfName,
  putMyselfEmail,
  putUserUsername,
  putMyselfPassword,
  putMyselfWorkspaceDoNotify,
  getLoggedUserCalendar,
  putUserLang
} from '../action-creator.async.js'
import {
  COOKIE_FRONTEND,
  editableUserAuthTypeList,
  MINIMUM_CHARACTERS_PUBLIC_NAME,
  FETCH_CONFIG
} from '../util/helper.js'
import AgendaInfo from '../component/Dashboard/AgendaInfo.jsx'

export class Account extends React.Component {
  constructor (props) {
    super(props)

    const builtSubComponentMenu = [{
      name: 'personalData',
      active: true,
      label: 'My account',
      translationKey: props.t('My account'),
      display: true
    }, {
      name: 'spacesConfig',
      active: false,
      label: 'Spaces',
      translationKey: props.t('Spaces'),
      display: true
    }, {
      name: 'password',
      active: false,
      label: 'Password',
      translationKey: props.t('Password'),
      display: editableUserAuthTypeList.includes(props.user.authType) // allow pw change only for users in tracim's db (eg. not from ldap)
    }, {
      name: 'agenda',
      active: false,
      label: 'Agenda',
      translationKey: props.t('Agenda'),
      display: props.appList.some(a => a.slug === 'agenda')
    }]

    this.state = {
      subComponentMenu: builtSubComponentMenu.filter(menu => menu.display),
      isUsernameValid: true,
      usernameInvalidMsg: ''
    }

    props.registerCustomEventHandlerList([
      { name: CUSTOM_EVENT.ALL_APP_CHANGE_LANGUAGE, handler: this.handleAllAppChangeLanguage }
    ])
  }

  // Custom Event Handler
  handleAllAppChangeLanguage = () => {
    this.buildBreadcrumbs()
    this.setHeadTitle()
  }

  componentDidMount () {
    const { props } = this
    this.setHeadTitle()
    if (props.appList.some(a => a.slug === 'agenda')) this.loadAgendaUrl()
    this.buildBreadcrumbs()
  }

  componentDidUpdate (prevProps) {
    const { props } = this

    if (prevProps.system.config.instance_name !== props.system.config.instance_name) {
      this.setHeadTitle()
    }
  }

  componentWillUnmount () {
    this.handleChangeUsername.cancel()
  }

  loadAgendaUrl = async () => {
    const { props } = this
    const fetchUserAgenda = await props.dispatch(getLoggedUserCalendar())
    switch (fetchUserAgenda.status) {
      case 200: {
        const newAgendaUrl = (fetchUserAgenda.json.find(a => a.agenda_type === 'private') || { agenda_url: '' }).agenda_url
        props.dispatch(updateUserAgendaUrl(newAgendaUrl))
        break
      }
      default:
        props.dispatch(newFlashMessage(props.t('Error while loading your agenda'), 'warning'))
    }
  }

  buildBreadcrumbs = () => {
    const { props } = this

    props.dispatch(setBreadcrumbs([{
      link: PAGE.ACCOUNT,
      type: BREADCRUMBS_TYPE.CORE,
      label: props.t('Account Settings'),
      isALink: true
    }]))
  }

  handleClickSubComponentMenuItem = subMenuItemName => this.setState(prev => ({
    subComponentMenu: prev.subComponentMenu.map(m => ({ ...m, active: m.name === subMenuItemName })),
    isUsernameValid: true
  }))

  handleSubmitPersonalData = async (newPublicName, newUsername, newEmail, checkPassword, newLang) => {
    const { props } = this

    if (newPublicName !== '') {
      if (newPublicName.length < MINIMUM_CHARACTERS_PUBLIC_NAME) {
        props.dispatch(newFlashMessage(
          props.t('Full name must be at least {{minimumCharactersPublicName}} characters', { minimumCharactersPublicName: MINIMUM_CHARACTERS_PUBLIC_NAME })
          , 'warning')
        )
        return false
      }

      const fetchPutPublicName = await props.dispatch(putMyselfName(props.user, newPublicName))
      switch (fetchPutPublicName.status) {
        case 200:
          if (newEmail === '' && newUsername === '') {
            props.dispatch(newFlashMessage(props.t('Your name has been changed'), 'info'))
            return true
          }
          // else, if email also has been changed, flash msg is handled bellow to not display 2 flash msg
          break
        default:
          props.dispatch(newFlashMessage(props.t('Error while changing name'), 'warning'))
          if (newEmail === '') return false
          break
      }
    }

    if (newUsername !== '') {
      const fetchPutUsername = await props.dispatch(putUserUsername(props.user, newUsername, checkPassword))

      switch (fetchPutUsername.status) {
        case 200:
          if (newEmail === '') {
            if (newPublicName !== '') props.dispatch(newFlashMessage(props.t('Your username and your name has been changed'), 'info'))
            else props.dispatch(newFlashMessage(props.t('Your username has been changed'), 'info'))
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
      const fetchPutUserEmail = await props.dispatch(putMyselfEmail(newEmail, checkPassword))
      switch (fetchPutUserEmail.status) {
        case 200:
          if (newUsername !== '' || newPublicName !== '') props.dispatch(newFlashMessage(props.t('Your personal data has been changed'), 'info'))
          else props.dispatch(newFlashMessage(props.t('Your email has been changed'), 'info'))
          return true
        default: props.dispatch(newFlashMessage(props.t('Error while changing email'), 'warning')); return false
      }
    }

    if (newLang !== props.user.lang) {
      const fetchPutUserLang = await props.dispatch(putUserLang(props.user, newLang))
      switch (fetchPutUserLang.status) {
        case 200:
          i18n.changeLanguage(newLang)
          Cookies.set(COOKIE_FRONTEND.DEFAULT_LANGUAGE, newLang, { expires: COOKIE_FRONTEND.DEFAULT_EXPIRE_TIME })
          props.dispatchCustomEvent(CUSTOM_EVENT.ALL_APP_CHANGE_LANGUAGE, newLang)
          return true
        default: props.dispatch(newFlashMessage(props.t('Error while saving new lang'))); return false
      }
    }
  }

  changeUsername = async (newUsername) => {
    if (!newUsername) {
      this.setState({ isUsernameValid: true, usernameInvalidMsg: '' })
      return
    }

    const { props } = this
    try {
      this.setState(await checkUsernameValidity(FETCH_CONFIG.apiUrl, newUsername, props))
    } catch (errorWhileChecking) {
      props.dispatch(newFlashMessage(errorWhileChecking.message, 'warning'))
    }
  }

  handleChangeUsername = debounce(this.changeUsername, CHECK_USERNAME_DEBOUNCE_WAIT)

  handleChangeSubscriptionNotif = async (workspaceId, doNotify) => {
    const { props } = this

    const fetchPutUserWorkspaceDoNotify = await props.dispatch(putMyselfWorkspaceDoNotify(workspaceId, doNotify))
    if (fetchPutUserWorkspaceDoNotify.status !== 204) {
      props.dispatch(newFlashMessage(props.t('Error while changing subscription'), 'warning'))
    }
  }

  handleSubmitPassword = async (oldPassword, newPassword, newPassword2) => {
    const { props } = this

    const fetchPutUserPassword = await props.dispatch(putMyselfPassword(oldPassword, newPassword, newPassword2))
    switch (fetchPutUserPassword.status) {
      case 204: props.dispatch(newFlashMessage(props.t('Your password has been changed'), 'info')); return true
      case 403: props.dispatch(newFlashMessage(props.t('Wrong old password'), 'warning')); return false
      default: props.dispatch(newFlashMessage(props.t('Error while changing password'), 'warning')); return false
    }
  }

  handleChangeTimezone = newTimezone => console.log('(NYI) new timezone: ', newTimezone)

  setHeadTitle = () => {
    const { props } = this
    props.dispatch(setHeadTitle(props.t('Account Settings')))
  }

  render () {
    const { props, state } = this

    return (
      <div className='tracim__content fullWidthFullHeight'>
        <div className='tracim__content-scrollview'>
          <PageWrapper customClass='account'>
            <PageTitle
              parentClass='account'
              title={props.t('Account Settings')}
              icon='fas fa-cogs'
              breadcrumbsList={props.breadcrumbs}
            />

            <PageContent parentClass='account'>
              <UserInfo user={props.user} />

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
                            userEmail={props.user.email}
                            userUsername={props.user.username}
                            userPublicName={props.user.publicName}
                            userAuthType={props.user.authType}
                            onClickSubmit={this.handleSubmitPersonalData}
                            onChangeUsername={this.handleChangeUsername}
                            isUsernameValid={state.isUsernameValid}
                            usernameInvalidMsg={state.usernameInvalidMsg}
                          />
                        )

                      case 'spacesConfig':
                        return (
                          <UserSpacesConfig
                            userToEditId={props.user.userId}
                            onChangeSubscriptionNotif={this.handleChangeSubscriptionNotif}
                            admin={false}
                          />
                        )

                      case 'password':
                        return <Password onClickSubmit={this.handleSubmitPassword} />

                      case 'agenda':
                        return (
                          <AgendaInfo
                            customClass='account__agenda'
                            introText={props.t('Use this link to integrate this agenda to your')}
                            caldavText={props.t('CalDAV compatible software')}
                            agendaUrl={props.user.agendaUrl}
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
export default connect(mapStateToProps)(translate()(appFactory(TracimComponent(Account))))
