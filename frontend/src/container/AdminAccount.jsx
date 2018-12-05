import React from 'react'
import { connect } from 'react-redux'
import { withRouter } from 'react-router-dom'
import UserInfo from '../component/Account/UserInfo.jsx'
import MenuSubComponent from '../component/Account/MenuSubComponent.jsx'
import PersonalData from '../component/Account/PersonalData.jsx'
// import Calendar from '../component/Account/Calendar.jsx'
// import Timezone from '../component/Account/Timezone.jsx'
import Notification from '../component/Account/Notification.jsx'
import Password from '../component/Account/Password.jsx'
import {
  Delimiter,
  PageWrapper,
  PageTitle,
  PageContent,
  generateAvatarFromPublicName
} from 'tracim_frontend_lib'
import {
  newFlashMessage
} from '../action-creator.sync.js'
import {
  getUser,
  getUserWorkspaceList,
  getWorkspaceMemberList,
  putUserName,
  putUserEmail,
  putUserPassword,
  putUserWorkspaceDoNotify
} from '../action-creator.async.js'
import { translate } from 'react-i18next'

class Account extends React.Component {
  constructor (props) {
    super(props)

    const builtSubComponentMenu = [{
      name: 'personalData',
      active: true,
      label: props.t('My profile')
    }, {
      name: 'notification',
      active: false,
      label: props.t('Shared spaces and notifications')
    }, {
      name: 'password',
      active: false,
      label: props.t('Password')
      // }, {
      //   name: 'timezone',
      //   active: false,
      //   label: 'Timezone'
      // }, {
      //   name: 'calendar',
      //   label: 'Calendrier personnel',
      //   active: false
    }].filter(menu => props.system.config.email_notification_activated ? true : menu.name !== 'notification')

    this.state = {
      idUserToEdit: props.match.params.iduser,
      userToEdit: {
        public_name: ''
      },
      userToEditWorkspaceList: [],
      subComponentMenu: builtSubComponentMenu
    }
  }

  async componentDidMount () {
    this.getUserDetail()
    this.getUserWorkspaceList()
  }

  getUserDetail = async () => {
    const { props, state } = this

    const fetchGetUser = await props.dispatch(getUser(state.idUserToEdit))

    switch (fetchGetUser.status) {
      case 200:
        this.setState({
          userToEdit: {
            ...fetchGetUser.json,
            avatar_url: fetchGetUser.json.avatar_url ? fetchGetUser.json.avatar_url : generateAvatarFromPublicName(fetchGetUser.json.public_name)
          }
        })
        break
      default: props.dispatch(newFlashMessage(props.t('Error while loading user')))
    }
  }

  getUserWorkspaceList = async () => {
    const { props, state } = this

    const fetchGetUserWorkspaceList = await props.dispatch(getUserWorkspaceList(state.idUserToEdit))

    switch (fetchGetUserWorkspaceList.status) {
      case 200: this.getUserWorkspaceListMemberList(fetchGetUserWorkspaceList.json); break
      default: props.dispatch(newFlashMessage(props.t('Error while loading user')))
    }
  }

  getUserWorkspaceListMemberList = async (wsList) => {
    const { props } = this

    const fetchWorkspaceListMemberList = await Promise.all(
      wsList.map(async ws => ({
        idWorkspace: ws.workspace_id,
        fetchMemberList: await props.dispatch(getWorkspaceMemberList(ws.workspace_id))
      }))
    )

    const workspaceListMemberList = fetchWorkspaceListMemberList.map(wsMemberList => ({
      idWorkspace: wsMemberList.idWorkspace,
      memberList: wsMemberList.fetchMemberList.status === 200
        ? wsMemberList.fetchMemberList.json
        : [] // handle error ?
    }))

    this.setState({
      userToEditWorkspaceList: wsList.map(ws => ({
        ...ws,
        id: ws.workspace_id, // duplicate id to be able use <Notification /> easily
        memberList: workspaceListMemberList.find(wsm => ws.workspace_id === wsm.idWorkspace).memberList
      }))
    })
  }

