import React from 'react'
import {
  Avatar,
  AVATAR_SIZE,
  DropdownMenu,
  NewMemberForm,
  PROFILE,
  ROLE
} from 'tracim_frontend_lib'
import { translate } from 'react-i18next'

export const WorkspaceMembersList = props => {
  const isWorkspaceManagerOrAdministrator = props.userRoleIdInWorkspace > ROLE.contentManager.id ||
    props.userProfile === PROFILE.administrator.slug
  return (
    <div className='formBlock workspace_advanced__userlist'>
      {props.displayFormNewMember
        ? (
          <NewMemberForm
            onClickCloseAddMemberBtn={props.onClickToggleFormNewMember}
            publicName={props.newMemberName}
            apiUrl={props.apiUrl}
            isEmail={props.isEmail}
            onChangePersonalData={props.onChangeNewMemberName}
            searchedKnownMemberList={props.searchedKnownMemberList}
            onClickKnownMember={props.onClickKnownMember}
            roleList={props.roleList}
            role={props.role}
            onChangeRole={props.onClickNewMemberRole}
            onClickBtnValidate={props.onClickValidateNewMember}
            autoCompleteActive={props.autoCompleteFormNewMemberActive}
            isEmailNotifActivated={props.isEmailNotifActivated}
            canSendInviteNewUser={props.canSendInviteNewUser}
            userRoleIdInWorkspace={props.userRoleIdInWorkspace}
            autoCompleteClicked={props.autoCompleteClicked}
            onClickAutoComplete={props.onClickAutoComplete}
          />
        ) : (
          <div>
            {isWorkspaceManagerOrAdministrator && (
              <div
                className='formBlock__bottom workspace_advanced__userlist__adduser'
                onClick={props.onClickToggleFormNewMember}
              >
                <div className='workspace_advanced__userlist__adduser__button primaryColorFontHover primaryColorBorderHover'>
                  <div className='workspace_advanced__userlist__adduser__button__avatar'>
                    <div className='workspace_advanced__userlist__adduser__button__avatar__icon'>
                      <i className='fas fa-plus' />
                    </div>
                  </div>

                  <div className='workspace_advanced__userlist__adduser__button__text'>
                    {props.t('Add a member')}
                  </div>
                </div>
              </div>
            )}
            <ul className='formBlock__field workspace_advanced__userlist__list'>
              {props.memberList && props.memberList.filter(m => m.user).map(m =>
                <li
                  className='workspace_advanced__userlist__list__item'
                  key={m.user_id}
                  data-cy={`workspace_advanced__member-${m.user_id}`}
                >
                  <div className='workspace_advanced__userlist__list__item__avatar'>
                    <Avatar
                      size={AVATAR_SIZE.MEDIUM}
                      apiUrl={props.apiUrl}
                      user={m.user}
                    />
                  </div>

                  <div className='workspace_advanced__userlist__list__item__name' title={m.user.public_name}>
                    {m.user.public_name}

                    {m.user.username && (
                      <div className='workspace_advanced__userlist__list__item__name__username' title={`@${m.user.username}`}>
                        @{m.user.username}
                      </div>
                    )}
                  </div>

                  <div
                    className='workspace_advanced__userlist__list__item__role'
                    data-cy={`workspace_advanced__member-${m.user_id}_role`}
                  >
                    {(() => {
                      const role = props.roleList.find(r => r.slug === m.role) || { label: 'unknown', hexcolor: '#333', faIcon: '' }
                      return isWorkspaceManagerOrAdministrator
                        ? (
                          <DropdownMenu
                            buttonOpts={<i className={`fas fa-fw fa-${role.faIcon}`} style={{ color: role.hexcolor }} />}
                            buttonLabel={props.t(role.label)}
                            buttonCustomClass='nohover btndropdown transparentButton'
                            isButton
                          >
                            {props.roleList.map(r =>
                              <button
                                className='transparentButton'
                                onClick={() => props.onClickNewRole(m.user_id, r.slug)}
                                key={r.id}
                              >
                                <i className={`fas fa-fw fa-${r.faIcon}`} style={{ color: r.hexcolor }} />
                                {props.t(r.label)}
                              </button>
                            )}
                          </DropdownMenu>
                        ) : (
                          <div>
                            <i className={`fas fa-fw fa-${role.faIcon}`} style={{ color: role.hexcolor }} />
                            {props.t(role.label)}
                          </div>
                        )
                    })()}
                  </div>
                  {isWorkspaceManagerOrAdministrator && (m.user_id !== props.loggedUser.userId
                    ? (
                      <div
                        className='workspace_advanced__userlist__list__item__delete'
                        data-cy='userlist_delete'
                        onClick={() => props.onClickDeleteMember(m.user_id)}
                      >
                        <i className='far fa-trash-alt' />
                      </div>
                    )
                    : <div className='workspace_advanced__userlist__list__item__delete' />
                  )}
                </li>
              )}
            </ul>
          </div>
        )}
    </div>
  )
}

export default translate()(WorkspaceMembersList)
