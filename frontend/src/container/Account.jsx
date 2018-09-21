import React from 'react'
import { connect } from 'react-redux'
import UserInfo from '../component/Account/UserInfo.jsx'
import MenuSubComponent from '../component/Account/MenuSubComponent.jsx'
import PersonalData from '../component/Account/PersonalData.jsx'
// import Calendar from '../component/Account/Calendar.jsx'
import Notification from '../component/Account/Notification.jsx'
import Password from '../component/Account/Password.jsx'
import Timezone from '../component/Account/Timezone.jsx'
import {
  Delimiter,
  PageWrapper,
  PageTitle,
  PageContent
} from 'tracim_frontend_lib'
import {
  newFlashMessage,
  setWorkspaceListMemberList,
  updateUserName,
  updateUserEmail,
  updateUserWorkspaceSubscriptionNotif
} from '../action-creator.sync.js'
import {
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

    this.state = {
      subComponentMenu: [{
        name: 'personalData',
        menuLabel: props.t('My profil'),
        active: true
      }, {
        name: 'notification',
        menuLabel: props.t('Workspaces and notifications'),
        active: false
      }, {
        name: 'password',
        menuLabel: props.t('Password'),
        active: false
      }, {
        name: 'timezone',
        menuLabel: props.t('Timezone'),
        active: false
      }]
      // {
      //   name: 'calendar',
      //   menuLabel: 'Calendrier personnel',
      //   active: false
      // }]
    }
  }

  componentDidMount () {
    const { props } = this
    if (props.system.workspaceListLoaded && props.workspaceList.length > 0) this.loadWorkspaceListMemberList()
  }

  loadWorkspaceListMemberList = async () => {
    const { props } = this

    const fetchWorkspaceListMemberList = await Promise.all(
      props.workspaceList.map(async ws => ({
        idWorkspace: ws.id,
        fetchMemberList: await props.dispatch(getWorkspaceMemberList(ws.id))
      }))
    )

    const workspaceListMemberList = fetchWorkspaceListMemberList.map(wsMemberList => ({
      idWorkspace: wsMemberList.idWorkspace,
      memberList: wsMemberList.fetchMemberList.status === 200
        ? wsMemberList.fetchMemberList.json
        : [] // handle error ?
    }))

    props.dispatch(setWorkspaceListMemberList(workspaceListMemberList))
  }

  handleClickSubComponentMenuItem = subMenuItemName => this.setState(prev => ({
    subComponentMenu: prev.subComponentMenu.map(m => ({...m, active: m.name === subMenuItemName}))
  }))

  handleSubmitNameOrEmail = async (newName, newEmail, checkPassword) => {
    const { props } = this

    if (newName !== '') {
      const fetchPutUserName = await props.dispatch(putUserName(props.user, newName))
      switch (fetchPutUserName.status) {
        case 200:
          props.dispatch(updateUserName(newName))
          if (newEmail === '') props.dispatch(newFlashMessage(props.t('Your name has been changed'), 'info'))
          // else, if email also has been changed, flash msg is handled bellow to not display 2 flash msg
          break
        default: props.dispatch(newFlashMessage(props.t('Error while changing name'), 'warning')); break
      }
    }

    if (newEmail !== '') {
      const fetchPutUserEmail = await props.dispatch(putUserEmail(props.user, newEmail, checkPassword))
      switch (fetchPutUserEmail.status) {
        case 200:
          props.dispatch(updateUserEmail(fetchPutUserEmail.json.email))
          if (newName !== '') props.dispatch(newFlashMessage(props.t('Your name and email has been changed'), 'info'))
          else props.dispatch(newFlashMessage(props.t('Your email has been changed'), 'info'))
          break
        default: props.dispatch(newFlashMessage(props.t('Error while changing email'), 'warning')); break
      }
    }
  }

  handleChangeSubscriptionNotif = async (idWorkspace, doNotify) => {
    const { props } = this

    const fetchPutUserWorkspaceDoNotify = await props.dispatch(putUserWorkspaceDoNotify(props.user, idWorkspace, doNotify))
    switch (fetchPutUserWorkspaceDoNotify.status) {
      case 204: props.dispatch(updateUserWorkspaceSubscriptionNotif(props.user.user_id, idWorkspace, doNotify)); break
      default: props.dispatch(newFlashMessage(props.t('Error while changing subscription'), 'warning'))
    }
  }

  handleSubmitPassword = async (oldPassword, newPassword, newPassword2) => {
    const { props } = this

    const fetchPutUserPassword = await props.dispatch(putUserPassword(props.user, oldPassword, newPassword, newPassword2))
    switch (fetchPutUserPassword.status) {
      case 204: props.dispatch(newFlashMessage(props.t('Your password has been changed'), 'info')); return true
      case 403: props.dispatch(newFlashMessage(props.t('Wrong old password'), 'warning')); return false
      default: props.dispatch(newFlashMessage(props.t('Error while changing password'), 'warning')); return false
    }
  }

  handleChangeTimezone = newTimezone => console.log('(NYI) new timezone : ', newTimezone)

  render () {
    const { props, state } = this

    const subComponent = (() => {
      switch (state.subComponentMenu.find(({active}) => active).name) {
        case 'personalData':
          return <PersonalData onClickSubmit={this.handleSubmitNameOrEmail} />

        // case 'calendar':
        //   return <Calendar user={props.user} />

        case 'notification':
          return <Notification
            idMyself={props.user.user_id}
            workspaceList={props.workspaceList}
            onChangeSubscriptionNotif={this.handleChangeSubscriptionNotif}
          />

        case 'password':
          return <Password onClickSubmit={this.handleSubmitPassword} />

        case 'timezone':
          return <Timezone timezone={props.timezone} onChangeTimezone={this.handleChangeTimezone} />
      }
    })()

    return (
      <PageWrapper customClass='account'>
        <PageTitle
          parentClass={'account'}
          title={props.t('My account')}
        />

        <PageContent parentClass='account'>
          <UserInfo user={props.user} />

          <Delimiter customClass={'account__delimiter'} />

          <div className='account__userpreference'>
            <MenuSubComponent
              subMenuList={state.subComponentMenu}
              onClickMenuItem={this.handleClickSubComponentMenuItem}
            />

            <div className='account__userpreference__setting'>
              { subComponent }
            </div>
          </div>

        </PageContent>
      </PageWrapper>
    )
  }
}

const mapStateToProps = ({ user, workspaceList, timezone, system }) => ({ user, workspaceList, timezone, system })
export default connect(mapStateToProps)(translate()(Account))
