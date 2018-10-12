import React from 'react'
import { translate } from 'react-i18next'
import { generateAvatarFromPublicName } from '../../index.js'

require('./NewMemberForm.styl')

export const NewMemberForm = props => {
  const radioHash = Math.random().toString(36).substring(7)
  return (
    <div className='memberlist__form'>
      <div className='memberlist__form__close' onClick={props.onClickCloseAddMemberBtn}>
        <i className='fa fa-times' />
      </div>

      <div className='memberlist__form__member'>
        <h4>{props.t('Add a member')}</h4
        <div className='memberlist__form__member__name'>
          <label className='name__label' htmlFor='addmember'>
            {props.t('Enter the name or email of the user')}
          </label>

          <input
            type='text'
            className='name__input form-control'
            id='addmember'
            placeholder='Nom ou Email'
            value={props.nameOrEmail}
            onChange={e => props.onChangeNameOrEmail(e.target.value)}
            autoComplete='off'
          />

          {(props.isLoggedUserAdmin || props.idRoleUserWorkspace >= 8) && (
            <div className='name__adminmsg'>
              <i className='name__adminmsg__icon fa fa-fw fa-warning' />
              {props.emailNotifActivated
                ? props.t("If you type an unknown email address, an invitational email will be sent")
                : props.t("Due to disabled email notifications, only registered users can be invited")
              }
            </div>
          )}

          {props.searchedKnownMemberList.length > 0
            ? (
              <div className='autocomplete primaryColorBorder'>
                {props.searchedKnownMemberList.filter((u, i) => i < 5).map(u => // only displays the first 5
                  <div
                    className='autocomplete__item primaryColorBgHover'
                    onClick={() => props.onClickKnownMember(u)}
                    key={u.user_id}
                  >
                    <div className='autocomplete__item__avatar'>
                      <img src={u.avatar_url ? u.avatar_url : generateAvatarFromPublicName(u.public_name)} />
                    </div>

                    <div className='autocomplete__item__name'>
                      {u.public_name}
                    </div>
                  </div>
                )}
              </div>
            )
            : props.autoCompleteActive && props.searchedKnownMemberList.length === 0 && props.nameOrEmail.length >= 2 && (
              <div className='autocomplete primaryColorBorder'>
                <div className='autocomplete__item'>
                  <div className='autocomplete__item__name'>
                    {props.t('No result')}
                  </div>
                </div>
              </div>
            )
          }
        </div>

        {/*
          <div className='memberlist__form__member__create'>
            <div className='memberlist__form__member__create__checkbox mr-3'>
            <Checkbox
              name='createAccountCheckbox'
              onClickCheckbox={e => this.handleClickCheckboxCreateAccount(e)}
              checked={state.createAccountCheckbox}
            />
          </div>

          <div className='create__text'>
            {props.t('Create an account')}
          </div>
        </div>
        */}
      </div>

      <div className='memberlist__form__role'>
        <div className='memberlist__form__role__text'>
          {props.t('Choose the role of the member')}
        </div>

        <ul className='memberlist__form__role__list'>
          {props.roleList.map(r =>
            <li key={r.slug}>
              <label className='memberlist__form__role__list__item' htmlFor={`${r.slug}_${radioHash}`}>
                <div className='item__radiobtn mr-2'>
                  <input
                    id={`${r.slug}_${radioHash}`}
                    type='radio'
                    // bellow is to have a unique name for radio in case this component is displayed twice on the same page
                    name={`role_${radioHash}`}
                    value={r.slug}
                    checked={r.slug === props.role}
                    onChange={() => props.onChangeRole(r.slug)}
                  />
                </div>

                <div className='item__text'>
                  <div className='item__text__icon mr-1' style={{color: r.hexcolor}}>
                    <i className={`fa fa-fw fa-${r.faIcon}`} />
                  </div>

                  <div className='item__text__name'>
                    {props.t(r.label) /* this trad key comes from frontend/helper.js, object ROLE */}
                  </div>
                </div>
              </label>
            </li>
          )}
        </ul>
      </div>

      <div className='memberlist__form__submitbtn'>
        <button
          className='btn highlightBtn primaryColorBg primaryColorBorderDarkenHover primaryColorBgDarkenHover'
          onClick={props.onClickBtnValidate}
        >
          {props.t('Validate')}
          <i class="fa fa-fw fa-check">
        </button>
      </div>
    </div>
  )
}

export default translate()(NewMemberForm)
