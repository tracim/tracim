import React from 'react'
import Radium from 'radium'
import color from 'color'
import {
  BtnSwitch,
  generateAvatarFromPublicName,
  NewMemberForm,
  CardPopup
} from 'tracim_frontend_lib'
import { translate } from 'react-i18next'

const WorkspaceAdvancedComponent = props => {
  return (
    <div className='workspace_advanced-content'>
      <div className='workspace_advanced__description'>
        <div className='workspace_advanced__description__title'>
          {props.t('Description')}
        </div>

        <div className='workspace_advanced__description__text'>
          <textarea
            placeholder={props.t("Shared space's description")}
            value={props.description}
            onChange={props.onChangeDescription}
            rows={'3'}
          />
        </div>

        <div className='workspace_advanced__description__btn d-flex justify-content-end'>
          <button
            type='button'
            className='btn highlightBtn'
            onClick={props.onClickValidateNewDescription}
            style={{backgroundColor: props.customColor}}
          >
            {props.t('Validate')}
          </button>
        </div>
      </div>

      <div className='workspace_advanced__userlist'>
        {props.displayFormNewMember === false &&
          <div>
            <div className='workspace_advanced__userlist__title'>
              {props.t('Members list')}
            </div>

            <ul className='workspace_advanced__userlist__list'>
              {props.memberList && props.memberList.filter(m => m.user).map(m =>
                <li className='workspace_advanced__userlist__list__item' key={`member_${m.user_id}`}>
                  <div className='workspace_advanced__userlist__list__item__avatar mr-3'>
                    <img src={generateAvatarFromPublicName(m.user.public_name)} />
                  </div>

                  <div className='workspace_advanced__userlist__list__item__name mr-5'>
                    {m.user.public_name}
                  </div>

                  <div className='workspace_advanced__userlist__list__item__role dropdown'>
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
              className='workspace_advanced__userlist__adduser'
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
        }

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
            idRoleUserWorkspace={props.idRoleUserWorkspace}
            autoCompleteClicked={props.autoCompleteClicked}
            onClickAutoComplete={props.onClickAutoComplete}
          />
        )}
      </div>

      <div className='workspace_advanced__delete'>
        <div className='workspace_advanced__delete__title'>
          {props.t('Delete shared space')}
        </div>

        <div className='workspace_advanced__delete__content'>
          <button
            className='btn outlineTextBtn primaryColorBorder primaryColorFontDarkenHover primaryColorFont nohover'
            onClick={props.onClickDelteWorkspaceBtn}
          >
            {props.t('Delete')}
          </button>

          <div className='workspace_advanced__delete__content__warning' />
        </div>

        {props.displayPopupValidateDeleteWorkspace &&
          <CardPopup
            customClass='workspace_advanced__popup'
            customHeaderClass='primaryColorBg'
            onClose={props.onClickClosePopupDeleteWorkspace}
          >
            <div className='workspace_advanced__popup__body'>
              <div className='workspace_advanced__popup__body__msg'>{props.t('Are you sure ?')}</div>
              <div className='workspace_advanced__popup__body__btn'>
                <button
                  type='button'
                  className='btn outlineTextBtn primaryColorBorder primaryColorFont nohover'
                  onClick={props.onClickClosePopupDeleteWorkspace}
                >
                  {props.t('Cancel')}
                </button>

                <button
                  type='button'
                  className='btn highlightBtn primaryColorBg primaryColorDarkenBgHover'
                  onClick={props.onClickValidatePopupDeleteWorkspace}
                  style={{':hover': {backgroundColor: color(GLOBAL_primaryColor).darken(0.15).hexString()}}}
                >
                  {props.t('Delete')}
                </button>
              </div>
            </div>
          </CardPopup>
        }
      </div>

      <div
        className='workspace_advanced__functionality'
        style={{display: 'none'}}
        // Côme - 2018/09/10 - hide this div until webdav and/or visioconf is activated
      >
        <div className='workspace_advanced__functionality__title'>
          Liste des fonctionnalités
        </div>

        <div className='workspace_advanced__functionality__text'>
          Liste des fonctionnalités présentes sur Tracim que vous pouvez désactiver :
        </div>

        <ul className='workspace_advanced__functionality__list'>
          <li className='workspace_advanced__functionality__list__item'>
            <div className='item__text'>
              Calendrier de l'espace de travail :
            </div>
            <div className='item__btnswitch'>
              <BtnSwitch />
            </div>
          </li>

          <li className='workspace_advanced__functionality__list__item'>
            <div className='item__text'>
              Visioconférence :
            </div>
            <div className='item__btnswitch'>
              <BtnSwitch />
            </div>
          </li>
        </ul>
      </div>
    </div>
  )
}

export default translate()(Radium(WorkspaceAdvancedComponent))
