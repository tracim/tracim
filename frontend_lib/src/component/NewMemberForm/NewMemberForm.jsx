import React from 'react'
import { translate } from 'react-i18next'
import Avatar from '../Avatar/Avatar.jsx'
import ComposedIcon from '../Icon/ComposedIcon.jsx'
import PropTypes from 'prop-types'

// require('./NewMemberForm.styl') // see https://github.com/tracim/tracim/issues/1156

export const NewMemberForm = props => {
  const radioHash = Math.random().toString(36).substring(7)
  return (
    <div className='memberlist__form'>
      <div className='memberlist__form__close' onClick={props.onClickCloseAddMemberBtn}>
        <i className='fa fa-times' />
      </div>

      <div className='memberlist__form__member'>
        <h4>{props.t('Add a member')}</h4>

        <div className='memberlist__form__member__name'>
          <label className='name__label' htmlFor='addmember'>
            {props.t('Enter the name or email of the user')}
          </label>

          <input
            type='text'
            className='name__input form-control'
            id='addmember'
            placeholder={props.t('Full name or email')}
            data-cy='addmember'
            value={props.nameOrEmail}
            onChange={e => props.onChangeNameOrEmail(e.target.value)}
            autoComplete='off'
          />

          {props.autoCompleteActive && props.nameOrEmail.length >= 2 && (
            // Côme - 2018/10/18 - see https://github.com/tracim/tracim/issues/1021 for details about theses tests
            <div className='autocomplete primaryColorBorder'>
              {props.searchedKnownMemberList.length > 0
                ? props.searchedKnownMemberList.filter((u, i) => i < 5).map(u => // only displays the first 5
                  <div
                    className='autocomplete__item primaryColorBgHover'
                    onClick={() => props.onClickKnownMember(u)}
                    key={u.user_id}
                  >
                    <div className='autocomplete__item__avatar'>
                      <Avatar publicName={u.public_name} width={'44px'} />
                    </div>

                    <div className='autocomplete__item__name' data-cy='autocomplete__item__name'>
                      {u.public_name}
                    </div>
                  </div>
                )
                : props.isEmail
                  ? (
                    <div
                      className='autocomplete__item primaryColorBgHover'
                      onClick={props.onClickAutoComplete}
                    >
                      <div className='autocomplete__item__icon'>
                        <i className='fa fa-fw fa-user-plus' />
                      </div>

                      <div className='autocomplete__item__name' data-cy='autocomplete__item__name'>
                        {props.t('Send an invitational email to this user')}
                      </div>
                    </div>
                  )
                  : (
                    <div
                      className='autocomplete__item primaryColorBgHover'
                      onClick={props.onClickAutoComplete}
                    >
                      <div className='autocomplete__item__icon'>
                        <i className='fa fa-fw fa-user-secret' />
                      </div>

                      <div className='autocomplete__item__name' data-cy='autocomplete__item__name'>
                        <div className='autocomplete__item__name__unknownuser'>
                          {props.nameOrEmail}
                          <div className='autocomplete__item__name__unknownuser__msg'>
                            {props.t('I know this user exist')}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
              }
            </div>
          )}

          {(props.canSendInviteNewUser && props.userRoleIdInWorkspace >= 8) && (
            props.emailNotifActivated
              ? (
                <div className='name__adminmsg'>
                  <i className='name__adminmsg__icon fa fa-fw fa-lightbulb-o' />
                  {props.t("If you type an email that isn't associated to an account, an invitational email will be sent")}
                </div>
              )
              : (
                <div className='name__adminmsg'>
                  <ComposedIcon
                    mainIcon='envelope'
                    smallIcon='warning'
                    smallIconCustomClass='text-danger'
                  />
                  {props.t("Email notifications are disabled, you can't create new users from here")}
                </div>
              )
          )}
        </div>
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
                  <div className='item__text__icon mr-1' style={{ color: r.hexcolor }}>
                    <i className={`fa fa-fw fa-${r.faIcon}`} />
                  </div>

                  <div className='item__text__content'>
                    <div className='item__text__content__name'>
                      {props.t(r.label) /* this trad key comes from frontend/helper.js, object ROLE */}
                    </div>

                    <div className='item__text__content__description'>
                      {props.t(r.description) /* this trad key comes from frontend/helper.js, object ROLE */}
                    </div>
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
          disabled={!props.autoCompleteClicked}
          onClick={props.onClickBtnValidate}
        >
          {props.t('Validate')}
          <i className='fa fa-fw fa-check' />
        </button>
      </div>
    </div>
  )
}

export default translate()(NewMemberForm)

NewMemberForm.propTypes = {
  onClickCloseAddMemberBtn: PropTypes.func,
  nameOrEmail: PropTypes.string,
  searchedKnownMemberList: PropTypes.arrayOf(PropTypes.object),
  isEmail: PropTypes.bool,
  onClickAutoComplete: PropTypes.func,
  userRoleIdInWorkspace: PropTypes.number,
  canSendInviteNewUser: PropTypes.bool,
  emailNotifActivated: PropTypes.bool,
  roleList: PropTypes.arrayOf(PropTypes.object),
  autoCompleteClicked: PropTypes.bool,
  onClickBtnValidate: PropTypes.func,
  onChangeRole: PropTypes.func,
  onClickKnownMember: PropTypes.func,
  onChangeNameOrEmail: PropTypes.func,
  autoCompleteActive: PropTypes.bool,
  role: PropTypes.string
}

NewMemberForm.defaultProps = {
  nameOrEmail: '',
  searchedKnownMemberList: [],
  isEmail: false,
  userRoleIdInWorkspace: 0,
  canSendInviteNewUser: false,
  emailNotifActivated: false,
  roleList: [],
  autoCompleteClicked: false,
  autoCompleteActive: false,
  role: '',
  onClickBtnValidate: () => {},
  onChangeRole: () => {},
  onClickKnownMember: () => {},
  onChangeNameOrEmail: () => {},
  onClickAutoComplete: () => {},
  onClickCloseAddMemberBtn: () => {},
}
