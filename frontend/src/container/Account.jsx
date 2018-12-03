import React from 'react'
import { connect } from 'react-redux'
import { translate } from 'react-i18next'
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
  putMyselfName,
  putMyselfEmail,
  putMyselfPassword,
  putMyselfWorkspaceDoNotify
} from '../action-creator.async.js'

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
      subComponentMenu: builtSubComponentMenu
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
      const fetchPutUserName = await props.dispatch(putMyselfName(props.user, newName))
      switch (fetchPutUserName.status) {
        case 200:
          props.dispatch(updateUserName(newName))
          if (newEmail === '') {
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

    if (newEmail !== '') {
      const fetchPutUserEmail = await props.dispatch(putMyselfEmail(newEmail, checkPassword))
      switch (fetchPutUserEmail.status) {
        case 200:
          props.dispatch(updateUserEmail(fetchPutUserEmail.json.email))
          if (newName !== '') props.dispatch(newFlashMessage(props.t('Your name and email has been changed'), 'info'))
          else props.dispatch(newFlashMessage(props.t('Your email has been changed'), 'info'))
          return true
        default: props.dispatch(newFlashMessage(props.t('Error while changing email'), 'warning')); return false
      }
    }
  }

  handleChangeSubscriptionNotif = async (idWorkspace, doNotify) => {
    const { props } = this

    const fetchPutUserWorkspaceDoNotify = await props.dispatch(putMyselfWorkspaceDoNotify(idWorkspace, doNotify))
    switch (fetchPutUserWorkspaceDoNotify.status) {
      case 204: props.dispatch(updateUserWorkspaceSubscriptionNotif(props.user.user_id, idWorkspace, doNotify)); break
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

        // case 'timezone':
        //   return <Timezone timezone={props.timezone} onChangeTimezone={this.handleChangeTimezone} />
      }
    })()

    return (
      <div className='tracim__content fullWidthFullHeight'>
        <PageWrapper customClass='account'>
          <PageTitle
            parentClass={'account'}
            title={props.t('My account')}
            icon='user-o'
          />

          <PageContent parentClass='account'>
            <UserInfo user={props.user} />

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
export default connect(mapStateToProps)(translate()(Account))
