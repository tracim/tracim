import React from 'react'
import {
  NewMemberForm,
  Avatar
} from 'tracim_frontend_lib'
import { translate } from 'react-i18next'

const WorkspaceMembersList = props => {
  return (
    <div className='formBlock workspace_advanced__userlist'>
      {props.displayFormNewMember === false && (
        <div>
          <div className='formBlock__title workspace_advanced__userlist__title'>
            {props.t('Members list')}
          </div>

          <ul className='formBlock__field workspace_advanced__userlist__list'>
            {props.memberList && props.memberList.filter(m => m.user).map(m =>
              <li className='workspace_advanced__userlist__list__item' key={`member_${m.user_id}`}>
                <div className='workspace_advanced__userlist__list__item__avatar'>
                  <Avatar width={'50px'} publicName={m.user.public_name} />
                </div>

                <div className='workspace_advanced__userlist__list__item__namerole'>
                  <div className='workspace_advanced__userlist__list__item__namerole__name'>
                    {m.user.public_name}
                  </div>

                  <div className='workspace_advanced__userlist__list__item__namerole__role dropdown'>
                    {(() => {
                      const role = props.roleList.find(r => r.slug === m.role) || {label: 'unknown', hexcolor: '#333', faIcon: ''}
                      return (
                        <button
                          className='btndropdown dropdown-toggle'
                          type='button'
                          id={`dropdownMenuButton_${m.user_id}`}
                          data-toggle='dropdown'
                          aria-haspopup='true'
                          aria-expanded='false'
                        >
                          <div className='btndropdown__icon mr-3' style={{color: role.hexcolor}}>
                            <i className={`fa fa-${role.faIcon}`} />
                          </div>

                          <div className='btndropdown__text mr-auto'>
                            {props.t(role.label)}
                          </div>
                        </button>
                      )
                    })()}

                    <div className='subdropdown dropdown-menu' aria-labelledby='dropdownMenuButton'>
                      {props.roleList.map(r =>
                        <div
                          className='subdropdown__item dropdown-item'
                          onClick={() => props.onClickNewRole(m.user_id, r.slug)}
                          key={`role_${r.id}`}
                        >
                          <div className='subdropdown__item__icon' style={{color: r.hexcolor}}>
                            <i className={`fa fa-fw fa-${r.faIcon}`} />
                          </div>

                          <div className='subdropdown__item__text'>
                            {props.t(r.label)}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {m.user_id !== props.loggedUser.user_id
                  ? (
                    <div
                      className='workspace_advanced__userlist__list__item__delete'
                      onClick={() => props.onClickDeleteMember(m.user_id)}
                    >
                      <i className='fa fa-trash-o' />
                    </div>
                  )
                  : <div className='workspace_advanced__userlist__list__item__delete' />
                }
              </li>
            )}
          </ul>

          <div
            className='formBlock__bottom workspace_advanced__userlist__adduser'
            onClick={props.onClickToggleFormNewMember}
          >
            <div className='workspace_advanced__userlist__adduser__button primaryColorFontHover primaryColorBorderHover'>
              <div className='workspace_advanced__userlist__adduser__button__avatar'>
                <div className='workspace_advanced__userlist__adduser__button__avatar__icon'>
                  <i className='fa fa-plus' />
                </div>
              </div>

              <div className='workspace_advanced__userlist__adduser__button__text'>
                {props.t('Add a member')}
              </div>
            </div>
          </div>
        </div>
      )}

      {props.displayFormNewMember === true && (
        <NewMemberForm
          onClickCloseAddMemberBtn={props.onClickToggleFormNewMember}
          nameOrEmail={props.newMemberName}
          isEmail={props.isEmail}
          onChangeNameOrEmail={props.onChangeNewMemberName}
          searchedKnownMemberList={props.searchedKnownMemberList}
          onClickKnownMember={props.onClickKnownMember}
          roleList={props.roleList}
          role={props.newMemberRole}
          onChangeRole={props.onClickNewMemberRole}
          onClickBtnValidate={props.onClickValidateNewMember}
          autoCompleteActive={props.autoCompleteFormNewMemberActive}
          emailNotifActivated={props.emailNotifActivated}
          canSendInviteNewUser={props.canSendInviteNewUser}
          userRoleIdInWorkspace={props.userRoleIdInWorkspace}
          autoCompleteClicked={props.autoCompleteClicked}
          onClickAutoComplete={props.onClickAutoComplete}
        />
      )}
    </div>
  )
}

export default translate()(WorkspaceMembersList)
