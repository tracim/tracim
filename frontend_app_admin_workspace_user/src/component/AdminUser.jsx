import React from 'react'
import classnames from 'classnames'
import { translate } from 'react-i18next'
import { Link, withRouter } from 'react-router-dom'
import { isMobile } from 'react-device-detect'
import {
  Delimiter,
  IconButton,
  PageWrapper,
  PageTitle,
  PageContent,
  BtnSwitch,
  ComposedIcon,
  Loading,
  CUSTOM_EVENT,
  PROFILE,
  PROFILE_LIST,
  ProfileNavigation
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

  handleToggleUser = (e, userId, toggle) => {
    e.preventDefault()
    e.stopPropagation()

    const { props } = this

    if (props.loggedUserId === userId) {
      GLOBAL_dispatchEvent({
        type: CUSTOM_EVENT.ADD_FLASH_MSG,
        data: {
          msg: props.t("You can't deactivate your own account"),
          type: 'warning',
          delay: undefined
        }
      })
      return
    }

    this.props.onClickToggleUserBtn(userId, toggle)
  }

  handleToggleProfileManager = (e, userId, toggle) => {
    e.preventDefault()
    e.stopPropagation()

    const { props } = this

    if (props.userList.find(u => u.user_id === userId).profile === PROFILE.administrator.slug) {
      GLOBAL_dispatchEvent({
        type: CUSTOM_EVENT.ADD_FLASH_MSG,
        data: {
          msg: props.t('An administrator can always create spaces'),
          type: 'warning',
          delay: undefined
        }
      })
      return
    }

    if (toggle) props.onChangeProfile(userId, 'trusted-users')
    else props.onChangeProfile(userId, 'users')
  }

  handleToggleProfileAdministrator = (e, userId, toggle) => {
    e.preventDefault()
    e.stopPropagation()

    const { props } = this

    if (!toggle && props.loggedUserId === userId) {
      GLOBAL_dispatchEvent({
        type: CUSTOM_EVENT.ADD_FLASH_MSG,
        data: {
          msg: props.t("You can't remove yourself from Administrator"),
          type: 'warning',
          delay: undefined
        }
      })
      return
    }

    if (toggle) this.props.onChangeProfile(userId, 'administrators')
    else this.props.onChangeProfile(userId, 'trusted-users')
  }

  handleClickAddUser = async (publicName, username, email, profile, password) => {
    const resultSuccess = await this.props.onClickAddUser(publicName, username, email, profile, password)
    if (resultSuccess > 0) this.handleToggleAddUser()
  }

  render () {
    const { props, state } = this

    return (
      <PageWrapper customClass='adminUser'>
        <PageTitle
          parentClass='adminUser'
          title={props.t('User account management')}
          icon='fas fa-users'
          breadcrumbsList={props.breadcrumbsList}
        />

        <PageContent parentClass='adminUser'>
          <div className='adminUser__description'>
            {props.t('On this page you can manage the users of your Tracim instance.')}
          </div>

          <div className='adminUser__adduser'>
            <IconButton
              customClass='adminUser__adduser__button'
              dataCy='adminUser__adduser__button'
              intent='secondary'
              onClick={this.handleToggleAddUser}
              text={props.t('Create a user')}
              icon='fas fa-user-plus'
            />

            <div className='adminUser__adduser__emailstate'>
              {!props.emailNotifActivated && (
                <div>
                  <ComposedIcon
                    mainIcon='far fa-envelope'
                    smallIcon='fas fa-exclamation-triangle'
                    mainIconCustomClass='primaryColorFont'
                    smallIconCustomClass='text-danger'
                  />
                  {props.t('Email notification are disabled, please manually notify users of any change')}
                </div>
              )}
            </div>

          </div>

          {state.displayAddUser && (
            <AddUserForm
              onClickAddUser={this.handleClickAddUser}
              onClickCreateUserAndAddToSpaces={props.onClickCreateUserAndAddToSpaces}
              onChangeUsername={props.onChangeUsername}
              emailNotifActivated={props.emailNotifActivated}
              isUsernameValid={props.isUsernameValid}
              usernameInvalidMsg={props.usernameInvalidMsg}
              isEmailRequired={props.isEmailRequired}
            />
          )}

          <Delimiter customClass='adminUser__delimiter' />

          <div className='adminUser__table'>
            <table className='table'>
              <thead>
                <tr>
                  <th className='adminUser__table__active' scope='col'>{props.t('Active')}</th>
                  <th className='adminUser__table__profile' />
                  <th className='adminUser__table__fullName' scope='col'>{props.t('Full name')}</th>
                  <th className='adminUser__table__username' scope='col'>{props.t('Username')}</th>
                  <th className='adminUser__table__user' scope='col'>{props.t('User')}</th>
                  <th className='adminUser__table__email' scope='col'>{props.t('Email')}</th>
                  <th className='adminUser__table__canCreate' scope='col'>{props.t('Can create space')}</th>
                  <th className='adminUser__table__administrator' scope='col'>{props.t('Administrator')}</th>
                </tr>
              </thead>

              <tbody>
                {props.loaded && props.userList.map(u => {
                  const userProfile = getUserProfile(PROFILE_LIST, u.profile)
                  return (
                    <tr
                      className={classnames('adminUser__table__tr', { 'user-deactivated': !u.is_active })}
                      key={u.user_id}
                      data-cy='adminUser__table__tr'
                    >
                      <td>
                        <BtnSwitch
                          checked={u.is_active}
                          inactiveLabel={isMobile ? '' : props.t('Account deactivated')}
                          onChange={e => this.handleToggleUser(e, u.user_id, !u.is_active)}
                          smallSize={isMobile}
                        />
                      </td>

                      <td>
                        <i
                          className={`fa-fw ${userProfile.faIcon} adminUser__table__profile__icon`}
                          style={{ color: userProfile.hexcolor }}
                          title={props.t(userProfile.label)}
                        />
                      </td>

                      <td
                        className='adminUser__table__tr__td-link primaryColorFont adminUser__table__fullName'
                        title={u.public_name}
                      >
                        <Link to={`/ui/admin/user/${u.user_id}`}>
                          {u.public_name}
                        </Link>
                      </td>

                      <td
                        className='adminUser__table__line__username'
                        title={u.username}
                      >
                        {u.username && `@${u.username}`}
                      </td>

                      <td
                        className='adminUser__table__tr__td-link primaryColorFont adminUser__table__user'
                        title={u.public_name}
                      >
                        <ProfileNavigation
                          user={{
                            userId: u.user_id,
                            publicName: u.public_name
                          }}
                        >
                          <span
                            title={u.public_name}
                          >
                            {u.public_name}
                          </span>
                          {u.username && (
                            <div
                              title={`@${u.username}`}
                            >
                              @{u.username}
                            </div>
                          )}
                        </ProfileNavigation>
                      </td>

                      <td
                        className='adminUser__table__line__email'
                        title={u.email}
                      >
                        {u.email}
                      </td>

                      <td>
                        <BtnSwitch
                          checked={u.profile === PROFILE.manager.slug || u.profile === PROFILE.administrator.slug}
                          onChange={e => this.handleToggleProfileManager(e, u.user_id, !(u.profile === PROFILE.manager.slug || u.profile === PROFILE.administrator.slug))}
                          activeLabel={isMobile ? '' : props.t('Activated')}
                          inactiveLabel={isMobile ? '' : props.t('Deactivated')}
                          disabled={!u.is_active}
                          smallSize={isMobile}
                        />
                      </td>

                      <td>
                        <BtnSwitch
                          checked={u.profile === PROFILE.administrator.slug}
                          onChange={e => this.handleToggleProfileAdministrator(e, u.user_id, !(u.profile === PROFILE.administrator.slug))}
                          activeLabel={isMobile ? '' : props.t('Activated')}
                          inactiveLabel={isMobile ? '' : props.t('Deactivated')}
                          disabled={!u.is_active}
                          smallSize={isMobile}
                        />
                      </td>
                    </tr>
                  )
                })}
                {!props.loaded && (
                  <tr
                    className='adminUser__table__tr'
                    data-cy='adminUser__table__tr'
                  >
                    <td><Loading /></td>
                    <td />
                    <td />
                    <td />
                    <td />
                    <td />
                    <td />
                    <td />
                  </tr>
                )}
              </tbody>
            </table>
          </div>

        </PageContent>

      </PageWrapper>
    )
  }
}

export default withRouter(translate()(AdminUser))
