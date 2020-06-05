import React from 'react'
import { connect } from 'react-redux'
import { Link } from 'react-router-dom'
import { translate } from 'react-i18next'
import UserInfo from '../component/Account/UserInfo.jsx'
import MenuSubComponent from '../component/Account/MenuSubComponent.jsx'
import PersonalData from '../component/Account/PersonalData.jsx'
import Notification from '../component/Account/Notification.jsx'
import Password from '../component/Account/Password.jsx'
import {
  Delimiter,
  PageWrapper,
  PageTitle,
  PageContent,
  BREADCRUMBS_TYPE,
  CUSTOM_EVENT,
  buildHeadTitle,
  removeAtInUsername
} from 'tracim_frontend_lib'
import {
  newFlashMessage,
  setWorkspaceListMemberList,
  updateUserPublicName,
  updateUserEmail,
  updateUserWorkspaceSubscriptionNotif,
  updateUserAgendaUrl,
  updateUserUsername,
  setBreadcrumbs
} from '../action-creator.sync.js'
import {
  getWorkspaceMemberList,
  putMyselfName,
  putMyselfEmail,
  putUserUsername,
  putMyselfPassword,
  putMyselfWorkspaceDoNotify,
  getLoggedUserCalendar,
  getUsernameAvailability
} from '../action-creator.async.js'
import {
  ALLOWED_CHARACTERS_USERNAME,
  editableUserAuthTypeList,
  PAGE,
  MINIMUM_CHARACTERS_PUBLIC_NAME,
  MINIMUM_CHARACTERS_USERNAME
} from '../util/helper.js'
import AgendaInfo from '../component/Dashboard/AgendaInfo.jsx'

