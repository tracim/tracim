import React from 'react'
import {
  BtnSwitch,
  generateAvatarFromPublicName,
  NewMemberForm
} from 'tracim_frontend_lib'
import { translate } from 'react-i18next'

const WorkspaceAdvancedComponent = props => {
  return (
    <div className='wsContentHtmlDocumentpage__textnote workspaceadvancedpage__textnote'>
      <div className='workspaceadvanced'>
        <div className='workspaceadvanced__description'>
          <div className='workspaceadvanced__description__title'>
            {props.t('Description')}
          </div>

          <div className='workspaceadvanced__description__text'>
            <textarea
              placeholder='Description du Workspace'
              value={props.description}
              onChange={props.onChangeDescription}
              rows={'3'}
            />
          </div>

          <div className='workspaceadvanced__description__btn d-flex justify-content-end'>
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

        <div className='workspaceadvanced__userlist'>
          {props.displayFormNewMember === false &&
          <div>
            <div className='workspaceadvanced__userlist__title'>
              {props.t('Members list')}
            </div>

            <ul className='workspaceadvanced__userlist__list'>
              {props.memberList && props.memberList.filter(m => m.user).map(m =>
                <li className='workspaceadvanced__userlist__list__item' key={`member_${m.user_id}`}>
                  <div className='workspaceadvanced__userlist__list__item__avatar mr-3'>
                    <img src={generateAvatarFromPublicName(m.user.public_name)} />
                  </div>

                  <div className='workspaceadvanced__userlist__list__item__name mr-5'>
                    {m.user.public_name}
                  </div>

                  <div className='workspaceadvanced__userlist__list__item__role dropdown mr-auto'>
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
                            {role.label}
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
                            <i className={`fa fa-${r.faIcon}`} />
                          </div>

                          <div className='subdropdown__item__text'>
                            {r.label}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div
                    className='workspaceadvanced__userlist__list__item__delete'
                    onClick={() => props.onClickDeleteMember(m.user_id)}
                  >
                    <i className='fa fa-trash-o' />
                  </div>
                </li>
              )}
            </ul>
            <div
              className='workspaceadvanced__userlist__adduser'
              onClick={props.onClickToggleFormNewMember}
            >
              <div className='workspaceadvanced__userlist__adduser__button primaryColorFontHover primaryColorBorderHover'>
                <div className='workspaceadvanced__userlist__adduser__button__avatar'>
                  <div className='workspaceadvanced__userlist__adduser__button__avatar__icon'>
                    <i className='fa fa-plus' />
                  </div>
                </div>

                <div className='workspaceadvanced__userlist__adduser__button__text'>
                  {props.t('Add a member')}
                </div>
              </div>
            </div>
          </div>
          }

          {props.displayFormNewMember === true &&
            <NewMemberForm
              onClickCloseAddMemberBtn={props.onClickToggleFormNewMember}
              nameOrEmail={props.newMemberName}
              onChangeNameOrEmail={props.onChangeNewMemberName}
              searchedKnownMemberList={props.searchedKnownMemberList}
              onClickKnownMember={props.onClickKnownMember}
              roleList={props.roleList}
              role={props.newMemberRole}
              onChangeRole={props.onClickNewMemberRole}
              onClickBtnValidate={props.onClickValidateNewMember}
            />
          }
        </div>

        <div
          className='workspaceadvanced__functionality'
          style={{display: 'none'}}
          // Côme - 2018/09/10 - hide this div until webdav and/or visioconf is activated
        >
          <div className='workspaceadvanced__functionality__title'>
            Liste des fonctionnalités
          </div>

          <div className='workspaceadvanced__functionality__text'>
            Liste des fonctionnalités présentes sur Tracim que vous pouvez désactiver :
          </div>

          <ul className='workspaceadvanced__functionality__list'>
            <li className='workspaceadvanced__functionality__list__item'>
              <div className='item__text'>
                Calendrier de l'espace de travail :
              </div>
              <div className='item__btnswitch'>
                <BtnSwitch />
              </div>
            </li>

            <li className='workspaceadvanced__functionality__list__item'>
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
    </div>
  )
}

export default translate()(WorkspaceAdvancedComponent)
