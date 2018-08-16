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
import { updateUserWorkspaceSubscriptionNotif } from '../action-creator.sync.js'
import {
  getTimezone,
  getUserRole
} from '../action-creator.async.js'
import { translate } from 'react-i18next'

class Account extends React.Component {
  constructor (props) {
    super(props)

    this.state = {
      subComponentMenu: [{
        name: 'personalData',
        menuLabel: 'Mon profil',
        active: true
      },
      {
        name: 'notification',
        menuLabel: 'Espace de travail & Notifications',
        active: false
      },
      {
        name: 'password',
        menuLabel: 'Mot de passe',
        active: false
      },
      {
        name: 'timezone',
        menuLabel: 'Fuseau Horaire',
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
    const { user, workspaceList, timezone, dispatch } = this.props

    if (user.id !== -1 && workspaceList.length > 0) dispatch(getUserRole(user))
    if (timezone.length === 0) dispatch(getTimezone())
  }

  componentDidUpdate () {
    const { user, workspaceList, dispatch } = this.props

    if (user.id !== -1 && workspaceList.length > 0 && workspaceList.some(ws => ws.role === undefined)) dispatch(getUserRole(user))
  }

  handleClickSubComponentMenuItem = subMenuItemName => this.setState(prev => ({
    subComponentMenu: prev.subComponentMenu.map(m => ({...m, active: m.name === subMenuItemName}))
  }))

  handleChangeSubscriptionNotif = (workspaceId, subscriptionNotif) =>
    this.props.dispatch(updateUserWorkspaceSubscriptionNotif(workspaceId, subscriptionNotif))

  handleChangeTimezone = newTimezone => console.log('(NYI) new timezone : ', newTimezone)

  render () {
    const subComponent = (() => {
      switch (this.state.subComponentMenu.find(({active}) => active).name) {
        case 'personalData':
          return <PersonalData
          />

        // case 'calendar':
        //   return <Calendar user={this.props.user} />

        case 'notification':
          return <Notification
            workspaceList={this.props.workspaceList}
            onChangeSubscriptionNotif={this.handleChangeSubscriptionNotif}
          />

        case 'password':
          return <Password
          />

        case 'timezone':
          return <Timezone timezone={this.props.timezone} onChangeTimezone={this.handleChangeTimezone} />
      }
    })()

    return (
      <div className='account'>
        <PageWrapper customClass='account'>
          <PageTitle
            parentClass={'account'}
            title={'Mon Compte'}
          />

          <PageContent parentClass='account'>
            <UserInfo user={this.props.user} />

            <Delimiter customClass={'account__delimiter'} />

            <div className='account__userpreference'>
              <MenuSubComponent subMenuList={this.state.subComponentMenu} onClickMenuItem={this.handleClickSubComponentMenuItem} />

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

const mapStateToProps = ({ user, workspaceList, timezone }) => ({ user, workspaceList, timezone })
export default connect(mapStateToProps)(translate()(Account))
