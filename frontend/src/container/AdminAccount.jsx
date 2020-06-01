import React from 'react'
import { connect } from 'react-redux'
import { Link, withRouter } from 'react-router-dom'
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
  setBreadcrumbs
} from '../action-creator.sync.js'
import {
  getUser,
  getUserWorkspaceList,
  getWorkspaceMemberList,
  putUserPublicName,
  putUserEmail,
  putUserUsername,
  putUserPassword,
  putUserWorkspaceDoNotify,
  getUsernameAvailability,
  getUserCalendar
} from '../action-creator.async.js'
import {
  ALLOWED_CHARACTERS_USERNAME,
  editableUserAuthTypeList,
  PAGE,
  MINIMUM_CHARACTERS_PUBLIC_NAME,
  MINIMUM_CHARACTERS_USERNAME
} from '../util/helper.js'
import AgendaInfo from '../component/Dashboard/AgendaInfo.jsx'

class Account extends React.Component {
  constructor (props) {
    super(props)

    const builtSubComponentMenu = [{
      name: 'personalData',
      active: true,
      label: props.t('Profile'),
      display: true
    }, {
      name: 'notification',
      active: false,
      label: props.t('Shared spaces and notifications'),
      display: props.system.config.email_notification_activated
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
        public_name: '',
        auth_type: 'internal',
        agendaUrl: '',
        username: '',
        newUsernameAvailability: true
      },
      userToEditWorkspaceList: [],
      subComponentMenu: builtSubComponentMenu
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

  async componentDidMount () {
    await this.getUserDetail()
    this.setHeadTitle()
    this.getUserWorkspaceList()
    if (this.props.appList.some(a => a.slug === 'agenda')) this.loadAgendaUrl()
    this.buildBreadcrumbs()
  }

  componentDidUpdate (prevProps) {
    const { props } = this

    if (prevProps.system.config.instance_name !== props.system.config.instance_name) {
      this.setHeadTitle()
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
          userToEdit: fetchGetUser.json,
          subComponentMenu: prev.subComponentMenu
            .filter(menu => editableUserAuthTypeList.includes(fetchGetUser.json.auth_type) ? true : menu.name !== 'password')
        }))
        break
      default: props.dispatch(newFlashMessage(props.t('Error while loading user')))
    }
  }

  getUserWorkspaceList = async () => {
    const { props, state } = this
    const showOwnedWorkspace = false

    const fetchGetUserWorkspaceList = await props.dispatch(getUserWorkspaceList(state.userToEditId, showOwnedWorkspace))

    switch (fetchGetUserWorkspaceList.status) {
      case 200: this.getUserWorkspaceListMemberList(fetchGetUserWorkspaceList.json); break
      default: props.dispatch(newFlashMessage(props.t('Error while loading user')))
    }
  }

  buildBreadcrumbs = () => {
    const { props, state } = this

    props.dispatch(setBreadcrumbs([{
      link: <Link to={PAGE.HOME}><i className='fa fa-home' />{props.t('Home')}</Link>,
      type: BREADCRUMBS_TYPE.CORE
    }, {
      link: <span>{props.t('Administration')}</span>,
      type: BREADCRUMBS_TYPE.CORE,
      notALink: true
    }, {
      link: <Link to={PAGE.ADMIN.USER}>{props.t('Users')}</Link>,
      type: BREADCRUMBS_TYPE.CORE
    }, {
      link: (
        <Link to={PAGE.ADMIN.USER_EDIT(state.userToEdit.user_id)}>
          {state.userToEdit.public_name}
        </Link>
      ),
      type: BREADCRUMBS_TYPE.CORE
    }]))
  }

  getUserWorkspaceListMemberList = async (wsList) => {
    const { props } = this

    const fetchWorkspaceListMemberList = await Promise.all(
      wsList.map(async ws => ({
        workspaceId: ws.workspace_id,
        fetchMemberList: await props.dispatch(getWorkspaceMemberList(ws.workspace_id))
      }))
    )

    const workspaceListMemberList = fetchWorkspaceListMemberList.map(wsMemberList => ({
      workspaceId: wsMemberList.workspaceId,
      memberList: wsMemberList.fetchMemberList.status === 200
        ? wsMemberList.fetchMemberList.json
        : [] // handle error ?
    }))

    this.setState({
      userToEditWorkspaceList: wsList.map(ws => ({
        ...ws,
        id: ws.workspace_id, // duplicate id to be able use <Notification /> easily
        memberList: workspaceListMemberList.find(wsm => ws.workspace_id === wsm.workspaceId).memberList.map(m => ({
          id: m.user_id,
          publicName: m.user.public_name,
          role: m.role,
          isActive: m.is_active,
          doNotify: m.do_notify
        }))
      }))
    })
  }

  handleClickSubComponentMenuItem = subMenuItemName => this.setState(prev => ({
    subComponentMenu: prev.subComponentMenu.map(m => ({ ...m, active: m.name === subMenuItemName })),
    userToEdit: { ...prev.userToEdit, newUsernameAvailability: true }
  }))

  handleSubmitPersonalData = async (newPublicName, newUsername, newEmail, checkPassword) => {
    const { props, state } = this

    if (newPublicName !== '') {
      if (newPublicName.length < MINIMUM_CHARACTERS_PUBLIC_NAME) {
        props.dispatch(newFlashMessage(
          props.t('Full name must be at least {{minimumCharactersPublicName}} characters', { minimumCharactersPublicName: MINIMUM_CHARACTERS_PUBLIC_NAME })
          , 'warning')
        )
        return false
      }

      const fetchPutUserPublicName = await props.dispatch(putUserPublicName(state.userToEdit, newPublicName))
      switch (fetchPutUserPublicName.status) {
        case 200:
          this.setState(prev => ({ userToEdit: { ...prev.userToEdit, public_name: newPublicName } }))
          if (newEmail === '') {
            props.dispatch(newFlashMessage(props.t('Name has been changed'), 'info'))
            return true
          }
          // else, if email also has been changed, flash msg is handled bellow to not display 2 flash msg
          break
        default: props.dispatch(newFlashMessage(props.t('Error while changing name'), 'warning')); break
      }
    }

    if (newUsername !== '') {
      const username = removeAtInUsername(newUsername)

      if (username.length < MINIMUM_CHARACTERS_USERNAME) {
        props.dispatch(newFlashMessage(
          props.t('Username must be at least {{minimumCharactersUsername}} characters', { minimumCharactersUsername: MINIMUM_CHARACTERS_USERNAME })
          , 'warning')
        )
        return false
      }

      if (/\s/.test(username)) {
        props.dispatch(newFlashMessage(props.t("Username can't contain any whitespace"), 'warning'))
        return false
      }

      const fetchPutUsername = await props.dispatch(putUserUsername(state.userToEdit, username, checkPassword))
      switch (fetchPutUsername.status) {
        case 200:
          this.setState(prev => ({ userToEdit: { ...prev.userToEdit, username: username } }))
          if (newEmail === '') {
            if (newPublicName !== '') props.dispatch(newFlashMessage(props.t('Username and name has been changed'), 'info'))
            else props.dispatch(newFlashMessage(props.t('Username has been changed'), 'info'))
            return true
          }
          break
        case 400:
          switch (fetchPutUsername.json.code) {
            case 2062:
              props.dispatch(newFlashMessage(
                props.t('Your username is incorrect, the allowed characters are {{allowedCharactersUsername}}', { allowedCharactersUsername: ALLOWED_CHARACTERS_USERNAME })
              , 'warning'))
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
          this.setState(prev => ({ userToEdit: { ...prev.userToEdit, email: newEmail } }))
          if (newUsername !== '' || newPublicName !== '') props.dispatch(newFlashMessage(props.t('Personal data has been changed'), 'info'))
          else props.dispatch(newFlashMessage(props.t('Email has been changed'), 'info'))
          return true
        default: props.dispatch(newFlashMessage(props.t('Error while changing email'), 'warning')); break
      }
    }

    return false
  }

  handleChangeUsername = async (username) => {
    const { props } = this

    const fetchUsernameAvailability = await props.dispatch(getUsernameAvailability(removeAtInUsername(username)))

    switch (fetchUsernameAvailability.status) {
      case 200:
        this.setState(prev => ({ userToEdit: { ...prev.userToEdit, newUsernameAvailability: fetchUsernameAvailability.json.available } }))
        break
      default: props.dispatch(newFlashMessage(props.t('Error while checking username availability'), 'warning')); break
    }
  }

  handleChangeSubscriptionNotif = async (workspaceId, doNotify) => {
    const { props, state } = this

    const fetchPutUserWorkspaceDoNotify = await props.dispatch(putUserWorkspaceDoNotify(state.userToEdit, workspaceId, doNotify))
    switch (fetchPutUserWorkspaceDoNotify.status) {
      case 204:
        this.setState(prev => ({
          userToEditWorkspaceList: prev.userToEditWorkspaceList.map(ws => ws.workspace_id === workspaceId
            ? { ...ws, memberList: ws.memberList.map(u => u.id === state.userToEdit.user_id ? { ...u, doNotify: doNotify } : u) }
            : ws
          )
        }))
        break
      default: props.dispatch(newFlashMessage(props.t('Error while changing subscription'), 'warning'))
    }
  }

  handleSubmitPassword = async (oldPassword, newPassword, newPassword2) => {
    const { props, state } = this

    const fetchPutUserPassword = await props.dispatch(putUserPassword(state.userToEdit, oldPassword, newPassword, newPassword2))
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
          __html: props.t('{{userName}} account edition', { userName: state.userToEdit.public_name, interpolation: { escapeValue: false } })
        }}
      />
    )
  }

  setHeadTitle = () => {
    const { props, state } = this
    if (props.system.config.instance_name && state.userToEdit.public_name) {
      GLOBAL_dispatchEvent({
        type: CUSTOM_EVENT.SET_HEAD_TITLE,
        data: { title: buildHeadTitle([this.props.t('User administration'), state.userToEdit.public_name, props.system.config.instance_name]) }
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
                            userAuthType={state.userToEdit.auth_type}
                            onClickSubmit={this.handleSubmitPersonalData}
                            onChangeUsername={this.handleChangeUsername}
                            newUsernameAvailability={state.userToEdit.newUsernameAvailability}
                            displayAdminInfo
                          />
                        )

                      case 'notification':
                        return (
                          <Notification
                            userLoggedId={parseInt(state.userToEditId)}
                            workspaceList={state.userToEditWorkspaceList}
                            onChangeSubscriptionNotif={this.handleChangeSubscriptionNotif}
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

const mapStateToProps = ({ breadcrumbs, user, workspaceList, timezone, system, appList }) => ({
  breadcrumbs, user, workspaceList, timezone, system, appList
})
export default withRouter(connect(mapStateToProps)(translate()(Account)))
