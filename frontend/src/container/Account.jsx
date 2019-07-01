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
  CUSTOM_EVENT
} from 'tracim_frontend_lib'
import {
  newFlashMessage,
  setWorkspaceListMemberList,
  updateUserName,
  updateUserEmail,
  updateUserWorkspaceSubscriptionNotif,
  updateUserAgendaUrl,
  setBreadcrumbs
} from '../action-creator.sync.js'
import {
  getWorkspaceMemberList,
  putMyselfName,
  putMyselfEmail,
  putMyselfPassword,
  putMyselfWorkspaceDoNotify,
  getLoggedUserCalendar
} from '../action-creator.async.js'
import {
  editableUserAuthTypeList,
  PAGE
} from '../helper.js'
import AgendaInfo from '../component/Dashboard/AgendaInfo.jsx'

class Account extends React.Component {
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
      subComponentMenu: builtSubComponentMenu.filter(menu => menu.display)
    }

    document.addEventListener(CUSTOM_EVENT.APP_CUSTOM_EVENT, this.customEventReducer)
  }

  customEventReducer = ({ detail: { type, data } }) => {
    switch (type) {
      case CUSTOM_EVENT.ALL_APP_CHANGE_LANG: this.buildBreadcrumbs(); break
    }
  }

  componentDidMount () {
    const { props } = this
    if (props.system.workspaceListLoaded && props.workspaceList.length > 0) this.loadWorkspaceListMemberList()
    if (props.appList.some(a => a.slug === 'agenda')) this.loadAgendaUrl()
    this.buildBreadcrumbs()
  }

  loadAgendaUrl = async () => {
    const { props } = this
    const fetchUserAgenda = await props.dispatch(getLoggedUserCalendar())
    switch (fetchUserAgenda.status) {
      case 200:
        const newAgendaUrl = (fetchUserAgenda.json.find(a => a.agenda_type === 'private') || {agenda_url: ''}).agenda_url
        props.dispatch(updateUserAgendaUrl(newAgendaUrl))
        break
      default:
        props.dispatch(newFlashMessage(props.t('Error while loading your agenda'), 'warning'))
    }
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
    subComponentMenu: prev.subComponentMenu.map(m => ({...m, active: m.name === subMenuItemName}))
  }))

  handleSubmitNameOrEmail = async (newName, newEmail, checkPassword) => {
    const { props } = this

    if (newName !== '') {
      if (newName.length < 3) {
        props.dispatch(newFlashMessage(props.t('Full name must be at least 3 characters'), 'warning'))
        return false
      }

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

    return (
      <div className='tracim__content fullWidthFullHeight'>
        <div className='tracim__content-scrollview'>
          <PageWrapper customClass='account'>
            <PageTitle
              parentClass={'account'}
              title={props.t('My account')}
              icon='user-o'
              breadcrumbsList={props.breadcrumbs}
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
                  {(() => {
                    switch (state.subComponentMenu.find(({active}) => active).name) {
                      case 'personalData':
                        return (
                          <PersonalData
                            userAuthType={props.user.auth_type}
                            onClickSubmit={this.handleSubmitNameOrEmail}
                          />
                        )

                      case 'notification':
                        return (
                          <Notification
                            idUserLogged={props.user.user_id}
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
