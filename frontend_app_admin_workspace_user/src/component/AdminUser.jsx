import React from 'react'
import { translate } from 'react-i18next'
import {
  Delimiter,
  PageWrapper,
  PageTitle,
  PageContent,
  BtnSwitch
} from 'tracim_frontend_lib'
import AddMemberForm from './AddMemberForm.jsx'
// import { translate } from 'react-i18next'

export class AdminUser extends React.Component {
  constructor (props) {
    super(props)

    this.state = {
      displayAddMember: false
    }
  }

  handleToggleAddMember = () => this.setState(prevState => ({
    displayAddMember: !prevState.displayAddMember
  }))

  handleToggleUser = (e, idUser, toggle) => {
    e.preventDefault()
    e.stopPropagation()
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
          msg: props.t('An administrator can always create workspaces'),
          type: 'warning',
          delay: undefined
        }
      })
      return
    }

    if (toggle) props.onChangeProfile(idUser, 'managers')
    else props.onChangeProfile(idUser, 'users')
  }

  handleToggleProfileAdministrator = (e, idUser, toggle) => {
    e.preventDefault()
    e.stopPropagation()

    if (toggle) this.props.onChangeProfile(idUser, 'administrators')
    else this.props.onChangeProfile(idUser, 'managers')
  }

  handleClickAddUser = (email, profile) => {
    this.props.onClickAddUser(email, profile)
    this.handleToggleAddMember()
  }

  render () {
    const { props } = this

    return (
      <PageWrapper customClass='adminUserPage'>
        <PageTitle
          parentClass={'adminUserPage'}
          title={"Member's management"}
        />

        <PageContent parentClass='adminUserPage'>

          <div className='adminUserPage__description'>
            {props.t('On this page you can manage the members of your Tracim instance.')}
          </div>

          <div className='adminUserPage__adduser'>
            <button className='adminUserPage__adduser__button btn' onClick={this.handleToggleAddMember}>
              {props.t('Add a member')}
            </button>

            {this.state.displayAddMember &&
              <AddMemberForm
                profile={props.profile}
                onClickAddUser={this.handleClickAddUser}
              />
            }
          </div>

          <Delimiter customClass={'adminUserPage__delimiter'} />

          <div className='adminUserPage__table'>
            <table className='table'>
              <thead>
                <tr>
                  <th scope='col'>{props.t('Active')}</th>
                  <th scope='col'>{props.t('Member')}</th>
                  <th scope='col'>{props.t('Email')}</th>
                  <th scope='col'>{props.t('Can create workspace')}</th>
                  <th scope='col'>{props.t('Administrator')}</th>
                </tr>
              </thead>

              <tbody>
                {props.userList.map(u =>
                  <tr key={u.user_id}>
                    <td>
                      <BtnSwitch checked={u.is_active} onChange={e => this.handleToggleUser(e, u.user_id, !u.is_active)} />
                    </td>
                    <th scope='row'>{u.public_name}</th>
                    <td>{u.email}</td>
                    <td>
                      <BtnSwitch
                        checked={u.profile === 'managers' || u.profile === 'administrators'}
                        onChange={e => this.handleToggleProfileManager(e, u.user_id, !(u.profile === 'managers' || u.profile === 'administrators'))}
                      />
                    </td>
                    <td>
                      <BtnSwitch
                        checked={u.profile === 'administrators'}
                        onChange={e => this.handleToggleProfileAdministrator(e, u.user_id, !(u.profile === 'administrators'))}
                      />
                    </td>
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

export default translate()(AdminUser)
