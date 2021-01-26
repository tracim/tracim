import React from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames'
import {
  NewMemberForm,
  Avatar,
  ROLE
} from 'tracim_frontend_lib'

require('./MemberList.styl')

export class MemberList extends React.Component {
  handleClickBtnValidate = async () => {
    if (await this.props.onClickValidateNewMember()) {
      this.setState({ displayNewMemberList: true })
    }
  }

  render () {
    const { props } = this

    return (
      <div className='memberlist' data-cy='memberlist'>

        <div className='memberlist__header subTitle'>
          {props.t('Member List')}
        </div>

        <div className='memberlist__wrapper'>
          {(props.displayNewMemberForm
            ? (
              <NewMemberForm
                onClickCloseAddMemberBtn={props.onClickCloseAddMemberBtn}
                publicName={props.publicName}
                isEmail={props.isEmail}
                apiUrl={props.apiUrl}
                onChangePersonalData={props.onChangePersonalData}
                searchedKnownMemberList={props.searchedKnownMemberList}
                autoCompleteActive={props.autoCompleteFormNewMemberActive}
                onClickKnownMember={props.onClickKnownMember}
                roleList={props.roleList}
                role={props.role}
                onChangeRole={props.onChangeRole}
                onClickBtnValidate={this.handleClickBtnValidate}
                emailNotifActivated={props.emailNotifActivated}
                canSendInviteNewUser={props.canSendInviteNewUser}
                userRoleIdInWorkspace={props.userRoleIdInWorkspace}
                autoCompleteClicked={props.autoCompleteClicked}
                onClickAutoComplete={props.onClickAutoComplete}
              />
            )
            : (
              <div>
                {props.userRoleIdInWorkspace >= ROLE.workspaceManager.id && (
                  <div className='memberlist__btnadd' data-cy='memberlist__btnadd' onClick={props.onClickAddMemberBtn}>
                    <div className='memberlist__btnadd__button primaryColorFontHover primaryColorBorderHover'>
                      <div className='memberlist__btnadd__button__avatar'>
                        <div className='memberlist__btnadd__button__avatar__icon'>
                          <i className='fa fa-plus' />
                        </div>
                      </div>

                      <div className='memberlist__btnadd__button__text'>
                        {props.t('Add a member')}
                      </div>
                    </div>
                  </div>
                )}

                <ul className={classnames('memberlist__list', { withAddBtn: props.userRoleIdInWorkspace >= ROLE.workspaceManager.id })}>
                  {props.memberList.map((m, index) =>
                    <li
                      className={classnames(
                        'memberlist__list__item',
                        { memberlist__list__item__last: props.memberList.length === index + 1 }
                      )}
                      key={m.id}
                    >
                      <div className='memberlist__list__item__avatar'>
                        <Avatar
                          user={m}
                          apiUrl={props.apiUrl}
                        />
                      </div>

                      <div className='memberlist__list__item__info'>
                        <div className='memberlist__list__item__info__firstColumn'>
                          <div
                            className='memberlist__list__item__info__firstColumn__name'
                            title={m.publicName}
                          >
                            {m.publicName}
                          </div>

                          {m.username && (
                            <div
                              className='memberlist__list__item__info__firstColumn__username'
                              title={`@${m.username}`}
                            >
                              @{m.username}
                            </div>
                          )}
                        </div>

                        <div className='memberlist__list__item__info__role'>
                          - {props.t(props.roleList.find(r => r.slug === m.role).label)}
                        </div>
                      </div>

                      {props.userRoleIdInWorkspace >= ROLE.workspaceManager.id && m.id !== props.loggedUser.userId && (
                        <div
                          className='memberlist__list__item__delete primaryColorFontHover'
                          onClick={() => props.onClickRemoveMember(m.id)}
                        >
                          <i className='fa fa-trash-o' />
                        </div>
                      )}
                    </li>
                  )}
                </ul>
              </div>
            )
          )}
        </div>
      </div>
    )
  }
}

export default MemberList

MemberList.propTypes = {
  memberList: PropTypes.array.isRequired,
  onChangeName: PropTypes.func
}
