import React from 'react'
import PropTypes from 'prop-types'
// import { Checkbox } from 'tracim_frontend_lib'
import { NewMemberForm } from 'tracim_frontend_lib'

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

        <div className='memberlist__header subTitle'>
          {props.t('Member List')}
        </div>

        <div className='memberlist__wrapper'>
          {state.displayNewMemberList
            ? (
              <div>
                <ul className='memberlist__list'>
                  {props.memberList.map(m =>
                    <li className='memberlist__list__item  primaryColorBgLightenHover' key={m.id}>
                      <div className='memberlist__list__item__avatar'>
                        <img src={m.avatarUrl} />
                      </div>

                      <div className='memberlist__list__item__info'>
                        <div className='memberlist__list__item__info__name'>
                          {m.publicName}
                        </div>

                        <div className='memberlist__list__item__info__role'>
                          {props.roleList.find(r => r.slug === m.role).label}
                        </div>
                      </div>

                      <div className='memberlist__list__item__delete primaryColorFontHover'>
                        <i className='fa fa-trash-o' />
                      </div>
                    </li>
                  )}
                </ul>

                <div className='memberlist__btnadd' onClick={this.handleClickAddMemberBtn}>
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
              </div>
            )
            : (
              <NewMemberForm
                onClickCloseAddMemberBtn={this.handleClickCloseAddMemberBtn}
                nameOrEmail={props.nameOrEmail}
                onChangeNameOrEmail={props.onChangeNameOrEmail}
                searchedKnownMemberList={props.searchedKnownMemberList}
                onClickKnownMember={props.onClickKnownMember}
                roleList={props.roleList}
                role={props.role}
                onChangeRole={props.onChangeRole}
                onClickBtnValidate={this.handleClickBtnValidate}
              />
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
