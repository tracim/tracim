import React from 'react'
import classnames from 'classnames'
import { translate } from 'react-i18next'
import {
  Delimiter,
  PageWrapper,
  PageTitle,
  PageContent,
  BtnSwitch
} from 'tracim_frontend_lib'
import AddUserForm from './AddUserForm.jsx'
import { getUserProfile } from '../helper.js'

export class AdminUser extends React.Component {
  constructor (props) {
    super(props)

    this.state = {
      displayAddUser: false
    }
  }

  handleToggleAddUser = () => this.setState(prevState => ({
    displayAddUser: !prevState.displayAddUser
  }))

  handleToggleUser = (e, idUser, toggle) => {
    e.preventDefault()
    e.stopPropagation()

    const { props } = this

    if (props.idLoggedUser === idUser) {
      GLOBAL_dispatchEvent({
        type: 'addFlashMsg',
        data: {
          msg: props.t("You can't deactivate your own account"),
          type: 'warning',
          delay: undefined
        }
      })
      return
    }

    this.props.onClickToggleUserBtn(idUser, toggle)
  }

  handleToggleProfileManager = (e, idUser, toggle) => {
    e.preventDefault()
    e.stopPropagation()

    const { props } = this

    if (props.userList.find(u => u.user_id === idUser).profile === 'administrators') {
      GLOBAL_dispatchEvent({
        type: 'addFlashMsg',
        data: {
          msg: props.t('An administrator can always create shared spaces'),
          type: 'warning',
          delay: undefined
        }
      })
      return
    }

    if (toggle) props.onChangeProfile(idUser, 'trusted-users')
    else props.onChangeProfile(idUser, 'users')
  }

  handleToggleProfileAdministrator = (e, idUser, toggle) => {
    e.preventDefault()
    e.stopPropagation()

    const { props } = this

    if (!toggle && props.idLoggedUser === idUser) {
      GLOBAL_dispatchEvent({
        type: 'addFlashMsg',
        data: {
          msg: props.t("You can't remove yourself from Administrator"),
          type: 'warning',
          delay: undefined
        }
      })
      return
    }

    if (toggle) this.props.onChangeProfile(idUser, 'administrators')
    else this.props.onChangeProfile(idUser, 'trusted-users')
  }

  handleClickAddUser = async (name, email, profile, password) => {
    const resultSuccess = await this.props.onClickAddUser(name, email, profile, password)
    if (resultSuccess) this.handleToggleAddUser()
  }

  handleClickUser = (e, idUser) => {
    e.preventDefault()
    e.stopPropagation()

    this.props.onClickUser(idUser)
  }

  render () {
    const { props, state } = this

    return (
      <PageWrapper customClass='adminUser'>
        <PageTitle
          parentClass={'adminUser'}
          title={props.t('User account management')}
          icon='users'
        />

        <PageContent parentClass='adminUser'>

          <div className='adminUser__description'>
            {props.t('On this page you can manage the users of your Tracim instance.')}
          </div>

          <div className='adminUser__adduser'>
            <button
              className='adminUser__adduser__button btn outlineTextBtn primaryColorBorder primaryColorBgHover primaryColorBorderDarkenHover'
              onClick={this.handleToggleAddUser}
            >
              {props.t('Create a user')}
            </button>

            <div className='adminUser__adduser__emailstate'>
              {props.emailNotifActivated
                ? (
                  <div className=''>
                    <i className='fa fa-envelope' /> {props.t('Email notification activated')}
                  </div>
                )
                : (
                  <div>
                    <i className='primaryColorFont fa fa-fw fa-warning' />
                    {props.t('Email notification are disabled, please notify users of any change')}
                  </div>
                )
              }
            </div>

          </div>

          {state.displayAddUser &&
            <AddUserForm
              profile={props.profile}
              onClickAddUser={this.handleClickAddUser}
              emailNotifActivated={props.emailNotifActivated}
            />
          }

          <Delimiter customClass={'adminUser__delimiter'} />

          <div className='adminUser__table'>
            <table className='table'>
              <thead>
                <tr>
                  <th scope='col'>{props.t('Active')}</th>
                  <th />
                  <th scope='col'>{props.t('User')}</th>
                  <th scope='col'>{props.t('Email')}</th>
                  <th scope='col'>{props.t('Can create shared space')}</th>
                  <th scope='col'>{props.t('Administrator')}</th>
                </tr>
              </thead>

              <tbody>
                {props.userList.map(u => {
                  const userProfile = getUserProfile(props.profile, u.profile)
                  return (
                    <tr
                      className={classnames('adminUser__table__tr', {'user-deactivated': !u.is_active})}
                      key={u.user_id}
                    >
                      <td>
                        <BtnSwitch
                          checked={u.is_active}
                          onChange={e => this.handleToggleUser(e, u.user_id, !u.is_active)}
                          activeLabel=''
                          inactiveLabel={props.t('Account deactivated')}
                        />
                      </td>

                      <td>
                        <i
                          className={`fa fa-fw fa-2x fa-${userProfile.faIcon}`}
                          style={{color: userProfile.hexcolor}}
                          title={props.t(userProfile.label)}
                        />
                      </td>

                      <td
                        className='adminUser__table__tr__td-link primaryColorFont'
                        onClick={e => this.handleClickUser(e, u.user_id)}
                      >
                        {u.public_name}
                      </td>

                      <td>{u.email}</td>

                      <td>
                        <BtnSwitch
                          checked={u.profile === 'trusted-users' || u.profile === 'administrators'}
                          onChange={e => this.handleToggleProfileManager(e, u.user_id, !(u.profile === 'trusted-users' || u.profile === 'administrators'))}
                          activeLabel={props.t('Activated')}
                          inactiveLabel={props.t('Deactivated')}
                          disabled={!u.is_active}
                        />
                      </td>

                      <td>
                        <BtnSwitch
                          checked={u.profile === 'administrators'}
                          onChange={e => this.handleToggleProfileAdministrator(e, u.user_id, !(u.profile === 'administrators'))}
                          activeLabel={props.t('Activated')}
                          inactiveLabel={props.t('Deactivated')}
                          disabled={!u.is_active}
                        />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

        </PageContent>

      </PageWrapper>
    )
  }
}

export default translate()(AdminUser)
