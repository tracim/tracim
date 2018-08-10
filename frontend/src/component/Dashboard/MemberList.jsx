import React from 'react'
import PropTypes from 'prop-types'
// import { Checkbox } from 'tracim_frontend_lib'
import { generateAvatarFromPublicName } from 'tracim_frontend_lib'

require('./MemberList.styl')

export class MemberList extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      displayNewMemberList: true
    }
  }

  handleClickAddMemberBtn = () => this.setState({displayNewMemberList: false})

  handleClickCloseAddMemberBtn = () => this.setState({displayNewMemberList: true})

  handleClickCheckboxCreateAccount = e => {
    e.preventDefault()
    e.stopPropagation()
    this.props.onChangeCreateAccount(!this.props.createAccount)
  }

  handleClickBtnValidate = () => {
    this.props.onClickValidateNewMember()
    this.setState({displayNewMemberList: true})
  }

  render () {
    const { props, state } = this

    return (
      <div className='memberlist'>

        <div className='memberlist__title subTitle'>
          {props.t('Member List')}
        </div>

        <div className='memberlist__wrapper'>
          {state.displayNewMemberList
            ? (
              <div>
                <ul className='memberlist__list'>
                  {props.memberList.map(m =>
                    <li className='memberlist__list__item' key={m.id}>
                      <div className='memberlist__list__item__avatar'>
                        <img src={m.avatarUrl} />
                      </div>

                      <div className='memberlist__list__item__info mr-auto'>
                        <div className='memberlist__list__item__info__name'>
                          {m.publicName}
                        </div>

                        <div className='memberlist__list__item__info__role'>
                          {props.roleList.find(r => r.slug === m.role).label}
                        </div>
                      </div>

                      <div className='memberlist__list__item__delete'>
                        <i className='fa fa-trash-o' />
                      </div>
                    </li>
                  )}
                </ul>

                <div className='memberlist__btnadd' onClick={this.handleClickAddMemberBtn}>
                  <div className='memberlist__btnadd__button'>
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
              </div>
            )
            : (
              <div className='memberlist__form'>
                <div className='memberlist__form__close d-flex justify-content-end'>
                  <i className='fa fa-times' onClick={this.handleClickCloseAddMemberBtn} />
                </div>

                <div className='memberlist__form__member'>
                  <div className='memberlist__form__member__name'>
                    <label className='name__label' htmlFor='addmember'>
                      {props.t('Enter the name or email of the member')}
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

                    {props.searchedKnownMemberList.length > 0 &&
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
                    }
                  </div>

                  {/*
                  // @TODO validate with DA that this checkbox is useless since the backend handle everything
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
                        <label className='memberlist__form__role__list__item' htmlFor={r.slug}>
                          <div className='item__radiobtn mr-3'>
                            <input
                              id={r.slug}
                              type='radio'
                              name='role'
                              value={r.slug}
                              checked={r.slug === props.role}
                              onChange={() => props.onChangeRole(r.slug)}
                            />
                          </div>

                          <div className='item__text'>
                            <div className='item__text__icon mr-2' style={{color: r.hexcolor}}>
                              <i className={`fa fa-${r.faIcon}`} />
                            </div>

                            <div className='item__text__name'>
                              {r.label}
                            </div>
                          </div>
                        </label>
                      </li>
                    )}

                  </ul>
                </div>

                <div className='memberlist__form__submitbtn'>
                  <button className='btn btn-outline-primary' onClick={this.handleClickBtnValidate}>
                    {props.t('Validate')}
                  </button>
                </div>
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