export class Account extends React.Component {
  constructor (props) {
    super(props)

    const builtSubComponentMenu = [{
      name: 'personalData',
      active: true,
      label: 'My profile',
      translationKey: props.t('My profile'),
      display: true
    }, {
      name: 'notification',
      active: false,
      label: 'Shared spaces and notifications',
      translationKey: props.t('Shared spaces and notifications'),
      display: props.system.config.email_notification_activated
    }, {
      name: 'password',
      active: false,
      label: 'Password',
      translationKey: props.t('Password'),
      display: editableUserAuthTypeList.includes(props.user.auth_type) // allow pw change only for users in tracim's db (eg. not from ldap)
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

    document.addEventListener(CUSTOM_EVENT.APP_CUSTOM_EVENT_LISTENER, this.customEventReducer)
  }

  customEventReducer = ({ detail: { type, data } }) => {
    switch (type) {
      case CUSTOM_EVENT.ALL_APP_CHANGE_LANGUAGE:
        this.buildBreadcrumbs()
        this.setHeadTitle()
        break
    }
  }

  componentDidMount () {
    const { props } = this
    this.setHeadTitle()
    if (props.system.workspaceListLoaded && props.workspaceList.length > 0) this.loadWorkspaceListMemberList()
    if (props.appList.some(a => a.slug === 'agenda')) this.loadAgendaUrl()
    this.buildBreadcrumbs()
  }

  componentDidUpdate (prevProps) {
    const { props } = this

    if (prevProps.system.config.instance_name !== props.system.config.instance_name) {
      this.setHeadTitle()
    }
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

  loadWorkspaceListMemberList = async () => {
    const { props } = this

    const fetchWorkspaceListMemberList = await Promise.all(
      props.workspaceList.map(async ws => ({
        workspaceId: ws.id,
        fetchMemberList: await props.dispatch(getWorkspaceMemberList(ws.id))
      }))
    )

    const workspaceListMemberList = fetchWorkspaceListMemberList.map(wsMemberList => ({
      workspaceId: wsMemberList.workspaceId,
      memberList: wsMemberList.fetchMemberList.status === 200
        ? wsMemberList.fetchMemberList.json
        : [] // handle error ?
    }))

    props.dispatch(setWorkspaceListMemberList(workspaceListMemberList))
  }

  buildBreadcrumbs = () => {
    const { props } = this

    props.dispatch(setBreadcrumbs([{
      link: <Link to={PAGE.HOME}><i className='fa fa-home' />{props.t('Home')}</Link>,
      type: BREADCRUMBS_TYPE.CORE
    }, {
      link: <span className='nolink'>{props.t('Administration')}</span>,
      type: BREADCRUMBS_TYPE.CORE,
      notALink: true
    }, {
      link: <Link to={PAGE.ACCOUNT}>{props.t('My account')}</Link>,
      type: BREADCRUMBS_TYPE.CORE
    }]))
  }

  handleClickSubComponentMenuItem = subMenuItemName => this.setState(prev => ({
    subComponentMenu: prev.subComponentMenu.map(m => ({ ...m, active: m.name === subMenuItemName })),
    isUsernameValid: true
  }))

  handleSubmitPersonalData = async (newPublicName, newUsername, newEmail, checkPassword) => {
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
          props.dispatch(updateUserPublicName(newPublicName))
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
      const username = removeAtInUsername(newUsername)
      const fetchPutUsername = await props.dispatch(putUserUsername(props.user, username, checkPassword))

      switch (fetchPutUsername.status) {
        case 200:
          props.dispatch(updateUserUsername(username))
          if (newEmail === '') {
            if (newPublicName !== '') props.dispatch(newFlashMessage(props.t('Your username and your name has been changed'), 'info'))
            else props.dispatch(newFlashMessage(props.t('Your username has been changed'), 'info'))
            return true
          }
          break
        case 400:
          switch (fetchPutUsername.json.code) {
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
          props.dispatch(updateUserEmail(fetchPutUserEmail.json.email))
          if (newUsername !== '' || newPublicName !== '') props.dispatch(newFlashMessage(props.t('Your personal data has been changed'), 'info'))
          else props.dispatch(newFlashMessage(props.t('Your email has been changed'), 'info'))
          return true
        default: props.dispatch(newFlashMessage(props.t('Error while changing email'), 'warning')); return false
      }
    }
  }

  handleChangeUsername = async (newUsername) => {
    const { props } = this

    const username = removeAtInUsername(newUsername)

    if (username.length > 0 && username.length < MINIMUM_CHARACTERS_USERNAME) {
      this.setState({
        isUsernameValid: false,
        usernameInvalidMsg: props.t('Username must be at least {{minimumCharactersUsername}} characters', { minimumCharactersUsername: MINIMUM_CHARACTERS_USERNAME })
      })
      return
    }

    if (!(/^[A-Za-z0-9_-]*$/.test(username))) {
      this.setState({
        isUsernameValid: false,
        usernameInvalidMsg: props.t('Allowed characters: {{allowedCharactersUsername}}', { allowedCharactersUsername: ALLOWED_CHARACTERS_USERNAME })
      })
      return
    }

    if (/\s/.test(username)) {
      this.setState({
        isUsernameValid: false,
        usernameInvalidMsg: props.t("Username can't contain any whitespace")
      })
      return
    }

    const fetchUsernameAvailability = await props.dispatch(getUsernameAvailability(username))

    switch (fetchUsernameAvailability.status) {
      case 200:
        this.setState({
          isUsernameValid: fetchUsernameAvailability.json.available,
          usernameInvalidMsg: props.t('This username is not available')
        })
        break
      default: props.dispatch(newFlashMessage(props.t('Error while checking username availability'), 'warning')); break
    }
  }

  handleChangeSubscriptionNotif = async (workspaceId, doNotify) => {
    const { props } = this

    const fetchPutUserWorkspaceDoNotify = await props.dispatch(putMyselfWorkspaceDoNotify(workspaceId, doNotify))
    switch (fetchPutUserWorkspaceDoNotify.status) {
      case 204: props.dispatch(updateUserWorkspaceSubscriptionNotif(props.user.user_id, workspaceId, doNotify)); break
      default: props.dispatch(newFlashMessage(props.t('Error while changing subscription'), 'warning'))
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
    if (props.system.config.instance_name) {
      GLOBAL_dispatchEvent({
        type: CUSTOM_EVENT.SET_HEAD_TITLE,
        data: { title: buildHeadTitle([props.t('My Account'), props.system.config.instance_name]) }
      })
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
              title={props.t('My account')}
              icon='user-o'
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
                            userAuthType={props.user.auth_type}
                            onClickSubmit={this.handleSubmitPersonalData}
                            onChangeUsername={this.handleChangeUsername}
                            isUsernameValid={state.isUsernameValid}
                            usernameInvalidMsg={state.usernameInvalidMsg}
                          />
                        )

                      case 'notification':
                        return (
                          <Notification
                            userLoggedId={props.user.user_id}
                            workspaceList={props.workspaceList}
                            onChangeSubscriptionNotif={this.handleChangeSubscriptionNotif}
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

const mapStateToProps = ({ breadcrumbs, user, workspaceList, timezone, system, appList }) => ({
  breadcrumbs, user, workspaceList, timezone, system, appList
})
export default connect(mapStateToProps)(translate()(Account))