  handleClickSubComponentMenuItem = subMenuItemName => this.setState(prev => ({
    subComponentMenu: prev.subComponentMenu.map(m => ({...m, active: m.name === subMenuItemName}))
  }))

  handleSubmitNameOrEmail = async (newName, newEmail, checkPassword) => {
    const { props, state } = this

    if (newName !== '') {
      const fetchPutUserName = await props.dispatch(putUserName(state.userToEdit, newName))
      switch (fetchPutUserName.status) {
        case 200:
          this.setState(prev => ({userToEdit: {...prev.userToEdit, public_name: newName}}))
          if (newEmail === '') {
            props.dispatch(newFlashMessage(props.t('Name has been changed'), 'info'))
            return true
          }
          // else, if email also has been changed, flash msg is handled bellow to not display 2 flash msg
          break
        default: props.dispatch(newFlashMessage(props.t('Error while changing name'), 'warning')); break
      }
    }

    if (newEmail !== '') {
      const fetchPutUserEmail = await props.dispatch(putUserEmail(state.userToEdit, newEmail, checkPassword))
      switch (fetchPutUserEmail.status) {
        case 200:
          this.setState(prev => ({userToEdit: {...prev.userToEdit, email: newEmail}}))
          if (newName !== '') props.dispatch(newFlashMessage(props.t('Name and email has been changed'), 'info'))
          else props.dispatch(newFlashMessage(props.t('Email has been changed'), 'info'))
          return true
        default: props.dispatch(newFlashMessage(props.t('Error while changing email'), 'warning')); break
      }
    }

    return false
  }

  handleChangeSubscriptionNotif = async (idWorkspace, doNotify) => {
    const { props, state } = this

    const fetchPutUserWorkspaceDoNotify = await props.dispatch(putUserWorkspaceDoNotify(state.userToEdit, idWorkspace, doNotify))
    switch (fetchPutUserWorkspaceDoNotify.status) {
      case 204: this.setState(prev => ({
        userToEditWorkspaceList: prev.userToEditWorkspaceList.map(ws => ws.workspace_id === idWorkspace
          ? {...ws, memberList: ws.memberList.map(u => u.user_id === state.userToEdit.user_id ? {...u, do_notify: doNotify} : u)}
          : ws
        )}))
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

  handleChangeTimezone = newTimezone => console.log('(NYI) new timezone : ', newTimezone)

  render () {
    const { props, state } = this

    const subComponent = (() => {
      switch (state.subComponentMenu.find(({active}) => active).name) {
        case 'personalData':
          return <PersonalData onClickSubmit={this.handleSubmitNameOrEmail} displayAdminInfo />

        // case 'calendar':
        //   return <Calendar user={props.user} />

        case 'notification':
          return <Notification
            idMyself={parseInt(state.idUserToEdit)}
            workspaceList={state.userToEditWorkspaceList}
            onChangeSubscriptionNotif={this.handleChangeSubscriptionNotif}
          />

        case 'password':
          return <Password onClickSubmit={this.handleSubmitPassword} displayAdminInfo />

        // case 'timezone':
        //   return <Timezone timezone={props.timezone} onChangeTimezone={this.handleChangeTimezone} />
      }
    })()

    return (
      <div className='tracim__content fullWidthFullHeight'>
        <PageWrapper customClass='account'>
          <PageTitle
            parentClass={'account'}
            title={props.t('Admin account page')}
            icon='user-o'
          />

          <PageContent parentClass='account'>
            <UserInfo user={state.userToEdit} />

            <Delimiter customClass={'account__delimiter'} />

            <div className='account__userpreference'>
              <MenuSubComponent
                menu={state.subComponentMenu}
                onClickMenuItem={this.handleClickSubComponentMenuItem}
              />

              <div className='account__userpreference__setting'>
                { subComponent }
              </div>
            </div>

          </PageContent>
        </PageWrapper>
      </div>
    )
  }
}

const mapStateToProps = ({ user, workspaceList, timezone, system }) => ({ user, workspaceList, timezone, system })
export default withRouter(connect(mapStateToProps)(translate()(Account)))
