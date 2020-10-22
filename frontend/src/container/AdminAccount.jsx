import React from 'react'
import { connect } from 'react-redux'
import { Link, withRouter } from 'react-router-dom'
import { translate } from 'react-i18next'
import debounce from 'lodash/debounce'
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
  buildHeadTitle,
  serialize,
  TLM_ENTITY_TYPE as TLM_ET,
  TLM_CORE_EVENT_TYPE as TLM_CET,
  TracimComponent,
  checkUsernameValidity,
  ALLOWED_CHARACTERS_USERNAME,
  MAXIMUM_CHARACTERS_USERNAME,
  MINIMUM_CHARACTERS_USERNAME,
  CHECK_USERNAME_DEBOUNCE_WAIT
} from 'tracim_frontend_lib'
import {
  newFlashMessage,
  setBreadcrumbs,
  setHeadTitle
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
  getUserCalendar
} from '../action-creator.async.js'
import {
  editableUserAuthTypeList,
  PAGE,
  MINIMUM_CHARACTERS_PUBLIC_NAME,
  FETCH_CONFIG
} from '../util/helper.js'
import AgendaInfo from '../component/Dashboard/AgendaInfo.jsx'
import { serializeUserProps } from '../reducer/user.js'
import { serializeMember } from '../reducer/currentWorkspace.js'

export class Account extends React.Component {
  constructor (props) {
    super(props)

    const builtSubComponentMenu = [{
      name: 'personalData',
      active: true,
      label: props.t('Profile'),
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
        usernameInvalidMsg: ''
      },
      userToEditWorkspaceList: [],
      subComponentMenu: builtSubComponentMenu
    }

    props.registerCustomEventHandlerList([
      { name: CUSTOM_EVENT.ALL_APP_CHANGE_LANGUAGE, handler: this.handleAllAppChangeLanguage }
    ])

    props.registerLiveMessageHandlerList([
      { entityType: TLM_ET.SHAREDSPACE_MEMBER, coreEntityType: TLM_CET.MODIFIED, handler: this.handleMemberModified },
      { entityType: TLM_ET.USER, coreEntityType: TLM_CET.MODIFIED, handler: this.handleUserModified }
    ])
  }

  // TLM Handler
  handleUserModified = data => {
    const { state } = this
    if (Number(state.userToEditId) !== data.fields.user.user_id) return
    if (state.userToEdit.publicName !== data.fields.user.public_name) {
      this.setState(prev => ({ userToEdit: { ...prev.userToEdit, publicName: data.fields.user.public_name } }))
      return
    }
    if (state.userToEdit.username !== data.fields.user.username) {
      this.setState(prev => ({ userToEdit: { ...prev.userToEdit, username: data.fields.user.username } }))
      return
    }
    if (state.userToEdit.email !== data.fields.user.email) {
      this.setState(prev => ({ userToEdit: { ...prev.userToEdit, email: data.fields.user.email } }))
      return
    }
    if (state.userToEdit.profile !== data.fields.user.profile) this.setState(prev => ({ userToEdit: { ...prev.userToEdit, profile: data.fields.user.profile } }))
  }

  handleMemberModified = data => {
    const { state } = this
    if (Number(state.userToEditId) !== data.fields.user.user_id) return
    this.setState(prev => ({
      userToEditWorkspaceList: prev.userToEditWorkspaceList.map(ws => ws.id === data.fields.workspace.workspace_id
        ? {
          ...ws,
          memberList: ws.memberList.map(member => member.id === Number(state.userToEditId)
            ? { ...member, doNotify: data.fields.member.do_notify }
            : member
          )
        }
        : ws
      )
    }))
  }

  // Custom Event Handler
  handleAllAppChangeLanguage = () => {
    this.buildBreadcrumbs()
    this.setHeadTitle()
  }

  async componentDidMount () {
    await this.getUserDetail()
    this.setHeadTitle()
    this.getUserWorkspaceList()
    if (this.props.appList.some(a => a.slug === 'agenda')) this.loadAgendaUrl()
    this.buildBreadcrumbs()
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
            allowedSpace: fetchGetUser.json.allowed_space,
            ...serialize(fetchGetUser.json, serializeUserProps)
          },
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
        <Link to={PAGE.ADMIN.USER_EDIT(state.userToEdit.userId)}>
          {state.userToEdit.publicName}
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
        memberList: workspaceListMemberList
          .find(wsm => ws.workspace_id === wsm.workspaceId).memberList
          .map(m => serializeMember(m))
      }))
    })
  }

  handleClickSubComponentMenuItem = subMenuItemName => this.setState(prev => ({
    subComponentMenu: prev.subComponentMenu.map(m => ({ ...m, active: m.name === subMenuItemName })),
    userToEdit: { ...prev.userToEdit, isUsernameValid: true }
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
                            workspaceList={state.userToEditWorkspaceList}
                            onChangeSubscriptionNotif={this.handleChangeSubscriptionNotif}
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

const mapStateToProps = ({ breadcrumbs, user, workspaceList, timezone, system, appList }) => ({
  breadcrumbs, user, workspaceList, timezone, system, appList
})
export default withRouter(connect(mapStateToProps)(translate()(TracimComponent(Account))))
