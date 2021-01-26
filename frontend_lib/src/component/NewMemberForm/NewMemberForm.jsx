import React from 'react'
import { translate } from 'react-i18next'
import Avatar, { AVATAR_SIZE } from '../Avatar/Avatar.jsx'
import { ROLE } from '../../helper.js'
import ComposedIcon from '../Icon/ComposedIcon.jsx'
import PropTypes from 'prop-types'
import SingleChoiceList from '../Input/SingleChoiceList/SingleChoiceList.jsx'

// require('./NewMemberForm.styl') // see https://github.com/tracim/tracim/issues/1156

export const NewMemberForm = props => {
  return (
    <div className='memberlist__form'>
      <div className='memberlist__form__close' onClick={props.onClickCloseAddMemberBtn}>
        <i className='fa fa-times' />
      </div>

      <div className='memberlist__form__member'>
        <div className='memberlist__form__title'>{props.t('Add a member')}</div>

        <div className='memberlist__form__member__name'>
          <label className='name__label' htmlFor='addmember'>
            {props.t('Enter the username, email or full name of the user')}
          </label>

          <input
            type='text'
            className='name__input form-control'
            id='addmember'
            placeholder={props.t('Search user...')}
            data-cy='addmember'
            value={props.publicName}
            onChange={e => props.onChangePersonalData(e.target.value)}
            autoComplete='off'
            autoFocus
          />

          {props.autoCompleteActive && props.publicName.length >= 2 && (
            // Côme - 2018/10/18 - see https://github.com/tracim/tracim/issues/1021 for details about theses tests
            <div className='autocomplete primaryColorBorder'>
              {props.searchedKnownMemberList.length > 0
                ? props.searchedKnownMemberList.filter((u, i) => i < 5).map(u => // only displays the first 5
                  <div
                    className='autocomplete__item'
                    onClick={() => props.onClickKnownMember(u)}
                    key={u.user_id}
                  >
                    <div className='autocomplete__item__avatar'>
                      <Avatar
                        user={u}
                        apiUrl={props.apiUrl}
                        size={AVATAR_SIZE.MEDIUM}
                      />
                    </div>

                    <div
                      className='autocomplete__item__name'
                      data-cy='autocomplete__item__name'
                      title={u.public_name}
                    >
                      {u.public_name}

                      {u.username && (
                        <div
                          className='autocomplete__item__name__username'
                          data-cy='autocomplete__item__username'
                          title={`@${u.username}`}
                        >
                          @{u.username}
                        </div>
                      )}
                    </div>
                  </div>
                )
                : props.isEmail
                  ? (
                    <div
                      className='autocomplete__item'
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
                      className='autocomplete__item'
                      onClick={props.onClickAutoComplete}
                    >
                      <div className='autocomplete__item__icon'>
                        <i className='fa fa-fw fa-user-secret' />
                      </div>

                      <div className='autocomplete__item__name' data-cy='autocomplete__item__name'>
                        <div className='autocomplete__item__name__unknownuser'>
                          {props.publicName}
                          <div className='autocomplete__item__name__unknownuser__msg'>
                            {props.t('I know this user exists')}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
            </div>
          )}

          {(props.canSendInviteNewUser && props.userRoleIdInWorkspace >= ROLE.workspaceManager.id) && (
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

        <SingleChoiceList
          list={props.roleList}
          onChange={props.onChangeRole}
          currentValue={props.role}
        />
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
  publicName: PropTypes.string,
  apiUrl: PropTypes.string.isRequired,
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
  onChangePersonalData: PropTypes.func,
  autoCompleteActive: PropTypes.bool,
  role: PropTypes.string
}

NewMemberForm.defaultProps = {
  publicName: '',
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
  onChangePersonalData: () => {},
  onClickAutoComplete: () => {},
  onClickCloseAddMemberBtn: () => {}
}
