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
  CUSTOM_EVENT
} from 'tracim_frontend_lib'
import {
  newFlashMessage,
  setBreadcrumbs
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
import {
  editableUserAuthTypeList,
  PAGE
} from '../helper.js'

class Account extends React.Component {
  constructor (props) {
    super(props)

    const builtSubComponentMenu = [{
      name: 'personalData',
      active: true,
      label: props.t('Profile')
    }, {
      name: 'notification',
      active: false,
      label: props.t('Shared spaces and notifications')
    }, {
      name: 'password',
      active: false,
      label: props.t('Password')
    }].filter(menu => props.system.config.email_notification_activated ? true : menu.name !== 'notification')

    this.state = {
      userToEditId: props.match.params.userid,
      userToEdit: {
        public_name: '',
        auth_type: 'internal'
      },
      userToEditWorkspaceList: [],
      subComponentMenu: builtSubComponentMenu
    }

    document.addEventListener(CUSTOM_EVENT.APP_CUSTOM_EVENT_LISTENER, this.customEventReducer)
  }

  customEventReducer = ({ detail: { type, data } }) => {
    switch (type) {
      case CUSTOM_EVENT.ALL_APP_CHANGE_LANGUAGE: this.buildBreadcrumbs(); break
    }
  }

  async componentDidMount () {
    await this.getUserDetail()
    this.getUserWorkspaceList()
    this.buildBreadcrumbs()
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

    const fetchGetUserWorkspaceList = await props.dispatch(getUserWorkspaceList(state.userToEditId))

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
        memberList: workspaceListMemberList.find(wsm => ws.workspace_id === wsm.workspaceId).memberList
      }))
    })
  }

  handleClickSubComponentMenuItem = subMenuItemName => this.setState(prev => ({
    subComponentMenu: prev.subComponentMenu.map(m => ({...m, active: m.name === subMenuItemName}))
  }))

  handleSubmitNameOrEmail = async (newName, newEmail, checkPassword) => {
    const { props, state } = this

    if (newName !== '') {
      if (newName.length < 3) {
        props.dispatch(newFlashMessage(props.t('Full name must be at least 3 characters'), 'warning'))
        return false
      }

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

  handleChangeSubscriptionNotif = async (workspaceId, doNotify) => {
    const { props, state } = this

    const fetchPutUserWorkspaceDoNotify = await props.dispatch(putUserWorkspaceDoNotify(state.userToEdit, workspaceId, doNotify))
    switch (fetchPutUserWorkspaceDoNotify.status) {
      case 204: this.setState(prev => ({
        userToEditWorkspaceList: prev.userToEditWorkspaceList.map(ws => ws.workspace_id === workspaceId
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

  // INFO - GB - 2019-06-11 - This tag dangerouslySetInnerHTML is needed to i18next be able to handle special characters
  // https://github.com/tracim/tracim/issues/1847
  setTitle () {
    const { props, state } = this

    return <div dangerouslySetInnerHTML={
      {__html: props.t('{{userName}} account edition',
        {userName: state.userToEdit.public_name, interpolation: {escapeValue: false}}
      )}} />
  }

  render () {
    const { props, state } = this

    return (
      <div className='tracim__content fullWidthFullHeight'>
        <div className='tracim__content-scrollview'>
          <PageWrapper customClass='account'>
            <PageTitle
              parentClass={'account'}
              title={this.setTitle()}
              icon='user-o'
              breadcrumbsList={props.breadcrumbs}
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
                  {(() => {
                    switch (state.subComponentMenu.find(({active}) => active).name) {
                      case 'personalData':
                        return <PersonalData
                          userAuthType={state.userToEdit.auth_type}
                          onClickSubmit={this.handleSubmitNameOrEmail}
                          displayAdminInfo
                        />

                      case 'notification':
                        return <Notification
                          userLoggedId={parseInt(state.userToEditId)}
                          workspaceList={state.userToEditWorkspaceList}
                          onChangeSubscriptionNotif={this.handleChangeSubscriptionNotif}
                        />

                      case 'password':
                        return <Password onClickSubmit={this.handleSubmitPassword} displayAdminInfo />
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

const mapStateToProps = ({ breadcrumbs, user, workspaceList, timezone, system }) => ({ breadcrumbs, user, workspaceList, timezone, system })
export default withRouter(connect(mapStateToProps)(translate()(Account)))
