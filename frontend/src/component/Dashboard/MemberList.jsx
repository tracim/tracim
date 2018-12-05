import React from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames'
import { NewMemberForm, Avatar } from 'tracim_frontend_lib'

require('./MemberList.styl')

export class MemberList extends React.Component {
  handleClickBtnValidate = async () => await this.props.onClickValidateNewMember() && this.setState({displayNewMemberList: true})

  render () {
    const { props } = this

    return (
      <div className='memberlist'>

        <div className='memberlist__header subTitle'>
          {props.t('Member List')}
        </div>

        <div className='memberlist__wrapper'>
          {props.displayNewMemberForm
            ? (
              <NewMemberForm
                onClickCloseAddMemberBtn={props.onClickCloseAddMemberBtn}
                nameOrEmail={props.nameOrEmail}
                isEmail={props.isEmail}
                onChangeNameOrEmail={props.onChangeNameOrEmail}
                searchedKnownMemberList={props.searchedKnownMemberList}
                autoCompleteActive={props.autoCompleteFormNewMemberActive}
                onClickKnownMember={props.onClickKnownMember}
                roleList={props.roleList}
                role={props.role}
                onChangeRole={props.onChangeRole}
                onClickBtnValidate={this.handleClickBtnValidate}
                emailNotifActivated={props.emailNotifActivated}
                canSendInviteNewUser={props.canSendInviteNewUser}
                idRoleUserWorkspace={props.idRoleUserWorkspace}
                autoCompleteClicked={props.autoCompleteClicked}
                onClickAutoComplete={props.onClickAutoComplete}
              />
            )
            : (
              <div>
                <ul className={classnames('memberlist__list', {'withAddBtn': props.idRoleUserWorkspace >= 8})}>
                  {props.memberList.map(m =>
                    <li className='memberlist__list__item  primaryColorBgLightenHover' key={m.id}>
                      <div className='memberlist__list__item__avatar'>
                        <Avatar publicName={m.publicName} />
                      </div>

                      <div className='memberlist__list__item__info'>
                        <div className='memberlist__list__item__info__name'>
                          {m.publicName}
                        </div>

                        <div className='memberlist__list__item__info__role'>
                          {props.t(props.roleList.find(r => r.slug === m.role).label)}
                        </div>
                      </div>

                      {props.idRoleUserWorkspace >= 8 && m.id !== props.loggedUser.user_id && (
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

                {props.idRoleUserWorkspace >= 8 && (
                  <div className='memberlist__btnadd' onClick={props.onClickAddMemberBtn}>
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
              </div>
            )
          }
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
