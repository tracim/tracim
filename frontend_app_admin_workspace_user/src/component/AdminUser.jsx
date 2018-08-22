import React from 'react'
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

  render () {
    return (
      <PageWrapper customClass='adminUserPage'>
        <PageTitle
          parentClass={'adminUserPage'}
          title={"Member's management"}
        />

        <PageContent parentClass='adminUserPage'>

          <div className='adminUserPage__description'>
            On this page you can manage the members of your instance Tracim.
          </div>

          <div className='adminUserPage__adduser'>
            <button className='adminUserPage__adduser__button btn' onClick={this.handleToggleAddMember}>
              Add a member
            </button>

            {this.state.displayAddMember &&
              <AddMemberForm />
            }
          </div>

          <Delimiter customClass={'adminUserPage__delimiter'} />

          <div className='adminUserPage__table'>
            <table className='table'>
              <thead>
                <tr>
                  <th scope='col'>Active</th>
                  <th scope='col'>Member</th>
                  <th scope='col'>Email</th>
                  <th scope='col'>Member can create workspace</th>
                  <th scope='col'>Administrator</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <BtnSwitch />
                  </td>
                  <th scope='row'>Joe Delavaiga</th>
                  <td><a href='#'>joedelavaiga@mail.com</a></td>
                  <td>
                    <BtnSwitch />
                  </td>
                  <td>
                    <BtnSwitch />
                  </td>
                </tr>
                <tr>
                  <td>
                    <BtnSwitch />
                  </td>
                  <th scope='row'>Susie Washington</th>
                  <td><a href='#'>susiewash@mail.com</a></td>
                  <td>
                    <BtnSwitch />
                  </td>
                  <td>
                    <BtnSwitch />
                  </td>
                </tr>
                <tr>
                  <td>
                    <BtnSwitch />
                  </td>
                  <th scope='row'>Marty MacJoe</th>
                  <td><a href='#'>martymac@mail.com</a></td>
                  <td>
                    <BtnSwitch />
                  </td>
                  <td>
                    <BtnSwitch />
                  </td>
                </tr>
                <tr>
                  <td>
                    <BtnSwitch />
                  </td>
                  <th scope='row'>Joe Delavaiga</th>
                  <td><a href='#'>joedelavaiga@mail.com</a></td>
                  <td>
                    <BtnSwitch />
                  </td>
                  <td>
                    <BtnSwitch />
                  </td>
                </tr>
                <tr>
                  <td>
                    <BtnSwitch />
                  </td>
                  <th scope='row'>Susie Washington</th>
                  <td><a href='#'>susiewash@mail.com</a></td>
                  <td>
                    <BtnSwitch />
                  </td>
                  <td>
                    <BtnSwitch />
                  </td>
                </tr>
                <tr>
                  <td>
                    <BtnSwitch />
                  </td>
                  <th scope='row'>Marty MacJoe</th>
                  <td><a href='#'>martymac@mail.com</a></td>
                  <td>
                    <BtnSwitch />
                  </td>
                  <td>
                    <BtnSwitch />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

        </PageContent>

      </PageWrapper>
    )
  }
}

export default AdminUser
